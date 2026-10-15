// Lectura de EPUB con epub.js: metadatos, índice, orden de lectura (spine)
// y contenido de cada capítulo. El contenido se sanitiza antes de salir de aquí.

import ePub from 'epubjs';
import JSZip from 'jszip';
import { ConversionError } from '../files/errors';
import { sanitizeTree } from '../html/sanitize';
import { removeBionicMarkup } from '../html/transform';
import type { EpubDocument, EpubSection } from '../document';
import { extensionOf, resolveZipPath } from './paths';

const IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 25 * 1024 * 1024;
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

export async function parseEpub(buffer: ArrayBuffer, fileName: string): Promise<EpubDocument> {
  const zip = await JSZip.loadAsync(buffer).catch(() => {
    throw new ConversionError('EPUB_INVALID', 'no es un contenedor ZIP legible');
  });
  await assertEpubStructure(zip);

  let book: ReturnType<typeof ePub>;
  try {
    book = ePub(buffer);
    await book.ready;
  } catch (error) {
    throw new ConversionError('EPUB_INVALID', error instanceof Error ? error.message : undefined);
  }

  const warnings: string[] = [];
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
    let skippedEmpty = 0;
    let previouslyConverted = false;

    for (const item of items) {
      const path = decodeZipPath(item.url);
      const source = await archive.getText(item.url);
      if (!source) {
        warnings.push(`Un capítulo (${path}) no se pudo leer y se ha omitido.`);
        continue;
      }

      const doc = parseXhtml(source);
      const body = bodyOf(doc);
      if (!body) {
        warnings.push(`Un capítulo (${path}) no tiene contenido legible.`);
        continue;
      }

      // Imágenes: se incrustan como data: para que la vista previa sea aislada.
      const imageMap = new Map<string, string>();
      const imageRefs = Array.from(body.querySelectorAll('img, image'));
      for (const ref of imageRefs) {
        const src = ref.getAttribute('src') ?? ref.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? ref.getAttribute('href') ?? '';
        if (!src || /^[a-z]+:/i.test(src) || imageMap.has(src)) continue;
        const zipPath = resolveZipPath(path, src);
        const entry = zip.file(zipPath);
        if (!entry) continue;
        const bytes = await entry.async('uint8array');
        const mime = mimeFromExtension(zipPath);
        if (!mime || bytes.byteLength > MAX_IMAGE_BYTES || imageBytes + bytes.byteLength > MAX_TOTAL_IMAGE_BYTES) continue;
        imageBytes += bytes.byteLength;
        imageMap.set(src, `data:${mime};base64,${base64Of(bytes)}`);
      }

      const clone = body.cloneNode(true) as Element;
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
        title: firstHeading(body) ?? tocLabel ?? `Sección ${sections.length + 1}`,
        html,
        path,
      });
    }

    if (previouslyConverted) {
      warnings.push('Este EPUB ya se había convertido. Se ha quitado la negrita anterior para aplicar tus ajustes actuales.');
    }
    if (skippedEmpty > 0) warnings.push(`${skippedEmpty} sección(es) sin texto (portadas, imágenes) se han omitido de la vista previa.`);
    if (sections.length === 0) throw new ConversionError('EPUB_NO_CONTENT');

    book.destroy();
    return { kind: 'epub', title, fileName, warnings, sections, original: buffer, opfPath };
  } catch (error) {
    book.destroy();
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
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  return IMAGE_MIME.has(mime) ? mime : null;
}

function base64Of(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
