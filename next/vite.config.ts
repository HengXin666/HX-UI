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
  // 只从文档站入口扫依赖; sites/_standalone/index.html 属于 build:site, 它的 @site-page 别名这里没有
  optimizeDeps: { entries: ["index.html"] },
  build: { outDir: "dist-site", chunkSizeWarningLimit: 600 },
});
