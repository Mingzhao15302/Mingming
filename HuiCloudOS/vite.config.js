import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: 'public',
  publicDir: '../static',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'public/src')
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    host: true
  }
});
