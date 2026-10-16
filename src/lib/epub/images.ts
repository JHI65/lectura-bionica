// Imágenes de un EPUB para la vista previa. El EPUB exportado conserva siempre
// los archivos originales; esto solo decide cómo se MUESTRAN en la vista previa
// aislada (iframe sin red), donde todo debe ir incrustado como data:.
import { stripActiveContent } from '../html/clean';

const DOWNSCALE_ABOVE = 400 * 1024; // por encima se reduce (si el navegador puede)
const PREVIEW_MAX_SIDE = 1400;
const MAX_UNSCALED_BYTES = 3 * 1024 * 1024; // sin poder reducir, por encima se omite
const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

export function base64Of(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

export interface PreviewImage {
  url: string;
  /** Tamaño aproximado de la URL (para el presupuesto de memoria). */
  size: number;
}

/** True si el navegador puede decodificar y reducir imágenes (no ocurre en jsdom). */
function canResize(): boolean {
  return typeof createImageBitmap === 'function' && typeof document !== 'undefined';
}

async function downscale(bytes: Uint8Array, mime: string): Promise<PreviewImage | null> {
  try {
    const bitmap = await createImageBitmap(new Blob([bytes as BlobPart], { type: mime }));
    const scale = Math.min(1, PREVIEW_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close?.();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    // PNG conserva la transparencia; el resto se recodifica como JPEG.
    const url = mime === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85);
    return { url, size: url.length };
  } catch {
    return null; // imagen corrupta o formato que el navegador no decodifica
  }
}

/** Imagen lista para la vista previa. null si no se puede mostrar (se avisa al usuario). */
export async function previewImage(bytes: Uint8Array, mime: string): Promise<PreviewImage | null> {
  // Los SVG no se reducen: son vectoriales y dentro de <img> no ejecutan nada.
  if (mime === 'image/svg+xml') {
    const url = `data:${mime};base64,${base64Of(bytes)}`;
    return bytes.byteLength <= MAX_UNSCALED_BYTES ? { url, size: url.length } : null;
  }
  if (bytes.byteLength > DOWNSCALE_ABOVE && canResize()) {
    const reduced = await downscale(bytes, mime);
    if (reduced) return reduced;
  }
  if (bytes.byteLength > MAX_UNSCALED_BYTES) return null;
  const url = `data:${mime};base64,${base64Of(bytes)}`;
  return { url, size: url.length };
}

function numeric(value: string | null): number | null {
  if (!value) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 && !value.trim().endsWith('%') ? n : null;
}

export interface InlineSvg {
  dataUrl: string;
  width: number | null;
  height: number | null;
  alt: string;
}

/**
 * Convierte un <svg> en una imagen data:image/svg+xml. Dentro de <img>, un SVG
 * no ejecuta scripts ni carga recursos, así que se conservan ilustraciones y
 * portadas vectoriales sin tener que sanear el SVG por dentro. Las imágenes que
 * contiene (<image href=…>) se resuelven antes con `loadImage` porque, dentro de
 * un data:, las rutas relativas dejan de funcionar.
 */
export async function svgToImage(svg: Element, loadImage: (href: string) => Promise<string | null>): Promise<InlineSvg | null> {
  const clone = svg.cloneNode(true) as Element;
  stripActiveContent(clone);

  for (const image of Array.from(clone.getElementsByTagNameNS('*', 'image'))) {
    const href = image.getAttribute('href') ?? image.getAttributeNS(XLINK_NS, 'href') ?? image.getAttribute('xlink:href');
    const resolved = href ? await loadImage(href) : null;
    if (!resolved) {
      image.remove(); // sin imagen resoluble: mejor omitirla que dejar un enlace roto
      continue;
    }
    image.removeAttributeNS(XLINK_NS, 'href');
    image.removeAttribute('xlink:href');
    image.setAttribute('href', resolved);
  }
  if (clone.getElementsByTagNameNS('*', '*').length === 0) return null; // quedó vacío

  if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', SVG_NS);
  clone.setAttribute('xmlns:xlink', XLINK_NS);

  const viewBox = clone.getAttribute('viewBox')?.split(/[\s,]+/).map(Number);
  const width = numeric(clone.getAttribute('width')) ?? (viewBox && viewBox.length === 4 ? viewBox[2] : null);
  const height = numeric(clone.getAttribute('height')) ?? (viewBox && viewBox.length === 4 ? viewBox[3] : null);
  if (width && !clone.getAttribute('width')) clone.setAttribute('width', String(width));
  if (height && !clone.getAttribute('height')) clone.setAttribute('height', String(height));

  const xml = new XMLSerializer().serializeToString(clone);
  const bytes = new TextEncoder().encode(xml);
  const alt =
    clone.getAttribute('aria-label') ??
    clone.getElementsByTagNameNS('*', 'title')[0]?.textContent?.trim() ??
    '';
  return { dataUrl: `data:image/svg+xml;base64,${base64Of(bytes)}`, width, height, alt };
}
