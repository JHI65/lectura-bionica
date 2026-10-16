// @vitest-environment jsdom
// Imágenes en PDF: geometría (pura), colocación entre párrafos, vista previa y exportación.
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  collectPlacements,
  hasImageOps,
  imageKey,
  mergePlacements,
  multiply,
  selectPlacements,
  unitSquareBounds,
  type Matrix,
  type OpsTable,
  type Placement,
} from '../src/lib/pdf/images';
import { buildBlocks, buildLines, type PageImage, type TextFragment } from '../src/lib/pdf/layout';
import { blocksToHtml } from '../src/lib/pdf/html';
import { exportPdf } from '../src/lib/pdf/export';
import { DEFAULT_SETTINGS } from '../src/lib/bionic/settings';
import type { PdfBlock, PdfDocument } from '../src/lib/document';

const OPS: OpsTable = {
  save: 10,
  restore: 11,
  transform: 12,
  paintFormXObjectBegin: 74,
  paintFormXObjectEnd: 75,
  paintImageXObject: 85,
  paintInlineImageXObject: 86,
  paintImageMaskXObject: 83,
};
const ops = (list: Array<[number, unknown?]>) => ({ fnArray: list.map((o) => o[0]), argsArray: list.map((o) => o[1] ?? null) });
const PAGE = { left: 0, bottom: 0, width: 600, height: 800 };
const box = (left: number, bottom: number, width: number, height: number): Placement => ({ left, bottom, width, height });

describe('matrices y posición', () => {
  it('multiply respeta el orden: primero se aplica la segunda matriz', () => {
    const scale: Matrix = [2, 0, 0, 2, 0, 0];
    const move: Matrix = [1, 0, 0, 1, 10, 20];
    // escala y luego traslada (el punto 1,1 → 2,2 → 12,22)
    const m = multiply(move, scale);
    expect([m[0] * 1 + m[2] * 1 + m[4], m[1] * 1 + m[3] * 1 + m[5]]).toEqual([12, 22]);
    // traslada y luego escala (1,1 → 11,21 → 22,42)
    const n = multiply(scale, move);
    expect([n[0] * 1 + n[2] * 1 + n[4], n[1] * 1 + n[3] * 1 + n[5]]).toEqual([22, 42]);
  });

  it('la caja de una imagen es el cuadrado unidad transformado', () => {
    expect(unitSquareBounds([200, 0, 0, 100, 50, 60])).toEqual(box(50, 60, 200, 100));
  });

  it('una imagen girada 90° intercambia ancho y alto', () => {
    const b = unitSquareBounds([0, 100, -200, 0, 250, 60]);
    expect(b.width).toBe(200);
    expect(b.height).toBe(100);
  });
});

describe('collectPlacements', () => {
  it('sigue save/transform/restore y devuelve la posición de cada imagen', () => {
    const found = collectPlacements(
      ops([
        [OPS.save],
        [OPS.transform, [200, 0, 0, 100, 50, 600]],
        [OPS.paintImageXObject, ['img_1', 10, 10]],
        [OPS.restore],
        [OPS.save],
        [OPS.transform, [100, 0, 0, 50, 300, 100]],
        [OPS.paintImageXObject, ['img_2', 10, 10]],
        [OPS.restore],
      ]),
      OPS,
    );
    expect(found).toEqual([box(50, 600, 200, 100), box(300, 100, 100, 50)]);
  });

  it('la matriz de un restore no se arrastra a la imagen siguiente', () => {
    const found = collectPlacements(
      ops([
        [OPS.save],
        [OPS.transform, [500, 0, 0, 500, 0, 0]],
        [OPS.restore],
        [OPS.transform, [10, 0, 0, 10, 5, 5]],
        [OPS.paintImageXObject],
      ]),
      OPS,
    );
    expect(found).toEqual([box(5, 5, 10, 10)]);
  });

  it('compone las transformaciones anidadas, incluidos los formularios (XObject)', () => {
    const found = collectPlacements(
      ops([
        [OPS.transform, [1, 0, 0, 1, 100, 100]],
        [OPS.paintFormXObjectBegin, [[2, 0, 0, 2, 0, 0], [0, 0, 50, 50]]],
        [OPS.transform, [30, 0, 0, 20, 5, 5]],
        [OPS.paintInlineImageXObject],
        [OPS.paintFormXObjectEnd],
        [OPS.paintImageMaskXObject],
      ]),
      OPS,
    );
    // dentro del formulario: traslación (100,100) · escala 2 · (30×20 en 5,5) = 60×40 en (110,110)
    expect(found[0]).toEqual(box(110, 110, 60, 40));
    // fuera del formulario vuelve a la matriz de antes: cuadrado unidad en (100,100)
    expect(found[1]).toEqual(box(100, 100, 1, 1));
  });

  it('hasImageOps detecta páginas sin imágenes', () => {
    expect(hasImageOps(ops([[OPS.save], [OPS.restore]]), OPS)).toBe(false);
    expect(hasImageOps(ops([[OPS.save], [OPS.paintImageXObject]]), OPS)).toBe(true);
  });
});

describe('mergePlacements y selectPlacements', () => {
  it('une las tiras contiguas de una misma figura y no las separadas', () => {
    const strips = [box(0, 0, 100, 20), box(0, 20, 100, 20), box(0, 40, 100, 20)];
    expect(mergePlacements(strips)).toEqual([box(0, 0, 100, 60)]);
    expect(mergePlacements([box(0, 0, 50, 50), box(300, 300, 50, 50)])).toHaveLength(2);
  });

  it('descarta imágenes diminutas (viñetas, filetes)', () => {
    const kept = selectPlacements([box(10, 10, 8, 8), box(10, 100, 200, 3), box(100, 300, 150, 100)], PAGE, true);
    expect(kept).toEqual([box(100, 300, 150, 100)]);
  });

  it('con texto en la página, descarta la imagen que cubre casi toda la página (escaneo de fondo)', () => {
    expect(selectPlacements([box(0, 0, 600, 800)], PAGE, true)).toEqual([]);
  });

  it('sin texto en la página, esa misma imagen SÍ se conserva (si no, se perdería la página)', () => {
    expect(selectPlacements([box(0, 0, 600, 800)], PAGE, false)).toHaveLength(1);
  });

  it('recorta a la página y descarta lo que queda fuera', () => {
    const kept = selectPlacements([box(-100, 300, 300, 200), box(700, 300, 100, 100)], PAGE, true);
    expect(kept).toEqual([box(0, 300, 200, 200)]);
  });

  it('ordena de arriba abajo y respeta el máximo por página', () => {
    const list = Array.from({ length: 20 }, (_, i) => box(50, 20 + i * 38, 100, 30));
    const kept = selectPlacements(list, PAGE, true, { minSize: 30, maxPerPage: 5, backgroundRatio: 0.8 });
    expect(kept).toHaveLength(5);
    const tops = kept.map((k) => k.bottom + k.height);
    expect([...tops].sort((a, b) => b - a)).toEqual(tops);
  });

  it('imageKey distingue imágenes distintas y reconoce la misma', () => {
    const a = 'data:image/png;base64,' + 'A'.repeat(300);
    expect(imageKey(a)).toBe(imageKey(a));
    expect(imageKey(a)).not.toBe(imageKey('data:image/png;base64,' + 'B'.repeat(300)));
  });
});

describe('buildBlocks con imágenes', () => {
  const frag = (text: string, y: number): TextFragment => ({ text, x: 50, y, width: text.length * 5, height: 10 });
  const image = (top: number, bottom: number): PageImage => ({
    top,
    bottom,
    block: { kind: 'image', text: '', src: 'data:image/png;base64,AAAA', widthPt: 100, heightPt: top - bottom },
  });
  const kinds = (blocks: PdfBlock[]) => blocks.map((b) => (b.kind === 'image' ? 'IMG' : b.text.slice(0, 12)));

  it('coloca la imagen entre los párrafos según su posición vertical', () => {
    const lines = buildLines([frag('Primer párrafo arriba.', 700), frag('Segundo párrafo abajo.', 400)]);
    expect(kinds(buildBlocks(lines, [image(600, 500)]))).toEqual(['Primer párra', 'IMG', 'Segundo párr']);
  });

  it('una imagen por encima de todo el texto va primero; por debajo, la última', () => {
    const lines = buildLines([frag('Texto único.', 400)]);
    expect(kinds(buildBlocks(lines, [image(780, 700)]))).toEqual(['IMG', 'Texto único.']);
    expect(kinds(buildBlocks(lines, [image(200, 100)]))).toEqual(['Texto único.', 'IMG']);
  });

  it('corta el párrafo en curso: las líneas a ambos lados de la imagen no se unen', () => {
    const lines = buildLines([frag('Línea antes de la figura', 700), frag('línea después de la figura', 686)]);
    const blocks = buildBlocks(lines, [image(695, 690)]);
    expect(kinds(blocks)).toEqual(['Línea antes ', 'IMG', 'línea despué']);
  });

  it('una página solo con imágenes produce bloques de imagen', () => {
    expect(buildBlocks([], [image(500, 300), image(780, 600)]).map((b) => b.kind)).toEqual(['image', 'image']);
  });

  it('sin imágenes el comportamiento es el de siempre', () => {
    const lines = buildLines([frag('Hola mundo.', 700)]);
    expect(buildBlocks(lines)).toEqual(buildBlocks(lines, []));
  });
});

describe('vista previa', () => {
  it('un bloque de imagen se muestra como <img> con su data URL, sin alt ruidoso', () => {
    const html = blocksToHtml([
      { kind: 'paragraph', text: 'Antes' },
      { kind: 'image', text: '', src: 'data:image/png;base64,iVBOR' },
      { kind: 'paragraph', text: 'Después' },
    ]);
    expect(html).toMatch(/<p>Antes<\/p>\s*<figure><img src="data:image\/png;base64,iVBOR" alt=""><\/figure>\s*<p>Después<\/p>/);
  });

  it('un src malicioso se escapa y no puede salirse del atributo', () => {
    const html = blocksToHtml([{ kind: 'image', text: '', src: 'x" onerror="alert(1)' }]);
    expect(html).not.toMatch(/onerror="alert/);
    expect(html).toContain('&quot;');
  });
});

describe('exportación a PDF con imágenes', () => {
  async function pngDataUrl(width: number, height: number): Promise<string> {
    const doc = await PDFDocument.create();
    // PNG real mínimo: se genera con pdf-lib a partir de un PNG de 1x1 y se reutiliza como contenido.
    void doc;
    void width;
    void height;
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEklEQVR4nGP8z8Dwn4EIwDiqEAC2QwsB9ye8lQAAAABJRU5ErkJggg==';
  }

  const docWith = (blocks: PdfBlock[]): PdfDocument => ({
    kind: 'pdf',
    title: 'Con imágenes',
    fileName: 'con-imagenes.pdf',
    warnings: [],
    pageCount: 1,
    extractedChars: 100,
    sections: [{ id: 'p1', pageNumber: 1, blocks }],
  });

  async function imageXObjects(blob: Blob): Promise<number> {
    const pdf = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()));
    let count = 0;
    for (const [, object] of pdf.context.enumerateIndirectObjects()) {
      const dict = object instanceof PDFDict ? object : (object as { dict?: PDFDict }).dict;
      if (dict && dict.get(PDFName.of('Subtype')) === PDFName.of('Image')) count++;
    }
    return count;
  }

  it('el PDF descargado contiene las imágenes y el texto', async () => {
    const src = await pngDataUrl(4, 4);
    const result = await exportPdf(
      docWith([
        { kind: 'paragraph', text: 'Texto antes de la figura con varias palabras para el párrafo.' },
        { kind: 'image', text: '', src, widthPt: 300, heightPt: 300 },
        { kind: 'paragraph', text: 'Texto después de la figura.' },
      ]),
      DEFAULT_SETTINGS,
    );
    expect(result.warnings.some((w) => w.code === 'PDF_IMAGES_SKIPPED')).toBe(false);
    expect(await imageXObjects(result.blob)).toBe(1);
  });

  it('una imagen más alta que la página se reduce y cabe en una página', async () => {
    const src = await pngDataUrl(4, 4);
    const result = await exportPdf(docWith([{ kind: 'image', text: '', src, widthPt: 400, heightPt: 5000 }]), DEFAULT_SETTINGS);
    const pdf = await PDFDocument.load(new Uint8Array(await result.blob.arrayBuffer()));
    expect(pdf.getPageCount()).toBe(1);
  });

  it('una imagen que no cabe en lo que queda de página pasa a la siguiente', async () => {
    const src = await pngDataUrl(4, 4);
    const text = Array.from({ length: 45 }, (_, i) => ({ kind: 'paragraph' as const, text: `Párrafo ${i + 1} con texto suficiente para ocupar una línea completa del documento.` }));
    const result = await exportPdf(docWith([...text, { kind: 'image', text: '', src, widthPt: 400, heightPt: 400 }]), DEFAULT_SETTINGS);
    const pdf = await PDFDocument.load(new Uint8Array(await result.blob.arrayBuffer()));
    expect(pdf.getPageCount()).toBeGreaterThan(1);
    expect(await imageXObjects(result.blob)).toBe(1);
  });

  it('una imagen corrupta no rompe la exportación: se avisa y el texto sigue', async () => {
    const result = await exportPdf(
      docWith([
        { kind: 'paragraph', text: 'Texto que debe conservarse.' },
        { kind: 'image', text: '', src: 'data:image/png;base64,NOESUNPNG', widthPt: 100, heightPt: 100 },
      ]),
      DEFAULT_SETTINGS,
    );
    expect(result.warnings.find((w) => w.code === 'PDF_IMAGES_SKIPPED')?.params?.count).toBe(1);
    expect(await imageXObjects(result.blob)).toBe(0);
  });

  it('un documento solo de imágenes (sin texto) se puede exportar', async () => {
    const src = await pngDataUrl(4, 4);
    const result = await exportPdf(docWith([{ kind: 'image', text: '', src, widthPt: 200, heightPt: 200 }]), DEFAULT_SETTINGS);
    expect(await imageXObjects(result.blob)).toBe(1);
  });
});
