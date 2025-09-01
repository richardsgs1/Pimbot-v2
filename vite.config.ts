import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// FIX: Import 'cwd' from 'process' to resolve TypeScript type error for process.cwd().
import { cwd } from 'process';

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
              // req.url will be like /api/generate-project
              // We need to map it to /api/generate-project.ts
              const apiFilePath = path.join(cwd(), `${req.url}.ts`);

              // Use Vite's SSR loader to execute the module in a Node-like environment.
              // We append a timestamp to bust the cache, ensuring our API code is always fresh on each request.
              const { default: handler } = await server.ssrLoadModule(`${apiFilePath}?t=${Date.now()}`);
              
              // Execute the Vercel-style handler
              await handler(req, res);
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
