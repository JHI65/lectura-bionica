// @vitest-environment jsdom
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { parseDocument, exportDocument } from '../src/lib/convert';
import { DEFAULT_SETTINGS, type ReadingSettings } from '../src/lib/bionic/settings';
import type { EpubDocument } from '../src/lib/document';
import { makeEpub } from './fixtures';

// PNG 1x1 transparente
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const fileOf = (buffer: ArrayBuffer, name = 'libro.epub') => new File([buffer], name, { type: 'application/epub+zip' });

async function sampleEpub(extra: Record<string, string | Uint8Array> = {}): Promise<ArrayBuffer> {
  return makeEpub({
    title: 'El jardín',
    chapters: [
      {
        name: 'OEBPS/text/cap1.xhtml',
        title: 'Capítulo 1',
        body: `<h1>Capítulo 1</h1>
<p>Había una vez un <em>jardín</em> lleno de flores, ¡y niños que jugaban!</p>
<p>Enlace: <a href="https://ejemplo.es/jardin">visitar</a> y <a href="javascript:alert(1)">malo</a>.</p>
<script>alert('no ejecutar')</script>
<p onclick="alert(2)">Clic aquí: canción.</p>
<img src="../images/flor.png" alt="una flor"/>`,
      },
      {
        name: 'OEBPS/text/cap2.xhtml',
        title: 'Capítulo 2',
        body: '<h2>Segunda parte</h2><ul><li>primer punto</li><li>segundo punto</li></ul>',
      },
    ],
    extraFiles: {
      'OEBPS/images/flor.png': Uint8Array.from(atob(PNG_BASE64), (c) => c.charCodeAt(0)),
      ...extra,
    },
  });
}

describe('importación EPUB', () => {
  it('extrae capítulos en orden, títulos y texto, sin scripts ni manejadores', async () => {
    const doc = (await parseDocument(fileOf(await sampleEpub()))) as EpubDocument;
    expect(doc.kind).toBe('epub');
    expect(doc.title).toBe('El jardín');
    expect(doc.sections.map((s) => s.title)).toEqual(['Capítulo 1', 'Segunda parte']);
    expect(doc.sections[0].html).not.toContain('<script');
    expect(doc.sections[0].html).not.toContain('onclick');
    expect(doc.sections[0].html).not.toContain('javascript:');
    expect(doc.sections[0].html).toContain('jardín');
  });

  it('incrusta las imágenes como data: para una vista previa aislada', async () => {
    const doc = (await parseDocument(fileOf(await sampleEpub()))) as EpubDocument;
    expect(doc.sections[0].html).toMatch(/<img[^>]+src="data:image\/png;base64,/);
  });
});

describe('exportación EPUB', () => {
  it('genera un EPUB válido con negrita bionica, CSS registrado y el mismo texto', async () => {
    const original = await sampleEpub();
    const doc = (await parseDocument(fileOf(original))) as EpubDocument;
    const result = await exportDocument(doc, DEFAULT_SETTINGS);

    expect(result.fileName).toBe('libro-lectura-bionica.epub');
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(Object.keys(zip.files)[0]).toBe('mimetype');

    const chapter = await zip.file('OEBPS/text/cap1.xhtml')!.async('string');
    expect(chapter).toContain('<b>');
    expect(chapter).toContain('bionic-text');
    expect(chapter).toContain('lectura-bionica.css');
    expect(chapter).not.toContain('<script');
    expect(chapter).not.toContain('onclick');

    const opf = await zip.file('OEBPS/content.opf')!.async('string');
    expect(opf).toContain('lectura-bionica-css');
    expect(zip.file('OEBPS/lectura-bionica.css')).not.toBeNull();
  });

  it('conserva los recursos originales byte a byte', async () => {
    const image = Uint8Array.from(atob(PNG_BASE64), (c) => c.charCodeAt(0));
    const doc = (await parseDocument(fileOf(await sampleEpub({ 'OEBPS/images/flor.png': image })))) as EpubDocument;
    const result = await exportDocument(doc, DEFAULT_SETTINGS);
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    const exported = await zip.file('OEBPS/images/flor.png')!.async('uint8array');
    expect(Array.from(exported)).toEqual(Array.from(image));
  });

  it('con la negrita desactivada no añade marcas bionic', async () => {
    const doc = (await parseDocument(fileOf(await sampleEpub()))) as EpubDocument;
    const settings: ReadingSettings = { ...DEFAULT_SETTINGS, bionicEnabled: false };
    const result = await exportDocument(doc, settings);
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    const chapter = await zip.file('OEBPS/text/cap1.xhtml')!.async('string');
    expect(chapter).not.toContain('bionic-text');
  });

  it('un capítulo que no es XHTML estricto se conserva y se avisa', async () => {
    const buffer = await makeEpub({
      chapters: [
        { name: 'OEBPS/ok.xhtml', body: '<p>Capítulo correcto con texto suficiente.</p>' },
        { name: 'OEBPS/roto.xhtml', body: '<p>Sin cerrar <b>negrita' },
      ],
    });
    const doc = (await parseDocument(fileOf(buffer))) as EpubDocument;
    const result = await exportDocument(doc, DEFAULT_SETTINGS);
    expect(result.warnings.some((w) => w.includes('no es XHTML estricto') || w.includes('roto'))).toBe(true);
  });
});

describe('EPUB ya convertido', () => {
  const chapters = [
    { name: 'OEBPS/c.xhtml', body: '<p>Gracias a las enseñanzas de la reconocida escritora iniciaremos un camino creativo</p>' },
  ];

  async function convertedEpub(): Promise<EpubDocument> {
    const first = (await parseDocument(fileOf(await makeEpub({ chapters })))) as EpubDocument;
    const out = await exportDocument(first, DEFAULT_SETTINGS);
    return (await parseDocument(fileOf(await out.blob.arrayBuffer(), 'libro-lectura-bionica.epub'))) as EpubDocument;
  }

  it('al volver a subirlo se quita la negrita anterior y se puede desactivar', async () => {
    const doc = await convertedEpub();
    expect(doc.sections[0].html).not.toContain('bionic-text');
    const { sectionBodyHtml } = await import('../src/lib/preview');
    const off = sectionBodyHtml(doc, doc.sections[0], { ...DEFAULT_SETTINGS, bionicEnabled: false });
    expect(off).not.toContain('<b>');
    expect(doc.warnings.some((w) => w.includes('ya se había convertido'))).toBe(true);
  });

  it('al re-exportarlo no duplica la hoja de estilo ni el texto', async () => {
    const doc = await convertedEpub();
    const result = await exportDocument(doc, { ...DEFAULT_SETTINGS, intensity: 'alta' });
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    const opf = await zip.file('OEBPS/content.opf')!.async('string');
    expect(opf.match(/id="lectura-bionica-css"/g)).toHaveLength(1);
    const chapter = await zip.file('OEBPS/c.xhtml')!.async('string');
    expect(chapter.match(/lectura-bionica\.css/g)).toHaveLength(1);
    const text = new DOMParser().parseFromString(chapter, 'application/xhtml+xml').body.textContent;
    expect(text).toContain('Gracias a las enseñanzas de la reconocida escritora');
  });
});
