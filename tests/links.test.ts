// Enlaces internos y estructura de rutas por idioma.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROUTES, alternatesFor, findByPath, pathFor } from '../src/content/routes';
import { LOCALES } from '../src/i18n/locale';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(full);
  }
  return out;
}

const IDS = new Set(ROUTES.map((r) => r.id));
const PATHS = new Set(ROUTES.flatMap((r) => LOCALES.flatMap((l) => (r[l] ? [r[l]!.path] : []))));

describe('enlaces internos', () => {
  const idsUsed = new Map<string, string[]>();
  const literalPaths = new Map<string, string[]>();
  for (const file of walk('src')) {
    const source = readFileSync(file, 'utf8');
    // href('guide-pdf') / href("privacy")
    for (const m of source.matchAll(/\bhref\(\s*['"`]([a-z-]+)['"`]\s*\)/g)) {
      idsUsed.set(m[1], [...(idsUsed.get(m[1]) ?? []), file]);
    }
    // to="/ruta" o to: '/ruta' (rutas fijas, solo permitidas en páginas de español)
    for (const m of source.matchAll(/\bto[=:]\s*\{?["'`](\/[^"'`#?]*)["'`]/g)) {
      literalPaths.set(m[1], [...(literalPaths.get(m[1]) ?? []), file]);
    }
  }

  it('hay enlaces para comprobar', () => {
    expect(idsUsed.size).toBeGreaterThan(5);
  });

  it('todo href(id) usado en el código existe en routes.json', () => {
    const unknown = [...idsUsed.entries()].filter(([id]) => !IDS.has(id));
    expect(unknown.map(([id, files]) => `${id} ← ${files[0]}`)).toEqual([]);
  });

  it('las rutas fijas que quedan existen', () => {
    const broken = [...literalPaths.entries()].filter(([path]) => !PATHS.has(path));
    expect(broken.map(([path, files]) => `${path} ← ${files[0]}`)).toEqual([]);
  });
});

describe('rutas por idioma', () => {
  it('todas las rutas existen en español y los ids son únicos', () => {
    expect(ROUTES.every((r) => r.es)).toBe(true);
    expect(new Set(ROUTES.map((r) => r.id)).size).toBe(ROUTES.length);
  });

  it('no hay dos rutas con el mismo path ni caracteres fuera de ASCII', () => {
    const all = ROUTES.flatMap((r) => LOCALES.flatMap((l) => (r[l] ? [r[l]!.path] : [])));
    expect(new Set(all).size).toBe(all.length);
    expect(all.every((p) => /^\/[a-z0-9\-/]*$/.test(p))).toBe(true);
  });

  it('las rutas en inglés cuelgan de /en', () => {
    for (const r of ROUTES) if (r.en) expect(r.en.path === '/en' || r.en.path.startsWith('/en/')).toBe(true);
  });

  it('cada página tiene título y descripción de longitud razonable en cada idioma', () => {
    for (const r of ROUTES) {
      for (const l of LOCALES) {
        const meta = r[l];
        if (!meta) continue;
        expect(meta.title.length, `${r.id}/${l}`).toBeLessThanOrEqual(70);
        expect(meta.description.length, `${r.id}/${l}`).toBeGreaterThan(50);
        expect(meta.description.length, `${r.id}/${l}`).toBeLessThanOrEqual(200);
      }
    }
  });

  it('el título completo (con la marca añadida) cabe en 70 caracteres', () => {
    for (const r of ROUTES) {
      for (const l of LOCALES) {
        const meta = r[l];
        if (!meta) continue;
        const full = meta.title.includes('Readably') ? meta.title : `${meta.title} · Readably`;
        expect(full.length, `${r.id}/${l}: «${full}»`).toBeLessThanOrEqual(70);
      }
    }
  });

  it('los títulos y descripciones no se repiten dentro de un idioma', () => {
    for (const l of LOCALES) {
      const metas = ROUTES.flatMap((r) => (r[l] ? [r[l]!] : []));
      expect(new Set(metas.map((m) => m.title)).size, `títulos ${l}`).toBe(metas.length);
      expect(new Set(metas.map((m) => m.description)).size, `descripciones ${l}`).toBe(metas.length);
    }
  });

  it('findByPath resuelve con y sin barra final y devuelve el idioma', () => {
    expect(findByPath('/en/privacy/')).toMatchObject({ locale: 'en', entry: { id: 'privacy' } });
    expect(findByPath('/privacidad')).toMatchObject({ locale: 'es', entry: { id: 'privacy' } });
    expect(findByPath('/en')?.entry.id).toBe('home');
    expect(findByPath('/no-existe')).toBeUndefined();
  });

  it('las alternativas de idioma son recíprocas', () => {
    for (const r of ROUTES) {
      const alts = alternatesFor(r.id);
      for (const a of alts) expect(findByPath(a.path)?.entry.id).toBe(r.id);
    }
    expect(pathFor('guide-pdf', 'en')).toBe('/en/convert-pdf-to-bionic-reading');
    // Sin versión en inglés, se cae al español.
    expect(pathFor('premium', 'en')).toBe('/premium');
  });
});
