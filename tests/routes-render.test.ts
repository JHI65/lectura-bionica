// Cada ruta publicada debe renderizar su contenido real en cada idioma, también
// con la barra final (las URLs canónicas terminan en «/»). Un fallo aquí dejó
// las guías y las páginas legales mostrando «Página no encontrada» al entrar
// por su URL directa.
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { GuidePage, LegalPage } from '../src/pages/ContentPages';
import { HomePage } from '../src/pages/HomePage';
import { GUIDES } from '../src/content/seo-pages';
import { CONTROLLER, LEGAL_DOCS } from '../src/content/legal';
import { ROUTES, normalizePath } from '../src/content/routes';
import { DICT } from '../src/i18n/dict';
import { LOCALES, type Locale } from '../src/i18n/locale';

const render = (Page: () => JSX.Element, location: string) =>
  renderToString(createElement(MemoryRouter, { initialEntries: [location] }, createElement(Page)));

const pathOf = (id: string, locale: Locale) => ROUTES.find((r) => r.id === id)![locale]!.path;
const NOT_FOUND = { es: 'Página no encontrada', en: 'Page not found' } as const;

const wordCount = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/g, ' ')
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w)).length;

describe('normalizePath', () => {
  it('quita la barra final salvo en la raíz', () => {
    expect(normalizePath('/privacidad/')).toBe('/privacidad');
    expect(normalizePath('/en/privacy/')).toBe('/en/privacy');
    expect(normalizePath('/')).toBe('/');
  });
});

for (const locale of LOCALES) {
  describe(`guías (${locale})`, () => {
    const guides = GUIDES[locale];

    it('hay las mismas guías en todos los idiomas', () => {
      expect(guides.map((g) => g.id)).toEqual(GUIDES.es.map((g) => g.id));
    });

    for (const guide of guides) {
      for (const suffix of ['', '/']) {
        it(`${pathOf(guide.id, locale)}${suffix} muestra su contenido`, () => {
          const html = render(GuidePage, `${pathOf(guide.id, locale)}${suffix}`);
          expect(html).not.toContain(NOT_FOUND[locale]);
          expect(html).toContain(guide.sections[0].heading.replace(/&/g, '&amp;').slice(0, 15));
        });
      }

      it(`${guide.id} tiene contenido sustancial (≥ 450 palabras)`, () => {
        expect(wordCount(render(GuidePage, `${pathOf(guide.id, locale)}/`))).toBeGreaterThanOrEqual(450);
      });

      it(`${guide.id} no repite encabezados ni hace afirmaciones clínicas`, () => {
        const headings = guide.sections.map((s) => s.heading);
        expect(new Set(headings).size).toBe(headings.length);
        const text = JSON.stringify(guide);
        expect(text).not.toMatch(/\b(cura|curar|cure[sd]?|heals?|trata(?:miento)? (?:el|del) TDAH|guaranteed improvement|mejora (?:garantizada|demostrada))\b/i);
      });
    }
  });

  describe(`páginas legales (${locale})`, () => {
    for (const doc of LEGAL_DOCS[locale]) {
      for (const suffix of ['', '/']) {
        it(`${pathOf(doc.id, locale)}${suffix} muestra su contenido`, () => {
          const html = render(LegalPage, `${pathOf(doc.id, locale)}${suffix}`);
          expect(html).not.toContain(NOT_FOUND[locale]);
          expect(html).toContain(doc.title);
        });
      }
    }

    it('el aviso legal publica los datos del titular y no deja marcadores', () => {
      const html = render(LegalPage, `${pathOf('legal', locale)}/`);
      expect(html).toContain(CONTROLLER.name);
      expect(html).toContain('50482704G');
      expect(html).toContain('Calle Portillo 16');
      expect(html).not.toContain('COMPLETAR');
    });

    it('hay los mismos documentos legales en todos los idiomas', () => {
      expect(LEGAL_DOCS[locale].map((d) => d.id).sort()).toEqual(LEGAL_DOCS.es.map((d) => d.id).sort());
    });
  });

  describe(`portada (${locale})`, () => {
    it('muestra su titular y el conversor', () => {
      const html = render(HomePage, pathOf('home', locale));
      expect(html).toContain(DICT[locale].home.h1);
      expect(html).toContain(DICT[locale].dropzone.title);
    });

    it('enlaza solo a rutas de su idioma', () => {
      const html = render(HomePage, pathOf('home', locale));
      const hrefs = [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
      expect(hrefs.length).toBeGreaterThan(3);
      if (locale === 'en') expect(hrefs.every((h) => h === '/en' || h.startsWith('/en/') || h.startsWith('/#') || h.startsWith('/lectura') || h === '/')).toBe(true);
      else expect(hrefs.some((h) => h.startsWith('/en/'))).toBe(false);
    });
  });
}

describe('rutas inexistentes', () => {
  it('una ruta que no existe muestra «Página no encontrada» en su idioma', () => {
    expect(render(GuidePage, '/ruta-que-no-existe/')).toContain(NOT_FOUND.es);
    expect(render(GuidePage, '/en/route-that-does-not-exist/')).toContain(NOT_FOUND.en);
  });
});
