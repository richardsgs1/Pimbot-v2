import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
// FIX: The explicit import of `process` caused a type conflict.
// The global `process` object is available in the Node.js context where this
// file is executed, so the import is not necessary and was removed to allow
// TypeScript to use the correct global typings for `process.cwd()`.
import dotenv from 'dotenv';

// Load environment variables from .env file into process.env for our API functions
dotenv.config();

// Helper function to parse the body of a POST/PUT request
async function parseBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', (err: Error) => {
      reject(err);
    });
  });
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to handle Vercel-style API routes in development
    {
      name: 'vite-plugin-vercel-api-handler',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            try {
              // Construct the absolute path to the API file
              const apiFilePath = path.join(process.cwd(), req.url.replace(/\?.*$/, '') + '.ts');
              
              // This is the critical fix: parse the request body for POST/PUT/PATCH methods
              if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                (req as any).body = await parseBody(req);
              }

              // Use Vite's SSR loader to execute the module in a Node-like environment.
              // We append a timestamp to bust the cache, ensuring our API code is always fresh on each request.
              const { default: handler } = await server.ssrLoadModule(`${apiFilePath}?t=${Date.now()}`);
              
              // The Vite dev server's `res` object is a raw Node.js ServerResponse.
              // It doesn't have the `.status()` or `.json()` helpers that Vercel's environment provides.
              // We create a lightweight adapter to make it compatible.
              const responseAdapter = Object.create(res);

              responseAdapter.status = function(statusCode: number) {
                  this.statusCode = statusCode;
                  return this;
              };
      
              responseAdapter.json = function(data: any) {
                  this.setHeader('Content-Type', 'application/json');
                  this.end(JSON.stringify(data));
              };

              // Execute the Vercel-style handler with the request and our adapted response
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