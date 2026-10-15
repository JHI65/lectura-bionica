// Exportación a PDF: reconstruye el texto extraído con negrita bionica real
// (fragmento en negrita + resto en normal) y paginación propia.
// Siempre sale en fondo blanco para imprimir; no es una copia del PDF original.

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import { ConversionError } from '../files/errors';
import { splitWord } from '../bionic/algorithm';
import { BIONIC_RATIO, INTENSITY_REST_OPACITY, type FontFamily, type ReadingSettings } from '../bionic/settings';
import type { PdfBlock, PdfDocument } from '../document';
import { safeBaseName } from '../files/validate';
import { toWinAnsi } from './winansi';

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const FOOTER_SIZE = 8;
const INK = 0.1; // gris casi negro del texto principal

const FONTS: Record<FontFamily, { regular: StandardFonts; bold: StandardFonts }> = {
  sans: { regular: StandardFonts.Helvetica, bold: StandardFonts.HelveticaBold },
  serif: { regular: StandardFonts.TimesRoman, bold: StandardFonts.TimesRomanBold },
  mono: { regular: StandardFonts.Courier, bold: StandardFonts.CourierBold },
};

export interface PdfExportResult {
  blob: Blob;
  fileName: string;
  warnings: string[];
}

interface Token {
  head: string;
  tail: string;
}

interface Layout {
  pdf: PDFDocument;
  page: PDFPage;
  y: number;
  pageNumber: number;
  footer: string;
}

export async function exportPdf(doc: PdfDocument, settings: ReadingSettings): Promise<PdfExportResult> {
  const blocks: PdfBlock[] = doc.sections.flatMap((s) => s.blocks);
  if (blocks.length === 0) throw new ConversionError('EXPORT_FAILED', 'no hay texto que exportar');

  const pdf = await PDFDocument.create();
  const fonts = FONTS[settings.fontFamily];
  const regular = await pdf.embedFont(fonts.regular);
  const bold = await pdf.embedFont(fonts.bold);
  const footerFont = await pdf.embedFont(StandardFonts.Helvetica);

  const bodySize = clamp(settings.fontSize * 0.75, 8, 24); // px a pt
  const lineHeight = bodySize * settings.lineHeight;
  const ratio = BIONIC_RATIO;
  // Sobre fondo blanco, la opacidad del resto equivale a un gris más claro.
  const restGray = 1 - INTENSITY_REST_OPACITY[settings.intensity] * (1 - INK);
  const restColor = rgb(restGray, restGray, Math.min(1, restGray + 0.01));
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  let replacedTotal = 0;
  const footer = `${toWinAnsi(doc.title).text.slice(0, 80)} · Lectura biónica`;
  const layout: Layout = { pdf, page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]), y: PAGE_HEIGHT - MARGIN, pageNumber: 1, footer };
  const pages: PDFPage[] = [layout.page];

  const ensureSpace = (needed: number) => {
    if (layout.y - needed < MARGIN) {
      drawFooter(layout, footerFont);
      layout.page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pages.push(layout.page);
      layout.pageNumber++;
      layout.y = PAGE_HEIGHT - MARGIN;
    }
  };

  for (const block of blocks) {
    const cleaned = toWinAnsi(block.text.replace(/\s+/g, ' ').trim());
    replacedTotal += cleaned.replaced;
    if (!cleaned.text) continue;

    const isHeading = block.kind === 'heading';
    const size = isHeading ? bodySize * 1.35 : bodySize;
    const indent = block.kind === 'listItem' ? 14 : 0;
    const useBionic = settings.bionicEnabled && !isHeading;
    const tokens: Token[] = cleaned.text.split(' ').filter(Boolean).map((word) => {
      if (!useBionic) return { head: '', tail: word };
      return splitWord(word, ratio);
    });

    const lines = wrap(tokens, {
      width: maxWidth - indent,
      size,
      regular,
      bold,
      boldAll: isHeading,
    });

    for (const line of lines) {
      ensureSpace(lineHeight);
      drawLine(layout, line, {
        x: MARGIN + indent,
        size,
        regular,
        bold,
        boldAll: isHeading,
        restColor,
      });
      layout.y -= lineHeight;
    }
    layout.y -= lineHeight * 0.6; // separación entre bloques
  }

  drawFooter(layout, footerFont);

  pdf.setTitle(doc.title);
  pdf.setCreator('Lectura biónica');
  pdf.setProducer('Lectura biónica');

  const bytes = await pdf.save();
  await verifyPdf(bytes, pages.length);

  const warnings: string[] = [];
  if (replacedTotal > 0) {
    warnings.push(`${replacedTotal} carácter(es) sin equivalente en la fuente estándar se han sustituido por «?».`);
  }

  return {
    blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }),
    fileName: `${safeBaseName(doc.fileName)}-lectura-bionica.pdf`,
    warnings,
  };
}

interface WrapOptions {
  width: number;
  size: number;
  regular: PDFFont;
  bold: PDFFont;
  boldAll: boolean;
}

interface LineToken {
  head: string;
  tail: string;
  headWidth: number;
  tailWidth: number;
}

function wrap(tokens: Token[], opts: WrapOptions): LineToken[][] {
  const spaceWidth = opts.regular.widthOfTextAtSize(' ', opts.size);
  const lines: LineToken[][] = [];
  let current: LineToken[] = [];
  let used = 0;

  for (const token of tokens) {
    const headWidth = opts.boldAll
      ? 0
      : opts.bold.widthOfTextAtSize(token.head, opts.size);
    const tailWidth = opts.boldAll
      ? opts.bold.widthOfTextAtSize(token.head + token.tail, opts.size)
      : opts.regular.widthOfTextAtSize(token.tail, opts.size);
    const wordWidth = headWidth + tailWidth;
    const needed = current.length === 0 ? wordWidth : spaceWidth + wordWidth;

    if (current.length > 0 && used + needed > opts.width) {
      lines.push(current);
      current = [];
      used = 0;
    }
    const gap = current.length === 0 ? 0 : spaceWidth;
    used += gap + wordWidth;
    current.push({ head: token.head, tail: token.tail, headWidth, tailWidth });
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

function drawLine(
  layout: Layout,
  line: LineToken[],
  opts: { x: number; size: number; regular: PDFFont; bold: PDFFont; boldAll: boolean; restColor: RGB },
): void {
  const spaceWidth = opts.regular.widthOfTextAtSize(' ', opts.size);
  let x = opts.x;
  const color = rgb(INK, INK + 0.01, INK + 0.03);
  line.forEach((token, index) => {
    if (index > 0) x += spaceWidth;
    if (opts.boldAll) {
      layout.page.drawText(token.head + token.tail, { x, y: layout.y, size: opts.size, font: opts.bold, color });
      x += token.headWidth + token.tailWidth;
      return;
    }
    if (token.head) {
      layout.page.drawText(token.head, { x, y: layout.y, size: opts.size, font: opts.bold, color });
      x += token.headWidth;
    }
    if (token.tail) {
      // Solo el resto de una palabra resaltada pierde contraste; el texto sin negrita queda en tinta normal.
      const tailColor = token.head ? opts.restColor : color;
      layout.page.drawText(token.tail, { x, y: layout.y, size: opts.size, font: opts.regular, color: tailColor });
      x += token.tailWidth;
    }
  });
}

function drawFooter(layout: Layout, font: PDFFont): void {
  const text = `${layout.footer} · ${layout.pageNumber}`;
  layout.page.drawText(text, {
    x: MARGIN,
    y: MARGIN / 2,
    size: FOOTER_SIZE,
    font,
    color: rgb(0.42, 0.45, 0.5),
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

async function verifyPdf(bytes: Uint8Array, expectedPages: number): Promise<void> {
  const header = String.fromCharCode(...bytes.subarray(0, 5));
  if (header !== '%PDF-') throw new ConversionError('EXPORT_VERIFY_FAILED', 'cabecera PDF incorrecta');
  const reopened = await PDFDocument.load(bytes).catch(() => {
    throw new ConversionError('EXPORT_VERIFY_FAILED', 'el PDF generado no se puede reabrir');
  });
  if (reopened.getPageCount() !== expectedPages) {
    throw new ConversionError('EXPORT_VERIFY_FAILED', 'número de páginas inesperado');
  }
}
