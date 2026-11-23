// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  define: {
    global: 'globalThis',
  },

  server: {
    port: 5174,
    host: true,

    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },

      '/ws': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        secure: false
      }
    }
  }
});