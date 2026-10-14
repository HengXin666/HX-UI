import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { existsSync } from "node:fs";

// 兄弟目录 HX-Blueprint-Demo 是父仓的普通目录, 单独 clone 本仓时不存在; 此时退到仓内替身, 构建不因外部目录缺席而失败
const blueprintDemo = path.resolve(import.meta.dirname, "../../HX-Blueprint-Demo/src/index.ts");
const blueprintDemoEntry = existsSync(blueprintDemo)
  ? blueprintDemo
  : path.resolve(import.meta.dirname, "src/blueprint-demo-fallback/index.tsx");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // 直接指向源码, 改库能立即在文档里看到, 不必先 pack
      "@hx/ui": path.resolve(import.meta.dirname, "../src/index.ts"),
      "@hx/blueprint-demo": blueprintDemoEntry,
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
  /**
   * 多入口: 蓝图是一个**真正独立的 HTML 页面**, 不是文档站的一个路由。
   *
   * 为什么: 全屏要的是"整屏都归蓝图"。嵌在文档站里时, 侧栏、顶栏、
   * 内容区滚动容器都在, 再怎么做全屏也只是"画布变大", 而用户真正想要的是
   * 一个干净的、只有图的页面。独立入口还能直接用浏览器原生的窗口管理
   * (新标签页 / 独立窗口 / 分屏), 比自己实现一套覆盖层强。
   */
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, "index.html"),
        blueprint: path.resolve(import.meta.dirname, "blueprint.html"),
      },
    },
  },
});
