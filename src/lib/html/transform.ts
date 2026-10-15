// Aplica la lectura biónica sobre un árbol DOM ya existente.
// Solo modifica nodos de texto: nunca atributos, enlaces, código ni scripts.
// Es idempotente: los nodos ya transformados (.bionic-text) se omiten.

import { BIONIC_RATIO } from '../bionic/settings';
import { segmentText } from '../bionic/algorithm';

export const BIONIC_CLASS = 'bionic-text';
export const BIONIC_REST_CLASS = 'bionic-rest';
export const BIONIC_TAGS_SKIPPED = ['script', 'style', 'code', 'pre', 'kbd', 'samp', 'textarea', 'svg', 'math'];

const SKIP_SELECTOR = [
  ...BIONIC_TAGS_SKIPPED,
  `.${BIONIC_CLASS}`,
].join(',');

/**
 * Transforma todos los nodos de texto descendientes de `root`.
 * Devuelve el número de nodos de texto modificados.
 */
export function applyBionicToTree(root: Element, ratio: number = BIONIC_RATIO): number {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets: Text[] = [];

  let node = walker.nextNode();
  while (node) {
    const text = node as Text;
    const parent = text.parentElement;
    if (text.data.trim().length > 0 && parent && !parent.closest(SKIP_SELECTOR)) {
      targets.push(text);
    }
    node = walker.nextNode();
  }

  for (const text of targets) {
    const segments = segmentText(text.data, ratio);
    const hasBold = segments.some((s) => s.head !== undefined);
    if (!hasBold) continue;

    const wrapper = doc.createElementNS(root.namespaceURI, 'span');
    wrapper.setAttribute('class', BIONIC_CLASS);
    for (const segment of segments) {
      if (segment.head !== undefined) {
        const bold = doc.createElementNS(root.namespaceURI, 'b');
        bold.textContent = segment.head;
        wrapper.appendChild(bold);
      } else if (segment.rest) {
        const rest = doc.createElementNS(root.namespaceURI, 'span');
        rest.setAttribute('class', BIONIC_REST_CLASS);
        rest.textContent = segment.text;
        wrapper.appendChild(rest);
      } else {
        wrapper.appendChild(doc.createTextNode(segment.text));
      }
    }
    text.replaceWith(wrapper);
  }

  return targets.length;
}

/**
 * Quita la negrita bionica de una conversión anterior (por ejemplo, al volver a
 * subir un EPUB ya descargado), para recalcularla con la intensidad actual.
 * Solo toca los envoltorios propios (.bionic-text); el texto queda idéntico.
 */
export function removeBionicMarkup(root: Element): number {
  const wrappers = Array.from(root.getElementsByTagName('*')).filter((el) =>
    (el.getAttribute('class') ?? '').split(/\s+/).includes(BIONIC_CLASS),
  );
  for (const wrapper of wrappers) {
    if (!wrapper.isConnected && wrapper.parentNode === null) continue;
    wrapper.replaceWith(root.ownerDocument.createTextNode(wrapper.textContent ?? ''));
  }
  root.normalize();
  return wrappers.length;
}

/**
 * Transforma un fragmento HTML (ya sanitizado) y devuelve el HTML resultante
 * del <body>. Con `enabled = false` devuelve el contenido sin cambios.
 */
export function transformHtmlBody(html: string, enabled: boolean, ratio: number = BIONIC_RATIO): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (enabled) applyBionicToTree(doc.body, ratio);
  return doc.body.innerHTML;
}
