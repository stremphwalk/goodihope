import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    // Performance optimizations
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'aws-vendor': ['aws-amplify'],
          
          // Feature-based chunks
          'widgets': [
            './src/components/widgets/MedicationWidget.tsx',
            './src/components/widgets/AllergiesWidget.tsx',
            './src/components/widgets/PMHWidget.tsx',
            './src/lib/widgetRegistry.ts'
          ],
          'auth': [
            './src/components/AuthProvider.tsx'
          ],
          'performance': [
            './src/lib/intelligentCache.ts'
          ]
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          return chunkInfo.name === 'index' 
            ? 'assets/app-[hash].js'
            : 'assets/[name]-[hash].js'
        }
      }
    },
    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    // Reduce bundle size
    target: 'esnext',
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'fuse.js'
    ],
    exclude: [
      'aws-amplify' // Large dependency, bundle separately
    ]
  },
  // Enable CSS code splitting
  css: {
    devSourcemap: false,
  },
})