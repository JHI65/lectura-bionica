// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { withSingleXmlDeclaration } from '../src/lib/epub/export';

const DECL = '<?xml version="1.0" encoding="utf-8"?>';

describe('withSingleXmlDeclaration', () => {
  it('añade la declaración cuando el serializador no la incluye (jsdom)', () => {
    expect(withSingleXmlDeclaration('<html/>')).toBe(`${DECL}\n<html/>`);
  });

  it('no la duplica cuando el navegador ya la incluye (WebKit/Blink)', () => {
    const out = withSingleXmlDeclaration('<?xml version="1.0" encoding="UTF-8"?><html/>');
    expect(out.match(/<\?xml/g)).toHaveLength(1);
    expect(out).toBe(`${DECL}\n<html/>`);
  });

  it('el resultado se puede analizar como XML', () => {
    const out = withSingleXmlDeclaration('<?xml version="1.0" standalone="no"?>\n<html xmlns="http://www.w3.org/1999/xhtml"><body/></html>');
    const doc = new DOMParser().parseFromString(out, 'application/xhtml+xml');
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
  });
});
