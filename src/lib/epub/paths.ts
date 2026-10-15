// Utilidades de rutas dentro del contenedor ZIP de un EPUB.

/** Une una ruta relativa (de un href/src) con el directorio base del archivo. */
export function resolveZipPath(baseFile: string, relative: string): string {
  const clean = relative.split('#')[0].split('?')[0];
  let decoded: string;
  try {
    decoded = decodeURIComponent(clean);
  } catch {
    decoded = clean;
  }
  const baseParts = baseFile.split('/').slice(0, -1);
  const parts = decoded.startsWith('/') ? [] : baseParts;
  for (const segment of decoded.replace(/^\/+/, '').split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') parts.pop();
    else parts.push(segment);
  }
  return parts.join('/');
}

/** Ruta relativa desde el directorio de `fromFile` hasta `toFile`. */
export function relativeZipPath(fromFile: string, toFile: string): string {
  const from = fromFile.split('/').slice(0, -1);
  const to = toFile.split('/');
  let common = 0;
  while (common < from.length && common < to.length - 1 && from[common] === to[common]) common++;
  const up = from.slice(common).map(() => '..');
  return [...up, ...to.slice(common)].join('/');
}

export function extensionOf(path: string): string {
  const name = path.split('/').pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}
