// Extracción de texto de PDF con pdf.js. Detecta protección, daños y PDF
// escaneados sin texto seleccionable (no simula un resultado).

import * as pdfjs from 'pdfjs-dist';
import { ConversionError } from '../files/errors';
import type { PdfDocument, PdfSection } from '../document';
import { createYielder, throwIfAborted, type TaskOptions } from '../async';
import type { AppWarning } from '../warnings';
import { buildBlocks, buildLines, type PageImage, type TextFragment, type TextLine } from './layout';
import {
  canRenderImages,
  collectPlacements,
  hasImageOps,
  imageKey,
  renderRegion,
  selectPlacements,
  type OpsTable,
  type RenderedImage,
} from './images';

const MAX_PAGES = 2000;
const MIN_CHARS_WITH_TEXT = 40;
// Límites de imágenes: acotan la memoria y el tamaño del PDF resultante.
const MAX_IMAGES = 150;
const MAX_IMAGE_CHARS = 40_000_000; // ~30 MB de imágenes codificadas
const REPEATED_ON_PAGES = 3;

let workerConfigured = false;
export function ensurePdfWorker(): void {
  if (workerConfigured) return;
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  }
  workerConfigured = true;
}

function mapPdfError(error: unknown): ConversionError {
  const name = (error as { name?: string })?.name ?? '';
  if (name === 'PasswordException') return new ConversionError('PDF_PROTECTED');
  return new ConversionError('PDF_DAMAGED', error instanceof Error ? error.message : undefined);
}

export interface ParsePdfOptions extends TaskOptions {
  workerSrc?: string;
}

export async function parsePdf(buffer: ArrayBuffer, fileName: string, options: ParsePdfOptions = {}): Promise<PdfDocument> {
  const { workerSrc, signal, onProgress } = options;
  const yieldToUi = createYielder();
  throwIfAborted(signal);
  if (workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  else ensurePdfWorker();

  let pdf: pdfjs.PDFDocumentProxy;
  try {
    pdf = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      isEvalSupported: false,
      disableFontFace: true,
    }).promise;
  } catch (error) {
    throw mapPdfError(error);
  }

  try {
    const pageCount = pdf.numPages;
    if (pageCount === 0) throw new ConversionError('PDF_DAMAGED', 'sin páginas');
    const pagesToRead = Math.min(pageCount, MAX_PAGES);

    // Pasada 1: texto (barata). Decide enseguida si el PDF es un escaneo sin texto,
    // antes de gastar tiempo en dibujar imágenes de un documento que se va a rechazar.
    const pagesText: Array<{ pageNumber: number; lines: TextLine[] }> = [];
    let extractedChars = 0;
    let pagesWithText = 0;
    let suspicious = 0;

    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber++) {
      throwIfAborted(signal);
      onProgress?.({ stage: 'pdf-page', done: pageNumber - 1, total: pagesToRead });
      await yieldToUi();
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const fragments: TextFragment[] = [];
      for (const item of content.items) {
        if (!('str' in item) || !item.str) continue;
        const [, , , d, e, f] = item.transform as number[];
        fragments.push({
          text: item.str,
          x: e,
          y: f,
          width: item.width,
          height: Math.abs(d) || Math.abs(item.height) || 10,
        });
      }

      const lines = buildLines(fragments);
      const chars = lines.reduce((sum, line) => sum + line.text.length, 0);
      extractedChars += chars;
      suspicious += lines.reduce((sum, line) => sum + (line.text.match(/[\uFFFD\uE000-\uF8FF]/g)?.length ?? 0), 0);
      if (chars > 0) pagesWithText++;
      pagesText.push({ pageNumber, lines });
      page.cleanup();
    }

    if (extractedChars < MIN_CHARS_WITH_TEXT) {
      throw new ConversionError('PDF_NO_TEXT');
    }

    // Pasada 2: imágenes (solo en navegador, que es donde hay canvas).
    const imagesByPage = new Map<number, RenderedImage[]>();
    let imagesSkipped = 0;
    if (canRenderImages()) {
      const OPS = pdfjs.OPS as unknown as OpsTable;
      let imageCount = 0;
      let imageChars = 0;
      for (const { pageNumber, lines } of pagesText) {
        throwIfAborted(signal);
        onProgress?.({ stage: 'pdf-images', done: pageNumber - 1, total: pagesToRead });
        await yieldToUi();
        const page = await pdf.getPage(pageNumber);
        try {
          const ops = await page.getOperatorList();
          if (!hasImageOps(ops, OPS)) continue;
          const [x0, y0, x1, y1] = page.view;
          const chosen = selectPlacements(
            collectPlacements(ops, OPS),
            { left: x0, bottom: y0, width: x1 - x0, height: y1 - y0 },
            lines.length > 0,
          );
          for (const area of chosen) {
            if (imageCount >= MAX_IMAGES || imageChars >= MAX_IMAGE_CHARS) {
              imagesSkipped++;
              continue;
            }
            const rendered = await renderRegion(page, area).catch(() => null);
            if (!rendered) {
              imagesSkipped++;
              continue;
            }
            imageCount++;
            imageChars += rendered.src.length;
            imagesByPage.set(pageNumber, [...(imagesByPage.get(pageNumber) ?? []), rendered]);
          }
        } catch (error) {
          if (error instanceof ConversionError) throw error;
          imagesSkipped++; // una página con operaciones raras no debe romper el texto
        } finally {
          page.cleanup();
        }
      }

      // La misma imagen en 3 o más páginas es una cabecera, pie o logotipo, no contenido.
      const pagesPerImage = new Map<string, Set<number>>();
      for (const [pageNumber, list] of imagesByPage) {
        for (const image of list) {
          const key = imageKey(image.src);
          pagesPerImage.set(key, (pagesPerImage.get(key) ?? new Set()).add(pageNumber));
        }
      }
      for (const [pageNumber, list] of imagesByPage) {
        const kept = list.filter((image) => (pagesPerImage.get(imageKey(image.src))?.size ?? 0) < REPEATED_ON_PAGES);
        if (kept.length > 0) imagesByPage.set(pageNumber, kept);
        else imagesByPage.delete(pageNumber);
      }
    }

    const sections: PdfSection[] = [];
    for (const { pageNumber, lines } of pagesText) {
      const images: PageImage[] = (imagesByPage.get(pageNumber) ?? []).map((image) => ({
        top: image.top,
        bottom: image.bottom,
        block: { kind: 'image', text: '', src: image.src, widthPt: image.widthPt, heightPt: image.heightPt },
      }));
      const blocks = buildBlocks(lines, images);
      if (blocks.length > 0) sections.push({ id: `p${pageNumber}`, pageNumber, blocks });
    }

    const warnings: AppWarning[] = [{ code: 'PDF_ORDER' }];
    if (pagesWithText / pagesToRead < 0.5) {
      warnings.push({ code: 'PDF_FEW_TEXT_PAGES', params: { withText: pagesWithText, total: pagesToRead } });
    }
    if (suspicious > 0 && suspicious / extractedChars > 0.02) {
      warnings.push({ code: 'PDF_DECODING' });
    }
    if (pageCount > MAX_PAGES) {
      warnings.push({ code: 'PDF_TRUNCATED', params: { pages: pageCount, max: MAX_PAGES } });
    }
    if (imagesSkipped > 0) warnings.push({ code: 'PDF_IMAGES_SKIPPED', params: { count: imagesSkipped } });

    const meta = await pdf.getMetadata().catch(() => null);
    const info = (meta?.info ?? {}) as { Title?: string };
    const title = info.Title?.trim() || fileName.replace(/\.pdf$/i, '');

    return {
      kind: 'pdf',
      title,
      fileName,
      warnings,
      sections,
      pageCount,
      extractedChars,
    };
  } catch (error) {
    if (error instanceof ConversionError) throw error;
    throw mapPdfError(error);
  } finally {
    await pdf.destroy();
  }
}
