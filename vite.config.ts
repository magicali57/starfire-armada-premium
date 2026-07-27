import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Relative base so the build works when hosted from any nested
// GitHub Pages path (e.g. https://user.github.io/repo/games/starfire-armada/).
export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // The isolated mobile preview is hosted inside a nested GitHub Pages path.
    // Pixi otherwise produces runtime browserAll / webworker chunks whose CDN
    // propagation can lag behind index.html and cause a dynamic-import 404.
    // Keep the test build self-contained so every required module arrives in
    // the initial script. This changes preview packaging only, not gameplay.
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
