import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
const targetBackend = process.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: targetBackend,
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: targetBackend,
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: targetBackend,
        ws: true,
        changeOrigin: true
      }
    }
  }
});
