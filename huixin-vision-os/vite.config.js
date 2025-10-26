import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'client'),
  base: './',
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.html'),
        login: path.resolve(__dirname, 'client/login.html'),
        dashboard: path.resolve(__dirname, 'client/dashboard.html'),
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
