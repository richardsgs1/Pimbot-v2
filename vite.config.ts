import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split vendor libraries into separate chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('recharts') || id.includes('chart.js')) {
              return 'chart-vendor';
            }
            if (id.includes('@google/genai') || id.includes('@supabase')) {
              return 'api-vendor';
            }
            if (id.includes('@dnd-kit')) {
              return 'dnd-vendor';
            }
            // All other node_modules
            return 'vendor';
          }
          // Split large app chunks
          if (id.includes('components/Task') || id.includes('TaskManager')) {
            return 'task-components';
          }
          if (id.includes('lib/') && id.includes('Service')) {
            return 'services';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600,
    // Enable minification with esbuild
    minify: 'esbuild',
    target: 'es2015'
  }
});