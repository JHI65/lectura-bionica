// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { applyBionicToTree, transformHtmlBody } from '../src/lib/html/transform';
import { sanitizeTree } from '../src/lib/html/sanitize';
import { BIONIC_RATIO, DEFAULT_SETTINGS } from '../src/lib/bionic/settings';
import { readerCss } from '../src/lib/bionic/css';

function body(html: string): HTMLElement {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  return doc.body;
}

describe('applyBionicToTree', () => {
  it('no altera el texto visible del documento', () => {
    const root = body('<p>Hola, <em>mundo</em>: ¿cómo estás? <a href="#x">enlace</a>.</p>');
    const before = root.textContent;
    applyBionicToTree(root, BIONIC_RATIO);
    expect(root.textContent).toBe(before);
  });

  it('no toca enlaces, atributos ni código', () => {
    const root = body('<p><a href="https://ejemplo.es/ruta?q=1" title="título">texto</a> <code>const valor = 1;</code></p>');
    applyBionicToTree(root, BIONIC_RATIO);
    const link = root.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://ejemplo.es/ruta?q=1');
    expect(link?.getAttribute('title')).toBe('título');
    expect(root.querySelector('code')?.textContent).toBe('const valor = 1;');
    expect(root.querySelector('code b')).toBeNull();
  });

  it('es idempotente: una segunda pasada no vuelve a envolver el texto', () => {
    const root = body('<p>Lectura biónica de prueba con palabras largas</p>');
    applyBionicToTree(root, BIONIC_RATIO);
    const once = root.innerHTML;
    const changed = applyBionicToTree(root, BIONIC_RATIO);
    expect(changed).toBe(0);
    expect(root.innerHTML).toBe(once);
  });

  it('resalta letras en negrita dentro de palabras con tildes', () => {
    const root = body('<p>canción</p>');
    applyBionicToTree(root, 0.45);
    const bold = root.querySelector('b');
    expect(bold?.textContent).toBe('canc');
    expect(root.textContent).toBe('canción');
  });

  it('deja intactos los nodos de texto vacíos y los bloques de código', () => {
    const root = body('<pre>  x = 1  </pre><p>   </p>');
    applyBionicToTree(root, BIONIC_RATIO);
    expect(root.querySelector('pre')?.innerHTML).toBe('  x = 1  ');
    expect(root.querySelectorAll('b').length).toBe(0);
  });

  it('transformHtmlBody devuelve el HTML sin cambios cuando está desactivado', () => {
    const html = '<p>Sin negrita</p>';
    expect(transformHtmlBody(html, false)).toBe(html);
    expect(transformHtmlBody(html, true)).toContain('<b>');
  });
});

describe('contraste', () => {
  it('envuelve el resto de cada palabra en .bionic-rest sin cambiar el texto', () => {
    const root = body('<p>lectura biónica.</p>');
    applyBionicToTree(root, BIONIC_RATIO);
    expect(Array.from(root.querySelectorAll('.bionic-rest')).map((e) => e.textContent)).toEqual(['ura', 'ica']);
    expect(root.textContent).toBe('lectura biónica.');
  });

  it('la intensidad cambia la opacidad del resto en el CSS', () => {
    const soft = readerCss({ ...DEFAULT_SETTINGS, intensity: 'suave' }, { includeColors: true });
    const high = readerCss({ ...DEFAULT_SETTINGS, intensity: 'alta' }, { includeColors: true });
    expect(soft).toContain('.bionic-rest { opacity: 0.7; }');
    expect(high).toContain('.bionic-rest { opacity: 0.35; }');
  });
});

describe('sanitizeTree', () => {
  it('elimina scripts, manejadores y URLs javascript:', () => {
    const root = body(
      '<p onclick="alert(1)">Texto</p><script>alert(2)</script><a href="javascript:alert(3)">malo</a><a href="https://ok.es">bueno</a>',
    );
    sanitizeTree(root);
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('p')?.hasAttribute('onclick')).toBe(false);
    const links = root.querySelectorAll('a');
    expect(links[0].hasAttribute('href')).toBe(false);
    expect(links[1].getAttribute('rel')).toBe('noopener noreferrer nofollow');
  });

  it('elimina iframes, objetos y formularios con su contenido', () => {
    const root = body('<iframe src="https://evil.example">x</iframe><form><input name="a"></form><p>ok</p>');
    sanitizeTree(root);
    expect(root.querySelector('iframe, form, input')).toBeNull();
    expect(root.textContent).toBe('ok');
  });

  it('desenvuelve elementos desconocidos conservando su texto', () => {
    const root = body('<p><foo-bar>contenido</foo-bar></p>');
    sanitizeTree(root);
    expect(root.querySelector('foo-bar')).toBeNull();
    expect(root.textContent).toBe('contenido');
  });

  it('solo admite imágenes data: de formatos raster o rutas relativas', () => {
    const root = body(
      '<img src="data:image/svg+xml;base64,PHN2Zz4=" alt="a"><img src="data:image/png;base64,iVBORw0KGgo=" alt="b"><img src="../img/c.jpg" alt="c"><img src="https://tracker.example/p.gif" alt="d">',
    );
    sanitizeTree(root);
    const sources = Array.from(root.querySelectorAll('img')).map((img) => img.getAttribute('alt'));
    expect(sources).toEqual(['b', 'c']);
  });

  it('conserva la estructura semántica básica', () => {
    const root = body('<h2 id="cap">Capítulo</h2><ul><li>uno</li></ul><table><tr><td colspan="2">x</td></tr></table>');
    sanitizeTree(root);
    expect(root.querySelector('h2')?.id).toBe('cap');
    expect(root.querySelector('li')?.textContent).toBe('uno');
    expect(root.querySelector('td')?.getAttribute('colspan')).toBe('2');
  });
});
