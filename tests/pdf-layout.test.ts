import { describe, expect, it } from 'vitest';
import { buildBlocks, buildLines, type TextFragment } from '../src/lib/pdf/layout';
import { toWinAnsi, isWinAnsi } from '../src/lib/pdf/winansi';

const frag = (text: string, x: number, y: number, height = 10): TextFragment => ({
  text,
  x,
  y,
  width: text.length * height * 0.5,
  height,
});

describe('buildLines', () => {
  it('agrupa fragmentos de la misma línea ordenándolos por x', () => {
    const lines = buildLines([frag('mundo', 120, 700), frag('Hola', 50, 700), frag('siguiente', 50, 680)]);
    expect(lines.map((l) => l.text)).toEqual(['Hola mundo', 'siguiente']);
  });

  it('ignora fragmentos vacíos o solo espacios', () => {
    expect(buildLines([frag('   ', 0, 0), frag('', 0, 0)])).toEqual([]);
  });
});

describe('buildBlocks', () => {
  it('separa párrafos por espacios verticales grandes', () => {
    const lines = buildLines([
      frag('Primera línea del párrafo uno.', 50, 700),
      frag('Segunda línea del mismo párrafo.', 50, 686),
      frag('Un párrafo nuevo después de una gran separación.', 50, 630),
    ]);
    const blocks = buildBlocks(lines);
    expect(blocks.filter((b) => b.kind === 'paragraph')).toHaveLength(2);
    expect(blocks[0].text).toBe('Primera línea del párrafo uno. Segunda línea del mismo párrafo.');
  });

  it('detecta títulos por tamaño de fuente mayor', () => {
    const lines = buildLines([
      frag('Introducción', 50, 740, 18),
      frag('Texto normal del cuerpo del documento.', 50, 710, 10),
      frag('Más texto normal en la misma sección.', 50, 696, 10),
    ]);
    const blocks = buildBlocks(lines);
    expect(blocks[0]).toEqual({ kind: 'heading', text: 'Introducción' });
    expect(blocks[1].kind).toBe('paragraph');
  });

  it('detecta elementos de lista por marcador', () => {
    const lines = buildLines([
      frag('• Primer elemento', 50, 700),
      frag('2. Segundo elemento', 50, 686),
    ]);
    const blocks = buildBlocks(lines);
    expect(blocks.map((b) => b.kind)).toEqual(['listItem', 'listItem']);
  });

  it('une palabras partidas con guion al final de línea', () => {
    const lines = buildLines([frag('El exa-', 50, 700), frag('men final.', 50, 686)]);
    const blocks = buildBlocks(lines);
    expect(blocks[0].text).toBe('El examen final.');
  });

  it('elimina números de página sueltos en la primera o última línea', () => {
    const lines = buildLines([
      frag('12', 300, 800),
      frag('Contenido real de la página.', 50, 700),
      frag('Otra línea de contenido.', 50, 686),
      frag('Final de la página.', 50, 672),
      frag('13', 300, 40),
    ]);
    const text = buildBlocks(lines).map((b) => b.text).join(' ');
    expect(text).not.toMatch(/\b12\b|\b13\b/);
  });

  it('una página sin texto no genera bloques', () => {
    expect(buildBlocks([])).toEqual([]);
  });
});

describe('toWinAnsi', () => {
  it('conserva caracteres del español y puntuación común', () => {
    const sample = 'Canción, niño, ¿qué?, ¡sí! «comillas» “tipográficas” — €';
    const result = toWinAnsi(sample);
    expect(result.text).toBe(sample);
    expect(result.replaced).toBe(0);
  });

  it('sustituye caracteres fuera de WinAnsi y los cuenta', () => {
    const result = toWinAnsi('ok 漢字 ✓');
    expect(result.text).toBe('ok ?? ?');
    expect(result.replaced).toBe(3);
    expect(isWinAnsi(0x6f22)).toBe(false);
  });
});
