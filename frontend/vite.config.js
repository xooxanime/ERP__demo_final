import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Expose for local network access
    proxy: {
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:10000',
        changeOrigin: true
      }
    }
  }
})
