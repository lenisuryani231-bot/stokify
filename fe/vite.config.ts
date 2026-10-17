import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Cookie login tetap same-origin selama development
    proxy: { '/api': 'http://localhost:4000' },
  },
})
