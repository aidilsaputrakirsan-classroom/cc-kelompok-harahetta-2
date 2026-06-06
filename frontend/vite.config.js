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
      // Proxy semua backend paths ke Nginx gateway (localhost:80)
      // Ini menghindari CORS issue karena request dari browser ke localhost:5173
      // dianggap same-origin oleh browser, Vite yang forward ke localhost:80
      proxy: {
        '/auth':        { target: 'http://localhost:8000', changeOrigin: true },
        '/profile':     { target: 'http://localhost:8000', changeOrigin: true },
        '/admin':       { target: 'http://localhost:8000', changeOrigin: true },
        '/admins':      { target: 'http://localhost:8000', changeOrigin: true },
        '/superadmin':  { target: 'http://localhost:8000', changeOrigin: true },
        '/items':       { target: 'http://localhost:8000', changeOrigin: true },
        '/categories':  { target: 'http://localhost:8000', changeOrigin: true },
        '/rentals':     { target: 'http://localhost:8000', changeOrigin: true },
        '/payments':    { target: 'http://localhost:8000', changeOrigin: true },
        '/promos':      { target: 'http://localhost:8000', changeOrigin: true },
        '/reviews':     { target: 'http://localhost:8000', changeOrigin: true },
        '/stats':       { target: 'http://localhost:8000', changeOrigin: true },
        '/health':      { target: 'http://localhost:8000', changeOrigin: true },
        '/chatbot':     { target: 'http://localhost:8000', changeOrigin: true },
        // Chat REST
        '/chat/rooms':  { target: 'http://localhost:8000', changeOrigin: true },
        '/chat/unread': { target: 'http://localhost:8000', changeOrigin: true },
        '/chat/heartbeat': { target: 'http://localhost:8000', changeOrigin: true },
        '/chat/presence':  { target: 'http://localhost:8000', changeOrigin: true },
        // Chat WebSocket — harus pakai ws: true
        '/chat/ws': {
          target: 'ws://localhost:8000',
          changeOrigin: true,
          ws: true,
        },
        // Legacy /api prefix (kalau masih ada)
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
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
