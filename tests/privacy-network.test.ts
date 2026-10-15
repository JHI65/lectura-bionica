// @vitest-environment jsdom
// Garantía de privacidad: procesar un documento no genera NINGUNA petición de red.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportDocument, parseDocument } from '../src/lib/convert';
import { DEFAULT_SETTINGS } from '../src/lib/bionic/settings';
import { makeEpub, makeTextPdf } from './fixtures';

const calls: string[] = [];

beforeEach(() => {
  calls.length = 0;
  vi.stubGlobal('fetch', (...args: unknown[]) => {
    calls.push(`fetch ${String(args[0])}`);
    return Promise.reject(new Error('red bloqueada en el test'));
  });
  vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(function (this: XMLHttpRequest, method: string, url: string | URL) {
    calls.push(`xhr ${method} ${String(url)}`);
  });
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    value: (url: string) => {
      calls.push(`beacon ${url}`);
      return true;
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('privacidad: sin red durante la conversión', () => {
  it('EPUB: importar y exportar no hace ninguna petición', async () => {
    const buffer = await makeEpub({
      chapters: [{ name: 'OEBPS/c.xhtml', body: '<p>Contenido privado del libro que no debe salir del navegador.</p>' }],
    });
    const doc = await parseDocument(new File([buffer], 'privado.epub'));
    await exportDocument(doc, DEFAULT_SETTINGS);
    expect(calls).toEqual([]);
  });

  it('PDF: importar y exportar no hace ninguna petición', async () => {
    const buffer = await makeTextPdf([{ text: 'Documento privado con texto suficiente para extraer sin problemas.' }]);
    const doc = await parseDocument(new File([buffer], 'privado.pdf'));
    await exportDocument(doc, DEFAULT_SETTINGS);
    expect(calls).toEqual([]);
  });
});
