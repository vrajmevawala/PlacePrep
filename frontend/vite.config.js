import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5001', 
    },
  },
  build: {
    // Raise the warning threshold to avoid noisy warnings for expected vendor bundle sizes
    chunkSizeWarningLimit: 2000,
  },
}); 