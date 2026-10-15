// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sniffKind, validateFile, safeBaseName } from '../src/lib/files/validate';
import { ConversionError } from '../src/lib/files/errors';
import { parseDocument } from '../src/lib/convert';
import { makeEpub, makeTextPdf, makeImageOnlyPdf } from './fixtures';
import JSZip from 'jszip';

const fileOf = (content: BlobPart[], name: string) => new File(content, name);

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'OK';
  } catch (error) {
    return error instanceof ConversionError ? error.code : `NO_CONVERSION_ERROR:${String(error)}`;
  }
}

describe('validateFile', () => {
  it('detecta PDF por firma aunque la extensión sea engañosa', async () => {
    const pdf = await makeTextPdf([{ text: 'Hola mundo de prueba' }]);
    const disguised = fileOf([pdf], 'libro.epub');
    await expect(validateFile(disguised)).resolves.toEqual({ kind: 'pdf' });
  });

  it('rechaza texto plano renombrado a .pdf', async () => {
    const file = fileOf(['esto no es un pdf'], 'notas.pdf');
    expect(await codeOf(validateFile(file))).toBe('UNSUPPORTED_TYPE');
  });

  it('rechaza archivos vacíos', async () => {
    expect(await codeOf(validateFile(fileOf([], 'vacio.pdf')))).toBe('EMPTY_FILE');
  });

  it('rechaza archivos que superan el tamaño máximo', async () => {
    const big = new Uint8Array(21 * 1024 * 1024);
    big.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(await codeOf(validateFile(fileOf([big], 'enorme.pdf')))).toBe('FILE_TOO_LARGE');
  });

  it('el mensaje de tamaño indica el peso del archivo y el máximo permitido', async () => {
    const big = new Uint8Array(21 * 1024 * 1024);
    big.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const error = await validateFile(fileOf([big], 'enorme.pdf')).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConversionError);
    expect((error as ConversionError).message).toMatch(/21 MB/);
    expect((error as ConversionError).message).toMatch(/20 MB/);
  });

  it('un archivo justo en el límite se acepta', async () => {
    const edge = new Uint8Array(20 * 1024 * 1024);
    edge.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
    await expect(validateFile(fileOf([edge], 'limite.pdf'))).resolves.toEqual({ kind: 'pdf' });
  });

  it('sniffKind reconoce las firmas de PDF y ZIP', () => {
    expect(sniffKind(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe('pdf');
    expect(sniffKind(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00]))).toBe('zip');
    expect(sniffKind(new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]))).toBeNull();
  });
});

describe('safeBaseName', () => {
  it('elimina rutas, caracteres peligrosos y la extensión', () => {
    expect(safeBaseName('../../etc/passwd.epub')).toBe('passwd');
    expect(safeBaseName('Mi libro: “edición” <final>.pdf')).toBe('Mi libro “edición” final');
    expect(safeBaseName('   ')).toBe('documento');
  });
});

describe('parseDocument: archivos dañados o no admitidos', () => {
  it('ZIP que no es EPUB se rechaza como tipo no admitido', async () => {
    const zip = new JSZip();
    zip.file('readme.txt', 'hola');
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    expect(await codeOf(parseDocument(fileOf([buffer], 'otro.epub')))).toBe('UNSUPPORTED_TYPE');
  });

  it('PDF sin texto seleccionable se identifica como escaneado', async () => {
    const buffer = await makeImageOnlyPdf();
    expect(await codeOf(parseDocument(fileOf([buffer], 'escaneo.pdf')))).toBe('PDF_NO_TEXT');
  });

  it('PDF truncado se identifica como dañado', async () => {
    const full = new Uint8Array(await makeTextPdf([{ text: 'Texto de prueba suficiente para el PDF' }]));
    const truncated = full.slice(0, 200);
    expect(await codeOf(parseDocument(fileOf([truncated], 'roto.pdf')))).toBe('PDF_DAMAGED');
  });

  it('EPUB con DRM se rechaza como protegido', async () => {
    const buffer = await makeEpub({
      chapters: [{ name: 'OEBPS/c.xhtml', body: '<p>Texto cifrado de prueba</p>' }],
      encryptionXml: `<encryption><enc:EncryptedData xmlns:enc="x"><enc:CipherData><enc:CipherReference URI="OEBPS/c.xhtml"/></enc:CipherData></enc:EncryptedData></encryption>`,
    });
    expect(await codeOf(parseDocument(fileOf([buffer], 'drm.epub')))).toBe('EPUB_PROTECTED');
  });
});

describe('cancelación, progreso y errores de memoria', () => {
  it('una señal ya cancelada detiene la conversión con el código CANCELLED', async () => {
    const buffer = await makeTextPdf([{ text: 'Texto de prueba suficiente para el documento.' }]);
    const controller = new AbortController();
    controller.abort();
    expect(await codeOf(parseDocument(fileOf([buffer], 'a.pdf'), { signal: controller.signal }))).toBe('CANCELLED');
  });

  it('informa del progreso durante la lectura', async () => {
    const buffer = await makeTextPdf([{ text: 'Texto de prueba suficiente para el documento.' }]);
    const stages: string[] = [];
    await parseDocument(fileOf([buffer], 'a.pdf'), { onProgress: (p) => stages.push(`${p.stage} ${p.done}/${p.total}`) });
    expect(stages.length).toBeGreaterThan(0);
    expect(stages[0]).toMatch(/Leyendo página 0\/1/);
  });

  it('los fallos de memoria se traducen a un mensaje comprensible', async () => {
    const { toConversionError } = await import('../src/lib/files/errors');
    expect(toConversionError(new RangeError('Array buffer allocation failed')).code).toBe('RESOURCE_LIMIT');
    expect(toConversionError(new Error('Out of memory')).code).toBe('RESOURCE_LIMIT');
    expect(toConversionError(new Error('otra cosa'), 'EXPORT_FAILED').code).toBe('EXPORT_FAILED');
  });
});
