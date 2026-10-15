// Cada ruta publicada debe renderizar su contenido, también con la barra final
// (las URLs canónicas terminan en «/»). Un fallo aquí dejó las guías y las
// páginas legales mostrando «Página no encontrada» en acceso directo.
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { GuidePage, LegalPage } from '../src/pages/ContentPages';
import { SEO_PAGES } from '../src/content/seo-pages';
import { LEGAL_DOCS } from '../src/content/legal';
import { CONTROLLER } from '../src/content/legal';
import { metaFor, normalizePath } from '../src/hooks/useDocumentMeta';

const render = (Page: typeof GuidePage, location: string) =>
  renderToString(createElement(MemoryRouter, { initialEntries: [location] }, createElement(Page)));

describe('normalizePath', () => {
  it('quita la barra final salvo en la raíz', () => {
    expect(normalizePath('/privacidad/')).toBe('/privacidad');
    expect(normalizePath('/privacidad')).toBe('/privacidad');
    expect(normalizePath('/')).toBe('/');
  });
});

describe('guías y páginas legales', () => {
  for (const page of SEO_PAGES) {
    for (const location of [page.path, `${page.path}/`]) {
      it(`guía ${location} muestra su contenido`, () => {
        const html = render(GuidePage, location);
        expect(html).not.toContain('Página no encontrada');
        expect(html).toContain(page.h1.replace(/¿|\?/g, '').slice(0, 20));
      });
    }
    it(`guía ${page.path} tiene metadatos con y sin barra`, () => {
      expect(metaFor(page.path)).toBeDefined();
      expect(metaFor(`${page.path}/`)).toEqual(metaFor(page.path));
    });
  }

  for (const doc of LEGAL_DOCS) {
    for (const location of [doc.path, `${doc.path}/`]) {
      it(`legal ${location} muestra su contenido`, () => {
        const html = render(LegalPage, location);
        expect(html).not.toContain('Página no encontrada');
        expect(html).toContain(doc.title);
      });
    }
  }

  it('el aviso legal publica los datos del titular y no deja marcadores', () => {
    const html = render(LegalPage, '/aviso-legal/');
    expect(html).toContain(CONTROLLER.name);
    expect(html).toContain('50482704G');
    expect(html).toContain('Calle Portillo 16');
    expect(html).not.toContain('COMPLETAR');
  });

  it('una ruta inexistente sí muestra «Página no encontrada»', () => {
    expect(render(GuidePage, '/ruta-que-no-existe/')).toContain('Página no encontrada');
  });
});
