import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

const ortVersion = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, 'node_modules/onnxruntime-web/package.json'), 'utf8')
).version as string;

// Cloudflare Pages rejects any file over 25 MiB. Vite would otherwise copy the 28 MB
// WebGPU runtime into dist/assets; at runtime it is loaded from the jsDelivr CDN instead.
const MAX_PAGES_FILE_BYTES = 25 * 1024 * 1024;

export default defineConfig(() => {
  return {
    define: {
      __ORT_VERSION__: JSON.stringify(ortVersion),
    },
    plugins: [
      {
        name: 'drop-oversized-wasm',
        generateBundle(_opts: unknown, bundle: Record<string, any>) {
          for (const [name, file] of Object.entries(bundle)) {
            if (file.type === 'asset' && name.endsWith('.wasm') && file.source.length > MAX_PAGES_FILE_BYTES) {
              delete bundle[name];
            }
          }
        },
      },
      {
        name: 'wasm-static-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && req.url.startsWith('/api/feedback') && req.method === 'POST') {
              let bodyStr = '';
              req.on('data', (chunk: any) => {
                bodyStr += chunk;
              });
              req.on('end', () => {
                try {
                  const body = JSON.parse(bodyStr || '{}');
                  const stars = '★'.repeat(body.rating || 0) + '☆'.repeat(Math.max(0, 5 - (body.rating || 0)));
                  console.log('[DEV USER FEEDBACK RECEIVED]', stars, body);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, message: 'Thank you for your feedback!' }));
                } catch {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
                }
              });
              return;
            }

            if (req.url && req.url.startsWith('/wasm/')) {
              const cleanUrl = req.url.split('?')[0];
              const filePath = path.resolve(import.meta.dirname, 'public' + cleanUrl);
              if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
                if (cleanUrl.endsWith('.mjs') || cleanUrl.endsWith('.js')) {
                  res.setHeader('Content-Type', 'text/javascript');
                } else if (cleanUrl.endsWith('.wasm')) {
                  res.setHeader('Content-Type', 'application/wasm');
                }
                fs.createReadStream(filePath).pipe(res);
                return;
              }
            }
            next();
          });
        },
      },
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
