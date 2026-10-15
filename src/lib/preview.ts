// Construye la vista previa. Se muestra en un iframe con sandbox sin
// allow-scripts: el contenido de un libro nunca se ejecuta en la app.
import { readerCss } from './bionic/css';
import type { ReadingSettings } from './bionic/settings';
import type { ParsedDocument, EpubSection, PdfSection } from './document';
import { transformHtmlBody } from './html/transform';
import { blocksToHtml } from './pdf/html';

export function sectionBodyHtml(doc: ParsedDocument, section: EpubSection | PdfSection, settings: ReadingSettings): string {
  const raw = doc.kind === 'epub' ? (section as EpubSection).html : blocksToHtml((section as PdfSection).blocks);
  return transformHtmlBody(raw, settings.bionicEnabled, settings.boldRatio);
}

export function previewCss(settings: ReadingSettings): string {
  return readerCss(settings, { includeColors: true });
}

/** Documento inicial del iframe. Los cambios posteriores se aplican sin recargarlo. */
export function buildPreviewDocument(body: string, css: string, lang = 'es'): string {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">
<style id="reader-style">${css}</style>
</head>
<body>${body}</body>
</html>`;
}
