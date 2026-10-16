// Guías de contenido para búsquedas informativas. Cada una responde una duda
// concreta y describe lo que la herramienta hace de verdad, incluidos sus
// límites. Sin afirmaciones clínicas ni cifras de eficacia no demostradas.
//
// Los valores que dependen de la configuración (tamaño máximo) se leen de
// config para que el texto no se desincronice del comportamiento real.

import { config } from '../lib/state/config';
import type { Locale } from '../i18n/locale';
import { GUIDES_EN } from './seo-pages.en';

export interface SeoSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
  /** Lista numerada (pasos) en vez de viñetas. */
  ordered?: boolean;
}

export interface SeoPage {
  /** Identificador estable de la ruta (src/content/routes.json). */
  id: string;
  h1: string;
  intro: string;
  updated: string;
  sections: SeoSection[];
  faq?: Array<{ q: string; a: string }>;
  cta: { label: string };
}

const UPDATED = '16 de octubre de 2026';
const MAX_MB = config.maxFileMb;

const GUIDES_ES: SeoPage[] = [
  {
    id: 'guide-what',
    h1: '¿Qué es la lectura biónica?',
    intro:
      'La lectura biónica es una forma de presentar un texto en la que el comienzo de cada palabra se muestra en negrita y el resto con menos peso o contraste. La idea es ofrecer puntos de anclaje visual para que la mirada avance por la línea. Es una opción de formato: no es un tratamiento ni un método terapéutico.',
    updated: UPDATED,
    sections: [
      {
        heading: 'De dónde viene',
        paragraphs: [
          'El formato se difundió hacia 2022 con una aplicación de lectura creada por el diseñador suizo Renato Casutt, y se hizo popular porque permitía convertir cualquier texto a este estilo. «Bionic Reading» es una marca registrada de sus titulares. Esta web no está afiliada a ellos y usa «lectura biónica» como término descriptivo del formato.',
        ],
      },
      {
        heading: 'Cómo funciona en esta herramienta',
        paragraphs: [
          'Para cada palabra, las primeras letras se muestran en negrita y el resto en un tono más suave. Las reglas son sencillas y puedes ajustarlas:',
        ],
        list: [
          'Palabras de 1 a 3 letras: se resalta solo la primera letra (en «de», la «d»; en «las», la «l»).',
          'Palabras más largas: se resalta el porcentaje que elijas, entre el 20 % y el 80 % de las letras (50 % por defecto), redondeado hacia arriba. Con el 50 %, en «lectura» se resaltan «lect» y en «canción», «canc».',
          'La intensidad (suave, media o alta) regula cuánto se atenúa el resto de cada palabra: a más intensidad, más contraste entre el inicio y el final.',
          'Las tildes, la ñ, los números, la puntuación y los enlaces no se tocan.',
        ],
      },
      {
        heading: 'El texto no cambia',
        paragraphs: [
          'La conversión solo modifica la presentación. Las palabras, el orden y la puntuación son exactamente los del original. En los EPUB, antes de ofrecerte la descarga se comprueba que el texto de cada capítulo es idéntico al de origen; si no lo fuera, no se genera el archivo.',
        ],
      },
      {
        heading: 'Qué puedes esperar',
        paragraphs: [
          'Es una opción de personalización: algunas personas lo encuentran más cómodo, menos denso o más fácil de retomar tras una distracción, y otras no notan diferencia o lo ven como un estorbo.',
          'Los estudios publicados hasta ahora no han mostrado de forma consistente mejoras en la velocidad o la comprensión, y la experiencia varía de una persona a otra. Por eso lo mejor es probarlo con tus propios textos, ajustarlo o desactivarlo cuando quieras y quedarte con lo que te resulte útil.',
        ],
      },
      {
        heading: 'Qué no es',
        paragraphs: ['Para evitar malentendidos:'],
        list: [
          'No es un tratamiento para el TDAH, la dislexia ni ninguna otra condición.',
          'No sustituye una evaluación ni los apoyos que pueda recomendar un profesional.',
          'No garantiza leer más rápido ni entender más.',
          'No altera el contenido de tus documentos.',
        ],
      },
      {
        heading: 'Cómo probarla con criterio',
        paragraphs: ['Si quieres saber si te sirve, un ejercicio sencillo de unos minutos es más fiable que una primera impresión:'],
        ordered: true,
        list: [
          'Elige un fragmento de un texto que sueles leer, de unos cinco minutos.',
          'Léelo primero con la lectura biónica desactivada (interruptor «Negrita bionica»).',
          'Léelo después con ella activada, con la intensidad media y el 50 % de letras.',
          'Fíjate en cómo te sientes: esfuerzo, comodidad y ganas de seguir leyendo. No te midas la velocidad: no es el objetivo.',
          'Prueba otras combinaciones. Una negrita excesiva suele resultar cansada; a muchas personas les va mejor una intensidad suave.',
          'Quédate con lo que te resulte cómodo. Si ninguna opción te ayuda, puedes no usarla: es una herramienta, no una obligación.',
        ],
      },
      {
        heading: 'Cuándo puede no convenir',
        paragraphs: [
          'El formato aporta poco en textos que no son prosa continua, como tablas, código, fórmulas o listas de datos, y puede distraer si el resalte compite con otros elementos de la página. Si notas que te cansa o te hace releer, desactívalo.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Sirve para el TDAH?',
        a: 'No hay evidencia sólida de que mejore la lectura de forma general en personas con TDAH. Algunas personas cuentan que les resulta más cómoda y otras no notan diferencia. Si la lectura te resulta difícil de forma persistente, consulta con un profesional.',
      },
      {
        q: '¿Y para la dislexia?',
        a: 'Tampoco hay pruebas sólidas. Para algunas personas ayudan más otros ajustes, como un interlineado mayor, más espaciado entre letras, un ancho de línea moderado o un fondo menos brillante. Los tienes explicados en la guía de personalización tipográfica.',
      },
      {
        q: '¿Por qué parte de cada palabra aparece en gris?',
        a: 'Es el contraste que regula la intensidad. Al atenuar el resto de la palabra, el inicio destaca más. Si no te gusta, baja la intensidad o desactiva la negrita.',
      },
    ],
    cta: { label: 'Probar con mi documento' },
  },
  {
    id: 'guide-epub',
    h1: 'Convertir un EPUB a lectura biónica',
    intro:
      'Puedes transformar un EPUB a lectura biónica y descargar un EPUB nuevo con el mismo contenido y el inicio de cada palabra resaltado. La transformación se hace en tu navegador: el libro no se sube a ningún servidor.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Por qué el EPUB es el mejor formato para esto',
        paragraphs: [
          'Un EPUB es un libro electrónico «adaptable»: el texto se reajusta al tamaño de tu pantalla y tu lector te deja cambiar la letra y el interlineado. Por dentro es un archivo comprimido con los capítulos en XHTML, las imágenes, las hojas de estilo y un índice. Esa estructura permite aplicar el formato capítulo a capítulo sin tocar el texto ni perder la organización del libro.',
          'Si tienes el mismo libro en EPUB y en PDF, el EPUB dará un resultado mucho mejor.',
        ],
      },
      {
        heading: 'Paso a paso',
        paragraphs: [],
        ordered: true,
        list: [
          'En la página principal, arrastra tu EPUB a la zona de carga o pulsa para elegirlo.',
          `La herramienta comprueba que es un EPUB válido y que no supera los ${MAX_MB} MB. Verás el progreso y puedes cancelar.`,
          'Revisa la vista previa. Con el selector puedes saltar de capítulo a capítulo.',
          'Ajusta la lectura: porcentaje de letras en negrita, intensidad, tipo de letra, tamaño, interlineado, espaciado, ancho y tema. Los cambios se ven al instante.',
          'Pulsa «Descargar EPUB transformado». El archivo se llamará como el original con «-lectura-bionica» al final.',
          'Cópialo a tu lector o a tu aplicación de lectura, como harías con cualquier otro libro.',
        ],
      },
      {
        heading: 'Qué se conserva del libro',
        paragraphs: ['El EPUB descargado es el tuyo con el formato aplicado. En concreto:'],
        list: [
          'El orden de lectura, los capítulos y los títulos.',
          'Párrafos, listas, enlaces, énfasis y estructura semántica.',
          'Las imágenes incrustadas, tal cual (no se recomprimen ni se modifican).',
          'Los metadatos, el índice, las fuentes y las hojas de estilo originales.',
          'La tipografía que elegiste se añade como una hoja de estilo adicional, sin sustituir las del libro.',
        ],
      },
      {
        heading: 'Qué no se puede hacer',
        paragraphs: [],
        list: [
          'Libros con DRM o contenido cifrado: la herramienta los detecta y los rechaza. No elimina protecciones.',
          'Capítulos que no sean XHTML estricto: se conservan sin transformar y se te avisa de cuáles son.',
          'Libros en maquetación fija (cómics, álbumes ilustrados): contienen sobre todo imágenes y no hay texto que transformar.',
          'En la vista previa, las fotos muy grandes se reducen para que la página vaya fluida y las portadas en SVG se muestran como imagen; el archivo descargado conserva las originales.',
          `Archivos de más de ${MAX_MB} MB.`,
        ],
      },
      {
        heading: 'Cómo se comprueba que el libro queda bien',
        paragraphs: [
          'Después de generar el EPUB, la herramienta lo vuelve a abrir y verifica tres cosas: que el contenedor es válido y mantiene su estructura, que cada capítulo transformado es XML correcto y que el texto de cada capítulo es idéntico al original. Si cualquiera de esas comprobaciones falla, no se ofrece la descarga y verás un mensaje con el motivo.',
          'Por seguridad, cualquier script incrustado en el libro se elimina del resultado: un EPUB no necesita ejecutar código para leerse.',
        ],
      },
      {
        heading: 'Dónde abrir el resultado',
        paragraphs: [
          'El archivo es un EPUB estándar y debería abrirse en los lectores habituales, como Apple Books, Kobo o Google Play Books, y en aplicaciones de lectura de Android y de ordenador. Amazon también admite EPUB mediante «Enviar a Kindle»; cómo se muestre dependerá de tu dispositivo.',
          'Hay un matiz: algunos lectores antiguos o muy básicos ignoran la atenuación del contraste y solo muestran la negrita. Si te pasa, funciona igual; simplemente no verás la parte en gris.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Conservo mis subrayados y marcadores?',
        a: 'Las anotaciones suelen guardarse en tu lector, no en el archivo. Para el lector, el EPUB convertido es un libro distinto, así que empezará sin ellas. Si te importan, conserva también el original.',
      },
      {
        q: '¿Puedo convertir un EPUB que ya convertí?',
        a: 'Sí. La herramienta detecta la negrita anterior, la quita y aplica tus ajustes actuales, y te avisa de que el libro ya se había convertido.',
      },
      {
        q: '¿Puedo convertir libros comprados?',
        a: 'Si no tienen DRM, sí, para tu uso personal. Respeta siempre los derechos de autor y los términos de la tienda donde los compraste.',
      },
    ],
    cta: { label: 'Convertir un EPUB' },
  },
  {
    id: 'guide-pdf',
    h1: 'Convertir un PDF a lectura biónica',
    intro:
      'Si tu PDF contiene texto seleccionable, puedes reformatearlo en lectura biónica y descargar un PDF nuevo. El resultado es una reconstrucción a partir del texto, no una copia idéntica del original, y conviene saber qué se conserva y qué no.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Por qué un PDF es distinto de un EPUB',
        paragraphs: [
          'Un PDF no guarda párrafos ni capítulos: guarda dónde se coloca cada fragmento de texto en cada página, para que se vea igual en cualquier dispositivo. Eso es perfecto para imprimir, pero significa que, para aplicar un formato nuevo, primero hay que reconstruir el texto a partir de las posiciones.',
        ],
      },
      {
        heading: 'Cómo se reconstruye el texto',
        paragraphs: ['La herramienta recorre el documento página a página y sigue estos pasos:'],
        ordered: true,
        list: [
          'Extrae los fragmentos de texto con su posición y su tamaño.',
          'Los agrupa en líneas según su altura en la página.',
          'Une las líneas en párrafos cuando la separación vertical es la habitual y abre uno nuevo cuando hay un espacio mayor.',
          'Detecta títulos por su tamaño de letra y elementos de lista por sus viñetas o numeración.',
          'Recompone las palabras partidas con guion al final de línea.',
          'Descarta los números de página sueltos.',
        ],
      },
      {
        heading: 'Qué funciona bien y qué no',
        paragraphs: ['El resultado depende mucho del tipo de documento:'],
        list: [
          'Funciona bien con documentos de una sola columna: novelas, ensayos, artículos y documentos exportados desde un procesador de textos.',
          'Funciona peor con dos o más columnas, tablas, notas al pie, fórmulas, formularios, presentaciones y publicaciones muy maquetadas, donde el orden de lectura puede no ser el correcto.',
          'Se incluyen las imágenes incrustadas (fotos, ilustraciones, figuras) en su posición entre los párrafos, rasterizadas y reducidas si son muy grandes. No se conservan los gráficos vectoriales (dibujados con trazos), los enlaces ni los escaneos que funcionan como fondo de la página.',
        ],
      },
      {
        heading: 'Cómo es el PDF que descargas',
        paragraphs: [],
        list: [
          'Tamaño A4, con título y número de página en el pie.',
          'Tipografía estándar de PDF (Helvetica, Times o Courier, según la familia que elijas) con tu tamaño y tu interlineado.',
          'Fondo blanco siempre, pensado para imprimir; el tema oscuro o sepia solo se aplica a la vista previa.',
          'El espaciado entre letras no se aplica en el PDF.',
          'Los caracteres fuera del alfabeto latino ampliado (por ejemplo, cirílico o chino) no pueden representarse con esas tipografías: se sustituyen por «?» y la herramienta te lo indica. Con los EPUB esto no ocurre.',
        ],
      },
      {
        heading: 'Cómo saber si tu PDF tiene texto',
        paragraphs: [
          'Ábrelo y prueba a seleccionar una palabra con el ratón o con el dedo. Si se resalta solo esa palabra, hay texto. Si no se selecciona nada, o se marca la página entera como si fuera una imagen, es un escaneo. También puedes buscar una palabra con Cmd/Ctrl + F.',
          'Si es un escaneo, la herramienta te lo dirá en lugar de generar un resultado vacío. En la guía sobre PDF escaneados explicamos qué hacer.',
        ],
      },
      {
        heading: 'Límites',
        paragraphs: [],
        list: [
          `Tamaño máximo de ${MAX_MB} MB por archivo.`,
          'Hasta 2.000 páginas; si el documento tiene más, se procesan las primeras 2.000 y se te avisa.',
          'No admite PDF protegidos con contraseña ni dañados.',
        ],
      },
      {
        heading: 'Consejos para un mejor resultado',
        paragraphs: [],
        list: [
          'Si tienes el documento original en Word, Docs o EPUB, conviértelo desde ahí: es más fiable que partir de un PDF.',
          'Revisa la vista previa antes de descargar, sobre todo si el documento tiene columnas o tablas.',
          'Si el orden de lectura sale mal, no hay ajuste que lo arregle: el PDF no contiene esa información.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Por qué pesa distinto que el original?',
        a: 'Porque se genera desde cero a partir del texto y de las imágenes incrustadas, sin la estructura interna del original. Puede pesar bastante menos o, con muchas páginas de texto o imágenes, algo más.',
      },
      {
        q: '¿Se pierden los enlaces del PDF?',
        a: 'Sí. Se extrae el texto y las imágenes incrustadas: los enlaces y los marcadores del PDF original no se conservan.',
      },
    ],
    cta: { label: 'Convertir un PDF' },
  },
  {
    id: 'guide-typography',
    h1: 'Personalizar la tipografía para leer mejor',
    intro:
      'Cambiar el tamaño, el tipo de letra y el espaciado puede hacer que un texto sea más cómodo de leer. Lo que funciona depende de cada persona, de la pantalla y de la luz, así que esta guía propone puntos de partida y una forma de encontrar los tuyos.',
    updated: UPDATED,
    sections: [
      {
        heading: 'No hay una configuración universal',
        paragraphs: [
          'Lo que resulta cómodo cambia con la persona, el dispositivo, la distancia, la iluminación y el tipo de texto. Por eso conviene tratar cualquier cifra como un punto de partida y ajustar a partir de ahí. Los cambios se ven al instante en la vista previa, y tus ajustes se recuerdan en tu navegador.',
        ],
      },
      {
        heading: 'Tamaño de letra',
        paragraphs: [
          'El tamaño por defecto es de 18 px, que suele ser cómodo en una pantalla a distancia normal. Súbelo si entrecierras los ojos o te acercas a la pantalla, y bájalo si tienes que mover la vista constantemente. Un tamaño excesivo también cansa, porque obliga a cambiar de línea más a menudo.',
        ],
      },
      {
        heading: 'Interlineado',
        paragraphs: [
          'Un interlineado entre 1,5 y 1,8 es un punto de partida habitual para textos largos. Más espacio entre líneas facilita no perderse al saltar de una a la siguiente; demasiado hace que el párrafo parezca disperso.',
          'Las pautas de accesibilidad web WCAG 2.1 (criterio 1.4.12) establecen que el contenido debe seguir siendo legible cuando el usuario aplica un interlineado de al menos 1,5 veces el tamaño de la letra, y la herramienta lo permite sobradamente.',
        ],
      },
      {
        heading: 'Espaciado entre letras',
        paragraphs: [
          'Un poco de espacio extra entre letras (de 0,01 a 0,05 em) puede aliviar la sensación de texto apretado. Más allá de eso, las palabras empiezan a deshacerse y se lee peor. Las mismas pautas WCAG plantean que el texto aguante hasta 0,12 em, pero eso es un margen de tolerancia, no un valor recomendado.',
        ],
      },
      {
        heading: 'Ancho de la línea',
        paragraphs: [
          'En tipografía suele citarse un rango de entre 45 y 75 caracteres por línea como cómodo. Líneas muy largas obligan a recorrer demasiado con la vista y a veces uno se pierde al volver al principio; líneas muy cortas fragmentan el texto. La herramienta ofrece tres anchos: estrecho (unos 45 caracteres), medio (unos 66) y ancho (unos 90).',
        ],
      },
      {
        heading: 'Familia tipográfica',
        paragraphs: [
          'Hay tres opciones: sans-serif (sin remates), serif (con remates) y monoespaciada. No existe un consenso científico claro sobre cuál es mejor para todos: lo más fiable es elegir la que te resulte familiar y cómoda. La monoespaciada, con letras de ancho constante, es útil para código y resulta menos natural en lecturas largas.',
          'Las tipografías son las del sistema, así que el aspecto exacto depende de tu dispositivo.',
        ],
      },
      {
        heading: 'Contraste y tema',
        paragraphs: [
          'Texto negro sobre fondo blanco puro es muy contrastado y a algunas personas les deslumbra, sobre todo con mucha luz o durante mucho rato. El tema sepia lo suaviza, y el oscuro suele ser más cómodo con poca luz. Más contraste no siempre es mejor: busca el nivel con el que puedas leer sin esfuerzo ni molestias.',
        ],
      },
      {
        heading: 'Cómo encontrar tu configuración',
        paragraphs: [],
        ordered: true,
        list: [
          'Carga un texto que leas habitualmente.',
          'Empieza con los valores por defecto.',
          'Cambia un solo ajuste cada vez, para saber qué efecto tiene.',
          'Lee unos cinco minutos con cada cambio antes de decidir.',
          'Anota lo que te resulte mejor y vuelve a revisarlo en otras condiciones, de día y de noche.',
          'Si te pierdes, el botón «Restablecer ajustes» te devuelve a los valores iniciales.',
        ],
      },
      {
        heading: 'Qué se aplica al exportar',
        paragraphs: [],
        list: [
          'En un EPUB, tu tipografía se añade como una hoja de estilo, sin sustituir las del libro. El tema (claro, sepia u oscuro) no se impone, para respetar el modo de tu lector.',
          'En un PDF se aplican la familia, el tamaño y el interlineado; el fondo siempre es blanco y el espaciado entre letras no se aplica.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Qué tipografía es mejor para la dislexia?',
        a: 'No hay una tipografía demostradamente mejor para todas las personas con dislexia. A algunas les ayuda una sans-serif con buen espaciado y un interlineado generoso; a otras, no. Prueba y quédate con lo que te funcione, y consulta a un profesional si lo necesitas.',
      },
      {
        q: '¿Se guardan mis ajustes?',
        a: 'Sí, en tu propio navegador y solo en tu dispositivo. No se envían a ningún servidor.',
      },
    ],
    cta: { label: 'Ajustar mi lectura' },
  },
  {
    id: 'guide-accessibility',
    h1: 'Herramientas de accesibilidad lectora',
    intro:
      'Leer cómodamente no depende de una única herramienta. Combinar el formato del documento, la tipografía, el contraste y, si te sirve, la lectura en voz alta permite adaptar cada texto a lo que necesitas en ese momento.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Por qué combinar varias',
        paragraphs: [
          'Cada herramienta resuelve una parte: el formato, el tamaño, el contraste, el ritmo o la forma de recibir el texto. Lo que a una persona le sirve a otra le estorba, así que lo razonable es probar cada opción por separado y quedarse con las que aportan algo.',
        ],
      },
      {
        heading: 'El formato del documento: EPUB o PDF',
        paragraphs: [
          'Un EPUB es adaptable: el texto se recoloca y puedes cambiar la letra, el interlineado y los márgenes. Un PDF tiene una maquetación fija: solo puedes ampliar. Si un libro está disponible en ambos formatos y quieres personalizar la lectura, el EPUB es casi siempre la mejor opción.',
        ],
      },
      {
        heading: 'Los ajustes de tu lector de libros',
        paragraphs: [
          'Aplicaciones como Apple Books, Kobo o Google Play Books permiten cambiar el tamaño y el tipo de letra y elegir entre varios temas; algunas incluyen también interlineado y márgenes. Conviene explorar esos menús antes de buscar otras soluciones, porque ya están ahí.',
        ],
      },
      {
        heading: 'Lectura en voz alta',
        paragraphs: [
          'Los sistemas operativos incluyen funciones para que el dispositivo lea el texto: «Contenido leído» y VoiceOver en iPhone, iPad y Mac, o «Seleccionar para escuchar» y TalkBack en Android, entre otras. Los nombres y la ubicación en los ajustes cambian según la versión. Es una alternativa útil para quien prefiere escuchar o quiere alternar entre leer y escuchar.',
        ],
      },
      {
        heading: 'Modo lectura del navegador',
        paragraphs: [
          'Safari, Firefox y Edge tienen un modo lectura que elimina menús y anuncios y permite cambiar la letra y el fondo de una página web. El Lector inmersivo de Edge añade además lectura en voz alta y enfoque por líneas.',
        ],
      },
      {
        heading: 'Contraste y modo oscuro',
        paragraphs: [
          'El modo oscuro o los filtros de color del sistema reducen el brillo y el deslumbramiento. En la herramienta, además, puedes elegir entre tema claro, sepia y oscuro en la vista previa.',
        ],
      },
      {
        heading: 'Lectura biónica: una opción más',
        paragraphs: [
          'La lectura biónica es una opción más dentro de este conjunto. No hay pruebas sólidas de que mejore la lectura de forma general, así que es mejor tratarla como una herramienta que se prueba y se descarta si no aporta.',
        ],
      },
      {
        heading: 'Cuándo buscar apoyo profesional',
        paragraphs: [
          'Si leer te resulta difícil de forma persistente, un profesional puede orientarte mejor que cualquier herramienta: optometría para la visión, psicopedagogía o logopedia para las dificultades de lectura, o tu médico de cabecera como primer paso. Estas herramientas son un complemento, no una sustitución.',
        ],
      },
      {
        heading: 'Privacidad al adaptar documentos',
        paragraphs: [
          'Muchos documentos son personales o de trabajo, y algunas herramientas en línea los suben a un servidor para procesarlos. Aquí, la conversión se hace en tu navegador. Puedes comprobarlo: abre las herramientas de desarrollo de tu navegador, entra en la pestaña de red y verás que el archivo no se envía a ninguna parte. Más detalles en la política de privacidad.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Es mejor leer o escuchar?',
        a: 'Depende de la persona y de la situación. Escuchar libera la vista y puede ayudar a quien se cansa leyendo, y leer permite ir a tu ritmo y volver atrás con facilidad. Muchas personas alternan.',
      },
      {
        q: '¿Estas herramientas son de pago?',
        a: 'Las funciones de sistema y de los navegadores que se citan vienen incluidas. La conversión de esta web es gratuita.',
      },
    ],
    cta: { label: 'Adaptar un documento' },
  },
  {
    id: 'guide-ocr',
    h1: 'PDF escaneado: cómo reconocerlo y qué hacer',
    intro:
      'Si al subir un PDF la herramienta te dice que no contiene texto seleccionable, lo más probable es que sea un escaneo: una imagen de cada página. Esta guía explica cómo comprobarlo y qué opciones tienes para convertirlo en un documento con texto.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Qué es un PDF escaneado',
        paragraphs: [
          'Cuando se escanea un libro o un papel, el resultado suele ser un PDF que contiene una fotografía de cada página. Para ti se ve como texto, pero para el ordenador es una imagen: no hay palabras que buscar, copiar ni transformar. Por eso la lectura biónica no puede aplicarse directamente.',
        ],
      },
      {
        heading: 'Cómo comprobar si tu PDF tiene texto',
        paragraphs: [],
        ordered: true,
        list: [
          'Ábrelo en tu lector de PDF habitual.',
          'Intenta seleccionar una palabra con el ratón o con el dedo.',
          'Si se resalta solo esa palabra, el documento tiene texto. Si no se selecciona nada, o se marca toda la página como un bloque, es una imagen.',
          'Prueba también a buscar una palabra con Cmd/Ctrl + F: si no encuentra nada que sabes que está, es un escaneo.',
        ],
      },
      {
        heading: 'Documentos mixtos',
        paragraphs: [
          'Algunos PDF mezclan páginas con texto y páginas escaneadas. En ese caso la herramienta procesa las que tienen texto y te avisa de cuántas páginas tenían contenido seleccionable; las demás se omiten.',
        ],
      },
      {
        heading: 'Qué es el OCR',
        paragraphs: [
          'OCR significa reconocimiento óptico de caracteres: un programa analiza la imagen de cada página e identifica las letras para generar texto real. Después del OCR, el PDF tiene una capa de texto seleccionable y ya puede usarse con la herramienta.',
        ],
      },
      {
        heading: 'Opciones para hacer OCR',
        paragraphs: ['Hay varias vías, con resultados y precios distintos. Ninguna es perfecta:'],
        list: [
          'Adobe Acrobat incluye una función de reconocimiento de texto, pero es de pago.',
          'OCRmyPDF es una herramienta gratuita y de código abierto, basada en Tesseract, que añade la capa de texto a un PDF escaneado. Se usa desde la línea de comandos.',
          'Algunas aplicaciones de escáner para móvil generan PDF con texto reconocido directamente al escanear.',
          'Google Drive puede reconocer el texto de imágenes y PDF escaneados al abrirlos con Documentos de Google. La calidad varía según el documento.',
        ],
      },
      {
        heading: 'Qué esperar del resultado',
        paragraphs: [
          'El OCR comete errores, sobre todo con tipografías antiguas, páginas manchadas, baja resolución o textos inclinados. Si el original está bien escaneado, el resultado suele ser razonable, pero conviene revisarlo. Algunas pautas ayudan: escanear a unos 300 puntos por pulgada, con la página recta y buen contraste.',
        ],
      },
      {
        heading: 'Después del OCR',
        paragraphs: [
          'Vuelve a subir el PDF resultante. Comprueba antes que ahora puedes seleccionar texto. Si el reconocimiento es defectuoso, la lectura biónica reproducirá esos errores, porque el texto que se transforma es el que el OCR haya generado.',
        ],
      },
      {
        heading: 'Una nota sobre derechos',
        paragraphs: [
          'Usa estas herramientas con documentos que tengas derecho a utilizar: materiales propios, de dominio público o con licencia que lo permita.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Por qué la herramienta no hace OCR?',
        a: 'Por ahora no lo incluye. Un OCR en el navegador exigiría cargar modelos de reconocimiento pesados y aun así necesita revisión humana, así que preferimos indicar claramente cuándo hace falta en lugar de prometer un resultado poco fiable.',
      },
      {
        q: '¿Puedo usar cualquier OCR?',
        a: 'Sí, siempre que el resultado sea un PDF con texto seleccionable. Cualquier herramienta que produzca ese archivo sirve.',
      },
    ],
    cta: { label: 'Probar con un PDF' },
  },
  {
    id: 'guide-troubleshoot',
    h1: 'Solución de problemas: por qué no se convierte mi documento',
    intro:
      'Cuando un documento no se puede convertir, la herramienta te muestra un mensaje y un código. Aquí tienes qué significa cada uno, por qué ocurre y qué puedes hacer.',
    updated: UPDATED,
    sections: [
      {
        heading: 'El archivo no es un EPUB ni un PDF válido (UNSUPPORTED_TYPE)',
        paragraphs: [
          'La herramienta identifica el tipo por su contenido, no por la extensión, así que renombrar un archivo no sirve. Formatos como MOBI, AZW3, DOCX o TXT no se admiten directamente. Puedes convertirlos antes a EPUB con una aplicación como Calibre, que es gratuita.',
        ],
      },
      {
        heading: 'El archivo está vacío (EMPTY_FILE)',
        paragraphs: ['El archivo pesa 0 bytes, normalmente porque la descarga se interrumpió. Vuelve a descargarlo o a copiarlo.'],
      },
      {
        heading: 'El archivo supera el tamaño máximo (FILE_TOO_LARGE)',
        paragraphs: [
          `El límite es de ${MAX_MB} MB por archivo, para que la conversión sea fiable en tu dispositivo. El mensaje te indica cuánto pesa el tuyo. En PDF, un optimizador o la función «reducir tamaño» de tu lector suele bastar; en EPUB, lo que más pesa son las imágenes.`,
        ],
      },
      {
        heading: 'No se pudo leer el EPUB (EPUB_INVALID)',
        paragraphs: [
          'El archivo está dañado o su estructura no es estándar. Vuelve a descargarlo y, si el problema persiste, ábrelo y guárdalo de nuevo con Calibre, que suele reparar estructuras defectuosas. Si quieres comprobarlo a fondo, existe la herramienta gratuita EPUBCheck.',
        ],
      },
      {
        heading: 'El EPUB está protegido (EPUB_PROTECTED)',
        paragraphs: [
          'El libro tiene DRM o contenido cifrado y no puede transformarse. La herramienta no elimina protecciones y no lo hará.',
        ],
      },
      {
        heading: 'El EPUB no contiene capítulos con texto (EPUB_NO_CONTENT)',
        paragraphs: [
          'Suele ocurrir con cómics, álbumes ilustrados o libros de maquetación fija, cuyas páginas son imágenes. No hay texto que transformar.',
        ],
      },
      {
        heading: 'El PDF está dañado (PDF_DAMAGED)',
        paragraphs: ['El archivo está incompleto o corrupto. Descárgalo de nuevo; si procede de un correo o de un servicio en la nube, comprueba que se haya bajado entero.'],
      },
      {
        heading: 'El PDF está protegido con contraseña (PDF_PROTECTED)',
        paragraphs: [
          'La herramienta no puede abrir documentos cifrados. Si conoces la contraseña, abre el PDF en tu lector y guárdalo sin protección, y vuelve a subirlo.',
        ],
      },
      {
        heading: 'El PDF no contiene texto seleccionable (PDF_NO_TEXT)',
        paragraphs: [
          'Es un escaneo o una imagen. Necesita pasar antes por un OCR. Te explicamos cómo comprobarlo y qué opciones tienes en la guía sobre PDF escaneados.',
        ],
      },
      {
        heading: 'Demasiado grande o complejo para este dispositivo (RESOURCE_LIMIT)',
        paragraphs: [
          'El navegador se quedó sin memoria. Cierra otras pestañas y aplicaciones, prueba con un documento más pequeño o divide el original en partes. En móviles con poca memoria este límite se alcanza antes.',
        ],
      },
      {
        heading: 'No se ha podido generar el archivo (EXPORT_FAILED o EXPORT_VERIFY_FAILED)',
        paragraphs: [
          'La conversión se hizo, pero el archivo de salida no superó la comprobación de integridad, y por eso no se descarga. Inténtalo de nuevo; si cambias algún ajuste, prueba con otros valores. Si el fallo se repite con un documento concreto, puedes escribirme a la dirección que figura en el aviso legal, indicando el código que ves en pantalla.',
        ],
      },
      {
        heading: 'La vista previa se ve rara',
        paragraphs: [
          'En PDF, las columnas, tablas o notas al pie pueden salir desordenadas, porque el archivo no guarda el orden de lectura. En EPUB, algunos estilos del libro (fondos, columnas o posiciones) no se muestran en la vista previa, aunque se conservan en el archivo descargado.',
        ],
      },
    ],
    faq: [
      {
        q: '¿La herramienta guarda mi documento si falla?',
        a: 'No. El documento se procesa en tu navegador y no se envía a ningún servidor, ni siquiera cuando hay un error.',
      },
    ],
    cta: { label: 'Probar de nuevo' },
  },
];

/** Guías por idioma. Cada guía tiene el mismo `id` en todos los idiomas. */
export const GUIDES: Record<Locale, SeoPage[]> = { es: GUIDES_ES, en: GUIDES_EN };
