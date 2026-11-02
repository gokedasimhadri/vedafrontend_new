import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:9022';
  const port = parseInt(env.VITE_PORT, 10) || 5174;

  return {
    plugins: [react()],
    server: {
      port,
      host: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/adityaapi': {
          target: 'https://info.aec.edu.in',
          changeOrigin: true,
          secure: false,
          headers: {
            'X-API-KEY': env.VITE_ECAP_API_KEY
          }
        },
        '/uploads': {
          target: backendUrl,
          changeOrigin: true,
        }
      }
    }
  };
});
