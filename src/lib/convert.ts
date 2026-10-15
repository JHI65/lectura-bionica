// Punto de entrada del flujo: validar → extraer → (ajustar) → exportar.
// La interfaz solo habla con este módulo.

import JSZip from 'jszip';
import { ConversionError, toConversionError } from './files/errors';
import { validateFile } from './files/validate';
import type { ReadingSettings } from './bionic/settings';
import type { ParsedDocument } from './document';
import { parseEpub } from './epub/parse';
import { exportEpub, type ExportResult } from './epub/export';
import { parsePdf } from './pdf/parse';
import { exportPdf } from './pdf/export';

export async function parseDocument(file: File): Promise<ParsedDocument> {
  try {
    const { kind } = await validateFile(file);
    const buffer = await file.arrayBuffer();

    if (kind === 'pdf') return await parsePdf(buffer, file.name);

    // ZIP: solo es EPUB si tiene mimetype; si no, no es un formato admitido.
    const zip = await JSZip.loadAsync(buffer).catch(() => null);
    if (!zip) throw new ConversionError('EPUB_INVALID', 'el contenedor ZIP no se puede leer');
    if (!zip.file('mimetype')) throw new ConversionError('UNSUPPORTED_TYPE', 'el ZIP no tiene mimetype de EPUB');
    return await parseEpub(buffer, file.name);
  } catch (error) {
    throw toConversionError(error, 'UNKNOWN');
  }
}

export async function exportDocument(doc: ParsedDocument, settings: ReadingSettings): Promise<ExportResult> {
  try {
    if (doc.kind === 'epub') return await exportEpub(doc, settings);
    return await exportPdf(doc, settings);
  } catch (error) {
    if (error instanceof ConversionError && error.code.startsWith('EXPORT')) throw error;
    throw toConversionError(error, 'EXPORT_FAILED');
  }
}
