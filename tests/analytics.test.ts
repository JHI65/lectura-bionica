// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

describe('parámetros de analítica', () => {
  it('descarta nombres de archivo, texto y cualquier clave no permitida', async () => {
    const { sanitizeParams } = await import('../src/lib/state/analytics');
    const clean = sanitizeParams({
      format: 'pdf',
      fileName: 'mi-libro-privado.pdf',
      text: 'contenido del documento',
      title: 'Título del libro',
      error_code: 'PDF_NO_TEXT',
    });
    expect(clean).toEqual({ format: 'pdf', error_code: 'PDF_NO_TEXT' });
  });

  it('descarta valores fuera de la lista permitida', async () => {
    const { sanitizeParams } = await import('../src/lib/state/analytics');
    expect(sanitizeParams({ format: 'docx', error_code: 'algo con datos personales' })).toEqual({});
  });
});

describe('fuente de adquisición', () => {
  it('usa solo el dominio del referrer, nunca la URL completa', async () => {
    const { acquisitionSource } = await import('../src/lib/state/analytics');
    expect(acquisitionSource('https://www.google.com/search?q=lectura+bionica&x=privado', '', 'miweb.es')).toBe('google.com');
  });

  it('prioriza utm_source saneado y trata el propio dominio como directo', async () => {
    const { acquisitionSource } = await import('../src/lib/state/analytics');
    expect(acquisitionSource('', '?utm_source=Newsletter%20<script>', 'miweb.es')).toBe('newsletterscript');
    expect(acquisitionSource('https://miweb.es/otra', '', 'miweb.es')).toBe('directo');
    expect(acquisitionSource('no-es-una-url', '', 'miweb.es')).toBe('directo');
  });
});

describe('track', () => {
  it('no envía nada sin consentimiento de analítica', async () => {
    vi.resetModules();
    window.localStorage.clear();
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: beacon });
    vi.doMock('../src/lib/state/config', () => ({ config: { analyticsEndpoint: 'https://analitica.example/e', isDev: false } }));
    const { track } = await import('../src/lib/state/analytics');
    const { saveConsent } = await import('../src/lib/state/consent');

    track('conversion_completed', { format: 'pdf' });
    expect(beacon).not.toHaveBeenCalled();

    saveConsent({ analytics: false, ads: true });
    track('conversion_completed', { format: 'pdf' });
    expect(beacon).not.toHaveBeenCalled();

    saveConsent({ analytics: true, ads: false });
    track('conversion_completed', { format: 'pdf', fileName: 'secreto.pdf' });
    expect(beacon).toHaveBeenCalledTimes(1);
  });
});

describe('visitas recurrentes', () => {
  it('registerVisit cuenta y devuelve true solo a partir de la segunda visita', async () => {
    vi.resetModules();
    window.localStorage.clear();
    const { registerVisit } = await import('../src/lib/state/analytics');
    expect(registerVisit()).toBe(false);
    expect(registerVisit()).toBe(true);
  });
});
