import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The vite.config.ts has been updated to include a proxy for API requests,
// which is a best practice for local development.
//
// For the most accurate local development that mirrors the Vercel production environment,
// it is still recommended to use the Vercel CLI command:
//
// vercel dev
//

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});