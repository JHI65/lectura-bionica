// Reconstrucción de líneas y párrafos a partir de fragmentos de texto de PDF.
// Funciones puras: no dependen de pdf.js, así que se prueban de forma aislada.
// Limitación conocida: el orden es el del flujo de texto del PDF. Columnas,
// tablas, notas al pie y fórmulas pueden no respetar el orden original.

import type { PdfBlock } from '../document';

export interface TextFragment {
  text: string;
  x: number;
  y: number; // coordenada vertical PDF: crece hacia arriba
  width: number;
  height: number; // tamaño aproximado de la fuente
}

export interface TextLine {
  y: number;
  height: number;
  text: string;
  x: number;
}

const LIST_MARKER = /^(?:[•·▪■◦●*–-]|\d{1,3}[.)])\s+\S/;

export function buildLines(fragments: TextFragment[]): TextLine[] {
  const sorted = fragments
    .filter((f) => f.text.trim().length > 0)
    .slice()
    .sort((a, b) => b.y - a.y || a.x - b.x);

  const groups: TextFragment[][] = [];
  for (const fragment of sorted) {
    const current = groups[groups.length - 1];
    const reference = current?.[0];
    const tolerance = reference ? Math.max(reference.height, fragment.height) * 0.5 : 0;
    if (reference && Math.abs(reference.y - fragment.y) <= tolerance) {
      current.push(fragment);
    } else {
      groups.push([fragment]);
    }
  }

  return groups.map((group) => {
    const ordered = group.slice().sort((a, b) => a.x - b.x);
    let text = '';
    let prevEnd: number | null = null;
    for (const fragment of ordered) {
      const size = fragment.height || 10;
      if (prevEnd !== null && fragment.x - prevEnd > size * 0.15 && !text.endsWith(' ') && !fragment.text.startsWith(' ')) {
        text += ' ';
      }
      text += fragment.text;
      prevEnd = fragment.x + fragment.width;
    }
    return {
      y: ordered[0].y,
      height: Math.max(...ordered.map((f) => f.height || 10)),
      text: text.replace(/\s+/g, ' ').trim(),
      x: ordered[0].x,
    };
  });
}

function median(values: number[]): number {
  if (values.length === 0) return 10;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Quita números de página sueltos al principio o final de la página. */
function stripPageNumbers(lines: TextLine[]): TextLine[] {
  if (lines.length < 3) return lines;
  const isNumber = (line: TextLine) => /^(?:p[áa]g(?:ina)?\.?\s*)?\d{1,4}$/i.test(line.text);
  const first = lines[0];
  const last = lines[lines.length - 1];
  return lines.filter((line) => !((line === first || line === last) && isNumber(line)));
}

/** Agrupa líneas en bloques: títulos, párrafos y elementos de lista. */
export function buildBlocks(lines: TextLine[]): PdfBlock[] {
  const usable = stripPageNumbers(lines.filter((l) => l.text.length > 0));
  if (usable.length === 0) return [];
  const bodySize = median(usable.map((l) => l.height));
  const blocks: PdfBlock[] = [];

  let current: PdfBlock | null = null;
  let previous: TextLine | null = null;

  const flush = () => {
    if (current && current.text.trim()) blocks.push({ ...current, text: current.text.trim() });
    current = null;
  };

  for (const line of usable) {
    const gap = previous ? previous.y - line.y : 0;
    const isHeading = line.height >= bodySize * 1.25 && line.text.length <= 120;
    const isListItem = LIST_MARKER.test(line.text);
    const startsNewBlock = !current || isHeading || isListItem || gap > bodySize * 1.9 || current.kind === 'heading';

    if (startsNewBlock) {
      flush();
      current = { kind: isHeading ? 'heading' : isListItem ? 'listItem' : 'paragraph', text: line.text };
    } else if (current) {
      // Guion de final de línea: "exa-" + "men" => "examen".
      if (/[\p{L}]-$/u.test(current.text) && /^\p{Ll}/u.test(line.text)) {
        current.text = current.text.slice(0, -1) + line.text;
      } else {
        current.text += ' ' + line.text;
      }
    }
    previous = line;
  }
  flush();
  return blocks;
}
