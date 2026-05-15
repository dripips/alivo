import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3100',
      '/socket.io': { target: 'http://localhost:3100', ws: true },
      '/chat': { target: 'http://localhost:3100', ws: true },
      '/dashboard': { target: 'http://localhost:3100', ws: true },
    },
  },
})
