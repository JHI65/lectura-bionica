import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build de producción estático: no hay backend propio. Las funciones de pago
// viven en Supabase Edge Functions (ver supabase/).
//
// VITE_BASE permite servir la app bajo un subdirectorio (p. ej. GitHub Pages en
// /lectura-bionica/). En local y en un dominio propio se queda en '/'.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
