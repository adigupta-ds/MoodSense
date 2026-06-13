import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  json: { stringify: false },
  server: {
    port: 5174,
    proxy: {
      '/predict':    'http://127.0.0.1:8000',
      '/camera-lux': 'http://127.0.0.1:8000',
      '/brightness': 'http://127.0.0.1:8000',
      '/weather':    'http://127.0.0.1:8000',
      '/status':     'http://127.0.0.1:8000',
      '/report':     'http://127.0.0.1:8000',
      '/history':    'http://127.0.0.1:8000',
      '/mode':       'http://127.0.0.1:8000',
    }
  }
});
