import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@':           resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages':      resolve(__dirname, './src/pages'),
      '@store':      resolve(__dirname, './src/store'),
      '@hooks':      resolve(__dirname, './src/hooks'),
      '@utils':      resolve(__dirname, './src/utils'),
      '@api':        resolve(__dirname, './src/api'),
      '@theme':      resolve(__dirname, './src/theme'),
    },
  },
  server: {
    port: 3002,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
