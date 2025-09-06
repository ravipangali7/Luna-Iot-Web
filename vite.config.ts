import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['app.mylunago.com', 'system.mylunago.com'],
    proxy: {
      '/api': {
        target: 'https://system.mylunago.com',
        changeOrigin: true,
        secure: true
      },
      '/socket.io': {
        target: 'http://38.54.71.218:7070',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
