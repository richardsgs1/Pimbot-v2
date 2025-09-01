import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The vite.config.ts has been simplified to align with a standard Vercel deployment workflow.
// The custom API middleware for the Vite dev server has been removed.
//
// For local development that mirrors the Vercel production environment (including serverless functions),
// please use the Vercel CLI and run the following command in your terminal:
//
// vercel dev
//
// This command will start the Vite server and make your serverless functions in the /api directory
// available, just as they would be in production.

export default defineConfig({
  plugins: [react()],
});