import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Remove the proxy section entirely for local development
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
});