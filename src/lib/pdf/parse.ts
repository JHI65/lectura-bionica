// Extracción de texto de PDF con pdf.js. Detecta protección, daños y PDF
// escaneados sin texto seleccionable (no simula un resultado).

import * as pdfjs from 'pdfjs-dist';
import { ConversionError } from '../files/errors';
import type { PdfDocument, PdfSection } from '../document';
import { createYielder, throwIfAborted, type TaskOptions } from '../async';
import { buildBlocks, buildLines, type TextFragment } from './layout';

const MAX_PAGES = 2000;
const MIN_CHARS_WITH_TEXT = 40;

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

    const sections: PdfSection[] = [];
    let extractedChars = 0;
    let pagesWithText = 0;
    let suspicious = 0;

    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber++) {
      throwIfAborted(signal);
      onProgress?.({ stage: 'Leyendo página', done: pageNumber - 1, total: pagesToRead });
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
      const blocks = buildBlocks(lines);
      const chars = lines.reduce((sum, line) => sum + line.text.length, 0);
      extractedChars += chars;
      suspicious += lines.reduce((sum, line) => sum + (line.text.match(/[�-]/g)?.length ?? 0), 0);
      if (blocks.length > 0) {
        pagesWithText++;
        sections.push({ id: `p${pageNumber}`, title: `Página ${pageNumber}`, blocks });
      }
      page.cleanup();
    }

    if (extractedChars < MIN_CHARS_WITH_TEXT) {
      throw new ConversionError('PDF_NO_TEXT');
    }

    const warnings: string[] = [
      'La reconstrucción sigue el orden del texto del PDF. Columnas, tablas, notas al pie y fórmulas pueden no conservarse. No es una copia idéntica del original.',
    ];
    if (pagesWithText / pagesToRead < 0.5) {
      warnings.push(
        `Solo ${pagesWithText} de ${pagesToRead} páginas contienen texto seleccionable. Las páginas escaneadas se han omitido y necesitarían OCR.`,
      );
    }
    if (suspicious > 0 && suspicious / extractedChars > 0.02) {
      warnings.push('Algunos caracteres no se han podido decodificar (fuentes incrustadas). Revisa el resultado.');
    }
    if (pageCount > MAX_PAGES) {
      warnings.push(`El PDF tiene ${pageCount} páginas; solo se han procesado las primeras ${MAX_PAGES}.`);
    }

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
