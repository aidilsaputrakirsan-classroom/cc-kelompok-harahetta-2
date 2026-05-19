import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // Development server configuration
    server: {
      port: 5173,
      strictPort: true,
      // Proxy configuration to avoid CORS issues during development
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false,
        },
      },
    },

    // Preview server (for production build preview)
    preview: {
      port: 4173,
    },

    // Production build optimizations — code splitting per vendor
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            // React core
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Map libraries (heavy — ~400KB raw)
            'vendor-map': ['leaflet', 'react-leaflet'],
            // Animation
            'vendor-motion': ['framer-motion'],
            // Radix UI components
            'vendor-radix': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slot',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
            ],
            // Utilities
            'vendor-utils': ['clsx', 'tailwind-merge', 'class-variance-authority', 'lucide-react', 'sonner'],
          },
        },
      },
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      css: true,
    },
  }
})
