// Exportación a PDF: reconstruye el texto extraído con negrita bionica real
// (fragmento en negrita + resto en normal) y paginación propia.
// Siempre sale en fondo blanco para imprimir; no es una copia del PDF original.

import { PDFDocument, PDFName, StandardFonts, type PDFFont, type PDFPage, type PDFRef } from 'pdf-lib';
import { ConversionError } from '../files/errors';
import { splitWord } from '../bionic/algorithm';
import { INTENSITY_REST_OPACITY, type FontFamily, type ReadingSettings } from '../bionic/settings';
import type { PdfBlock, PdfDocument } from '../document';
import { safeBaseName } from '../files/validate';
import { createYielder, throwIfAborted, type TaskOptions } from '../async';
import { BRAND, FILE_SUFFIX } from '../../i18n/locale';
import type { AppWarning } from '../warnings';
import { toPdfLiteral, toWinAnsi } from './winansi';

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
  warnings: AppWarning[];
}

interface Token {
  head: string;
  tail: string;
}

type Rgb = [number, number, number];
type FontSlot = 'regular' | 'bold' | 'footer';

/**
 * Escribe el contenido de una página como un único flujo comprimido.
 * Con pdf-lib, cada drawText() crea decenas de objetos; en documentos largos
 * eso dispara la memoria (cientos de MB) y el tamaño del PDF. Aquí cada
 * operación es una línea de texto y el flujo se comprime al cerrar la página.
 */
class PageWriter {
  private ops: string[] = [];
  private keys: Record<FontSlot, string>;

  constructor(
    readonly page: PDFPage,
    fonts: Record<FontSlot, PDFFont>,
  ) {
    this.keys = {
      regular: String(page.node.newFontDictionary(fonts.regular.name, fonts.regular.ref)),
      bold: String(page.node.newFontDictionary(fonts.bold.name, fonts.bold.ref)),
      footer: String(page.node.newFontDictionary(fonts.footer.name, fonts.footer.ref)),
    };
  }

  text(slot: FontSlot, size: number, x: number, y: number, color: Rgb, text: string): void {
    const [r, g, b] = color.map((c) => c.toFixed(3));
    this.ops.push(`BT ${this.keys[slot]} ${size.toFixed(2)} Tf ${r} ${g} ${b} rg ${x.toFixed(2)} ${y.toFixed(2)} Td ${toPdfLiteral(text)} Tj ET`);
  }

  /** Dibuja una imagen ya incrustada en el documento. */
  image(ref: PDFRef, x: number, y: number, width: number, height: number): void {
    const key = String(this.page.node.newXObject('Img', ref));
    this.ops.push(`q ${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm ${key} Do Q`);
  }

  close(pdf: PDFDocument): void {
    const stream = pdf.context.flateStream(this.ops.join('\n'));
    this.page.node.set(PDFName.of('Contents'), pdf.context.register(stream));
    this.ops = [];
  }
}

interface Layout {
  pdf: PDFDocument;
  writer: PageWriter;
  y: number;
  pageNumber: number;
  footer: string;
}

export async function exportPdf(doc: PdfDocument, settings: ReadingSettings, options: TaskOptions = {}): Promise<PdfExportResult> {
  const { signal, onProgress, locale = 'es' } = options;
  const yieldToUi = createYielder();
  const blocks: PdfBlock[] = doc.sections.flatMap((s) => s.blocks);
  if (blocks.length === 0) throw new ConversionError('EXPORT_FAILED', 'no hay texto que exportar');

  const pdf = await PDFDocument.create();
  const fonts = FONTS[settings.fontFamily];
  const regular = await pdf.embedFont(fonts.regular);
  const bold = await pdf.embedFont(fonts.bold);
  const footerFont = await pdf.embedFont(StandardFonts.Helvetica);

  const bodySize = clamp(settings.fontSize * 0.75, 8, 24); // px a pt
  const lineHeight = bodySize * settings.lineHeight;
  const ratio = settings.boldRatio;
  // Sobre fondo blanco, la opacidad del resto equivale a un gris más claro.
  const restGray = 1 - INTENSITY_REST_OPACITY[settings.intensity] * (1 - INK);
  const restColor: Rgb = [restGray, restGray, Math.min(1, restGray + 0.01)];
  const inkColor: Rgb = [INK, INK + 0.01, INK + 0.03];
  const fontSet = { regular, bold, footer: footerFont };
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  let replacedTotal = 0;
  const footer = `${toWinAnsi(doc.title).text.slice(0, 80)} · ${BRAND[locale]}`;
  const layout: Layout = {
    pdf,
    writer: new PageWriter(pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]), fontSet),
    y: PAGE_HEIGHT - MARGIN,
    pageNumber: 1,
    footer,
  };
  let pageCount = 1;

  const ensureSpace = (needed: number) => {
    if (layout.y - needed < MARGIN) {
      drawFooter(layout);
      layout.writer.close(pdf); // comprime y libera la página terminada
      layout.writer = new PageWriter(pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]), fontSet);
      pageCount++;
      layout.pageNumber++;
      layout.y = PAGE_HEIGHT - MARGIN;
    }
  };

  let imagesFailed = 0;
  for (const [blockIndex, block] of blocks.entries()) {
    throwIfAborted(signal);
    if (blockIndex % 25 === 0) onProgress?.({ stage: 'pdf-build', done: blockIndex, total: blocks.length });
    await yieldToUi();

    if (block.kind === 'image') {
      const embedded = block.src ? await embedDataUrl(pdf, block.src).catch(() => null) : null;
      if (!embedded) {
        imagesFailed++;
        continue;
      }
      // Ancho completo como máximo, proporción conservada y nunca más alta que una página.
      const ratio = embedded.width / embedded.height;
      const maxHeight = PAGE_HEIGHT - MARGIN * 2 - 20;
      let w = Math.min(maxWidth, block.widthPt ?? embedded.width);
      let h = w / ratio;
      if (h > maxHeight) {
        h = maxHeight;
        w = h * ratio;
      }
      ensureSpace(h);
      layout.writer.image(embedded.ref, MARGIN + (maxWidth - w) / 2, layout.y - h, w, h);
      layout.y -= h + lineHeight * 0.8;
      continue;
    }
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
        inkColor,
      });
      layout.y -= lineHeight;
    }
    layout.y -= lineHeight * 0.6; // separación entre bloques
  }

  drawFooter(layout);
  layout.writer.close(pdf);

  pdf.setTitle(doc.title);
  pdf.setCreator(BRAND[locale]);
  pdf.setProducer(BRAND[locale]);

  const bytes = await pdf.save();
  await verifyPdf(bytes, pageCount);

  const warnings: AppWarning[] = [];
  if (replacedTotal > 0) warnings.push({ code: 'PDF_CHARS_REPLACED', params: { count: replacedTotal } });
  if (imagesFailed > 0) warnings.push({ code: 'PDF_IMAGES_SKIPPED', params: { count: imagesFailed } });

  return {
    blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }),
    fileName: `${safeBaseName(doc.fileName)}-${FILE_SUFFIX[locale]}.pdf`,
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
  opts: {
    x: number;
    size: number;
    regular: PDFFont;
    bold: PDFFont;
    boldAll: boolean;
    restColor: Rgb;
    inkColor: Rgb;
  },
): void {
  const spaceWidth = opts.regular.widthOfTextAtSize(' ', opts.size);
  const { writer, y } = layout;
  let x = opts.x;
  line.forEach((token, index) => {
    if (index > 0) x += spaceWidth;
    if (opts.boldAll) {
      writer.text('bold', opts.size, x, y, opts.inkColor, token.head + token.tail);
      x += token.headWidth + token.tailWidth;
      return;
    }
    if (token.head) {
      writer.text('bold', opts.size, x, y, opts.inkColor, token.head);
      x += token.headWidth;
    }
    if (token.tail) {
      // Solo el resto de una palabra resaltada pierde contraste; el texto sin negrita queda en tinta normal.
      const tailColor = token.head ? opts.restColor : opts.inkColor;
      writer.text('regular', opts.size, x, y, tailColor, token.tail);
      x += token.tailWidth;
    }
  });
}

function drawFooter(layout: Layout): void {
  const text = `${layout.footer} · ${layout.pageNumber}`;
  layout.writer.text('footer', FOOTER_SIZE, MARGIN, MARGIN / 2, [0.42, 0.45, 0.5], text);
}

/** Incrusta en el PDF una imagen guardada como data URL (PNG o JPEG). */
async function embedDataUrl(pdf: PDFDocument, dataUrl: string) {
  const match = /^data:image\/(png|jpeg);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  return match[1] === 'png' ? pdf.embedPng(bytes) : pdf.embedJpg(bytes);
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
