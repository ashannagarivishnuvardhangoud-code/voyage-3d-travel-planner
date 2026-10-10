import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000' } },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three') || id.includes('node_modules/react-reconciler')) return 'globe'
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) return 'maps'
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'charts'
        },
      },
    },
  },
})
