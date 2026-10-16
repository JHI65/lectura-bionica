// Conversión por lotes (Premium): convierte varios archivos en serie y los
// empaqueta en un ZIP. Todo ocurre en el navegador. La conversión concreta se
// inyecta, así que este módulo no depende de pdf.js ni de epub.js.

import JSZip from 'jszip';
import { ConversionError, toConversionError, type ConversionErrorCode, type ErrorParams } from './files/errors';

export type BatchStatus = 'pending' | 'working' | 'done' | 'error' | 'cancelled';

export interface BatchItem {
  name: string;
  status: BatchStatus;
  outName?: string;
  error?: { code: ConversionErrorCode; params: ErrorParams };
}

export interface BatchOutput {
  blob: Blob;
  fileName: string;
}

/** Nombre que no choca con los ya usados dentro del ZIP: «a.pdf», «a (2).pdf»… */
export function uniqueName(name: string, used: Set<string>): string {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let candidate = name;
  for (let n = 2; used.has(candidate.toLowerCase()); n++) candidate = `${stem} (${n})${ext}`;
  used.add(candidate.toLowerCase());
  return candidate;
}

export interface RunBatchOptions {
  convert: (file: File, index: number) => Promise<BatchOutput>;
  onItem: (index: number, patch: Partial<BatchItem>) => void;
  signal?: AbortSignal;
}

/**
 * Convierte los archivos de uno en uno (así la memoria se mantiene acotada).
 * Un archivo que falla no detiene el lote. Si se cancela, los pendientes
 * quedan como «cancelled» y se devuelven los ya terminados.
 */
export async function runBatch(files: File[], { convert, onItem, signal }: RunBatchOptions): Promise<BatchOutput[]> {
  const outputs: BatchOutput[] = [];
  const used = new Set<string>();
  for (let i = 0; i < files.length; i++) {
    if (signal?.aborted) {
      for (let j = i; j < files.length; j++) onItem(j, { status: 'cancelled' });
      break;
    }
    onItem(i, { status: 'working' });
    try {
      const result = await convert(files[i], i);
      const fileName = uniqueName(result.fileName, used);
      outputs.push({ blob: result.blob, fileName });
      onItem(i, { status: 'done', outName: fileName });
    } catch (error) {
      if (error instanceof ConversionError && error.code === 'CANCELLED') {
        for (let j = i; j < files.length; j++) onItem(j, { status: 'cancelled' });
        break;
      }
      const conversion = toConversionError(error, 'UNKNOWN');
      onItem(i, { status: 'error', error: { code: conversion.code, params: conversion.params } });
    }
  }
  return outputs;
}

/** Empaqueta los resultados. Los PDF/EPUB ya están comprimidos: se almacenan sin recomprimir. */
export async function zipOutputs(outputs: BatchOutput[]): Promise<Blob> {
  const zip = new JSZip();
  for (const output of outputs) zip.file(output.fileName, output.blob, { compression: 'STORE' });
  return zip.generateAsync({ type: 'blob', compression: 'STORE' });
}
