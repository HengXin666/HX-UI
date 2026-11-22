import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@site": fileURLToPath(new URL("./site/src", import.meta.url)),
      "@sites": fileURLToPath(new URL("./sites", import.meta.url)),
    },
  },
  build: { outDir: "dist-site", chunkSizeWarningLimit: 600 },
});
