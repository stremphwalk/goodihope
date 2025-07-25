import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, URL } from "node:url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { visualizer } from "rollup-plugin-visualizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async ({ mode }) => ({
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
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
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
    // Rollup options for better tree shaking and code splitting
    rollupOptions: {
      output: {
        // Code splitting strategy
        manualChunks: {
          // React ecosystem
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // UI libraries
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu", 
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip"
          ],
          // Data fetching and state
          "data-vendor": ["@tanstack/react-query", "axios"],
          // Form and validation
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          // Large UI component libraries
          "chart-vendor": ["recharts"],
          "date-vendor": ["react-datepicker", "date-fns"],
          // Icons and styling
          "style-vendor": ["lucide-react", "clsx", "tailwind-merge"],
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo: any) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.\w+$/, '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
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
      // Improve tree shaking
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
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
    fs: {
      // Restrict file system access for security
      strict: true,
    },
  } : undefined,
}));
