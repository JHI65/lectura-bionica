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

export function userMessage(code: ConversionErrorCode): string {
  return MESSAGES[code];
}

export function toConversionError(error: unknown, fallback: ConversionErrorCode = 'UNKNOWN'): ConversionError {
  if (error instanceof ConversionError) return error;
  const detail = error instanceof Error ? error.message : undefined;
  return new ConversionError(fallback, detail);
}
