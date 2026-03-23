import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/auth-service': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/policy-service': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/claims-service': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/admin-service': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/payment-service': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
})
