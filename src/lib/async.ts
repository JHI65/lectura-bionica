// Utilidades para que los procesos largos no congelen la interfaz y se puedan cancelar.
import { ConversionError } from './files/errors';

export interface Progress {
  stage: string;
  done: number;
  total: number;
}

export interface TaskOptions {
  signal?: AbortSignal;
  onProgress?: (progress: Progress) => void;
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new ConversionError('CANCELLED');
}

/**
 * Devuelve una función que cede el control al navegador como mucho cada
 * `sliceMs`. Así se mantiene la interfaz fluida sin pagar el coste mínimo
 * de un setTimeout en cada iteración.
 */
export function createYielder(sliceMs = 40): () => Promise<void> {
  let last = performance.now();
  return async () => {
    if (performance.now() - last < sliceMs) return;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    last = performance.now();
  };
}
