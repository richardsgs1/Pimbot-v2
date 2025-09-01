import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import type { ViteDevServer, Connect } from 'vite';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// --- DEFINITIVE FIX ---
// Explicitly load environment variables from the .env file at the very start.
// We provide an absolute path to remove any ambiguity about the file's location.
dotenv.config({ path: path.resolve('.env') });

// --- NEW ARCHITECTURE ---
// Initialize the AI client ONCE.
// This is the single source of truth for the AI connection.
// FIX: Removed explicit check for API_KEY to adhere to guidelines assuming it's always provided.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// Helper to parse the request body.
async function parseBody(req: Connect.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('error', reject);
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
  });
}

// Vite plugin to handle /api/* routes
const apiPlugin = {
  name: 'vercel-api-middleware',
  configureServer(server: ViteDevServer) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url || !req.url.startsWith('/api/')) {
        return next();
      }

      const apiRoute = req.url.substring(4);
      const filePath = path.resolve('api', `${apiRoute}.ts`);

      try {
        const module = await server.ssrLoadModule(filePath);
        const handler = module.default;

        if (typeof handler !== 'function') {
          res.statusCode = 500;
          return res.end(`Handler not found in ${filePath}`);
        }

        const vercelReq = req as VercelRequest & { ai: GoogleGenAI };
        vercelReq.body = await parseBody(req);
        
        // --- NEW: Inject the shared AI client into the request ---
        vercelReq.ai = ai;
        
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