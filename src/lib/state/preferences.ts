// Preferencias de lectura guardadas localmente. Son solo ajustes visuales:
// nunca se usan para decidir nada de Premium ni de seguridad.

import { BOLD_RATIO_MAX, BOLD_RATIO_MIN, DEFAULT_SETTINGS, type ReadingSettings } from '../bionic/settings';

const KEY = 'lb:reading-settings:v1';

export function loadSettings(): ReadingSettings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    // Almacenamiento bloqueado o JSON corrupto: se usan los valores por defecto.
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: ReadingSettings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Sin almacenamiento disponible la sesión sigue funcionando.
  }
}

/** Acepta solo valores válidos y rellena lo que falte con los valores por defecto. */
export function sanitizeSettings(input: unknown): ReadingSettings {
  const value = (typeof input === 'object' && input !== null ? input : {}) as Partial<Record<keyof ReadingSettings, unknown>>;
  const pick = <K extends keyof ReadingSettings>(key: K, valid: (v: unknown) => boolean): ReadingSettings[K] =>
    valid(value[key]) ? (value[key] as ReadingSettings[K]) : DEFAULT_SETTINGS[key];
  const inRange = (min: number, max: number) => (v: unknown) => typeof v === 'number' && v >= min && v <= max;
  const oneOf = <T extends string>(options: readonly T[]) => (v: unknown) => options.includes(v as T);

  return {
    bionicEnabled: pick('bionicEnabled', (v) => typeof v === 'boolean'),
    intensity: pick('intensity', oneOf(['suave', 'media', 'alta'] as const)),
    boldRatio: pick('boldRatio', inRange(BOLD_RATIO_MIN, BOLD_RATIO_MAX)),
    fontSize: pick('fontSize', inRange(12, 32)),
    fontFamily: pick('fontFamily', oneOf(['sans', 'serif', 'mono'] as const)),
    lineHeight: pick('lineHeight', inRange(1.2, 2.6)),
    letterSpacing: pick('letterSpacing', inRange(0, 0.15)),
    readingWidth: pick('readingWidth', oneOf(['estrecho', 'medio', 'ancho'] as const)),
    theme: pick('theme', oneOf(['claro', 'sepia', 'oscuro'] as const)),
  };
}
