// Modelo intermedio común a los dos formatos. El resto de la app (vista previa,
// ajustes, exportación) trabaja sobre estos tipos y no sobre EPUB o PDF.

import type { AppWarning } from './warnings';

export interface EpubSection {
  id: string;
  /** Título detectado en el libro. null si no tiene: la interfaz pone «Sección N». */
  title: string | null;
  /** Markup del <body> ya sanitizado. Sin scripts ni manejadores; imágenes como data: */
  html: string;
  /** Ruta del capítulo dentro del ZIP original (para reescribirlo al exportar). */
  path: string;
}

export type PdfBlockKind = 'heading' | 'paragraph' | 'listItem' | 'image';

export interface PdfBlock {
  kind: PdfBlockKind;
  text: string;
  /** Solo en kind 'image': data URL (PNG o JPEG) de la zona rasterizada. */
  src?: string;
  /** Solo en kind 'image': tamaño original en puntos, para conservar la proporción al exportar. */
  widthPt?: number;
  heightPt?: number;
}

export interface PdfSection {
  id: string;
  pageNumber: number;
  blocks: PdfBlock[];
}

interface BaseDocument {
  title: string;
  fileName: string;
  /** Avisos no bloqueantes que se muestran al usuario (calidad, limitaciones). */
  warnings: AppWarning[];
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
