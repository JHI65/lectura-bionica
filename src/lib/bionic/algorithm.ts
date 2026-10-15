// Algoritmo de lectura biónica (puro, sin DOM ni formatos).
//
// Dada una palabra, separa su prefijo (que se resalta) de su resto.
// Reglas:
//  - Solo las letras (\p{L}) cuentan para la proporción. Números y signos
//    se mantienen tal cual, así que "2024" o "—" nunca se modifican.
//  - Los signos de combinación (acentos descompuestos, \p{M}) se mantienen
//    siempre pegados a la letra base: nunca se parte un carácter compuesto.
//  - Unicode completo: tildes, ñ, ü, cirílico, CJK, etc.
//  - Concatenar head + tail reproduce exactamente la palabra original.

const LETTER = /\p{L}/u;
const COMBINING_MARK = /\p{M}/u;

export interface BionicParts {
  head: string; // prefijo a resaltar
  tail: string; // resto de la palabra
}

export function countLetters(text: string): number {
  let count = 0;
  for (const ch of text) {
    if (LETTER.test(ch)) count++;
  }
  return count;
}

/** Palabras de hasta este número de letras solo resaltan la primera. */
export const SHORT_WORD_MAX = 3;

/**
 * Número de letras a resaltar para una palabra de `letters` letras.
 *  - Palabras cortas (1-3 letras): solo la primera, para que se vea el contraste.
 *  - Resto: `ratio` de la palabra, redondeado hacia arriba (mínimo 1).
 */
export function boldLetterCount(letters: number, ratio: number): number {
  if (letters <= 0) return 0;
  if (letters <= SHORT_WORD_MAX) return 1;
  return Math.max(1, Math.ceil(letters * ratio));
}

export function splitWord(word: string, ratio: number): BionicParts {
  const letters = countLetters(word);
  const target = boldLetterCount(letters, ratio);
  if (target === 0) return { head: '', tail: word };

  let seen = 0;
  let cut = 0; // índice (en unidades de código UTF-16) del corte
  const chars = Array.from(word);
  let offset = 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (LETTER.test(ch)) {
      seen++;
      offset += ch.length;
      cut = offset;
      if (seen === target) {
        // Incluye los signos de combinación que siguen a esta letra.
        let j = i + 1;
        while (j < chars.length && COMBINING_MARK.test(chars[j])) {
          offset += chars[j].length;
          cut = offset;
          j++;
        }
        break;
      }
    } else {
      offset += ch.length;
    }
  }

  return { head: word.slice(0, cut), tail: word.slice(cut) };
}

/**
 * Divide un texto plano en segmentos alternos de texto normal y palabras
 * con su parte resaltada. No altera ningún carácter: la concatenación de
 * todos los segmentos es igual al texto original.
 */
export interface BionicSegment {
  text: string;
  head?: string; // inicio resaltado de una palabra
  rest?: true; // resto de una palabra transformada (se muestra con menos contraste)
}

const WORD_PATTERN = /[\p{L}\p{N}\p{M}]+/gu;

export function segmentText(text: string, ratio: number): BionicSegment[] {
  const segments: BionicSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(WORD_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ text: text.slice(last, index) });
    const word = match[0];
    const { head, tail } = splitWord(word, ratio);
    if (head) {
      segments.push({ text: head, head });
      if (tail) segments.push({ text: tail, rest: true });
    } else {
      segments.push({ text: word });
    }
    last = index + word.length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}
