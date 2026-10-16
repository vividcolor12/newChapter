import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/newChapter/',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
});
