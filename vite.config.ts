import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import Sitemap from "vite-plugin-sitemap"; // 1. Added this import

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
    // 2. Added the Sitemap plugin here
    Sitemap({ 
      hostname: "https://newnarayanaschool.netlify.app",
      dynamicRoutes: ["/", "/about", "/contact"], // Add your specific routes
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    minify: "esbuild",
    sourcemap: mode === "development",
  },
}));