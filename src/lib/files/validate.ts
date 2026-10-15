// Validación del archivo subido. Nunca confía en la extensión ni en el MIME
// declarado por el navegador: se inspeccionan los bytes iniciales (firma).

import { ConversionError } from './errors';

export type DocumentKind = 'epub' | 'pdf';

export const DEFAULT_MAX_MB = 25;

export function maxFileBytes(): number {
  const raw = Number(import.meta.env.VITE_MAX_FILE_MB);
  const mb = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_MB;
  return mb * 1024 * 1024;
}

const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

/** Decide el tipo real por firma. Devuelve null si no es un tipo admitido. */
export function sniffKind(header: Uint8Array): 'zip' | 'pdf' | null {
  if (startsWith(header, PDF_SIGNATURE)) return 'pdf';
  if (startsWith(header, ZIP_SIGNATURE)) return 'zip';
  return null;
}

/**
 * Valida tamaño y firma. Para ZIP la comprobación EPUB (mimetype) la hace
 * el parser, que tiene el contenido completo. Devuelve el tipo detectado.
 */
export async function validateFile(file: File): Promise<{ kind: 'pdf' | 'zip' }> {
  if (file.size === 0) throw new ConversionError('EMPTY_FILE');
  if (file.size > maxFileBytes()) {
    const mb = Math.round(maxFileBytes() / (1024 * 1024));
    throw new ConversionError('FILE_TOO_LARGE', `límite ${mb} MB`);
  }

  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const kind = sniffKind(header);
  if (!kind) throw new ConversionError('UNSUPPORTED_TYPE');
  return { kind };
}

/** Nombre de archivo seguro (sin rutas, caracteres peligrosos ni nombres vacíos). */
export function safeBaseName(input: string, fallback = 'documento'): string {
  const lastSegment = input.normalize('NFC').split(/[\\/]/).pop() ?? '';
  const cleaned = lastSegment
    .replace(/^\.+/, '')
    .replace(/\.(epub|pdf)$/i, '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
    .trim();
  return cleaned || fallback;
}
