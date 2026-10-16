// Imágenes de un PDF. Dos partes:
//  1. Geometría (pura, sin navegador): recorre la lista de operaciones de pdf.js,
//     sigue la matriz de transformación y calcula dónde se pinta cada imagen,
//     descartando decoraciones y fondos de escaneo y uniendo las que son trozos
//     de una misma figura.
//  2. Renderizado (solo en navegador): dibuja esa zona de la página en un canvas
//     y la codifica. Se rasteriza la zona tal como se ve (con máscaras, espacios
//     de color y rotaciones ya resueltos) en vez de decodificar cada imagen.
//
// Limitación: solo se detectan imágenes incrustadas. Los gráficos vectoriales
// (dibujados con trazos, no como imagen) no se capturan.

import type { PDFPageProxy } from 'pdfjs-dist';

export type Matrix = [number, number, number, number, number, number];

/** Códigos de operación de pdf.js que necesitamos (pdfjs.OPS). */
export interface OpsTable {
  save: number;
  restore: number;
  transform: number;
  paintFormXObjectBegin: number;
  paintFormXObjectEnd: number;
  paintImageXObject: number;
  paintInlineImageXObject: number;
  paintImageMaskXObject: number;
}

export interface OperatorList {
  fnArray: ArrayLike<number>;
  argsArray: ArrayLike<unknown>;
}

/** Rectángulo en coordenadas de usuario del PDF (el origen abajo a la izquierda, y hacia arriba). */
export interface Placement {
  left: number;
  bottom: number;
  width: number;
  height: number;
}

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** m1 × m2 con la semántica de ctx.transform(): se aplica m2 y después m1. */
export function multiply(m1: Matrix, m2: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

/** Caja que ocupa el cuadrado unidad (donde se pinta una imagen) tras aplicar la matriz. */
export function unitSquareBounds(m: Matrix): Placement {
  const [a, b, c, d, e, f] = m;
  const xs = [e, a + e, c + e, a + c + e];
  const ys = [f, b + f, d + f, b + d + f];
  const left = Math.min(...xs);
  const bottom = Math.min(...ys);
  return { left, bottom, width: Math.max(...xs) - left, height: Math.max(...ys) - bottom };
}

/** Posición de cada imagen pintada en una página, en el orden en que se pintan. */
export function collectPlacements(ops: OperatorList, OPS: OpsTable): Placement[] {
  const placements: Placement[] = [];
  const stack: Matrix[] = [];
  let ctm: Matrix = IDENTITY;

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i];

    if (fn === OPS.save) {
      stack.push(ctm);
    } else if (fn === OPS.restore) {
      ctm = stack.pop() ?? IDENTITY;
    } else if (fn === OPS.transform && Array.isArray(args) && args.length >= 6) {
      ctm = multiply(ctm, args.slice(0, 6) as Matrix);
    } else if (fn === OPS.paintFormXObjectBegin) {
      stack.push(ctm);
      const matrix = Array.isArray(args) ? (args[0] as unknown) : null;
      if (Array.isArray(matrix) && matrix.length >= 6) ctm = multiply(ctm, matrix.slice(0, 6) as Matrix);
    } else if (fn === OPS.paintFormXObjectEnd) {
      ctm = stack.pop() ?? IDENTITY;
    } else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintImageMaskXObject) {
      placements.push(unitSquareBounds(ctm));
    }
  }
  return placements;
}

/** ¿Hay alguna operación de imagen? Evita trabajo en páginas de solo texto. */
export function hasImageOps(ops: OperatorList, OPS: OpsTable): boolean {
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintImageMaskXObject) return true;
  }
  return false;
}

function intersects(a: Placement, b: Placement, margin: number): boolean {
  return (
    a.left - margin < b.left + b.width &&
    b.left - margin < a.left + a.width &&
    a.bottom - margin < b.bottom + b.height &&
    b.bottom - margin < a.bottom + a.height
  );
}

function union(a: Placement, b: Placement): Placement {
  const left = Math.min(a.left, b.left);
  const bottom = Math.min(a.bottom, b.bottom);
  return {
    left,
    bottom,
    width: Math.max(a.left + a.width, b.left + b.width) - left,
    height: Math.max(a.bottom + a.height, b.bottom + b.height) - bottom,
  };
}

/** Une las imágenes que se tocan o solapan: muchas figuras vienen troceadas en tiras o repintadas. */
export function mergePlacements(list: Placement[], margin = 2): Placement[] {
  const result = list.map((p) => ({ ...p }));
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        if (intersects(result[i], result[j], margin)) {
          result[i] = union(result[i], result[j]);
          result.splice(j, 1);
          changed = true;
          break outer;
        }
      }
    }
  }
  return result;
}

export interface SelectOptions {
  /** Lado mínimo (en puntos) para que una imagen cuente: descarta viñetas y filetes. */
  minSize: number;
  maxPerPage: number;
  /** Fracción de la página a partir de la cual una imagen es el fondo de un escaneo. */
  backgroundRatio: number;
}

export const DEFAULT_SELECT: SelectOptions = { minSize: 30, maxPerPage: 12, backgroundRatio: 0.8 };

/**
 * Elige qué imágenes de una página se conservan.
 *  - Recorta a la página y descarta lo que queda fuera.
 *  - Une trozos contiguos de una misma figura.
 *  - Descarta imágenes diminutas (viñetas, filetes, adornos).
 *  - Si la página tiene texto, descarta la imagen que cubre casi toda la página:
 *    es el escaneo de fondo de un PDF con capa de texto (OCR). Se conservaría el
 *    texto dos veces. En páginas SIN texto sí se conserva (si no, se perdería).
 */
export function selectPlacements(
  placements: Placement[],
  view: { left: number; bottom: number; width: number; height: number },
  hasText: boolean,
  options: SelectOptions = DEFAULT_SELECT,
): Placement[] {
  const pageArea = view.width * view.height;
  const clipped: Placement[] = [];
  for (const p of placements) {
    const left = Math.max(p.left, view.left);
    const bottom = Math.max(p.bottom, view.bottom);
    const right = Math.min(p.left + p.width, view.left + view.width);
    const top = Math.min(p.bottom + p.height, view.bottom + view.height);
    if (right > left && top > bottom) clipped.push({ left, bottom, width: right - left, height: top - bottom });
  }

  return mergePlacements(clipped)
    .filter((p) => p.width >= options.minSize && p.height >= options.minSize)
    .filter((p) => !(hasText && pageArea > 0 && (p.width * p.height) / pageArea >= options.backgroundRatio))
    .sort((a, b) => b.bottom + b.height - (a.bottom + a.height))
    .slice(0, options.maxPerPage);
}

// ---------------------------------------------------------------------------
// Renderizado (solo navegador)
// ---------------------------------------------------------------------------

const MAX_SIDE_PX = 1400;
const MAX_URL_CHARS = 2_500_000;

export interface RenderedImage {
  src: string;
  widthPt: number;
  heightPt: number;
  /** Borde superior e inferior en coordenadas del PDF, para ordenar entre las líneas de texto. */
  top: number;
  bottom: number;
}

export function canRenderImages(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    return Boolean(document.createElement('canvas').getContext('2d'));
  } catch {
    return false;
  }
}

/** Dibuja la zona `area` de la página y la codifica como data URL. */
export async function renderRegion(page: PDFPageProxy, area: Placement): Promise<RenderedImage | null> {
  const scale = Math.min(3, Math.max(0.5, MAX_SIDE_PX / Math.max(area.width, area.height)));
  const base = page.getViewport({ scale });
  const [x1, y1, x2, y2] = base.convertToViewportRectangle([area.left, area.bottom, area.left + area.width, area.bottom + area.height]);
  const cropX = Math.min(x1, x2);
  const cropY = Math.min(y1, y2);
  const width = Math.max(1, Math.ceil(Math.abs(x2 - x1)));
  const height = Math.max(1, Math.ceil(Math.abs(y2 - y1)));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const viewport = page.getViewport({ scale, offsetX: -cropX, offsetY: -cropY });
  await page.render({ canvasContext: ctx, viewport }).promise;

  // PNG para figuras pequeñas (texto, diagramas); JPEG para fotos grandes.
  let src = width * height <= 250_000 ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.88);
  if (src.length > MAX_URL_CHARS) src = canvas.toDataURL('image/jpeg', 0.7);
  canvas.width = canvas.height = 0; // libera la memoria del canvas
  return { src, widthPt: area.width, heightPt: area.height, top: area.bottom + area.height, bottom: area.bottom };
}

/** Huella barata de una imagen para detectar la misma figura repetida en varias páginas. */
export function imageKey(src: string): string {
  return `${src.length}:${src.slice(60, 120)}:${src.slice(-60)}`;
}
