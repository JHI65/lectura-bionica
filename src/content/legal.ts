// Textos legales por idioma. Ningún texto de aquí constituye por sí solo
// cumplimiento normativo: deben revisarse con asesoría. Los datos del titular
// están en CONTROLLER; los campos que falten se marcan [COMPLETAR].
//
// Los textos describen lo que la web hace de verdad: mientras Premium esté
// desactivado (VITE_PREMIUM_ENABLED), no se mencionan cuentas, Supabase ni Stripe.
// Premium solo existe en español, así que la versión inglesa nunca lo menciona.

import { config } from '../lib/state/config';
import type { Locale } from '../i18n/locale';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface LegalDocument {
  /** Identificador estable de la ruta (src/content/routes.json). */
  id: 'privacy' | 'cookies' | 'terms' | 'legal';
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

const PREMIUM = config.premiumEnabled;

/** Incluye los elementos solo cuando la condición se cumple. */
function when<T>(condition: boolean, items: T[]): T[] {
  return condition ? items : [];
}

const ES: LegalDocument[] = [
  {
    id: 'privacy',
    title: 'Política de privacidad',
    updated: '15 de octubre de 2026',
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
            'Cuenta (solo si te registras para Premium): correo electrónico y estado de tu suscripción, gestionados con Supabase. Si entras con Google, recibimos tu correo y nombre de perfil de tu cuenta de Google.',
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
            'Supabase: autenticación (enlace por correo o cuenta de Google) y base de datos de suscripciones. Puede implicar transferencias a Estados Unidos con las garantías del proveedor [REVISAR].',
            'Google: solo si eliges «Continuar con Google», como proveedor de identidad.',
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
    id: 'cookies',
    title: 'Política de cookies',
    updated: '15 de octubre de 2026',
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
    id: 'terms',
    title: 'Condiciones de uso',
    updated: '15 de octubre de 2026',
    sections: [
      {
        heading: '1. Servicio',
        paragraphs: [
          'Readably permite transformar documentos EPUB y PDF con texto en un formato de lectura con negrita bionica personalizable. La conversión es gratuita y no requiere registro.',
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
            'La suscripción Premium elimina los anuncios, eleva el tamaño máximo por archivo y permite convertir varios archivos a la vez. Hay plan mensual y anual, y la primera suscripción puede incluir un periodo de prueba gratuita. La suscripción se renueva automáticamente hasta que la canceles desde tu cuenta. Los pagos los gestiona Stripe. Precio vigente y condiciones de consumo (incluido el derecho de desistimiento): [COMPLETAR].',
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
    id: 'legal',
    title: 'Aviso legal',
    updated: '15 de octubre de 2026',
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

const EN: LegalDocument[] = [
  {
    id: 'privacy',
    title: 'Privacy policy',
    updated: 'October 15, 2026',
    sections: [
      {
        heading: '1. Data controller',
        paragraphs: [`${CONTROLLER.name}, ${CONTROLLER.id}, ${CONTROLLER.address}, Spain. Contact: ${CONTROLLER.email}.`],
      },
      {
        heading: '2. Your documents are not uploaded to our servers',
        paragraphs: [
          'The EPUB and PDF files you convert are read and transformed in your own browser. They are not sent to any server, they are not stored, and they are not included in analytics. When you close the tab, the document disappears from the app.',
        ],
      },
      {
        heading: '3. Data we do process',
        paragraphs: ['We only process the data needed for each purpose:'],
        list: [
          'Reading settings: saved in your browser (localStorage) to remember your configuration. They do not leave your device.',
          'Cookie preferences: saved in your browser so we do not ask again.',
          'Analytics (only with your consent): anonymous events such as visits, start and end of conversions, file format and the source of the visit (only the referring domain). File contents, file names and extracted text are never sent.',
          'Advertising (only with your consent): Google AdSense may process data through cookies and device identifiers. If you do not accept, it is not loaded.',
        ],
      },
      {
        heading: '4. Purposes and legal bases',
        paragraphs: [
          'To provide the conversion service (performance of the service and the settings you choose), and to measure usage and show advertising only with your consent (Article 6(1)(a) GDPR).',
        ],
      },
      {
        heading: '5. External services',
        paragraphs: ['Services that may be involved depending on the feature you use:'],
        list: [
          'Google AdSense: advertising, only with consent. See Google’s policy.',
          'Hosting: GitHub Pages (GitHub, Inc.) may record IP addresses and technical access data in its logs.',
        ],
      },
      {
        heading: '6. Retention',
        paragraphs: ['Settings stay in your browser until you delete them. We do not keep your documents.'],
      },
      {
        heading: '7. Your rights',
        paragraphs: [
          `You can access, rectify, erase, restrict or object to the processing of your data and request portability by writing to ${CONTROLLER.email}. You can also complain to the Spanish Data Protection Agency (aepd.es) or to your local data protection authority, such as the ICO in the United Kingdom.`,
          'Depending on where you live (for example in the United Kingdom or in some US states), you may have additional rights under local law. Contact us and we will respond.',
        ],
      },
    ],
  },
  {
    id: 'cookies',
    title: 'Cookie policy',
    updated: 'October 15, 2026',
    sections: [
      {
        heading: 'What we store',
        paragraphs: ['The app uses your browser’s local storage (localStorage) for:'],
        list: [
          'lb:reading-settings:v1: your reading settings (necessary).',
          'lb:consent:v1: your choice about optional cookies (necessary).',
          'lb:visits: a local visit counter used to detect returning visits (only if you accept analytics).',
        ],
      },
      {
        heading: 'Third-party cookies',
        paragraphs: [
          'Google AdSense may set cookies to show ads. It only loads if you accept advertising. If you reject it, no ad script is loaded.',
        ],
      },
      {
        heading: 'How to change your choice',
        paragraphs: [
          'You can change your consent at any time with the “Cookie preferences” link in the footer. You can also clear the site’s data from your browser settings.',
        ],
      },
    ],
  },
  {
    id: 'terms',
    title: 'Terms of use',
    updated: 'October 15, 2026',
    sections: [
      {
        heading: '1. Service',
        paragraphs: [
          'Readably converts EPUB and PDF documents containing text into a reading format with customizable bionic-style bolding. Conversion is free and requires no sign-up.',
        ],
      },
      {
        heading: '2. Acceptable use',
        paragraphs: [
          'You must have the right to use the documents you convert (for example, books you bought or works in the public domain). You may not use the service to circumvent technical protections on documents.',
        ],
      },
      {
        heading: '3. Limits of the result',
        paragraphs: [
          `There is a maximum size of ${config.maxFileMb} MB per file. PDF reconstruction is not an identical copy of the original and complex documents may not keep their layout. Protected or scanned documents cannot be transformed. The app tells you in those cases.`,
          'Bionic-style reading is a reading personalization tool and has no medical or therapeutic purpose.',
        ],
      },
      {
        heading: '4. Availability and liability',
        paragraphs: ['The service is provided as is and may change or be interrupted. We recommend always keeping the original document.'],
      },
    ],
  },
  {
    id: 'legal',
    title: 'Legal notice',
    updated: 'October 15, 2026',
    sections: [
      {
        heading: 'Site owner',
        paragraphs: [`${CONTROLLER.name} · ${CONTROLLER.id} · ${CONTROLLER.address}, Spain · ${CONTROLLER.email}`],
      },
      {
        heading: 'Conditions of access',
        paragraphs: [
          'Access to the site is free. Users agree to make lawful use of the service. The owner may modify or withdraw content and features without notice.',
        ],
      },
      {
        heading: 'Intellectual property',
        paragraphs: [
          'The design, code and texts of the site belong to the owner or are used under license. The documents you convert remain the property of their owner.',
          'Bionic Reading® is a trademark of its owners. This site is not affiliated with them.',
        ],
      },
    ],
  },
];

export const LEGAL_DOCS: Record<Locale, LegalDocument[]> = { es: ES, en: EN };
