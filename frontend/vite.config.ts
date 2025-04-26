import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [react()],  // ✅ Imprescindible para React
  server: {
    open: '/public/index.html',  // ✅ Opcional (abre automáticamente el navegador)
    port: 5173  // ✅ Opcional (define el puerto)
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,  // ✅ Necesario para Tailwind
        autoprefixer // ✅ Recomendado para compatibilidad
      ]
    }
  }
});