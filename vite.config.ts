import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Content Security Policy for production builds. Lovable hosting can't send response
// headers, so it goes in a <meta> tag (which can't express frame-ancestors; main.tsx
// guards against framing instead). Not applied to the dev server: Vite's dev client
// needs an inline script, and the Lovable editor preview runs on it.
// Adding an outside service? Add its origin here and to the privacy policy.
const CSP = [
  "default-src 'self'",
  // The hash is next-themes' inline theme script, which prerendered pages contain.
  // ponytail: if next-themes changes that script, the hash goes stale and dark-mode users see a
  // brief flash on prerendered pages; recompute it from dist/*/index.html.
  "script-src 'self' https://challenges.cloudflare.com 'sha256-eMuh8xiwcX72rRYNAGENurQBAcH7kLlAUQcoOri3BIo='",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://ptfrzwsivtetvmdotfui.supabase.co wss://ptfrzwsivtetvmdotfui.supabase.co https://*.ingest.de.sentry.io https://tile.openstreetmap.org https://nominatim.openstreetmap.org https://api.pwnedpasswords.com https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const cspMeta = {
  name: "csp-meta",
  apply: "build" as const,
  transformIndexHtml: (html: string) =>
    html.replace("<head>", `<head>
    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), cspMeta, mode === "development" && componentTagger()].filter(Boolean),
  // Prevent duplicate instances of React / React Router that can break context
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-router-dom",
      "@tanstack/react-query",
      "@tanstack/react-query-devtools",
      "react-helmet-async",
      "next-themes",
      "react-i18next",
      "i18next",
      "i18next-browser-languagedetector",
    ],
    force: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react-router-dom"],
  },
  build: {
    // Chunk splitting for better caching & smaller initial load
    rollupOptions: {
      output: {
        // Vite 8/Rolldown accepts a function, not Rollup's object shorthand.
        manualChunks(id) {
          const packagePath = id.replace(/\\/g, '/').split('/node_modules/').pop();
          if (!packagePath || packagePath === id) return;
          const chunks: Record<string, string[]> = {
          // Core React ecosystem - changes rarely
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Heavy charting library
          'vendor-recharts': ['recharts'],
          // Map library - only loaded on map pages
          'vendor-maps': ['maplibre-gl'],
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
          };
          return Object.entries(chunks).find(([, packages]) =>
            packages.some(pkg => packagePath === pkg || packagePath.startsWith(`${pkg}/`))
          )?.[0];
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
