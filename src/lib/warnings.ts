// Avisos no bloqueantes sobre un documento o su exportación. Son datos
// (código + parámetros), no texto: cada idioma los redacta en la interfaz.

export type WarningCode =
  | 'PDF_ORDER'
  | 'PDF_FEW_TEXT_PAGES'
  | 'PDF_DECODING'
  | 'PDF_TRUNCATED'
  | 'EPUB_UNREADABLE_CHAPTER'
  | 'EPUB_NO_BODY'
  | 'EPUB_EMPTY_SECTIONS'
  | 'EPUB_IMAGES_OMITTED'
  | 'EPUB_PREVIOUSLY_CONVERTED'
  | 'EXPORT_NOT_STRICT_XHTML'
  | 'EXPORT_NO_BODY'
  | 'PDF_CHARS_REPLACED';

export interface AppWarning {
  code: WarningCode;
  params?: Record<string, number | string>;
}
