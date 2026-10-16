// Paridad entre idiomas: mismas claves, mensajes para cada código y nada de
// español en la versión inglesa.
import { describe, expect, it } from 'vitest';
import { DICT } from '../src/i18n/dict';
import { GUIDES } from '../src/content/seo-pages';
import { LEGAL_DOCS } from '../src/content/legal';
import { faqFor } from '../src/content/faq';
import { ROUTES } from '../src/content/routes';
import { LOCALES, localeFromPath } from '../src/i18n/locale';
import type { ConversionErrorCode } from '../src/lib/files/errors';
import type { WarningCode } from '../src/lib/warnings';

type Tree = { [key: string]: Tree | string | number | ((...args: never[]) => unknown) | Tree[] | string[] };

function keysOf(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) return [`${prefix}[${value.length}]`];
  if (value && typeof value === 'object') {
    return Object.entries(value as Tree).flatMap(([k, v]) => keysOf(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

/** Todos los textos (cadenas) de un valor, con su ruta. */
function strings(value: unknown, path = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value as Tree).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
  }
  return [];
}

// Caracteres propios del español. En la versión inglesa solo pueden aparecer
// en el nombre del selector de idioma («Español») y su etiqueta accesible.
const SPANISH_CHARS = /[ñÑ¿¡áéíóúÁÉÍÓÚüÜ]/;

describe('diccionario de la interfaz', () => {
  it('es y en tienen exactamente las mismas claves', () => {
    expect(keysOf(DICT.en).sort()).toEqual(keysOf(DICT.es).sort());
  });

  it('el inglés no contiene caracteres del español (salvo el selector de idioma)', () => {
    const { language: _language, ...rest } = DICT.en;
    void _language;
    const offenders = strings(rest).filter(([, text]) => SPANISH_CHARS.test(text));
    expect(offenders).toEqual([]);
  });

  it('cada código de error tiene mensaje no vacío en cada idioma', () => {
    const codes: ConversionErrorCode[] = [
      'UNSUPPORTED_TYPE', 'FILE_TOO_LARGE', 'EMPTY_FILE', 'EPUB_INVALID', 'EPUB_PROTECTED', 'EPUB_NO_CONTENT',
      'PDF_DAMAGED', 'PDF_PROTECTED', 'PDF_NO_TEXT', 'EXPORT_FAILED', 'EXPORT_VERIFY_FAILED', 'RESOURCE_LIMIT',
      'CANCELLED', 'UNKNOWN',
    ];
    for (const locale of LOCALES) {
      for (const code of codes) {
        const text = DICT[locale].errors[code]({ sizeBytes: 21 * 1024 * 1024, maxBytes: 20 * 1024 * 1024 }, locale === 'en' ? 'en-US' : 'es-ES');
        expect(text.length, `${locale}/${code}`).toBeGreaterThan(10);
      }
    }
  });

  it('el mensaje de tamaño usa el separador decimal de cada idioma', () => {
    const p = { sizeBytes: 21.5 * 1024 * 1024, maxBytes: 20 * 1024 * 1024 };
    expect(DICT.es.errors.FILE_TOO_LARGE(p, 'es-ES')).toContain('21,5 MB');
    expect(DICT.en.errors.FILE_TOO_LARGE(p, 'en-US')).toContain('21.5 MB');
  });

  it('cada aviso tiene texto en cada idioma y usa sus parámetros', () => {
    const codes: WarningCode[] = [
      'PDF_ORDER', 'PDF_FEW_TEXT_PAGES', 'PDF_DECODING', 'PDF_TRUNCATED', 'EPUB_UNREADABLE_CHAPTER', 'EPUB_NO_BODY',
      'EPUB_EMPTY_SECTIONS', 'EPUB_IMAGES_OMITTED', 'EPUB_PREVIOUSLY_CONVERTED', 'EXPORT_NOT_STRICT_XHTML',
      'EXPORT_NO_BODY', 'PDF_CHARS_REPLACED',
    ];
    const params = { withText: 3, total: 10, pages: 2500, max: 2000, path: 'OEBPS/c1.xhtml', count: 7, index: 4, title: 'Chapter One' };
    for (const locale of LOCALES) {
      for (const code of codes) expect(DICT[locale].warnings[code](params).length, `${locale}/${code}`).toBeGreaterThan(10);
    }
    expect(DICT.en.warnings.PDF_FEW_TEXT_PAGES(params)).toContain('3 of 10');
    expect(DICT.es.warnings.PDF_FEW_TEXT_PAGES(params)).toContain('3 de 10');
  });
});

describe('contenido en inglés', () => {
  it('las guías en inglés no contienen caracteres del español', () => {
    const offenders = strings(GUIDES.en).filter(([, text]) => SPANISH_CHARS.test(text));
    expect(offenders).toEqual([]);
  });

  it('los documentos legales en inglés no contienen caracteres del español', () => {
    const offenders = strings(LEGAL_DOCS.en).filter(([, text]) => SPANISH_CHARS.test(text));
    expect(offenders).toEqual([]);
  });

  it('las preguntas frecuentes existen en ambos idiomas, en el mismo número y sin español en inglés', () => {
    expect(faqFor('en').length).toBe(faqFor('es').length);
    expect(strings(faqFor('en')).filter(([, text]) => SPANISH_CHARS.test(text))).toEqual([]);
  });

  it('los títulos y descripciones en inglés no contienen caracteres del español', () => {
    const offenders = ROUTES.flatMap((r) => (r.en ? strings(r.en) : [])).filter(([, text]) => SPANISH_CHARS.test(text));
    expect(offenders).toEqual([]);
  });

  it('las guías en inglés no mencionan Premium, cuentas ni cobros que no existen en esa versión', () => {
    const text = JSON.stringify([GUIDES.en, LEGAL_DOCS.en]);
    expect(text).not.toMatch(/premium|stripe|supabase|subscription/i);
  });

  it('el aviso de marca figura en la versión inglesa', () => {
    expect(JSON.stringify(GUIDES.en)).toMatch(/registered trademark/i);
    expect(DICT.en.footer.copyright(2026, 'Readably')).toMatch(/trademark/i);
  });
});

describe('detección de idioma', () => {
  it('lo decide la URL', () => {
    expect(localeFromPath('/en')).toBe('en');
    expect(localeFromPath('/en/')).toBe('en');
    expect(localeFromPath('/en/privacy')).toBe('en');
    expect(localeFromPath('/privacidad')).toBe('es');
    expect(localeFromPath('/')).toBe('es');
    expect(localeFromPath('/entrar')).toBe('es'); // /en… no debe confundirse con /entrar
  });
});
