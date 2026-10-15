// Generadores de documentos de prueba (EPUB y PDF) en memoria. No se incluyen
// libros reales en el repositorio.
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface ChapterFixture {
  name: string; // p. ej. "text/cap1.xhtml"
  body: string; // contenido del <body>
  title?: string;
}

export async function makeEpub(options: {
  title?: string;
  chapters: ChapterFixture[];
  extraFiles?: Record<string, string | Uint8Array>;
  encryptionXml?: string;
}): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
  );
  if (options.encryptionXml) zip.file('META-INF/encryption.xml', options.encryptionXml);

  const manifest = options.chapters
    .map((c, i) => `<item id="c${i}" href="${c.name.replace('OEBPS/', '')}" media-type="application/xhtml+xml"/>`)
    .join('\n');
  const spine = options.chapters.map((_, i) => `<itemref idref="c${i}"/>`).join('\n');
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="id">test-${Math.random().toString(36).slice(2)}</dc:identifier>
    <dc:title>${options.title ?? 'Libro de prueba'}</dc:title>
    <dc:language>es</dc:language>
  </metadata>
  <manifest>
${manifest}
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine>
${spine}
  </spine>
</package>`,
  );
  zip.file(
    'OEBPS/nav.xhtml',
    `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Índice</title></head>
<body><nav epub:type="toc"><ol>${options.chapters
      .map((c) => `<li><a href="${c.name.replace('OEBPS/', '')}">${c.title ?? c.name}</a></li>`)
      .join('')}</ol></nav></body></html>`,
  );

  for (const chapter of options.chapters) {
    zip.file(
      chapter.name,
      `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${chapter.title ?? 'Capítulo'}</title></head>
<body>${chapter.body}</body>
</html>`,
    );
  }
  for (const [name, content] of Object.entries(options.extraFiles ?? {})) zip.file(name, content);

  return zip.generateAsync({ type: 'arraybuffer', mimeType: 'application/epub+zip' });
}

/** PDF con texto seleccionable. Cada línea se dibuja con su propio tamaño. */
export async function makeTextPdf(lines: Array<{ text: string; size?: number }>): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.addPage([595, 842]);
  let y = 780;
  for (const line of lines) {
    const size = line.size ?? 11;
    page.drawText(line.text, { x: 60, y, size, font, color: rgb(0, 0, 0) });
    y -= size * 1.9;
  }
  const bytes = await pdf.save();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/** PDF sin capa de texto (simula un escaneo: solo dibuja formas). */
export async function makeImageOnlyPdf(): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  page.drawRectangle({ x: 40, y: 40, width: 515, height: 760, color: rgb(0.8, 0.8, 0.8) });
  const bytes = await pdf.save();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
