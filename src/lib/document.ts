// Modelo intermedio común a los dos formatos. El resto de la app (vista previa,
// ajustes, exportación) trabaja sobre estos tipos y no sobre EPUB o PDF.

import type { DocumentKind } from './files/validate';

export interface EpubSection {
  id: string;
  title: string;
  /** Markup del <body> ya sanitizado. Sin scripts ni manejadores; imágenes como data: */
  html: string;
  /** Ruta del capítulo dentro del ZIP original (para reescribirlo al exportar). */
  path: string;
}

export type PdfBlockKind = 'heading' | 'paragraph' | 'listItem';

export interface PdfBlock {
  kind: PdfBlockKind;
  text: string;
}

export interface PdfSection {
  id: string;
  title: string;
  blocks: PdfBlock[];
}

interface BaseDocument {
  title: string;
  fileName: string;
  /** Avisos no bloqueantes que se muestran al usuario (calidad, limitaciones). */
  warnings: string[];
}

export interface EpubDocument extends BaseDocument {
  kind: 'epub';
  sections: EpubSection[];
  /** Contenido original del EPUB, necesario para exportar conservando recursos. */
  original: ArrayBuffer;
  /** Ruta del archivo OPF (paquete) dentro del ZIP. */
  opfPath: string;
}

export interface PdfDocument extends BaseDocument {
  kind: 'pdf';
  sections: PdfSection[];
  pageCount: number;
  extractedChars: number;
}

export type ParsedDocument = EpubDocument | PdfDocument;

export function documentKindLabel(kind: DocumentKind): string {
  return kind === 'epub' ? 'EPUB' : 'PDF';
}
