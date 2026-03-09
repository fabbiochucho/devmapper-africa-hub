import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  // Prevent duplicate instances of React / React Router that can break context
  optimizeDeps: {
    include: ["react", "react-dom", "react-router", "react-router-dom"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
  },
  build: {
    // Chunk splitting for better caching & smaller initial load
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React ecosystem - changes rarely
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Heavy charting library
          'vendor-recharts': ['recharts'],
          // Map libraries - only loaded on map pages
          'vendor-maps': ['leaflet', 'react-leaflet', 'maplibre-gl'],
          // UI framework
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
          ],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // Data management
          'vendor-query': ['@tanstack/react-query'],
          // Form handling
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
    // Increase chunk size warning limit slightly since we now have controlled splitting
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging
    sourcemap: mode === 'development',
    // CSS code splitting
    cssCodeSplit: true,
    // Minification
    minify: 'esbuild',
    // Target modern browsers for smaller output
    target: 'es2020',
  },
}));
