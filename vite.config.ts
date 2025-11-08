import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-window']
  },
  server: {
    allowedHosts: ['app.mylunago.com'],
    proxy: {
      '/socket.io': {
        target: 'http://38.54.71.218:6060',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  },
  publicDir: 'public'
})
