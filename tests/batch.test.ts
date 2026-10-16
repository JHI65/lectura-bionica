// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { runBatch, uniqueName, zipOutputs, type BatchItem } from '../src/lib/batch';
import { ConversionError } from '../src/lib/files/errors';
import { maxFileBytes, validateFile } from '../src/lib/files/validate';
import { PREMIUM_MAX_FILE_MB, config } from '../src/lib/state/config';
import { sanitizeParams } from '../src/lib/state/analytics';

const file = (name: string) => new File(['x'], name);

describe('uniqueName', () => {
  it('añade un contador cuando el nombre ya existe, sin distinguir mayúsculas', () => {
    const used = new Set<string>();
    expect(uniqueName('libro.pdf', used)).toBe('libro.pdf');
    expect(uniqueName('Libro.pdf', used)).toBe('Libro (2).pdf');
    expect(uniqueName('libro.pdf', used)).toBe('libro (3).pdf');
  });
});

describe('runBatch', () => {
  const collect = () => {
    const items: Partial<BatchItem>[] = [];
    return { items, onItem: (i: number, patch: Partial<BatchItem>) => (items[i] = { ...items[i], ...patch }) };
  };

  it('convierte en orden y un fallo no detiene el resto', async () => {
    const { items, onItem } = collect();
    const outputs = await runBatch([file('a.pdf'), file('b.pdf'), file('c.pdf')], {
      onItem,
      convert: async (f) => {
        if (f.name === 'b.pdf') throw new ConversionError('PDF_DAMAGED');
        return { blob: new Blob([f.name]), fileName: f.name };
      },
    });
    expect(outputs.map((o) => o.fileName)).toEqual(['a.pdf', 'c.pdf']);
    expect(items.map((i) => i.status)).toEqual(['done', 'error', 'done']);
    expect(items[1].error?.code).toBe('PDF_DAMAGED');
  });

  it('resuelve nombres de salida repetidos', async () => {
    const { items, onItem } = collect();
    const outputs = await runBatch([file('x.pdf'), file('y.pdf')], {
      onItem,
      convert: async () => ({ blob: new Blob(['1']), fileName: 'mismo.pdf' }),
    });
    expect(outputs.map((o) => o.fileName)).toEqual(['mismo.pdf', 'mismo (2).pdf']);
    expect(items[1].outName).toBe('mismo (2).pdf');
  });

  it('al cancelar conserva lo hecho y marca el resto como cancelado', async () => {
    const controller = new AbortController();
    const { items, onItem } = collect();
    const outputs = await runBatch([file('a.pdf'), file('b.pdf'), file('c.pdf')], {
      onItem,
      signal: controller.signal,
      convert: async (f) => {
        if (f.name === 'a.pdf') controller.abort();
        return { blob: new Blob(['ok']), fileName: f.name };
      },
    });
    expect(outputs).toHaveLength(1);
    expect(items.map((i) => i.status)).toEqual(['done', 'cancelled', 'cancelled']);
  });

  it('una cancelación lanzada desde la conversión también detiene el lote', async () => {
    const { items, onItem } = collect();
    await runBatch([file('a.pdf'), file('b.pdf')], {
      onItem,
      convert: async () => {
        throw new ConversionError('CANCELLED');
      },
    });
    expect(items.map((i) => i.status)).toEqual(['cancelled', 'cancelled']);
  });
});

describe('zipOutputs', () => {
  it('genera un ZIP con todos los archivos', async () => {
    const blob = await zipOutputs([
      { blob: new Blob(['uno']), fileName: 'a.pdf' },
      { blob: new Blob(['dos']), fileName: 'b.epub' },
    ]);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual(['a.pdf', 'b.epub']);
    expect(await zip.file('b.epub')!.async('string')).toBe('dos');
  });
});

describe('límite de tamaño por plan', () => {
  it('Premium admite archivos mayores que el plan gratuito', () => {
    expect(maxFileBytes(true)).toBe(PREMIUM_MAX_FILE_MB * 1024 * 1024);
    expect(maxFileBytes(true)).toBeGreaterThan(maxFileBytes(false));
    expect(maxFileBytes(false)).toBe(config.maxFileMb * 1024 * 1024);
  });

  it('validateFile respeta el límite que se le pasa', async () => {
    const big = new File([new Uint8Array(2048)], 'x.pdf');
    await expect(validateFile(big, 1024)).rejects.toMatchObject({ code: 'FILE_TOO_LARGE' });
  });
});

describe('analítica de lotes', () => {
  it('admite el recuento y los planes, pero no valores desconocidos', () => {
    expect(sanitizeParams({ count: 5, plan: 'yearly' })).toEqual({ count: 5, plan: 'yearly' });
    expect(sanitizeParams({ plan: 'gratis-total' })).toEqual({});
  });
});
