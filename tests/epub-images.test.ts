// @vitest-environment jsdom
// Imágenes en EPUB: vista previa (SVG, grandes) y conservación en la exportación.
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { exportDocument, parseDocument } from '../src/lib/convert';
import { DEFAULT_SETTINGS } from '../src/lib/bionic/settings';
import type { EpubDocument } from '../src/lib/document';
import { makeEpub } from './fixtures';

const PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='),
  (c) => c.charCodeAt(0),
);
const COVER_SVG =
  '<div><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 600 800"><image width="600" height="800" xlink:href="images/a.png"/></svg></div>';

const fileOf = (buffer: ArrayBuffer) => new File([buffer], 'libro.epub');
const decodeSvg = (dataUrl: string) => atob(dataUrl.replace(/^data:image\/svg\+xml;base64,/, ''));

async function open(chapters: Array<{ name: string; body: string; title?: string }>, extraFiles: Record<string, Uint8Array | string> = {}) {
  return (await parseDocument(fileOf(await makeEpub({ chapters, extraFiles: { 'OEBPS/images/a.png': PNG, ...extraFiles } })))) as EpubDocument;
}

describe('vista previa: imágenes SVG', () => {
  it('una portada envuelta en SVG ya no desaparece: es una sección con su imagen', async () => {
    const doc = await open([
      { name: 'OEBPS/cover.xhtml', body: COVER_SVG },
      { name: 'OEBPS/c1.xhtml', body: '<p>Texto del primer capítulo con contenido suficiente.</p>' },
    ]);
    expect(doc.sections.map((s) => s.path)).toEqual(['OEBPS/cover.xhtml', 'OEBPS/c1.xhtml']);
    expect(doc.warnings.some((w) => w.code === 'EPUB_EMPTY_SECTIONS')).toBe(false);
    expect(doc.sections[0].html).toMatch(/<img[^>]+src="data:image\/svg\+xml;base64,/);
    expect(doc.sections[0].html).not.toMatch(/<svg|<image/);
  });

  it('la imagen raster que va dentro del SVG se incrusta (las rutas relativas no funcionarían en un data:)', async () => {
    const doc = await open([{ name: 'OEBPS/cover.xhtml', body: COVER_SVG }]);
    const url = doc.sections[0].html.match(/src="(data:image\/svg\+xml;base64,[^"]+)"/)![1];
    const svg = decodeSvg(url);
    expect(svg).toMatch(/href="data:image\/png;base64,/);
    expect(svg).not.toMatch(/images\/a\.png/);
  });

  it('un SVG ilustrativo dentro de un capítulo con texto se conserva junto al texto', async () => {
    const doc = await open([
      {
        name: 'OEBPS/c1.xhtml',
        body: '<p>Antes de la figura.</p><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="100" height="100"><title>Círculo</title><circle cx="5" cy="5" r="4" fill="red"/></svg><p>Después de la figura.</p>',
      },
    ]);
    const html = doc.sections[0].html;
    expect(html).toMatch(/Antes de la figura[\s\S]*<img[^>]+alt="Círculo"[\s\S]*Después de la figura/);
    expect(decodeSvg(html.match(/src="(data:image\/svg\+xml;base64,[^"]+)"/)![1])).toContain('<circle');
  });

  it('el SVG convertido no puede ejecutar código: se eliminan scripts, manejadores y foreignObject', async () => {
    const doc = await open([
      {
        name: 'OEBPS/c1.xhtml',
        body: '<p>Texto suficiente.</p><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" onload="alert(1)"><script>alert(2)</script><foreignObject><div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject><rect width="5" height="5" onclick="alert(3)"/></svg>',
      },
    ]);
    const svg = decodeSvg(doc.sections[0].html.match(/src="(data:image\/svg\+xml;base64,[^"]+)"/)![1]);
    expect(svg).not.toMatch(/script|onload|onclick|foreignObject|alert/i);
    expect(svg).toContain('<rect');
  });

  it('<img src="figura.svg"> también se muestra', async () => {
    const doc = await open(
      [{ name: 'OEBPS/c1.xhtml', body: '<p>Texto.</p><p><img src="images/fig.svg" alt="figura"/></p>' }],
      { 'OEBPS/images/fig.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"><rect width="4" height="4"/></svg>' },
    );
    expect(doc.sections[0].html).toMatch(/<img[^>]+src="data:image\/svg\+xml;base64,/);
  });
});

describe('vista previa: imágenes grandes y ausentes', () => {
  it('una imagen enorme que no se puede reducir se omite y se avisa (con el recuento exacto)', async () => {
    const big = new Uint8Array(4 * 1024 * 1024);
    big.set(PNG);
    const doc = await open(
      [
        { name: 'OEBPS/c1.xhtml', body: '<p>Texto.</p><img src="images/big.png" alt="grande"/><img src="images/big.png" alt="otra vez"/><img src="images/a.png" alt="ok"/>' },
      ],
      { 'OEBPS/images/big.png': big },
    );
    expect(doc.sections[0].html).toContain('alt="ok"');
    expect(doc.sections[0].html).not.toContain('alt="grande"');
    const warning = doc.warnings.find((w) => w.code === 'EPUB_IMAGES_OMITTED');
    expect(warning?.params?.count).toBe(1); // la misma imagen repetida cuenta una vez
  });

  it('una imagen que no existe en el paquete no rompe la conversión', async () => {
    const doc = await open([{ name: 'OEBPS/c1.xhtml', body: '<p>Texto.</p><img src="images/no-existe.png" alt="x"/>' }]);
    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].html).not.toContain('<img');
  });
});

describe('exportación: no se pierden imágenes ni ilustraciones', () => {
  async function exportChapter(body: string) {
    const doc = await open([{ name: 'OEBPS/c1.xhtml', body }]);
    const out = await exportDocument(doc, DEFAULT_SETTINGS);
    const zip = await JSZip.loadAsync(await out.blob.arrayBuffer());
    return { zip, chapter: await zip.file('OEBPS/c1.xhtml')!.async('string') };
  }

  it('conserva SVG, MathML, estilos en línea, srcset y figuras', async () => {
    const { zip, chapter } = await exportChapter(
      '<p>Texto del capítulo.</p>' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>' +
        '<p><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi></math></p>' +
        '<figure><img src="images/a.png" alt="fig" srcset="images/a.png 1x" style="width:50%"/><figcaption>Pie</figcaption></figure>',
    );
    expect(chapter).toContain('<circle');
    expect(chapter).toContain('<math');
    expect(chapter).toContain('srcset="images/a.png 1x"');
    expect(chapter).toContain('style="width:50%"');
    expect(chapter).toContain('figcaption');
    expect(zip.file('OEBPS/images/a.png')).not.toBeNull();
  });

  it('el texto sigue idéntico y las imágenes originales no se tocan', async () => {
    const { zip } = await exportChapter('<p>Texto del capítulo.</p><img src="images/a.png" alt="x"/>');
    const bytes = await zip.file('OEBPS/images/a.png')!.async('uint8array');
    expect(Array.from(bytes)).toEqual(Array.from(PNG));
  });

  it('una portada solo-SVG se conserva íntegra en el EPUB descargado', async () => {
    const doc = await open([
      { name: 'OEBPS/cover.xhtml', body: COVER_SVG },
      { name: 'OEBPS/c1.xhtml', body: '<p>Texto del capítulo con contenido suficiente.</p>' },
    ]);
    const out = await exportDocument(doc, DEFAULT_SETTINGS);
    const zip = await JSZip.loadAsync(await out.blob.arrayBuffer());
    const cover = await zip.file('OEBPS/cover.xhtml')!.async('string');
    expect(cover).toMatch(/<svg/);
    expect(cover).toMatch(/xlink:href="images\/a\.png"/);
  });

  it('sigue eliminando contenido activo: scripts, manejadores, javascript:, iframes, objetos y foreignObject', async () => {
    const { chapter } = await exportChapter(
      '<p onclick="alert(1)">Texto <a href="javascript:alert(2)">enlace</a> <a href=" JaVa\tScRiPt:alert(3)">otro</a></p>' +
        '<script>alert(4)</script><iframe src="https://evil.example"></iframe><object data="x.swf"></object>' +
        '<img src="images/a.png" alt="x" onerror="alert(5)"/>' +
        '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(6)"><foreignObject><div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject><rect width="1" height="1"/></svg>' +
        '<p style="background:url(javascript:alert(7))">estilo</p>',
    );
    expect(chapter).not.toMatch(/alert|<script|<iframe|<object|foreignObject|onclick|onerror|onload|javascript/i);
    expect(chapter).toContain('<rect');
    expect(chapter).toContain('images/a.png');
  });
});
