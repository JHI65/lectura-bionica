// Convierte bloques de PDF en HTML escapado. Es la única forma en que el texto
// extraído llega a la vista previa: siempre escapado, nunca como markup.
import type { PdfBlock } from '../document';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function blocksToHtml(blocks: PdfBlock[]): string {
  return blocks
    .map((block) => {
      const text = escapeHtml(block.text);
      if (block.kind === 'heading') return `<h2>${text}</h2>`;
      if (block.kind === 'listItem') return `<p class="list-item">${text}</p>`;
      return `<p>${text}</p>`;
    })
    .join('\n');
}
