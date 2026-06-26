import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react';
            if (id.includes('framer-motion')) return 'framer';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('pdfjs-dist')) return 'pdf';
            if (id.includes('tesseract.js')) return 'tesseract';
            if (id.includes('mammoth')) return 'mammoth';
            if (id.includes('gsap')) return 'gsap';
            return 'vendor';
          }
        }
      }
    }
  }
})
