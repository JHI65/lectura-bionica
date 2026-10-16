// Textos de la interfaz en cada idioma. `en` se tipa como `typeof es`: si falta
// una clave o cambia la firma de una función, TypeScript no compila.
//
// Los textos largos (guías, preguntas frecuentes y documentos legales) viven en
// src/content, también por idioma.

import type { ConversionErrorCode } from '../lib/files/errors';
import { formatBytes } from '../lib/files/validate';
import type { WarningCode } from '../lib/warnings';
import { NUMBER_LOCALE, type Locale } from './locale';

type P = Record<string, number | string>;

const num = (p: P, key: string): number => Number(p[key] ?? 0);
const str = (p: P, key: string): string => String(p[key] ?? '');

const es = {
  htmlLang: 'es',
  skipToContent: 'Saltar al contenido',
  advertisement: 'Publicidad',
  adDevPlaceholder: 'Espacio publicitario de desarrollo. No se muestra en producción. Configura VITE_ADSENSE_CLIENT y VITE_ADSENSE_SLOT.',

  language: { label: 'Idioma', switchLabel: 'English', switchAria: 'Read this site in English' },

  nav: {
    aria: 'Principal',
    home: 'Convertir',
    'guide-what': '¿Qué es?',
    'guide-epub': 'EPUB',
    'guide-pdf': 'PDF',
    account: 'Mi cuenta',
    accountPremium: 'Mi cuenta · Premium',
    premium: 'Premium',
  } as Record<string, string>,

  footer: {
    tagline: 'Herramienta de personalización de la lectura. Tus documentos se procesan en tu dispositivo.',
    legalTitle: 'Legal',
    legalAria: 'Legal',
    privacy: 'Política de privacidad',
    cookies: 'Política de cookies',
    terms: 'Condiciones de uso',
    legal: 'Aviso legal',
    cookiePrefs: 'Preferencias de cookies',
    guidesTitle: 'Guías',
    guidesAria: 'Guías',
    guideLinks: {
      'guide-epub': 'Convertir EPUB',
      'guide-pdf': 'Convertir PDF',
      'guide-typography': 'Personalizar la tipografía',
      'guide-accessibility': 'Herramientas de accesibilidad',
      'guide-ocr': 'PDF escaneado y OCR',
      'guide-troubleshoot': 'Solución de problemas',
    } as Record<string, string>,
    copyright: (year: number, brand: string) =>
      `© ${year} ${brand}. La lectura biónica es una herramienta de personalización visual y no tiene finalidad médica.`,
  },

  cookies: {
    title: 'Tu privacidad, tu elección',
    text: 'Tus documentos nunca salen de tu dispositivo. La analítica y la publicidad solo se cargan si las aceptas.',
    more: 'Más información',
    choose: 'Elegir por categoría',
    hide: 'Ocultar opciones',
    legend: 'Cookies opcionales',
    analytics: 'Analítica anónima',
    ads: 'Publicidad (Google AdSense)',
    reject: 'Rechazar opcionales',
    save: 'Guardar mi elección',
    accept: 'Aceptar todo',
  },

  dropzone: {
    title: 'Arrastra tu EPUB o PDF aquí',
    hint: 'o pulsa para elegir un archivo desde tu dispositivo',
    chip: (mb: number) => `EPUB o PDF con texto seleccionable · hasta ${mb}\u00a0MB`,
    aria: 'Seleccionar documento EPUB o PDF',
  },

  steps: {
    aria: 'Pasos del proceso',
    done: '(completado)',
    labels: ['Importar', 'Extraer', 'Lectura biónica', 'Personalizar', 'Exportar'],
  },

  settings: {
    bionicTitle: 'Negrita bionica',
    bionicHint: 'Resalta el inicio de cada palabra',
    bionicAria: 'Activar negrita bionica',
    intensity: 'Intensidad',
    intensityOptions: { suave: 'Suave', media: 'Media', alta: 'Alta' },
    boldRatio: 'Letras en negrita',
    boldRatioNote: 'Porcentaje de cada palabra en negrita. Las palabras de 1 a 3 letras resaltan solo la primera.',
    fontFamily: 'Tipo de letra',
    fontSize: 'Tamaño de letra',
    lineHeight: 'Interlineado',
    letterSpacing: 'Espaciado entre letras',
    width: 'Ancho de lectura',
    widthOptions: { estrecho: 'Estrecho', medio: 'Medio', ancho: 'Ancho' },
    theme: 'Tema y contraste',
    themeOptions: { claro: 'Claro', sepia: 'Sepia', oscuro: 'Oscuro' },
    reset: 'Restablecer ajustes',
  },

  converter: {
    privacyTitle: 'Tu documento no sale de tu dispositivo',
    privacyBody:
      'El archivo se procesa en tu navegador. No lo subimos a ningún servidor ni lo guardamos. Solo se recuerdan tus ajustes visuales.',
    ocrNote: '¿Tienes un PDF escaneado? Necesita OCR antes de convertirse; te lo indicaremos si ocurre.',
    ocrLink: 'Más sobre PDF',
    readingTitle: 'Leyendo el documento…',
    readingBody: (size: string) =>
      `Extraemos el texto en tu dispositivo (${size}). Los documentos grandes pueden tardar unos segundos.`,
    preparing: 'Preparando…',
    cancel: 'Cancelar',
    progress: 'Progreso',
    stage: {
      'pdf-page': 'Leyendo página',
      'pdf-images': 'Buscando imágenes en la página',
      'epub-chapter': 'Leyendo capítulo',
      'epub-transform': 'Transformando capítulo',
      'pdf-build': 'Generando PDF',
    } as Record<string, string>,
    progressOf: (stage: string, done: number, total: number) => `${stage} ${done} de ${total}`,
    errorTitle: 'No se ha podido convertir este documento',
    codeLabel: 'Código',
    restart: 'Empezar de nuevo',
    summary: (noun: string, size: string, count: number, kind: 'epub' | 'pdf') =>
      `${noun} · ${size} · ${count} ${kind === 'epub' ? 'secciones' : 'páginas con texto'}`,
    changeDocument: 'Cambiar de documento',
    previous: 'Sección anterior',
    next: 'Sección siguiente',
    chooseSection: 'Elegir sección',
    sectionFallback: (n: number) => `Sección ${n}`,
    pdfPage: (n: number) => `Página ${n}`,
    previewTitle: (title: string) => `Vista previa: ${title}`,
    noText: 'Este documento no tiene texto que mostrar.',
    warningsTitle: 'Avisos sobre el resultado',
    settingsTitle: 'Personalizar lectura',
    settingsAria: 'Personalizar y exportar',
    downloadTitle: 'Descargar',
    downloadEpub:
      'Genera un EPUB con el texto transformado. Conserva capítulos, imágenes y la estructura original, e incluye tu tipografía elegida.',
    downloadPdf:
      'Genera un PDF reformateado a partir del texto extraído. Es una reconstrucción: no es una copia idéntica del original.',
    exportErrorTitle: 'No se ha podido generar el archivo',
    generating: 'Generando archivo…',
    download: (noun: string) => `Descargar ${noun} transformado`,
    doneTitle: 'Descarga iniciada',
  },

  home: {
    eyebrow: 'Personalización de la lectura',
    h1: 'Conversor PDF/EPUB a Lectura Biónica',
    intro:
      'Convierte un libro o documento con texto a lectura biónica, ajusta la tipografía a tu gusto, revisa la vista previa y descarga el resultado. Sin registro.',
    introLink: '¿Qué es la lectura biónica?',
    exampleCaption: 'Ejemplo ilustrativo',
    example: [
      ['Lec', 'tura de un '],
      ['pár', 'rafo con '],
      ['nega', 'rita '],
      ['al', ' inicio de '],
      ['ca', 'da '],
      ['pa', 'labra, '],
      ['sin', ' cambiar el texto.'],
    ] as Array<[string, string]>,
    howTitle: 'Cómo funciona',
    steps: [
      { title: 'Importa', text: 'Arrastra un EPUB o un PDF con texto, o elígelo desde tu dispositivo.' },
      { title: 'Extrae', text: 'Leemos capítulos, títulos y párrafos. Si un PDF no tiene texto, te lo indicamos.' },
      { title: 'Personaliza', text: 'Elige la intensidad de la negrita, la letra, el interlineado y el tema.' },
      { title: 'Descarga', text: 'Obtén un EPUB o un PDF transformado, listo para leer donde prefieras.' },
    ],
    featuresTitle: 'Qué puedes hacer',
    features: [
      'EPUB con capítulos, enlaces, listas, énfasis e imágenes.',
      'PDF reformateado a partir del texto, con títulos y párrafos.',
      'Negrita bionica ajustable y vista previa en tiempo real.',
      'Tipografía, interlineado, ancho y tema claro, sepia u oscuro.',
      'Sin registro para convertir y descargar.',
      'Tu documento se procesa en tu navegador: no se sube a ningún servidor.',
    ],
    pdfNote:
      'Para PDF, el resultado es una reconstrucción a partir del texto y las imágenes incrustadas: columnas, tablas, gráficos vectoriales, notas al pie y fórmulas pueden no conservarse.',
    pdfNoteLink: 'Cómo funciona con PDF',
    faqTitle: 'Preguntas frecuentes',
    privacyTitle: 'Tu privacidad',
    privacyBody:
      'Procesamos tus archivos en tu navegador. Solo guardamos tus ajustes de lectura en este dispositivo. Los anuncios y la analítica requieren tu consentimiento.',
    privacyLink: 'Leer la política de privacidad',
    premiumTitle: 'Premium: sin anuncios',
    premiumBody: (price: string) =>
      `Todas las funciones gratuitas, sin publicidad en la aplicación. ${price}, cancelable en cualquier momento.`,
    premiumLink: 'Ver Premium',
  },

  guide: {
    updated: 'Última actualización',
    toc: 'En esta guía',
    faq: 'Preguntas frecuentes',
    tryIt: 'Pruébalo con tu propio documento. No necesitas registrarte.',
    others: 'Otras guías',
  },
  legal: { updated: 'Última revisión' },
  notFound: {
    title: 'Página no encontrada',
    description: 'La página que buscas no existe.',
    body: 'La dirección no existe o se ha movido.',
    home: 'Volver al inicio',
  },

  errors: {
    UNSUPPORTED_TYPE: () => 'El archivo no es un EPUB ni un PDF válido. Revisa que sea el documento correcto.',
    FILE_TOO_LARGE: (p: P, nl: string) =>
      `El archivo supera el tamaño máximo permitido (tu archivo pesa ${formatBytes(num(p, 'sizeBytes'), nl)} y el máximo es ${formatBytes(num(p, 'maxBytes'), nl)}).`,
    EMPTY_FILE: () => 'El archivo está vacío.',
    EPUB_INVALID: () => 'No se pudo leer el EPUB. Puede estar dañado o tener una estructura no estándar.',
    EPUB_PROTECTED: () => 'Este EPUB está protegido (DRM o cifrado) y no puede transformarse.',
    EPUB_NO_CONTENT: () => 'El EPUB no contiene capítulos con texto que transformar.',
    PDF_DAMAGED: () => 'El PDF está dañado o no se puede abrir.',
    PDF_PROTECTED: () => 'El PDF está protegido con contraseña. Desbloquéalo antes de subirlo.',
    PDF_NO_TEXT: () =>
      'Este PDF no contiene texto seleccionable: parece un escaneo o una imagen. Necesita OCR antes de poder transformarse. No se ha generado ningún resultado.',
    EXPORT_FAILED: () => 'No se pudo generar el archivo transformado. Inténtalo de nuevo.',
    EXPORT_VERIFY_FAILED: () => 'El archivo generado no ha superado la comprobación de integridad, así que no se ha descargado.',
    RESOURCE_LIMIT: () =>
      'El documento es demasiado grande o complejo para procesarlo en este dispositivo. Prueba con un archivo más pequeño o cierra otras pestañas.',
    CANCELLED: () => 'Operación cancelada.',
    UNKNOWN: () => 'Ha ocurrido un error inesperado al procesar el documento.',
  } as Record<ConversionErrorCode, (p: P, nl: string) => string>,

  warnings: {
    PDF_ORDER: () =>
      'La reconstrucción sigue el orden del texto del PDF. Columnas, tablas, notas al pie y fórmulas pueden no conservarse. No es una copia idéntica del original.',
    PDF_FEW_TEXT_PAGES: (p: P) =>
      `Solo ${num(p, 'withText')} de ${num(p, 'total')} páginas contienen texto seleccionable. Las páginas escaneadas se han omitido y necesitarían OCR.`,
    PDF_DECODING: () => 'Algunos caracteres no se han podido decodificar (fuentes incrustadas). Revisa el resultado.',
    PDF_TRUNCATED: (p: P) => `El PDF tiene ${num(p, 'pages')} páginas; solo se han procesado las primeras ${num(p, 'max')}.`,
    PDF_IMAGES_SKIPPED: (p: P) =>
      `${num(p, 'count')} imagen(es) no se han podido incluir (límite de tamaño o de cantidad, o no se pudieron dibujar). El texto no se ve afectado.`,
    EPUB_UNREADABLE_CHAPTER: (p: P) => `Un capítulo (${str(p, 'path')}) no se pudo leer y se ha omitido.`,
    EPUB_NO_BODY: (p: P) => `Un capítulo (${str(p, 'path')}) no tiene contenido legible.`,
    EPUB_EMPTY_SECTIONS: (p: P) => `${num(p, 'count')} sección(es) sin texto (portadas, imágenes) se han omitido de la vista previa.`,
    EPUB_IMAGES_OMITTED: (p: P) =>
      `${num(p, 'count')} imagen(es) no se muestran en la vista previa por su tamaño o formato. Se conservan en el EPUB descargado.`,
    EPUB_PREVIOUSLY_CONVERTED: () =>
      'Este EPUB ya se había convertido. Se ha quitado la negrita anterior para aplicar tus ajustes actuales.',
    EXPORT_NOT_STRICT_XHTML: (p: P) => {
      const title = str(p, 'title');
      return `${title ? `«${title}»` : `La sección ${num(p, 'index')}`} no es XHTML estricto: se conserva sin transformar en el EPUB.`;
    },
    EXPORT_NO_BODY: (p: P) => {
      const title = str(p, 'title');
      return `${title ? `«${title}»` : `La sección ${num(p, 'index')}`} no tiene <body>: se conserva sin transformar.`;
    },
    PDF_CHARS_REPLACED: (p: P) =>
      `${num(p, 'count')} carácter(es) sin equivalente en la fuente estándar se han sustituido por «?».`,
  } as Record<WarningCode, (p: P) => string>,
};

export type Dict = typeof es;

const en: Dict = {
  htmlLang: 'en',
  skipToContent: 'Skip to content',
  advertisement: 'Advertisement',
  adDevPlaceholder: 'Development ad space. Not shown in production. Set VITE_ADSENSE_CLIENT and VITE_ADSENSE_SLOT.',

  language: { label: 'Language', switchLabel: 'Español', switchAria: 'Leer este sitio en español' },

  nav: {
    aria: 'Main',
    home: 'Convert',
    'guide-what': 'What is it?',
    'guide-epub': 'EPUB',
    'guide-pdf': 'PDF',
    account: 'My account',
    accountPremium: 'My account · Premium',
    premium: 'Premium',
  },

  footer: {
    tagline: 'A reading personalization tool. Your documents are processed on your device.',
    legalTitle: 'Legal',
    legalAria: 'Legal',
    privacy: 'Privacy policy',
    cookies: 'Cookie policy',
    terms: 'Terms of use',
    legal: 'Legal notice',
    cookiePrefs: 'Cookie preferences',
    guidesTitle: 'Guides',
    guidesAria: 'Guides',
    guideLinks: {
      'guide-epub': 'Convert EPUB',
      'guide-pdf': 'Convert PDF',
      'guide-typography': 'Customize typography',
      'guide-accessibility': 'Accessibility tools',
      'guide-ocr': 'Scanned PDFs and OCR',
      'guide-troubleshoot': 'Troubleshooting',
    },
    copyright: (year: number, brand: string) =>
      `© ${year} ${brand}. Bionic-style reading is a visual personalization tool and has no medical purpose. Bionic Reading® is a trademark of its owners; this site is not affiliated with them.`,
  },

  cookies: {
    title: 'Your privacy, your choice',
    text: 'Your documents never leave your device. Analytics and advertising only load if you accept them.',
    more: 'More information',
    choose: 'Choose by category',
    hide: 'Hide options',
    legend: 'Optional cookies',
    analytics: 'Anonymous analytics',
    ads: 'Advertising (Google AdSense)',
    reject: 'Reject optional',
    save: 'Save my choice',
    accept: 'Accept all',
  },

  dropzone: {
    title: 'Drag your EPUB or PDF here',
    hint: 'or click to choose a file from your device',
    chip: (mb: number) => `EPUB or PDF with selectable text · up to ${mb}\u00a0MB`,
    aria: 'Select an EPUB or PDF document',
  },

  steps: {
    aria: 'Steps',
    done: '(completed)',
    labels: ['Import', 'Extract', 'Bionic reading', 'Customize', 'Export'],
  },

  settings: {
    bionicTitle: 'Bold the start of words',
    bionicHint: 'Highlights the beginning of each word',
    bionicAria: 'Turn bionic bolding on or off',
    intensity: 'Intensity',
    intensityOptions: { suave: 'Soft', media: 'Medium', alta: 'High' },
    boldRatio: 'Letters in bold',
    boldRatioNote: 'Share of each word shown in bold. Words of 1 to 3 letters only bold the first letter.',
    fontFamily: 'Typeface',
    fontSize: 'Font size',
    lineHeight: 'Line height',
    letterSpacing: 'Letter spacing',
    width: 'Reading width',
    widthOptions: { estrecho: 'Narrow', medio: 'Medium', ancho: 'Wide' },
    theme: 'Theme and contrast',
    themeOptions: { claro: 'Light', sepia: 'Sepia', oscuro: 'Dark' },
    reset: 'Reset settings',
  },

  converter: {
    privacyTitle: 'Your document never leaves your device',
    privacyBody:
      'The file is processed in your browser. We do not upload it to any server or store it. Only your visual settings are remembered.',
    ocrNote: 'Have a scanned PDF? It needs OCR before it can be converted; we will tell you if that happens.',
    ocrLink: 'More about PDFs',
    readingTitle: 'Reading the document…',
    readingBody: (size: string) => `We are extracting the text on your device (${size}). Large documents can take a few seconds.`,
    preparing: 'Getting ready…',
    cancel: 'Cancel',
    progress: 'Progress',
    stage: {
      'pdf-page': 'Reading page',
      'pdf-images': 'Finding images on page',
      'epub-chapter': 'Reading chapter',
      'epub-transform': 'Transforming chapter',
      'pdf-build': 'Building PDF',
    },
    progressOf: (stage: string, done: number, total: number) => `${stage} ${done} of ${total}`,
    errorTitle: 'This document could not be converted',
    codeLabel: 'Code',
    restart: 'Start over',
    summary: (noun: string, size: string, count: number, kind: 'epub' | 'pdf') =>
      `${noun} · ${size} · ${count} ${kind === 'epub' ? 'sections' : 'pages with text'}`,
    changeDocument: 'Change document',
    previous: 'Previous section',
    next: 'Next section',
    chooseSection: 'Choose section',
    sectionFallback: (n: number) => `Section ${n}`,
    pdfPage: (n: number) => `Page ${n}`,
    previewTitle: (title: string) => `Preview: ${title}`,
    noText: 'This document has no text to show.',
    warningsTitle: 'Notes about the result',
    settingsTitle: 'Customize reading',
    settingsAria: 'Customize and export',
    downloadTitle: 'Download',
    downloadEpub:
      'Creates an EPUB with the transformed text. It keeps chapters, images and the original structure, and includes the typography you chose.',
    downloadPdf:
      'Creates a PDF reformatted from the extracted text. It is a reconstruction: it is not an identical copy of the original.',
    exportErrorTitle: 'The file could not be created',
    generating: 'Creating file…',
    download: (noun: string) => `Download transformed ${noun}`,
    doneTitle: 'Download started',
  },

  home: {
    eyebrow: 'Reading personalization',
    h1: 'PDF/EPUB to Bionic Reading Converter',
    intro:
      'Turn a book or any document with text into bionic-style reading, tune the typography to your taste, check the preview and download the result. No sign-up.',
    introLink: 'What is bionic reading?',
    exampleCaption: 'Illustrative example',
    example: [
      ['Rea', 'ding a '],
      ['par', 'agraph with '],
      ['bo', 'ld at the '],
      ['st', 'art of '],
      ['ea', 'ch '],
      ['wo', 'rd, '],
      ['with', 'out changing the text.'],
    ],
    howTitle: 'How it works',
    steps: [
      { title: 'Import', text: 'Drag an EPUB or a PDF with text, or choose one from your device.' },
      { title: 'Extract', text: 'We read chapters, headings and paragraphs. If a PDF has no text, we tell you.' },
      { title: 'Customize', text: 'Pick the bold amount, contrast, typeface, line height and theme.' },
      { title: 'Download', text: 'Get a transformed EPUB or PDF, ready to read wherever you prefer.' },
    ],
    featuresTitle: 'What you can do',
    features: [
      'EPUB with chapters, links, lists, emphasis and images.',
      'PDF reformatted from its text, with headings and paragraphs.',
      'Adjustable bold and a real-time preview.',
      'Typography, line height, width and a light, sepia or dark theme.',
      'No sign-up to convert and download.',
      'Your document is processed in your browser: it is never uploaded to a server.',
    ],
    pdfNote:
      'For PDFs, the result is a reconstruction from the text and embedded images: columns, tables, vector graphics, footnotes and formulas may not be preserved.',
    pdfNoteLink: 'How PDFs work',
    faqTitle: 'Frequently asked questions',
    privacyTitle: 'Your privacy',
    privacyBody:
      'We process your files in your browser. We only store your reading settings on this device. Ads and analytics require your consent.',
    privacyLink: 'Read the privacy policy',
    premiumTitle: 'Premium: no ads',
    premiumBody: (price: string) => `All the free features, with no advertising in the app. ${price}, cancel anytime.`,
    premiumLink: 'See Premium',
  },

  guide: {
    updated: 'Last updated',
    toc: 'In this guide',
    faq: 'Frequently asked questions',
    tryIt: 'Try it with your own document. No sign-up needed.',
    others: 'More guides',
  },
  legal: { updated: 'Last reviewed' },
  notFound: {
    title: 'Page not found',
    description: 'The page you are looking for does not exist.',
    body: 'The address does not exist or has moved.',
    home: 'Back to home',
  },

  errors: {
    UNSUPPORTED_TYPE: () => 'The file is not a valid EPUB or PDF. Check that it is the right document.',
    FILE_TOO_LARGE: (p: P, nl: string) =>
      `The file exceeds the maximum allowed size (your file is ${formatBytes(num(p, 'sizeBytes'), nl)} and the limit is ${formatBytes(num(p, 'maxBytes'), nl)}).`,
    EMPTY_FILE: () => 'The file is empty.',
    EPUB_INVALID: () => 'The EPUB could not be read. It may be damaged or have a non-standard structure.',
    EPUB_PROTECTED: () => 'This EPUB is protected (DRM or encryption) and cannot be transformed.',
    EPUB_NO_CONTENT: () => 'The EPUB has no chapters with text to transform.',
    PDF_DAMAGED: () => 'The PDF is damaged or cannot be opened.',
    PDF_PROTECTED: () => 'The PDF is password-protected. Unlock it before uploading.',
    PDF_NO_TEXT: () =>
      'This PDF has no selectable text: it looks like a scan or an image. It needs OCR before it can be transformed. No result was generated.',
    EXPORT_FAILED: () => 'The transformed file could not be created. Please try again.',
    EXPORT_VERIFY_FAILED: () => 'The generated file did not pass the integrity check, so it was not downloaded.',
    RESOURCE_LIMIT: () =>
      'The document is too large or complex to process on this device. Try a smaller file or close other tabs.',
    CANCELLED: () => 'Operation cancelled.',
    UNKNOWN: () => 'An unexpected error occurred while processing the document.',
  },

  warnings: {
    PDF_ORDER: () =>
      'The reconstruction follows the order of the text in the PDF. Columns, tables, footnotes and formulas may not be preserved. It is not an identical copy of the original.',
    PDF_FEW_TEXT_PAGES: (p: P) =>
      `Only ${num(p, 'withText')} of ${num(p, 'total')} pages contain selectable text. Scanned pages were skipped and would need OCR.`,
    PDF_DECODING: () => 'Some characters could not be decoded (embedded fonts). Please review the result.',
    PDF_TRUNCATED: (p: P) => `The PDF has ${num(p, 'pages')} pages; only the first ${num(p, 'max')} were processed.`,
    PDF_IMAGES_SKIPPED: (p: P) =>
      `${num(p, 'count')} image(s) could not be included (size or count limit, or they could not be drawn). The text is not affected.`,
    EPUB_UNREADABLE_CHAPTER: (p: P) => `A chapter (${str(p, 'path')}) could not be read and was skipped.`,
    EPUB_NO_BODY: (p: P) => `A chapter (${str(p, 'path')}) has no readable content.`,
    EPUB_EMPTY_SECTIONS: (p: P) => `${num(p, 'count')} section(s) without text (covers, images) were left out of the preview.`,
    EPUB_IMAGES_OMITTED: (p: P) =>
      `${num(p, 'count')} image(s) are not shown in the preview because of their size or format. They are kept in the downloaded EPUB.`,
    EPUB_PREVIOUSLY_CONVERTED: () =>
      'This EPUB had already been converted. The previous bolding was removed to apply your current settings.',
    EXPORT_NOT_STRICT_XHTML: (p: P) => {
      const title = str(p, 'title');
      return `${title ? `“${title}”` : `Section ${num(p, 'index')}`} is not strict XHTML: it is kept untransformed in the EPUB.`;
    },
    EXPORT_NO_BODY: (p: P) => {
      const title = str(p, 'title');
      return `${title ? `“${title}”` : `Section ${num(p, 'index')}`} has no <body>: it is kept untransformed.`;
    },
    PDF_CHARS_REPLACED: (p: P) =>
      `${num(p, 'count')} character(s) with no equivalent in the standard font were replaced with “?”.`,
  },
};

export const DICT: Record<Locale, Dict> = { es, en };

export function numberLocaleFor(locale: Locale): string {
  return NUMBER_LOCALE[locale];
}
