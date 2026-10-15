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
    expect(doc.warnings.some((w) => w.includes('orden del texto'))).toBe(true);
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
    expect(result.warnings.some((w) => w.includes('sustituido'))).toBe(true);
  });
});
