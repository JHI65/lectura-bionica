export const FAQ: Array<{ q: string; a: string }> = [
  {
    q: '¿Necesito crear una cuenta?',
    a: 'No. La conversión básica, los ajustes y la descarga funcionan sin registro. La cuenta solo sirve para gestionar la suscripción Premium.',
  },
  {
    q: '¿Mis libros se suben a un servidor?',
    a: 'No. El EPUB o PDF se procesa en tu navegador. No se sube al servidor y no lo guardamos. Solo se guardan tus preferencias visuales en el propio navegador.',
  },
  {
    q: '¿La lectura biónica me ayuda con el TDAH o mejora la comprensión?',
    a: 'Es una herramienta de personalización de la lectura. Algunas personas la encuentran más cómoda y otras no notan diferencia. No está demostrado de forma general que mejore la comprensión y no sustituye a ningún tratamiento.',
  },
  {
    q: '¿Qué formatos admite?',
    a: 'EPUB y PDF. Para PDF se necesita texto seleccionable: si el PDF es un escaneo, la aplicación te lo indica en lugar de generar un resultado vacío.',
  },
  {
    q: '¿El PDF descargado es idéntico al original?',
    a: 'No. Es un documento reformateado a partir del texto extraído, con títulos, párrafos y listas. Columnas, tablas, imágenes, notas al pie y fórmulas pueden no conservarse.',
  },
  {
    q: '¿Qué pasa con los EPUB protegidos con DRM?',
    a: 'No se pueden transformar. La aplicación lo detecta y te avisa.',
  },
  {
    q: '¿Qué incluye Premium?',
    a: 'Todas las funciones gratuitas sin anuncios. La suscripción se gestiona con Stripe y puedes cancelarla o cambiar los datos de facturación en cualquier momento desde tu cuenta.',
  },
  {
    q: '¿Y si no puedo ver anuncios o no los quiero?',
    a: 'Puedes suscribirte a Premium para ocultarlos. Si no aceptas la publicidad personalizada, los anuncios que se muestren serán no personalizados. Puedes cambiar tu elección en cualquier momento desde Preferencias de cookies.',
  },
];
