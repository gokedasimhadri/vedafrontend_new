import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL;
  const port = parseInt(env.VITE_PORT, 10) || 5174;
  const eventType = env.EVENT_TYPE || env.VITE_EVENT_TYPE || 'VEDA';
  const eventAcademicYear = env.EVENT_ACADEMIC_YEAR || env.VITE_EVENT_ACADEMIC_YEAR || '2026-2027';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.EVENT_TYPE': JSON.stringify(eventType),
      'import.meta.env.VITE_EVENT_TYPE': JSON.stringify(eventType),
      'import.meta.env.EVENT_ACADEMIC_YEAR': JSON.stringify(eventAcademicYear),
      'import.meta.env.VITE_EVENT_ACADEMIC_YEAR': JSON.stringify(eventAcademicYear),
    },
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
