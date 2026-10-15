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
