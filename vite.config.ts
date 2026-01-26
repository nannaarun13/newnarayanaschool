import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

// Standard way to define __dirname in ESM for reliable Vercel builds
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Lovable tagger removed as requested
  ].filter(Boolean),
  resolve: {
    alias: {
      // Direct alias for Narayana School source files
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Standard Vercel output directory
    outDir: "dist",
    // Clean up console logs in production for Narayana School deployment
    minify: "esbuild",
    sourcemap: mode === "development",
  },
}));