import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// A relative base and hash routing, so the same build works from any static host or sub-path (GitHub Pages, Firebase
// Hosting, a USB stick) with no rewrites.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5180 },
  preview: { port: 5181 },
});
