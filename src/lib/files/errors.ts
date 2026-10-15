// Errores de conversión con código estable y mensaje comprensible para el usuario.
// Nunca se oculta un fallo tras un mensaje genérico: cada caso tiene su código.

export type ConversionErrorCode =
  | 'UNSUPPORTED_TYPE'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_FILE'
  | 'EPUB_INVALID'
  | 'EPUB_PROTECTED'
  | 'EPUB_NO_CONTENT'
  | 'PDF_DAMAGED'
  | 'PDF_PROTECTED'
  | 'PDF_NO_TEXT'
  | 'EXPORT_FAILED'
  | 'EXPORT_VERIFY_FAILED'
  | 'RESOURCE_LIMIT'
  | 'CANCELLED'
  | 'UNKNOWN';

const MESSAGES: Record<ConversionErrorCode, string> = {
  UNSUPPORTED_TYPE: 'El archivo no es un EPUB ni un PDF válido. Revisa que sea el documento correcto.',
  FILE_TOO_LARGE: 'El archivo supera el tamaño máximo permitido.',
  EMPTY_FILE: 'El archivo está vacío.',
  EPUB_INVALID: 'No se pudo leer el EPUB. Puede estar dañado o tener una estructura no estándar.',
  EPUB_PROTECTED: 'Este EPUB está protegido (DRM o cifrado) y no puede transformarse.',
  EPUB_NO_CONTENT: 'El EPUB no contiene capítulos con texto que transformar.',
  PDF_DAMAGED: 'El PDF está dañado o no se puede abrir.',
  PDF_PROTECTED: 'El PDF está protegido con contraseña. Desbloquéalo antes de subirlo.',
  PDF_NO_TEXT:
    'Este PDF no contiene texto seleccionable: parece un escaneo o una imagen. Necesita OCR antes de poder transformarse. No se ha generado ningún resultado.',
  EXPORT_FAILED: 'No se pudo generar el archivo transformado. Inténtalo de nuevo.',
  EXPORT_VERIFY_FAILED: 'El archivo generado no ha superado la comprobación de integridad, así que no se ha descargado.',
  RESOURCE_LIMIT:
    'El documento es demasiado grande o complejo para procesarlo en este dispositivo. Prueba con un archivo más pequeño o cierra otras pestañas.',
  CANCELLED: 'Operación cancelada.',
  UNKNOWN: 'Ha ocurrido un error inesperado al procesar el documento.',
};

export class ConversionError extends Error {
  readonly code: ConversionErrorCode;

  constructor(code: ConversionErrorCode, detail?: string) {
    super(detail ? `${MESSAGES[code]} (${detail})` : MESSAGES[code]);
    this.name = 'ConversionError';
    this.code = code;
  }
}

export function toConversionError(error: unknown, fallback: ConversionErrorCode = 'UNKNOWN'): ConversionError {
  if (error instanceof ConversionError) return error;
  if (isResourceError(error)) return new ConversionError('RESOURCE_LIMIT');
  const detail = error instanceof Error ? error.message : undefined;
  return new ConversionError(fallback, detail);
}

/** Fallos de memoria o de tamaño de buffer, que en navegadores aparecen como RangeError. */
export function isResourceError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error instanceof RangeError) return true;
  return /out of memory|allocation failed|invalid (array|string) length|memory/i.test(error.message);
}
