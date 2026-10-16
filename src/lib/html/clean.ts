// Limpieza de seguridad para la EXPORTACIÓN. A diferencia de sanitizeTree (lista
// blanca, para la vista previa), esta solo quita lo que puede ejecutar código o
// cargar contenido activo, y conserva todo lo demás: SVG, MathML, estilos en
// línea, srcset, audio y vídeo. Así el libro exportado no pierde ilustraciones.

const ACTIVE_ELEMENTS = new Set(['script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'base', 'foreignobject']);
const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'formaction', 'data', 'poster', 'background', 'srcset', 'ping']);
const DANGEROUS_URL = /^(?:javascript|vbscript|data:text\/html|data:application\/xhtml)/i;
const DANGEROUS_STYLE = /expression\s*\(|javascript:|vbscript:|behavior\s*:|-moz-binding/i;

/** Un valor de URL con espacios o caracteres de control insertados no debe esquivar la comprobación. */
export function isDangerousUrl(value: string): boolean {
  // eslint-disable-next-line no-control-regex
  const compact = value.replace(/[\u0000- \u007f-\u009f]+/g, '');
  return DANGEROUS_URL.test(compact);
}

/** Quita contenido activo de un árbol en el sitio. Devuelve cuántos elementos y atributos retiró. */
export function stripActiveContent(root: Element): number {
  let removed = 0;
  // La propia raíz también se revisa (p. ej. <svg onload=…>), no solo sus descendientes.
  for (const el of [root, ...Array.from(root.getElementsByTagNameNS('*', '*'))]) {
    if (el !== root && ACTIVE_ELEMENTS.has(el.localName.toLowerCase())) {
      el.remove();
      removed++;
      continue;
    }
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const local = name.includes(':') ? name.slice(name.lastIndexOf(':') + 1) : name;
      const bad =
        name.startsWith('on') ||
        (URL_ATTRIBUTES.has(local) && isDangerousUrl(attr.value)) ||
        (name === 'style' && DANGEROUS_STYLE.test(attr.value));
      if (bad) {
        el.removeAttribute(attr.name);
        removed++;
      }
    }
  }
  return removed;
}
