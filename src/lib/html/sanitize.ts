// Sanitizador por lista blanca para contenido extraído de documentos.
// Trabaja sobre el DOM (nunca sobre cadenas) y se usa tanto en importación
// como en exportación. Elimina scripts, manejadores on*, URLs javascript:,
// iframes/objetos/formularios y cualquier elemento o atributo no permitido.

const DROP_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
  'link', 'meta', 'base', 'form', 'input', 'button', 'select', 'option', 'textarea',
  'noscript', 'template', 'svg', 'math', 'video', 'audio', 'source', 'track', 'canvas',
  'head', 'title',
]);

const ALLOWED_TAGS = new Set([
  'html', 'body', 'div', 'span', 'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'blockquote', 'pre', 'code', 'em', 'i', 'strong',
  'b', 'u', 's', 'sub', 'sup', 'small', 'mark', 'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'section', 'article',
  'header', 'footer', 'nav', 'aside', 'abbr', 'cite', 'q', 'dfn', 'time', 'address',
  'ruby', 'rt', 'rp', 'kbd', 'samp', 'var',
]);

// class, role y epub:type conservan la semántica del original (no se aplican estilos ajenos en la vista previa).
const GLOBAL_ATTRS = new Set(['id', 'lang', 'dir', 'title', 'class', 'role', 'epub:type']);

const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href']),
  img: new Set(['src', 'alt', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  ol: new Set(['start', 'type']),
  li: new Set(['value']),
  time: new Set(['datetime']),
};

const SAFE_IMAGE_DATA = /^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i;

export interface SanitizeOptions {
  /**
   * Resuelve el atributo src de una imagen. Devuelve la URL segura a usar,
   * o null para eliminar la imagen. Si no se indica, se conservan rutas
   * relativas (válidas dentro de un EPUB) y data: de imagen.
   */
  resolveImageSrc?: (src: string) => string | null;
}

export function isSafeHref(href: string): boolean {
  const value = href.trim();
  if (value.startsWith('#')) return true;
  if (/^(https?:|mailto:)/i.test(value)) return true;
  return false;
}

function isRelativeSafePath(src: string): boolean {
  const value = src.trim();
  if (!value || value.startsWith('/') || value.includes('\\')) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false; // cualquier esquema
  return true;
}

/** Sanitiza un elemento y su descendencia en el sitio (in-place). */
export function sanitizeTree(root: Element, options: SanitizeOptions = {}): void {
  const children = Array.from(root.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.COMMENT_NODE || child.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      child.parentNode?.removeChild(child);
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const el = child as Element;
    const tag = el.localName.toLowerCase();

    if (DROP_WITH_CONTENT.has(tag)) {
      el.remove();
      continue;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      // Elemento desconocido: se conserva su texto, se descarta el envoltorio.
      sanitizeTree(el, options);
      while (el.firstChild) root.insertBefore(el.firstChild, el);
      el.remove();
      continue;
    }

    sanitizeAttributes(el, tag, options);
    sanitizeTree(el, options);
  }
}

function sanitizeAttributes(el: Element, tag: string, options: SanitizeOptions): void {
  const allowed = TAG_ATTRS[tag];
  let dropElement = false;

  // Se recorren SIEMPRE todos los atributos: salir antes dejaría sin revisar los
  // que vienen después (p. ej. onerror tras src).
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    const keep = GLOBAL_ATTRS.has(name) || (allowed?.has(name) ?? false);
    if (!keep || name.startsWith('on')) {
      el.removeAttribute(attr.name);
      continue;
    }

    if (name === 'href' && tag === 'a') {
      if (!isSafeHref(attr.value)) {
        el.removeAttribute(attr.name);
      } else if (!attr.value.trim().startsWith('#')) {
        // Enlaces externos: se abren aislados, sin referrer.
        el.setAttribute('rel', 'noopener noreferrer nofollow');
        el.setAttribute('target', '_blank');
      }
    }

    if (name === 'src' && tag === 'img') {
      const resolved = resolveImage(attr.value, options);
      if (resolved) el.setAttribute('src', resolved);
      else dropElement = true; // se elimina al terminar, tras revisar el resto
    }
  }

  if (dropElement) el.remove();
}

function resolveImage(src: string, options: SanitizeOptions): string | null {
  if (options.resolveImageSrc) return options.resolveImageSrc(src);
  if (SAFE_IMAGE_DATA.test(src)) return src;
  if (isRelativeSafePath(src)) return src;
  return null;
}
