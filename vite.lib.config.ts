/**
 * 发布包 (@hx/ui) 的 JS 构建: Vite 库模式, ESM, preserveModules (一个源文件对应一个产物, 使用方按需摇树).
 * - 所有第三方依赖 external, 只打 src/ 自己的代码; "@/" 别名在这里解析成相对路径.
 * - 组件里的 `import "./x.css"` 在包里去掉: 样式统一走 "@hx/ui/styles.css" 或 "@hx/ui/tailwind.css".
 * - 文件顶部的 "use client" 保留 (Rolldown 会丢模块级指令, renderChunk 里补回).
 * - 动态 import (蓝图懒加载面板, 3D 场景, 中国地图数据) 保持动态, 在使用方那里照样是按需分包.
 * 类型声明另由 tsc -p tsconfig.lib.json 产出, 见 scripts/build-lib.ts.
 */
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = fileURLToPath(new URL("./src", import.meta.url));

/** src 下每个 .ts / .tsx 都是入口 (类型测试除外), 这样每个模块的导出签名都完整保留. */
function entries(dir = SRC, out: Record<string, string> = {}) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) entries(p, out);
    else if (/\.tsx?$/.test(f) && !/\.(typetest|test|d)\.tsx?$/.test(f)) out[relative(SRC, p).replace(/\.tsx?$/, "")] = p;
  }
  return out;
}

function libPlugin(): Plugin {
  const client = new Set<string>();
  return {
    name: "hx-lib",
    enforce: "pre",
    transform(code, id) {
      if (!/\.[jt]sx?$/.test(id) || id.includes("node_modules")) return;
      if (/^\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(code)) client.add(id);
      // 组件里的样式导入: 包里由 styles.css / tailwind.css 统一提供
      const stripped = code.replace(/^import\s+["'][^"']+\.css["'];?[ \t]*$/gm, "");
      return stripped === code ? undefined : { code: stripped, map: null };
    },
    renderChunk(code, chunk) {
      const id = chunk.facadeModuleId;
      if (id && client.has(id) && !/^["']use client["']/.test(code)) return { code: `"use client";\n${code}`, map: null };
    },
  };
}

export default defineConfig({
  plugins: [react(), libPlugin()],
  resolve: { alias: { "@": SRC } },
  logLevel: "warn",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    copyPublicDir: false,
    target: "es2022",
    lib: { entry: entries(), formats: ["es"] },
    rollupOptions: {
      // 只有 src 内的相对路径 / "@/" / 绝对路径是自己的代码, 其余一律 external
      external: (id) => !(id.startsWith(".") || id.startsWith("/") || id.startsWith("@/") || id.startsWith("\0") || /^[A-Za-z]:[\\/]/.test(id)),
      output: {
        preserveModules: true,
        preserveModulesRoot: SRC,
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
      },
    },
  },
});
