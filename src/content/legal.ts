// Textos legales. Ningún texto de aquí constituye por sí solo cumplimiento
// normativo: debe revisarse con asesoría. Los datos del titular están en
// CONTROLLER; los campos que falten se marcan [COMPLETAR].
//
// Los textos describen lo que la web hace de verdad: mientras Premium esté
// desactivado (VITE_PREMIUM_ENABLED), no se mencionan cuentas, Supabase ni Stripe.

import { config } from '../lib/state/config';

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
  name: 'Jaime Lillo Benito',
  id: 'NIF 50482704G',
  address: 'Calle Portillo 16, Valdemoro (Madrid)',
  email: 'jaimelillobenito@gmail.com',
};

const UPDATED = '15 de octubre de 2026';
const PREMIUM = config.premiumEnabled;

/** Incluye los elementos solo cuando la condición se cumple. */
function when<T>(condition: boolean, items: T[]): T[] {
  return condition ? items : [];
}

export const LEGAL_DOCS: LegalDocument[] = [
  {
    path: '/privacidad',
    title: 'Política de privacidad',
    updated: UPDATED,
    sections: [
      {
        heading: '1. Responsable del tratamiento',
        paragraphs: [`${CONTROLLER.name}, ${CONTROLLER.id}, ${CONTROLLER.address}. Contacto: ${CONTROLLER.email}.`],
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
          ...when(PREMIUM, [
            'Cuenta (solo si te registras para Premium): correo electrónico y estado de tu suscripción, gestionados con Supabase.',
            'Pagos (solo Premium): los gestiona Stripe. Nosotros no almacenamos datos de tarjeta; recibimos el estado de la suscripción.',
          ]),
          'Analítica (solo con tu consentimiento): eventos anónimos como visitas, inicio y fin de conversiones, tipo de formato y la fuente de la visita (solo el dominio de origen). Nunca se envían contenido, nombres de archivo ni texto extraído.',
          'Publicidad (solo con tu consentimiento): Google AdSense puede tratar datos mediante cookies e identificadores del dispositivo. Si no aceptas, no se carga.',
        ],
      },
      {
        heading: '4. Finalidades y bases jurídicas',
        paragraphs: [
          `Prestar el servicio de conversión (ejecución del servicio y ajustes que tú eliges)${
            PREMIUM ? ', gestionar la cuenta y la suscripción Premium (ejecución del contrato)' : ''
          }, y medir el uso y mostrar publicidad solo con tu consentimiento (artículo 6.1.a RGPD).`,
        ],
      },
      {
        heading: '5. Servicios externos',
        paragraphs: ['Servicios que pueden intervenir según la función que uses:'],
        list: [
          ...when(PREMIUM, [
            'Supabase: autenticación y base de datos de suscripciones.',
            'Stripe: cobro de la suscripción y portal de facturación.',
          ]),
          'Google AdSense: anuncios, solo con consentimiento. Consulta la política de Google.',
          'Alojamiento: GitHub Pages (GitHub, Inc.) puede registrar direcciones IP y datos técnicos de acceso en sus registros.',
        ],
      },
      {
        heading: '6. Conservación',
        paragraphs: [
          PREMIUM
            ? 'Los ajustes permanecen en tu navegador hasta que los borres. Los datos de cuenta y suscripción se conservan mientras la cuenta esté activa y después el plazo legal que corresponda a la facturación.'
            : 'Los ajustes permanecen en tu navegador hasta que los borres. No conservamos tus documentos.',
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
        paragraphs: ['La aplicación utiliza almacenamiento local del navegador (localStorage) para:'],
        list: [
          'lb:reading-settings:v1: tus ajustes de lectura (necesario).',
          'lb:consent:v1: tu elección sobre cookies opcionales (necesario).',
          'lb:visits: un contador local de visitas para detectar visitas recurrentes (solo si aceptas analítica).',
          ...when(PREMIUM, ['Sesión de Supabase: mantiene tu sesión si inicias sesión para Premium (necesario para esa función).']),
        ],
      },
      {
        heading: 'Cookies de terceros',
        paragraphs: [
          'Google AdSense puede instalar cookies para mostrar anuncios. Solo se carga si aceptas la publicidad. Si la rechazas, no se carga ningún script de anuncios.',
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
          'Lectura biónica permite transformar documentos EPUB y PDF con texto en un formato de lectura con negrita bionica personalizable. La conversión es gratuita y no requiere registro.',
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
          `Hay un tamaño máximo de ${config.maxFileMb} MB por archivo. La reconstrucción de PDF no es una copia idéntica del original y los documentos complejos pueden no conservar su maquetación. Los documentos protegidos o escaneados no se pueden transformar. La aplicación indica estos casos.`,
          'La lectura biónica es una herramienta de personalización de la lectura y no tiene finalidad médica ni terapéutica.',
        ],
      },
      ...when(PREMIUM, [
        {
          heading: '4. Premium',
          paragraphs: [
            'La suscripción Premium elimina los anuncios y se renueva automáticamente hasta que la canceles desde tu cuenta. Los pagos los gestiona Stripe. Precio vigente y condiciones de consumo (incluido el derecho de desistimiento): [COMPLETAR].',
          ],
        },
      ]),
      {
        heading: PREMIUM ? '5. Disponibilidad y responsabilidad' : '4. Disponibilidad y responsabilidad',
        paragraphs: ['El servicio se ofrece tal cual y puede cambiar o interrumpirse. Recomendamos conservar siempre el documento original.'],
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
        paragraphs: [`${CONTROLLER.name} · ${CONTROLLER.id} · ${CONTROLLER.address} · ${CONTROLLER.email}`],
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
