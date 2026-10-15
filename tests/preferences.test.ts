import { describe, expect, it } from 'vitest';
import { sanitizeSettings } from '../src/lib/state/preferences';
import { DEFAULT_SETTINGS } from '../src/lib/bionic/settings';

describe('sanitizeSettings', () => {
  it('conserva una proporción de negrita válida', () => {
    expect(sanitizeSettings({ boldRatio: 0.65 }).boldRatio).toBe(0.65);
  });

  it('descarta proporciones fuera de rango o de tipo incorrecto', () => {
    expect(sanitizeSettings({ boldRatio: 5 }).boldRatio).toBe(DEFAULT_SETTINGS.boldRatio);
    expect(sanitizeSettings({ boldRatio: '0.5' }).boldRatio).toBe(DEFAULT_SETTINGS.boldRatio);
  });

  it('migra ajustes antiguos sin boldRatio usando el valor por defecto', () => {
    const old = { bionicEnabled: true, intensity: 'alta', fontSize: 20 };
    const settings = sanitizeSettings(old);
    expect(settings.boldRatio).toBe(DEFAULT_SETTINGS.boldRatio);
    expect(settings.intensity).toBe('alta');
    expect(settings.fontSize).toBe(20);
  });
});
