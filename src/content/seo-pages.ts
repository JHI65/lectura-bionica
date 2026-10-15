// Páginas de contenido para búsquedas informativas. Cada una responde una
// intención concreta y evita afirmaciones clínicas o de eficacia no demostradas.

export interface SeoSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface SeoPage {
  path: string;
  h1: string;
  intro: string;
  sections: SeoSection[];
  cta: { label: string; to: string };
}

export const SEO_PAGES: SeoPage[] = [
  {
    path: '/convertir-epub-a-lectura-bionica',
    h1: 'Convertir un EPUB a lectura biónica',
    intro:
      'Puedes transformar un EPUB a lectura biónica y descargar un nuevo EPUB con el mismo contenido, pero con el inicio de cada palabra resaltado. La transformación se hace en tu navegador.',
    sections: [
      {
        heading: 'Qué se conserva del EPUB',
        paragraphs: [
          'La conversión trabaja capítulo a capítulo. Mantiene el orden de lectura, los títulos, los párrafos, las listas, los enlaces, el énfasis y las imágenes incrustadas en el libro. El resto del paquete (índice, metadatos, fuentes y hojas de estilo) se copia tal cual.',
          'El texto del libro no cambia: solo se aplica formato. Puedes comprobarlo buscando cualquier frase en el archivo descargado.',
        ],
      },
      {
        heading: 'Limitaciones que conviene conocer',
        paragraphs: [
          'Los EPUB con DRM o cifrado de contenido no se pueden transformar. Los capítulos con XHTML muy irregular pueden conservarse sin formato y la aplicación te lo indica.',
        ],
        list: [
          'Libros protegidos con DRM: no compatibles.',
          'Capítulos que no son XHTML estricto: se copian sin transformar y se avisa.',
          'Lectores muy antiguos pueden no mostrar bien algunos estilos.',
        ],
      },
    ],
    cta: { label: 'Convertir un EPUB', to: '/convertir' },
  },
  {
    path: '/convertir-pdf-a-lectura-bionica',
    h1: 'Convertir un PDF a lectura biónica',
    intro:
      'Si tu PDF contiene texto seleccionable, puedes reformatearlo en lectura biónica y descargar un PDF nuevo. El resultado es una reconstrucción, no una copia idéntica del original.',
    sections: [
      {
        heading: 'Cómo se reconstruye el PDF',
        paragraphs: [
          'Se extrae el texto de cada página respetando el orden de lectura aproximado y se agrupa en títulos, párrafos y listas. Después se genera un PDF nuevo con tipografía, interlineado y negrita bionica que tú eliges.',
          'Por eso el diseño original (columnas, tablas, imágenes, notas al pie y fórmulas) no se conserva. Si necesitas la maquetación exacta, usa el PDF original.',
        ],
      },
      {
        heading: 'PDF escaneados y OCR',
        paragraphs: [
          'Un PDF escaneado es una imagen de páginas sin texto seleccionable. La aplicación lo detecta y te avisa en lugar de generar un resultado vacío. Para transformarlo primero necesitas un OCR (reconocimiento de texto), que puedes hacer con tu lector de PDF o una herramienta de OCR.',
        ],
      },
    ],
    cta: { label: 'Convertir un PDF', to: '/convertir' },
  },
  {
    path: '/que-es-la-lectura-bionica',
    h1: '¿Qué es la lectura biónica?',
    intro:
      'La lectura biónica es una forma de presentar el texto en la que la primera parte de cada palabra aparece en negrita. Es una herramienta de personalización visual: no es un tratamiento ni un método diagnóstico.',
    sections: [
      {
        heading: 'Cómo funciona',
        paragraphs: [
          'Para cada palabra, las letras iniciales se muestran en negrita y el resto en un tono más suave. La puntuación, las tildes, la ñ y las palabras de otros idiomas se mantienen tal cual.',
          'La intensidad regula el contraste entre ambas partes: suave, media o alta. Puedes desactivar la negrita en cualquier momento y volver al texto normal.',
        ],
      },
      {
        heading: 'Qué puede y qué no puede prometer',
        paragraphs: [
          'Hay personas que encuentran el texto más fácil de seguir con este formato y otras que no notan diferencia. No está demostrado de forma general que mejore la comprensión lectora, y no debe usarse como sustituto de una evaluación o un tratamiento.',
          'Te recomendamos probarla con un fragmento de tu libro y quedarte con la configuración que te resulte cómoda.',
        ],
      },
    ],
    cta: { label: 'Probar con mi documento', to: '/convertir' },
  },
  {
    path: '/personalizar-tipografia-para-leer',
    h1: 'Personalizar la tipografía para leer mejor',
    intro:
      'Cambiar el tamaño, el tipo de letra y el espaciado puede hacer que un texto sea más cómodo de leer. Lo que funciona depende de cada persona, así que conviene probar y ajustar.',
    sections: [
      {
        heading: 'Ajustes que más influyen',
        paragraphs: [
          'El tamaño de letra y el interlineado suelen ser los primeros que notan los lectores. Un interlineado entre 1,5 y 1,8 es un punto de partida habitual en tipografía para textos largos.',
          'El ancho de línea también importa. Líneas muy largas obligan a los ojos a recorrer demasiado; líneas muy cortas fragmentan el texto. Un ancho medio suele ser un buen punto de partida.',
        ],
        list: [
          'Tamaño de letra: empieza en 18 px y sube si necesitas menos esfuerzo.',
          'Interlineado: entre 1,5 y 1,8 como punto de partida.',
          'Espaciado entre letras: una décima de em suele bastar; más puede romper palabras.',
          'Contraste: el modo sepia reduce el contraste frente al blanco puro.',
        ],
      },
      {
        heading: 'Cómo aplicarlo en la aplicación',
        paragraphs: [
          'Todos estos ajustes se ven al momento en la vista previa y se recuerdan en tu navegador. Si conviertes un EPUB, el libro descargado incluye tu tipografía elegida.',
        ],
      },
    ],
    cta: { label: 'Ajustar mi lectura', to: '/convertir' },
  },
  {
    path: '/herramientas-accesibilidad-lectora',
    h1: 'Herramientas de accesibilidad lectora',
    intro:
      'Leer cómodamente no depende de una única herramienta. Combinar formato, tipografía y contraste permite adaptar cada documento a lo que necesitas en ese momento.',
    sections: [
      {
        heading: 'Opciones habituales',
        paragraphs: [
          'Además de la lectura biónica, los lectores de EPUB y PDF suelen ofrecer texto de tamaño ajustable, modos de lectura con contraste alto, lectura en voz alta y desplazamiento continuo. Son complementarias: prueba cuáles te resultan útiles.',
        ],
        list: [
          'Lectura biónica personalizable (esta aplicación).',
          'Tipografía y espaciado ajustables.',
          'Temas de contraste: claro, sepia y oscuro.',
          'Lectura en voz alta del sistema operativo o del lector.',
        ],
      },
      {
        heading: 'Privacidad al adaptar documentos',
        paragraphs: [
          'Muchos documentos son personales o de trabajo. Esta aplicación procesa el archivo en tu navegador: no lo sube a un servidor, y solo se almacenan tus ajustes visuales. Consulta la política de privacidad para ver todos los datos que se tratan.',
        ],
      },
    ],
    cta: { label: 'Adaptar un documento', to: '/convertir' },
  },
];
