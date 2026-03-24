import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8888';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      proxy: {
        '/auth-service': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/policy-service': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/claims-service': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/admin-service': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/payment-service': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
