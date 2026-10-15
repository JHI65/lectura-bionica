// @vitest-environment jsdom
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { parseDocument, exportDocument } from '../src/lib/convert';
import { DEFAULT_SETTINGS } from '../src/lib/bionic/settings';
import type { PdfDocument } from '../src/lib/document';
import { makeTextPdf } from './fixtures';

const fileOf = (buffer: ArrayBuffer, name = 'informe.pdf') => new File([buffer], name, { type: 'application/pdf' });

const SAMPLE_LINES = [
  { text: 'Introducción al tema', size: 20 },
  { text: 'La lectura es una actividad que se puede personalizar según cada persona.', size: 11 },
  { text: 'Esta prueba comprueba la extracción de texto seleccionable del documento.', size: 11 },
  { text: 'Las tildes y la ñ también deben sobrevivir: canción, niño, camión.', size: 11 },
];

describe('importación PDF', () => {
  it('extrae texto con título y párrafos y avisa del orden de lectura', async () => {
    const doc = (await parseDocument(fileOf(await makeTextPdf(SAMPLE_LINES)))) as PdfDocument;
    expect(doc.kind).toBe('pdf');
    expect(doc.pageCount).toBe(1);
    const blocks = doc.sections[0].blocks;
    expect(blocks[0].kind).toBe('heading');
    expect(blocks.map((b) => b.text).join(' ')).toContain('canción, niño, camión');
    expect(doc.warnings.some((w) => w.code === 'PDF_ORDER')).toBe(true);
  });
});

describe('exportación PDF', () => {
  it('genera un PDF reabrible con el nombre adecuado', async () => {
    const doc = (await parseDocument(fileOf(await makeTextPdf(SAMPLE_LINES)))) as PdfDocument;
    const result = await exportDocument(doc, DEFAULT_SETTINGS);
    expect(result.fileName).toBe('informe-lectura-bionica.pdf');
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    expect(String.fromCharCode(...bytes.subarray(0, 5))).toBe('%PDF-');
    const reopened = await PDFDocument.load(bytes);
    expect(reopened.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(reopened.getTitle()).toBe('informe');
  });

  it('pagina el contenido largo en varias páginas', async () => {
    const lines = Array.from({ length: 160 }, (_, i) => ({
      text: `Línea ${i + 1} con suficiente texto para ocupar un renglón completo del documento.`,
      size: 11,
    }));
    const doc = (await parseDocument(fileOf(await makeTextPdf(lines)))) as PdfDocument;
    const result = await exportDocument(doc, DEFAULT_SETTINGS);
    const reopened = await PDFDocument.load(new Uint8Array(await result.blob.arrayBuffer()));
    expect(reopened.getPageCount()).toBeGreaterThan(1);
  });

  it('informa de los caracteres que no caben en la fuente estándar', async () => {
    const doc = (await parseDocument(fileOf(await makeTextPdf(SAMPLE_LINES)))) as PdfDocument;
    doc.sections[0].blocks.push({ kind: 'paragraph', text: 'Texto con símbolo raro: 漢字 y más contenido de prueba.' });
    const result = await exportDocument(doc, DEFAULT_SETTINGS);
    expect(result.warnings.some((w) => w.code === 'PDF_CHARS_REPLACED')).toBe(true);
  });
});

describe('PDF exportado: contenido, tamaño y memoria', () => {
  it('el texto exportado se puede volver a extraer (la negrita no parte las palabras)', async () => {
    const doc = (await parseDocument(fileOf(await makeTextPdf(SAMPLE_LINES)))) as PdfDocument;
    const result = await exportDocument(doc, { ...DEFAULT_SETTINGS, boldRatio: 0.5 });
    const again = (await parseDocument(fileOf(await result.blob.arrayBuffer(), 'salida.pdf'))) as PdfDocument;
    const text = again.sections.flatMap((s) => s.blocks.map((b) => b.text)).join(' ');
    expect(text).toContain('canción, niño, camión');
    expect(text).toContain('Introducción al tema');
    expect(text).toContain('extracción de texto seleccionable');
  });

  it('conserva tildes, ñ, comillas tipográficas y paréntesis escapados correctamente', async () => {
    const doc = (await parseDocument(fileOf(await makeTextPdf(SAMPLE_LINES)))) as PdfDocument;
    doc.sections[0].blocks.push({ kind: 'paragraph', text: 'Prueba (con paréntesis) y barra \\ además de “comillas” y € en el texto del documento.' });
    const result = await exportDocument(doc, DEFAULT_SETTINGS);
    const again = (await parseDocument(fileOf(await result.blob.arrayBuffer(), 'salida.pdf'))) as PdfDocument;
    const text = again.sections.flatMap((s) => s.blocks.map((b) => b.text)).join(' ');
    expect(text).toContain('(con paréntesis)');
    expect(text).toContain('“comillas”');
    expect(text).toContain('€');
  });

  it('un documento largo ocupa poco: el contenido va comprimido', async () => {
    const paragraph = 'La lectura personalizable permite ajustar el formato del texto para que cada persona lo encuentre cómodo. ';
    const blocks = Array.from({ length: 800 }, () => ({ kind: 'paragraph' as const, text: paragraph.repeat(2) }));
    const doc: PdfDocument = {
      kind: 'pdf',
      title: 'Largo',
      fileName: 'largo.pdf',
      warnings: [],
      pageCount: 1,
      extractedChars: 1,
      sections: [{ id: 'p1', pageNumber: 1, blocks }],
    };
    const result = await exportDocument(doc, DEFAULT_SETTINGS);
    const reopened = await PDFDocument.load(new Uint8Array(await result.blob.arrayBuffer()));
    const pages = reopened.getPageCount();
    expect(pages).toBeGreaterThan(30);
    // Antes del cambio: ~26 KB por página. Comprimido, debe quedar muy por debajo.
    expect(result.blob.size / pages).toBeLessThan(6 * 1024);
  });
});
