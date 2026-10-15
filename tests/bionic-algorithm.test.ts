import { describe, expect, it } from 'vitest';
import { boldLetterCount, countLetters, segmentText, splitWord } from '../src/lib/bionic/algorithm';
import { BIONIC_RATIO, INTENSITY_REST_OPACITY } from '../src/lib/bionic/settings';

// Ratio fijo: estos tests prueban el algoritmo, no los niveles configurados.
const MEDIUM = 0.45;

describe('splitWord', () => {
  it('resalta una proporción de letras y concatena al original', () => {
    expect(splitWord('lectura', MEDIUM)).toEqual({ head: 'lect', tail: 'ura' });
  });

  it('respeta tildes y ñ sin partir caracteres', () => {
    expect(splitWord('canción', MEDIUM)).toEqual({ head: 'canc', tail: 'ión' });
    expect(splitWord('niño', MEDIUM)).toEqual({ head: 'ni', tail: 'ño' });
    expect(splitWord('camión', 0.3)).toEqual({ head: 'ca', tail: 'mión' });
  });

  it('mantiene los signos de combinación pegados a su letra base', () => {
    const decomposed = 'canción'; // "canción" con acento descompuesto
    const { head, tail } = splitWord(decomposed, MEDIUM);
    expect(head + tail).toBe(decomposed);
    expect(head.endsWith('́') || tail.startsWith('́') === false).toBe(true);
    // Nunca termina el prefijo justo antes de un acento suelto.
    expect(tail.startsWith('́')).toBe(false);
  });

  it('funciona con alfabetos no latinos y palabras de otros idiomas', () => {
    expect(splitWord('привет', MEDIUM).head).toBe('при');
    expect(splitWord('naïve', MEDIUM)).toEqual({ head: 'naï', tail: 've' });
    expect(splitWord('ß', 0.6).head + splitWord('ß', 0.6).tail).toBe('ß');
  });

  it('palabras de 2-3 letras resaltan solo la primera (l|a, d|e, l|as)', () => {
    expect(splitWord('la', BIONIC_RATIO)).toEqual({ head: 'l', tail: 'a' });
    expect(splitWord('de', BIONIC_RATIO)).toEqual({ head: 'd', tail: 'e' });
    expect(splitWord('las', BIONIC_RATIO)).toEqual({ head: 'l', tail: 'as' });
  });

  it('con ratio 50 %: 4 letras → 2, 5 → 3, 6 → 3 (médico), 11 → 6 (computadora)', () => {
    expect(splitWord('para', BIONIC_RATIO).head).toBe('pa');
    expect(splitWord('marca', BIONIC_RATIO).head).toBe('mar');
    expect(splitWord('médico', BIONIC_RATIO).head).toBe('méd');
    expect(splitWord('computadora', BIONIC_RATIO).head).toBe('comput');
  });

  it('una palabra de una letra se resalta entera', () => {
    expect(splitWord('a', MEDIUM)).toEqual({ head: 'a', tail: '' });
  });

  it('no modifica palabras sin letras', () => {
    expect(splitWord('2024', MEDIUM)).toEqual({ head: '', tail: '2024' });
    expect(splitWord('', MEDIUM)).toEqual({ head: '', tail: '' });
  });

  it('cuenta letras y números, nunca signos', () => {
    expect(countLetters('¿Qué?')).toBe(3);
    expect(countLetters('2024')).toBe(0);
    expect(boldLetterCount(0, 0.5)).toBe(0);
    expect(boldLetterCount(2, 0.3)).toBe(1);
  });

  it('a mayor proporción, más letras resaltadas', () => {
    const word = 'extraordinario';
    const soft = splitWord(word, 0.3).head.length;
    const high = splitWord(word, 0.6).head.length;
    expect(high).toBeGreaterThan(soft);
  });
});

describe('segmentText', () => {
  it('la concatenación de segmentos reproduce el texto exacto', () => {
    const text = '¡Hola, mundo! Está aquí: "lectura" (2024) — ¿sí? niño fin.';
    const segments = segmentText(text, MEDIUM);
    expect(segments.map((s) => s.text).join('')).toBe(text);
  });

  it('respeta puntuación, comillas y espacios múltiples', () => {
    const segments = segmentText('«Sí»,   no.', MEDIUM);
    expect(segments.map((s) => s.text).join('')).toBe('«Sí»,   no.');
    expect(segments.some((s) => s.head === 'S')).toBe(true);
  });

  it('texto vacío y solo signos no producen negritas', () => {
    expect(segmentText('', MEDIUM)).toEqual([]);
    expect(segmentText('?!...', MEDIUM).every((s) => s.head === undefined)).toBe(true);
  });
});

describe('niveles de intensidad', () => {
  it('la negrita es fija y la intensidad solo cambia el contraste', () => {
    expect(BIONIC_RATIO).toBe(0.5);
    expect(splitWord('lectura', BIONIC_RATIO)).toEqual({ head: 'lect', tail: 'ura' });
  });

  it('más intensidad = resto de palabra más tenue (más contraste)', () => {
    expect(INTENSITY_REST_OPACITY.suave).toBeGreaterThan(INTENSITY_REST_OPACITY.media);
    expect(INTENSITY_REST_OPACITY.media).toBeGreaterThan(INTENSITY_REST_OPACITY.alta);
  });

  it('marca el resto de cada palabra para poder atenuarlo', () => {
    const segments = segmentText('canción.', BIONIC_RATIO);
    expect(segments).toEqual([{ text: 'canc', head: 'canc' }, { text: 'ión', rest: true }, { text: '.' }]);
  });
});
