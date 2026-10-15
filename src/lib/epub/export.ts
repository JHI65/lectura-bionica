// Exportación a EPUB: reescribe los capítulos del original (negrita bionica +
// hoja de estilo tipográfica) y conserva el resto del paquete intacto.
// Después se reabre el resultado y se comprueba su integridad antes de ofrecerlo.

import ePub from 'epubjs';
import JSZip from 'jszip';
import { ConversionError } from '../files/errors';
import { applyBionicToTree, removeBionicMarkup } from '../html/transform';
import { sanitizeTree } from '../html/sanitize';
import { readerCss } from '../bionic/css';
import type { ReadingSettings } from '../bionic/settings';
import type { EpubDocument } from '../document';
import { safeBaseName } from '../files/validate';
import { findOpfPath } from './parse';
import { relativeZipPath } from './paths';

const XHTML_NS = 'http://www.w3.org/1999/xhtml';
const OPF_NS = 'http://www.idpf.org/2007/opf';
const CSS_NAME = 'lectura-bionica.css';

export interface ExportResult {
  blob: Blob;
  fileName: string;
  warnings: string[];
}

function parseXml(source: string): Document | null {
  const doc = new DOMParser().parseFromString(source, 'application/xhtml+xml');
  return doc.getElementsByTagName('parsererror').length > 0 ? null : doc;
}

/**
 * Asegura exactamente una declaración XML al principio. Algunos navegadores
 * (WebKit/Blink) ya la incluyen al serializar y otros (jsdom) no: duplicarla
 * produce un XML inválido.
 */
export function withSingleXmlDeclaration(serialized: string): string {
  const withoutDeclaration = serialized.replace(/^\uFEFF?\s*<\?xml[^?]*\?>\s*/, '');
  return `<?xml version="1.0" encoding="utf-8"?>\n${withoutDeclaration}`;
}

function serializeXml(doc: Document): string {
  return withSingleXmlDeclaration(new XMLSerializer().serializeToString(doc));
}

function xmlError(source: string): string | null {
  const doc = new DOMParser().parseFromString(source, 'application/xhtml+xml');
  const error = doc.getElementsByTagName('parsererror')[0];
  return error ? (error.textContent ?? 'error de análisis').replace(/\s+/g, ' ').trim().slice(0, 160) : null;
}

function removeActiveContent(doc: Document): void {
  // Sin scripts, bases ni recargas: el EPUB no debe ejecutar código al abrirse.
  for (const tag of ['script', 'base', 'iframe', 'object', 'embed']) {
    for (const el of Array.from(doc.getElementsByTagNameNS('*', tag))) el.remove();
  }
  for (const meta of Array.from(doc.getElementsByTagNameNS('*', 'meta'))) {
    if (meta.getAttribute('http-equiv')?.toLowerCase() === 'refresh') meta.remove();
  }
  for (const el of Array.from(doc.getElementsByTagNameNS('*', '*'))) {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.toLowerCase().startsWith('on')) el.removeAttribute(attr.name);
    }
  }
}

function relativeHref(fromFile: string, toFile: string): string {
  return relativeZipPath(fromFile, toFile);
}

export async function exportEpub(doc: EpubDocument, settings: ReadingSettings): Promise<ExportResult> {
  const warnings: string[] = [];
  const source = await JSZip.loadAsync(doc.original).catch(() => {
    throw new ConversionError('EXPORT_FAILED', 'el original ya no se puede leer');
  });
  const zip = source;
  const opfPath = doc.opfPath || (await findOpfPath(zip));
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const cssPath = `${opfDir}${CSS_NAME}`;

  const css = readerCss(settings, { includeColors: false });
  const replacements = new Map<string, string>();
  const transformedPaths = new Set<string>();

  for (const section of doc.sections) {
    const original = await zip.file(section.path)?.async('string');
    if (original === undefined) {
      throw new ConversionError('EXPORT_FAILED', `falta ${section.path}`);
    }
    const xhtml = parseXml(original);
    if (!xhtml) {
      warnings.push(`«${section.title}» no es XHTML estricto: se conserva sin transformar en el EPUB.`);
      continue;
    }
    const body = xhtml.getElementsByTagNameNS(XHTML_NS, 'body')[0] ?? xhtml.getElementsByTagNameNS('*', 'body')[0];
    if (!body) {
      warnings.push(`«${section.title}» no tiene <body>: se conserva sin transformar.`);
      continue;
    }

    removeActiveContent(xhtml);
    removeBionicMarkup(body);
    sanitizeTree(body);
    // Comprobación de integridad: el texto debe quedar idéntico tras transformar.
    const textBefore = body.textContent ?? '';
    if (settings.bionicEnabled) applyBionicToTree(body, settings.boldRatio);
    if ((body.textContent ?? '') !== textBefore) {
      throw new ConversionError('EXPORT_VERIFY_FAILED', `el texto de «${section.title}» cambió`);
    }

    const head = xhtml.getElementsByTagNameNS(XHTML_NS, 'head')[0] ?? xhtml.getElementsByTagNameNS('*', 'head')[0];
    if (head) {
      // Si el EPUB ya venía de una conversión anterior, no se duplica el enlace.
      for (const existing of Array.from(head.getElementsByTagNameNS('*', 'link'))) {
        if ((existing.getAttribute('href') ?? '').endsWith(CSS_NAME)) existing.remove();
      }
      const link = xhtml.createElementNS(XHTML_NS, 'link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('type', 'text/css');
      link.setAttribute('href', relativeHref(section.path, cssPath));
      head.appendChild(link);
    }

    replacements.set(section.path, serializeXml(xhtml));
    transformedPaths.add(section.path);
  }

  if (transformedPaths.size === 0) throw new ConversionError('EXPORT_FAILED', 'ningún capítulo se pudo transformar');

  // Registrar la hoja de estilo en el manifiesto del OPF.
  const opfSource = await zip.file(opfPath)?.async('string');
  const opf = opfSource ? parseXml(opfSource) : null;
  const manifest = opf?.getElementsByTagNameNS(OPF_NS, 'manifest')[0];
  if (!opf || !manifest) throw new ConversionError('EXPORT_FAILED', 'OPF no legible');
  // Un id duplicado en el manifiesto invalidaría el EPUB (caso de re-conversión).
  for (const existing of Array.from(manifest.getElementsByTagNameNS(OPF_NS, 'item'))) {
    if (existing.getAttribute('id') === 'lectura-bionica-css') existing.remove();
  }
  const item = opf.createElementNS(OPF_NS, 'item');
  item.setAttribute('id', 'lectura-bionica-css');
  item.setAttribute('href', relativeZipPath(opfPath, cssPath));
  item.setAttribute('media-type', 'text/css');
  manifest.appendChild(item);
  replacements.set(opfPath, serializeXml(opf));

  // Nuevo ZIP: mimetype primero y sin compresión, luego el resto en su orden original.
  const out = new JSZip();
  out.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  for (const name of Object.keys(zip.files)) {
    const entry = zip.files[name];
    if (entry.dir || name === 'mimetype') continue;
    const replacement = replacements.get(name);
    if (replacement !== undefined) out.file(name, replacement);
    else out.file(name, await entry.async('uint8array'));
  }
  out.file(cssPath, css);

  const blob = new Blob(
    [await out.generateAsync({ type: 'arraybuffer', mimeType: 'application/epub+zip', compression: 'DEFLATE' })],
    { type: 'application/epub+zip' },
  );

  await verifyEpub(blob, cssPath, transformedPaths.size);

  return {
    blob,
    fileName: `${safeBaseName(doc.fileName)}-lectura-bionica.epub`,
    warnings,
  };
}

/** Reabre el EPUB generado y comprueba estructura, CSS registrado y legibilidad. */
export async function verifyEpub(blob: Blob, cssPath: string, expectedChapters: number): Promise<void> {
  const buffer = await blob.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer).catch(() => {
    throw new ConversionError('EXPORT_VERIFY_FAILED', 'el ZIP generado no es válido');
  });
  const firstEntry = Object.keys(zip.files)[0];
  const mimetype = await zip.file('mimetype')?.async('string');
  if (firstEntry !== 'mimetype' || mimetype?.trim() !== 'application/epub+zip') {
    throw new ConversionError('EXPORT_VERIFY_FAILED', 'mimetype incorrecto');
  }
  if (!zip.file(cssPath)) throw new ConversionError('EXPORT_VERIFY_FAILED', 'falta la hoja de estilo');

  let marked = 0;
  for (const name of Object.keys(zip.files)) {
    if (!/\.(x?html?)$/i.test(name)) continue;
    const text = await zip.files[name].async('string');
    if (text.includes(CSS_NAME)) {
      const problem = xmlError(text);
      if (problem) throw new ConversionError('EXPORT_VERIFY_FAILED', `${name} no es XML válido: ${problem}`);
      marked++;
    }
  }
  if (marked < expectedChapters) throw new ConversionError('EXPORT_VERIFY_FAILED', 'capítulos sin transformar');

  // Prueba final con el propio lector de epub.js.
  const book = ePub(buffer);
  try {
    await book.ready;
    const items = (book.spine as unknown as { items: unknown[] }).items;
    if (!items || items.length === 0) throw new ConversionError('EXPORT_VERIFY_FAILED', 'spine vacío');
  } catch (error) {
    if (error instanceof ConversionError) throw error;
    throw new ConversionError('EXPORT_VERIFY_FAILED', error instanceof Error ? error.message : undefined);
  } finally {
    book.destroy();
  }
}
