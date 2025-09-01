import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
// FIX: Removed incorrect import of `cwd`. `cwd` is a method on the global `process` object (`process.cwd()`) and not an export.

// A more robust body parser that handles different content types and errors.
async function parseBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        // Assuming JSON, as that's what our app sends.
        resolve(JSON.parse(body));
      } catch (e) {
        // If parsing fails, resolve with an empty object to prevent crashes.
        console.error('Failed to parse request body:', e);
        resolve({});
      }
    });
    req.on('error', (err: Error) => {
      console.error('Error reading request body:', err);
      resolve({});
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
        // Vite automatically loads .env files. The API key will be in process.env.
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            try {
              // FIX: Replaced `cwd()` with `process.cwd()` to correctly get the current working directory.
              const apiFilePath = path.join(process.cwd(), req.url.replace(/\?.*$/, '') + '.ts');
              
              if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                (req as any).body = await parseBody(req);
              }

              const { default: handler } = await server.ssrLoadModule(`${apiFilePath}?t=${Date.now()}`);
              
              const responseAdapter = Object.create(res);

              responseAdapter.status = function(statusCode: number) {
                  this.statusCode = statusCode;
                  return this;
              };
      
              responseAdapter.json = function(data: any) {
                  this.setHeader('Content-Type', 'application/json');
                  this.end(JSON.stringify(data));
              };

              await handler(req, responseAdapter);

            } catch (error) {
              console.error(`API Error for ${req.url}:`, error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
})