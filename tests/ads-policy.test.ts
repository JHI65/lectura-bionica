// @vitest-environment jsdom
// Política de publicidad: cuándo se permite (o no) cargar y mostrar anuncios.
import { beforeEach, describe, expect, it, vi } from 'vitest';

async function load(options: { configured: boolean; dev: boolean }) {
  vi.resetModules();
  window.localStorage.clear();
  vi.doMock('../src/lib/state/config', () => ({
    config: {
      isDev: options.dev,
      isProduction: !options.dev,
      adsenseClient: options.configured ? 'ca-pub-1234567890123456' : '',
      adsenseSlot: options.configured ? '1234567890' : '',
      analyticsEndpoint: '',
    },
    isAdsenseConfigured: options.configured,
  }));
  const ads = await import('../src/lib/state/ads');
  const consent = await import('../src/lib/state/consent');
  return { ...ads, ...consent };
}

beforeEach(() => {
  vi.resetModules();
});

describe('resolveAdMode en producción con AdSense configurado', () => {
  it('sin decisión de consentimiento: no hay anuncios', async () => {
    const { resolveAdMode } = await load({ configured: true, dev: false });
    expect(resolveAdMode(false)).toBe('off');
  });

  it('con la publicidad rechazada: no hay anuncios (ni «no personalizados»)', async () => {
    const { resolveAdMode, saveConsent } = await load({ configured: true, dev: false });
    saveConsent({ analytics: true, ads: false });
    expect(resolveAdMode(false)).toBe('off');
  });

  it('con la publicidad aceptada: anuncios reales', async () => {
    const { resolveAdMode, saveConsent } = await load({ configured: true, dev: false });
    saveConsent({ analytics: false, ads: true });
    expect(resolveAdMode(false)).toBe('live');
  });

  it('Premium verificado nunca ve anuncios, aunque haya consentimiento', async () => {
    const { resolveAdMode, saveConsent } = await load({ configured: true, dev: false });
    saveConsent({ analytics: true, ads: true });
    expect(resolveAdMode(true)).toBe('off');
  });
});

describe('resolveAdMode sin configuración', () => {
  it('producción sin identificadores: nada, aunque haya consentimiento', async () => {
    const { resolveAdMode, saveConsent } = await load({ configured: false, dev: false });
    saveConsent({ analytics: true, ads: true });
    expect(resolveAdMode(false)).toBe('off');
  });

  it('desarrollo sin identificadores: placeholder claramente marcado', async () => {
    const { resolveAdMode } = await load({ configured: false, dev: true });
    expect(resolveAdMode(false)).toBe('dev-placeholder');
  });

  it('loadAdsenseScript rechaza si AdSense no está configurado', async () => {
    const { loadAdsenseScript } = await load({ configured: false, dev: false });
    await expect(loadAdsenseScript()).rejects.toThrow();
    expect(document.querySelector('script[data-lb-adsense]')).toBeNull();
  });
});
