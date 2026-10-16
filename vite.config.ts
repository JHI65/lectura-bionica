import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Build de producción estático: no hay backend propio. Las funciones de pago
// viven en Firebase Functions (ver functions/).
//
// VITE_BASE permite servir la app bajo un subdirectorio (p. ej. GitHub Pages en
// /lectura-bionica/). En local y en un dominio propio se queda en '/'.

// La política de seguridad solo se amplía cuando Premium está activado y Firebase
// configurado: así la versión gratuita no permite orígenes que no usa.
function premiumCsp(): Plugin {
  let enabled = false;
  let emulators = false;
  return {
    name: 'premium-csp',
    configResolved(resolved) {
      const env = loadEnv(resolved.mode, resolved.root, 'VITE_');
      const get = (key: string) => process.env[key] ?? env[key] ?? '';
      enabled = get('VITE_PREMIUM_ENABLED') === 'true' && Boolean(get('VITE_FIREBASE_PROJECT_ID'));
      emulators = get('VITE_FIREBASE_EMULATORS') === 'true';
    },
    transformIndexHtml(html) {
      if (!enabled) return html;
      // El acceso con ventana emergente de Google carga apis.google.com y un iframe de Firebase.
      const connect = [
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://firestore.googleapis.com',
        'https://*.cloudfunctions.net',
        ...(emulators ? ['http://127.0.0.1:*', 'ws://127.0.0.1:*'] : []),
      ].join(' ');
      return html
        .replace("script-src 'self'", "script-src 'self' https://apis.google.com")
        .replace("connect-src 'self'", `connect-src 'self' ${connect}`)
        .replace('frame-src ', 'frame-src https://*.firebaseapp.com https://accounts.google.com ');
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), premiumCsp()],
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
