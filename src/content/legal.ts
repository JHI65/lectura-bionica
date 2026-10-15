// Textos legales. Los campos entre corchetes [COMPLETAR] deben rellenarse con
// los datos reales del titular antes de publicar. Ningún texto de aquí
// constituye por sí solo cumplimiento normativo: debe revisarse con asesoría.

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface LegalDocument {
  path: string;
  title: string;
  updated: string;
  sections: LegalSection[];
}

export const CONTROLLER = {
  name: '[COMPLETAR: nombre o razón social del titular]',
  id: '[COMPLETAR: NIF/CIF]',
  address: '[COMPLETAR: dirección postal]',
  email: '[COMPLETAR: correo de contacto de privacidad]',
};

const UPDATED = '[COMPLETAR: fecha de la última revisión]';

export const LEGAL_DOCS: LegalDocument[] = [
  {
    path: '/privacidad',
    title: 'Política de privacidad',
    updated: UPDATED,
    sections: [
      {
        heading: '1. Responsable del tratamiento',
        paragraphs: [
          `${CONTROLLER.name}, ${CONTROLLER.id}, ${CONTROLLER.address}. Contacto: ${CONTROLLER.email}.`,
        ],
      },
      {
        heading: '2. Tus documentos no se suben a nuestros servidores',
        paragraphs: [
          'Los EPUB y PDF que conviertes se leen y transforman en tu propio navegador. No se envían a ningún servidor, no se almacenan y no se incluyen en la analítica. Al cerrar la pestaña, el documento desaparece de la aplicación.',
        ],
      },
      {
        heading: '3. Datos que sí tratamos',
        paragraphs: ['Solo tratamos los datos necesarios para cada finalidad:'],
        list: [
          'Ajustes de lectura: se guardan en tu navegador (localStorage) para recordar tu configuración. No salen de tu dispositivo.',
          'Preferencias de cookies: se guardan en tu navegador para no volver a preguntarte.',
          'Cuenta (solo si te registras para Premium): correo electrónico y estado de tu suscripción, gestionados con Supabase.',
          'Pagos (solo Premium): los gestiona Stripe. Nosotros no almacenamos datos de tarjeta; recibimos el estado de la suscripción.',
          'Analítica (solo con tu consentimiento): eventos anónimos como visitas, inicio y fin de conversiones y tipo de formato. Nunca se envían contenido, nombres de archivo ni texto extraído.',
          'Publicidad (solo con tu consentimiento): Google AdSense puede tratar datos de cookies según tu elección.',
        ],
      },
      {
        heading: '4. Finalidades y bases jurídicas',
        paragraphs: [
          'Prestar el servicio de conversión (ejecución del servicio y ajustes que tú eliges), gestionar la cuenta y la suscripción Premium (ejecución del contrato), y medir el uso y mostrar publicidad solo con tu consentimiento (artículo 6.1.a RGPD).',
        ],
      },
      {
        heading: '5. Encargados y servicios externos',
        paragraphs: ['Servicios que pueden intervenir según la función que uses:'],
        list: [
          'Supabase: autenticación y base de datos de suscripciones (UE o región configurada por el titular).',
          'Stripe: cobro de la suscripción y portal de facturación.',
          'Google AdSense: anuncios, solo con consentimiento. Consulta la política de Google.',
          'Proveedor de alojamiento: [COMPLETAR] puede registrar direcciones IP en sus logs técnicos.',
        ],
      },
      {
        heading: '6. Conservación',
        paragraphs: [
          'Los ajustes permanecen en tu navegador hasta que los borres. Los datos de cuenta y suscripción se conservan mientras la cuenta esté activa y después el plazo legal que corresponda a la facturación.',
        ],
      },
      {
        heading: '7. Tus derechos',
        paragraphs: [
          `Puedes acceder, rectificar, suprimir, limitar u oponerte al tratamiento de tus datos y pedir su portabilidad escribiendo a ${CONTROLLER.email}. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).`,
        ],
      },
    ],
  },
  {
    path: '/cookies',
    title: 'Política de cookies',
    updated: UPDATED,
    sections: [
      {
        heading: 'Qué almacenamos',
        paragraphs: [
          'La aplicación utiliza almacenamiento local del navegador (localStorage) para:',
        ],
        list: [
          'lb:reading-settings:v1: tus ajustes de lectura (necesario).',
          'lb:consent:v1: tu elección sobre cookies opcionales (necesario).',
          'lb:visits: un contador local de visitas para detectar visitas recurrentes (solo si aceptas analítica).',
          'Sesión de Supabase: mantiene tu sesión si inicias sesión para Premium (necesario para esa función).',
        ],
      },
      {
        heading: 'Cookies de terceros',
        paragraphs: [
          'Google AdSense puede instalar cookies para mostrar anuncios. Solo se carga si aceptas la publicidad. Si la rechazas, los anuncios son no personalizados.',
        ],
      },
      {
        heading: 'Cómo cambiar tu elección',
        paragraphs: [
          'Puedes modificar tu consentimiento en cualquier momento con el enlace «Preferencias de cookies» del pie de página. También puedes borrar los datos del sitio desde la configuración de tu navegador.',
        ],
      },
    ],
  },
  {
    path: '/terminos',
    title: 'Condiciones de uso',
    updated: UPDATED,
    sections: [
      {
        heading: '1. Servicio',
        paragraphs: [
          'Lectura biónica permite transformar documentos EPUB y PDF con texto en un formato de lectura con negrita bionica personalizable. La conversión básica es gratuita y no requiere registro.',
        ],
      },
      {
        heading: '2. Uso adecuado',
        paragraphs: [
          'Debes tener derecho a usar los documentos que conviertes (por ejemplo, libros comprados o de dominio público). No está permitido usar el servicio para eludir protecciones técnicas de los documentos.',
        ],
      },
      {
        heading: '3. Limitaciones del resultado',
        paragraphs: [
          'La reconstrucción de PDF no es una copia idéntica del original y los documentos complejos pueden no conservar su maquetación. Los documentos protegidos o escaneados no se pueden transformar. La aplicación indica estos casos.',
          'La lectura biónica es una herramienta de personalización de la lectura y no tiene finalidad médica ni terapéutica.',
        ],
      },
      {
        heading: '4. Premium',
        paragraphs: [
          `La suscripción Premium cuesta ${'[COMPLETAR precio vigente]'} y elimina los anuncios. Se renueva automáticamente hasta que la canceles desde tu cuenta. Los pagos los gestiona Stripe. El derecho de desistimiento y el resto de condiciones de consumo se aplicarán según la normativa vigente: [COMPLETAR].`,
        ],
      },
      {
        heading: '5. Disponibilidad y responsabilidad',
        paragraphs: [
          'El servicio se ofrece tal cual y puede cambiar o interrumpirse. Recomendamos conservar siempre el documento original.',
        ],
      },
    ],
  },
  {
    path: '/aviso-legal',
    title: 'Aviso legal',
    updated: UPDATED,
    sections: [
      {
        heading: 'Titular del sitio',
        paragraphs: [
          `${CONTROLLER.name} · ${CONTROLLER.id} · ${CONTROLLER.address} · ${CONTROLLER.email}`,
        ],
      },
      {
        heading: 'Condiciones de acceso',
        paragraphs: [
          'El acceso al sitio es gratuito. El usuario se compromete a hacer un uso lícito del servicio. El titular puede modificar o retirar contenidos y funciones sin previo aviso.',
        ],
      },
      {
        heading: 'Propiedad intelectual',
        paragraphs: [
          'El diseño, código y textos del sitio son propiedad del titular o se utilizan con licencia. Los documentos que conviertes siguen siendo de su titular.',
        ],
      },
    ],
  },
];
