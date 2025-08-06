import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, URL } from "node:url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { visualizer } from "rollup-plugin-visualizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // Optimize React for production
      babel: mode === "production" ? {
        plugins: [
          ["babel-plugin-react-remove-properties", { properties: ["data-testid"] }]
        ]
      } : undefined
    }),
    // Only include development plugins in dev mode
    ...(mode === "development" ? [runtimeErrorOverlay()] : []),
    // Conditionally load cartographer plugin (removed async/await)
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined ? [] : []),
    // Bundle analyzer for production builds
    ...(mode === "production" && process.env.ANALYZE ? [
      visualizer({
        filename: "bundle-analysis.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      })
    ] : [])
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    // Production optimizations
    minify: mode === "production" ? "esbuild" : false,
    sourcemap: mode === "production" ? false : true,
    target: "esnext",
    // Simplified rollup options
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo: any) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `img/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    // Asset inlining threshold
    assetsInlineLimit: 4096,
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "axios",
      "lucide-react",
      "clsx",
      "tailwind-merge"
    ],
  },
  // Development server optimizations
  server: mode === "development" ? {
    host: true, // Allow external connections
    fs: {
      // Restrict file system access for security
      strict: true,
    },
  } : undefined,
  // Vercel-specific configuration
  define: {
    // Ensure environment variables are available at build time
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  // Explicitly load environment variables for Vite
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  // Load environment variables from .env files
  envDir: '.',
}));
