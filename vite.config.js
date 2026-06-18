import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone storefront app — independent of the owner/admin app.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react'],
          motion: ['framer-motion'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
