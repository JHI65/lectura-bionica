// Lectura de EPUB con epub.js: metadatos, índice, orden de lectura (spine)
// y contenido de cada capítulo. El contenido se sanitiza antes de salir de aquí.

import JSZip from 'jszip';
import { ConversionError } from '../files/errors';
import { sanitizeTree } from '../html/sanitize';
import { removeBionicMarkup } from '../html/transform';
import { previewImage, svgToImage } from './images';
import type { EpubDocument, EpubSection } from '../document';
import { createYielder, throwIfAborted, type TaskOptions } from '../async';
import type { AppWarning } from '../warnings';
import { disposeBook, openBook, type EpubBook } from './book';
import { extensionOf, resolveZipPath } from './paths';

const IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']);
/** Presupuesto de memoria para las imágenes de la vista previa (URLs data:). */
const MAX_TOTAL_IMAGE_BYTES = 40 * 1024 * 1024;
/** Imágenes originales por encima de esto no se intentan ni decodificar. */
const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;
const FONT_EXTENSIONS = new Set(['ttf', 'otf', 'woff', 'woff2']);

interface TocEntry {
  label: string;
  href: string;
}

/** Ruta del paquete OPF según META-INF/container.xml. */
export async function findOpfPath(zip: JSZip): Promise<string> {
  const container = await zip.file('META-INF/container.xml')?.async('string');
  const match = container?.match(/<rootfile[^>]*full-path="([^"]+)"/);
  if (!match) throw new ConversionError('EPUB_INVALID', 'container.xml sin paquete OPF');
  return match[1];
}

/** Comprueba que el ZIP es un EPUB y que no está cifrado con DRM. */
export async function assertEpubStructure(zip: JSZip): Promise<void> {
  const mimetype = await zip.file('mimetype')?.async('string');
  if (!mimetype || mimetype.trim() !== 'application/epub+zip') {
    throw new ConversionError('EPUB_INVALID', 'falta mimetype válido');
  }
  const encryption = await zip.file('META-INF/encryption.xml')?.async('string');
  if (encryption) {
    const uris = Array.from(encryption.matchAll(/CipherReference[^>]*URI="([^"]+)"/g)).map((m) => m[1]);
    // La ofuscación de fuentes no es DRM; cualquier otro recurso cifrado sí.
    const nonFontEncrypted = uris.some((uri) => !FONT_EXTENSIONS.has(extensionOf(uri)));
    if (nonFontEncrypted) throw new ConversionError('EPUB_PROTECTED');
  }
}

function flattenToc(items: Array<{ label?: string; href?: string; subitems?: unknown[] }>, out: TocEntry[] = []): TocEntry[] {
  for (const item of items) {
    if (item.href && item.label) out.push({ label: item.label.trim(), href: item.href.split('#')[0] });
    if (Array.isArray(item.subitems)) flattenToc(item.subitems as typeof items, out);
  }
  return out;
}

function parseXhtml(source: string): Document {
  const xml = new DOMParser().parseFromString(source, 'application/xhtml+xml');
  if (xml.getElementsByTagName('parsererror').length === 0 && xml.body !== undefined) return xml;
  // Fallback tolerante: muchos EPUB tienen XHTML imperfecto que los navegadores aceptan como HTML.
  return new DOMParser().parseFromString(source, 'text/html');
}

function bodyOf(doc: Document): Element | null {
  return doc.body ?? doc.getElementsByTagNameNS('*', 'body')[0] ?? null;
}

/** Primer encabezado dentro del cuerpo (no el <title> de <head>). */
function firstHeading(body: Element): string | null {
  const heading = body.querySelector('h1, h2');
  const text = heading?.textContent?.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, 120) : null;
}

export async function parseEpub(buffer: ArrayBuffer, fileName: string, options: TaskOptions = {}): Promise<EpubDocument> {
  const { signal, onProgress } = options;
  const yieldToUi = createYielder();
  throwIfAborted(signal);
  const zip = await JSZip.loadAsync(buffer).catch(() => {
    throw new ConversionError('EPUB_INVALID', 'no es un contenedor ZIP legible');
  });
  await assertEpubStructure(zip);

  let book: EpubBook;
  try {
    book = await openBook(buffer);
  } catch (error) {
    throw new ConversionError('EPUB_INVALID', error instanceof Error ? error.message : undefined);
  }

  const warnings: AppWarning[] = [];
  try {
    const metadata = await book.loaded.metadata;
    const navigation = await book.loaded.navigation;
    const toc = flattenToc((navigation?.toc ?? []) as Parameters<typeof flattenToc>[0]);
    const title = metadata?.title?.trim() || fileName.replace(/\.epub$/i, '');
    const opfPath = await findOpfPath(zip);

    const archive = book.archive;
    const items = (book.spine as unknown as { items: Array<{ url: string; href: string; linear?: string }> }).items;

    const sections: EpubSection[] = [];
    let imageBytes = 0;
    // Una imagen se lee, reduce y codifica una sola vez aunque salga en varios capítulos.
    const imageCache = new Map<string, string | null>();
    const omitted = new Set<string>();
    const loadImage = async (chapterPath: string, src: string): Promise<string | null> => {
      if (!src || /^[a-z][a-z0-9+.-]*:/i.test(src)) return null; // externa o data: ya incrustada
      const zipPath = resolveZipPath(chapterPath, src);
      if (imageCache.has(zipPath)) return imageCache.get(zipPath) ?? null;
      let result: string | null = null;
      const entry = zip.file(zipPath);
      const mime = mimeFromExtension(zipPath);
      if (entry && mime) {
        const bytes = await entry.async('uint8array');
        if (bytes.byteLength <= MAX_ORIGINAL_BYTES) {
          const image = await previewImage(bytes, mime);
          if (image && imageBytes + image.size <= MAX_TOTAL_IMAGE_BYTES) {
            imageBytes += image.size;
            result = image.url;
          }
        }
      }
      if (!result && entry) omitted.add(zipPath); // existe pero no se puede mostrar: se avisa
      imageCache.set(zipPath, result);
      return result;
    };
    let skippedEmpty = 0;
    let previouslyConverted = false;

    for (const [index, item] of items.entries()) {
      throwIfAborted(signal);
      onProgress?.({ stage: 'epub-chapter', done: index, total: items.length });
      await yieldToUi();
      const path = decodeZipPath(item.url);
      const source = await archive.getText(item.url);
      if (!source) {
        warnings.push({ code: 'EPUB_UNREADABLE_CHAPTER', params: { path } });
        continue;
      }

      const doc = parseXhtml(source);
      const body = bodyOf(doc);
      if (!body) {
        warnings.push({ code: 'EPUB_NO_BODY', params: { path } });
        continue;
      }

      // Imágenes: se incrustan como data: para que la vista previa sea aislada.
      const imageMap = new Map<string, string>();
      for (const ref of Array.from(body.querySelectorAll('img'))) {
        const src = ref.getAttribute('src') ?? '';
        if (!src || imageMap.has(src)) continue;
        const url = await loadImage(path, src);
        if (url) imageMap.set(src, url);
      }

      const clone = body.cloneNode(true) as Element;
      // Los <svg> (portadas, ilustraciones) pasan a <img>: dentro de <img> no ejecutan
      // código. Si no, la limpieza los eliminaría y la sección quedaría «vacía».
      let svgIndex = 0;
      for (const svg of Array.from(clone.getElementsByTagNameNS('*', 'svg'))) {
        if (svg.parentElement?.closest('svg')) continue; // los anidados van dentro del externo
        const converted = await svgToImage(svg, (href) => loadImage(path, href));
        if (!converted) {
          svg.remove();
          continue;
        }
        const key = `svg:${svgIndex++}`;
        imageMap.set(key, converted.dataUrl);
        const img = clone.ownerDocument.createElementNS(clone.namespaceURI, 'img');
        img.setAttribute('src', key);
        img.setAttribute('alt', converted.alt);
        if (converted.width) img.setAttribute('width', String(Math.round(converted.width)));
        if (converted.height) img.setAttribute('height', String(Math.round(converted.height)));
        svg.replaceWith(img);
      }

      if (removeBionicMarkup(clone) > 0) previouslyConverted = true;
      sanitizeTree(clone, {
        resolveImageSrc: (src) => imageMap.get(src) ?? null,
      });
      const html = clone.innerHTML;
      const hasText = (clone.textContent ?? '').trim().length > 0 || clone.querySelector('img') !== null;
      if (!hasText) {
        skippedEmpty++;
        continue;
      }

      const tocLabel = toc.find((entry) => entry.href && path.endsWith(entry.href.replace(/^\.?\/*/, '')))?.label;
      sections.push({
        id: `s${sections.length + 1}`,
        title: firstHeading(body) ?? tocLabel ?? null,
        html,
        path,
      });
    }

    if (omitted.size > 0) {
      warnings.push({ code: 'EPUB_IMAGES_OMITTED', params: { count: omitted.size } });
    }
    if (previouslyConverted) {
      warnings.push({ code: 'EPUB_PREVIOUSLY_CONVERTED' });
    }
    if (skippedEmpty > 0) warnings.push({ code: 'EPUB_EMPTY_SECTIONS', params: { count: skippedEmpty } });
    if (sections.length === 0) throw new ConversionError('EPUB_NO_CONTENT');

    disposeBook(book);
    return { kind: 'epub', title, fileName, warnings, sections, original: buffer, opfPath };
  } catch (error) {
    disposeBook(book);
    if (error instanceof ConversionError) throw error;
    throw new ConversionError('EPUB_INVALID', error instanceof Error ? error.message : undefined);
  }
}

function decodeZipPath(url: string): string {
  try {
    return decodeURIComponent(url.replace(/^\//, ''));
  } catch {
    return url.replace(/^\//, '');
  }
}

function mimeFromExtension(path: string): string | null {
  const ext = extensionOf(path);
  const mime = ext === 'jpg' ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
  return IMAGE_MIME.has(mime) ? mime : null;
}
