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

describe('cantidad de letras en negrita', () => {
  const boldOf = (ratio: number) => {
    const root = body('<p>extraordinario</p>');
    applyBionicToTree(root, ratio);
    return root.querySelector('b')?.textContent ?? '';
  };

  it('a mayor proporción, más letras en negrita', () => {
    expect(boldOf(0.2).length).toBeLessThan(boldOf(0.5).length);
    expect(boldOf(0.5).length).toBeLessThan(boldOf(0.8).length);
  });

  it('transformHtmlBody respeta la proporción indicada', () => {
    const html = '<p>extraordinario</p>';
    expect(transformHtmlBody(html, true, 0.3)).not.toBe(transformHtmlBody(html, true, 0.7));
  });

  it('el texto no cambia con ninguna proporción', () => {
    for (const ratio of [0.2, 0.35, 0.5, 0.8]) {
      const root = body('<p>Había una vez un jardín, ¡y niños!</p>');
      applyBionicToTree(root, ratio);
      expect(root.textContent).toBe('Había una vez un jardín, ¡y niños!');
    }
  });
});

describe('sanitizeTree: atributos de <img> posteriores a src', () => {
  it('elimina manejadores de eventos aunque vengan después de src', () => {
    const root = body('<img src="../img/a.png" onerror="alert(1)" onload="alert(2)" alt="x" style="width:1px" srcset="a.png 1x">');
    sanitizeTree(root);
    const img = root.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('../img/a.png');
    expect(img.getAttribute('alt')).toBe('x');
    expect(img.hasAttribute('onerror')).toBe(false);
    expect(img.hasAttribute('onload')).toBe(false);
    expect(img.hasAttribute('style')).toBe(false);
    expect(img.hasAttribute('srcset')).toBe(false);
  });

  it('elimina la imagen entera si su src no es seguro, sin dejar atributos', () => {
    const root = body('<p>t</p><img src="javascript:alert(1)" onerror="alert(1)"><img src="https://tracker.example/p.gif" alt="d">');
    sanitizeTree(root);
    expect(root.querySelectorAll('img').length).toBe(0);
    expect(root.innerHTML).not.toMatch(/onerror|javascript/);
  });

  it('procesa todos los atributos aunque src sea el último', () => {
    const root = body('<img alt="x" onerror="alert(1)" src="a.png">');
    sanitizeTree(root);
    expect(root.querySelector('img')!.hasAttribute('onerror')).toBe(false);
  });
});
