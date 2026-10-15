// Enlaces internos: todo `to="/ruta"` del código debe existir en routes.json.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import routes from '../src/content/routes.json';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(full);
  }
  return out;
}

const KNOWN = new Set((routes as Array<{ path: string }>).map((r) => r.path));

describe('enlaces internos', () => {
  const found = new Map<string, string[]>();
  for (const file of walk('src')) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\bto[=:]\s*\{?["'`](\/[^"'`#?]*)["'`]/g)) {
      const list = found.get(match[1]) ?? [];
      list.push(file);
      found.set(match[1], list);
    }
  }

  it('se han encontrado enlaces para comprobar', () => {
    expect(found.size).toBeGreaterThan(5);
  });

  it('cada enlace interno apunta a una ruta existente', () => {
    const broken = [...found.entries()].filter(([path]) => !KNOWN.has(path));
    expect(broken.map(([path, files]) => `${path} ← ${files[0]}`)).toEqual([]);
  });

  it('las rutas no tienen duplicados ni caracteres fuera de ASCII', () => {
    const paths = (routes as Array<{ path: string }>).map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((p) => /^\/[a-z0-9\-/]*$/.test(p))).toBe(true);
  });

  it('cada página tiene título y descripción de longitud razonable', () => {
    for (const route of routes as Array<{ path: string; title: string; description: string }>) {
      expect(route.title.length, route.path).toBeLessThanOrEqual(70);
      expect(route.description.length, route.path).toBeGreaterThan(50);
      expect(route.description.length, route.path).toBeLessThanOrEqual(200);
    }
  });
});
