import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@vladmandic/face-api': '@vladmandic/face-api/dist/face-api.esm-nobundle.js',
    },
  },
})
