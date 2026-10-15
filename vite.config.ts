import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build de producción estático: no hay backend propio. Las funciones de pago
// viven en Supabase Edge Functions (ver supabase/).
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
