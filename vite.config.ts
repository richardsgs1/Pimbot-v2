import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
// FIX: Import `process` from `node:process` to avoid potential type conflicts
// with the global `process` object that can occur in a Vite environment.
import process from 'node:process';
import dotenv from 'dotenv';
import type { ViteDevServer, Connect } from 'vite';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Load environment variables from .env file FIRST.
dotenv.config();

// Helper to parse the request body.
async function parseBody(req: Connect.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('error', reject);
    req.on('end', () => {
      if (!body) {
        return resolve({});
      }
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        console.error('Invalid JSON body received.');
        reject(new Error('Invalid JSON body'));
      }
    });
  });
}

// Vite plugin to handle /api/* routes
const apiPlugin = {
  name: 'vercel-like-api-middleware',
  configureServer(server: ViteDevServer) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url || !req.url.startsWith('/api/')) {
        return next();
      }

      const apiRoute = req.url.substring(4);
      // FIX: Use process.cwd() as cwd is a method on the process object and not a named export.
      const filePath = path.join(process.cwd(), 'api', `${apiRoute}.ts`);

      try {
        // Use vite.ssrLoadModule to get hot-reloading for API files
        const module = await server.ssrLoadModule(filePath);
        const handler = module.default;

        if (typeof handler !== 'function') {
          res.statusCode = 500;
          res.end(`Handler not found or not a function in ${filePath}`);
          return;
        }

        // Create Vercel-like req/res objects
        const vercelReq = req as VercelRequest;
        vercelReq.body = await parseBody(req);
        
        const vercelRes = res as VercelResponse;
        
        // Add compatibility methods to Vite's response object
        const originalEnd = res.end.bind(res);
        
        vercelRes.status = (statusCode: number) => {
          res.statusCode = statusCode;
          return vercelRes;
        };
        
        vercelRes.json = (data: any) => {
          res.setHeader('Content-Type', 'application/json');
          originalEnd(JSON.stringify(data));
          return vercelRes;
        };

        await handler(vercelReq, vercelRes);

      } catch (error) {
        console.error(`API Error for ${req.url}:`, error);
        res.statusCode = 500;
        res.end(error instanceof Error ? error.message : 'Internal Server Error');
      }
    });
  },
};


export default defineConfig({
  plugins: [react(), apiPlugin],
});