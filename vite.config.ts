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
    // The isolated mobile preview is nested under GitHub Pages. Keep Pixi and
    // its browser runtime in the initial script so the preview cannot fail on
    // a delayed secondary browserAll/webworker chunk.
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
