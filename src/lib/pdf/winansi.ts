// Las fuentes estándar de PDF (Helvetica, Times, Courier) solo cubren WinAnsi.
// Un carácter fuera de ese conjunto haría fallar la generación, así que se
// sustituye por "?" y se cuenta para avisar al usuario.

const EXTRA_WINANSI = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152,
  0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a,
  0x0153, 0x017e, 0x0178,
]);

const REPLACEMENTS: Record<string, string> = {
  '\t': ' ',
  ' ': ' ',
  ' ': ' ',
  '​': '',
  '﻿': '',
  '­': '',
};

export function isWinAnsi(codePoint: number): boolean {
  return (codePoint >= 0x20 && codePoint <= 0x7e) || (codePoint >= 0xa0 && codePoint <= 0xff) || EXTRA_WINANSI.has(codePoint);
}

export function toWinAnsi(text: string): { text: string; replaced: number } {
  let replaced = 0;
  let out = '';
  for (const ch of text) {
    if (ch in REPLACEMENTS) {
      out += REPLACEMENTS[ch];
      continue;
    }
    if (isWinAnsi(ch.codePointAt(0) ?? 0)) {
      out += ch;
    } else {
      out += '?';
      replaced++;
    }
  }
  return { text: out, replaced };
}

// Byte WinAnsi (cp1252) de los caracteres que no coinciden con Latin-1.
const WINANSI_BYTE: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
  0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91,
  0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98,
  0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

/**
 * Convierte un texto ya filtrado con toWinAnsi() en una cadena literal PDF
 * `( ... )` con los bytes WinAnsi escapados. Se usa para escribir el contenido
 * de página directamente, sin crear un objeto por cada operación de dibujo.
 */
export function toPdfLiteral(text: string): string {
  let out = '(';
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0x3f;
    const byte = WINANSI_BYTE[cp] ?? (cp <= 0xff ? cp : 0x3f);
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) out += `\\${String.fromCharCode(byte)}`;
    else if (byte >= 0x20 && byte <= 0x7e) out += String.fromCharCode(byte);
    else out += `\\${byte.toString(8).padStart(3, '0')}`;
  }
  return `${out})`;
}
