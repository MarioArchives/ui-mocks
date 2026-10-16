import type { IncomingMessage, ServerResponse } from 'node:http';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/** Serves contact cards (.vcf) as vCards in dev and preview, so an iPhone on the dev server opens them as a contact. */
function vcards(): Plugin {
  const typed = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url?.split('?')[0]?.endsWith('.vcf')) res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    next();
  };
  return {
    name: 'vcards',
    configureServer: (server) => void server.middlewares.use(typed),
    configurePreviewServer: (server) => void server.middlewares.use(typed),
  };
}

// A relative base and hash routing, so the same build works from any static host or sub-path (GitHub Pages, Firebase
// Hosting, a USB stick) with no rewrites.
export default defineConfig({
  base: './',
  plugins: [react(), vcards()],
  server: { port: 5180 },
  preview: { port: 5181 },
});
