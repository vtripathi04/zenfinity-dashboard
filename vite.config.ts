import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // ADD THIS SERVER BLOCK
  server: {
    proxy: {
      '/api': {
        target: 'https://zenfinity-intern-api-104290304048.europe-west1.run.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})