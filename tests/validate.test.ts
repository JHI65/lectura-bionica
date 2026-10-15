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
    const big = new Uint8Array(26 * 1024 * 1024);
    big.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(await codeOf(validateFile(fileOf([big], 'enorme.pdf')))).toBe('FILE_TOO_LARGE');
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
