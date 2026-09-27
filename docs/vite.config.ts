import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // 直接指向源码, 改库能立即在文档里看到, 不必先 pack
      "@hx/ui": path.resolve(import.meta.dirname, "../src/index.ts"),
    },
    /**
     * 关键: 强制单一 React 实例。
     *
     * 上面那条 alias 让库源码从 ../ 目录被解析, 于是它 import "react" 时会走到
     * ../node_modules/react —— 和本工程那份不是同一个实例, 结果就是
     * "Cannot read properties of null (reading 'useState')"。
     * 组件库与它的使用方各带一份 React 是这类错误最常见的原因;
     * dedupe 比把库的 node_modules 删掉更稳, 因为开发时那份是给类型与本地测试用的。
     */
    dedupe: ["react", "react-dom"],
  },
  server: { host: "127.0.0.1", port: 5600 },
  build: { outDir: "dist", emptyOutDir: true },
});
