import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dotenv from 'dotenv';
// FIX: Import `process` to provide proper type definitions for process.cwd().
import process from 'process';

// Load environment variables from .env file into process.env
dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to handle API routes in development
    {
      name: 'vite-plugin-vercel-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            try {
              // Construct the absolute path to the API file
              const apiFilePath = path.join(process.cwd(), `${req.url}.ts`);

              // Use Vite's SSR loader to execute the module in a Node-like environment.
              // We append a timestamp to bust the cache, ensuring our API code is always fresh on each request.
              const { default: handler } = await server.ssrLoadModule(`${apiFilePath}?t=${Date.now()}`);
              
              // The Vite dev server's `res` object is a raw Node.js ServerResponse,
              // which doesn't have the `.status()` or `.json()` helper methods
              // that Vercel's environment provides. We create an adapter.
              const responseAdapter = Object.create(res);

              responseAdapter.status = function(statusCode) {
                  this.statusCode = statusCode;
                  return this;
              };
      
              responseAdapter.json = function(data) {
                  this.setHeader('Content-Type', 'application/json');
                  this.end(JSON.stringify(data));
              };

              // Execute the Vercel-style handler with the adapted response
              await handler(req, responseAdapter);

            } catch (error) {
              console.error(`API Error for ${req.url}:`, error);
              res.statusCode = 500;
              res.end('Internal Server Error');
            }
          } else {
            // Not an API route, pass to the next handler
            next();
          }
        });
      }
    }
  ],
})