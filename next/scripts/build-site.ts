/**
 * 把一套成品单独构建成可部署的静态站, 并预渲染 HTML:
 *   dist-sites/<id>/index.html (含首屏 HTML) + assets/
 * 页面需导出 meta: { title, description, themeColor, icon }.
 * 用法: node --experimental-strip-types scripts/build-site.ts <id> [--dev]
 */
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { build, createServer, type InlineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { NEXT, closure } from "./lib/closure.ts";

const id = process.argv[2];
if (!id) throw new Error("用法: build-site.ts <id>");
const outDir = join(NEXT, "dist-sites", id);

const config = (extra: InlineConfig = {}): InlineConfig => ({
  configFile: false,
  root: join(NEXT, "sites/_standalone"),
  base: "./",
  logLevel: "warn",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@site-page": join(NEXT, "sites", id, "page.tsx"),
      "@sites": join(NEXT, "sites"),
      "@": join(NEXT, "src"),
    },
  },
  ...extra,
});

// Tailwind 只扫这套成品真正 import 到的文件 (依赖闭包), 不扫整个 src: CSS 只带用得上的类.
// 生成到 _standalone/entry.css (已忽略), client.tsx 引它.
const standalone = join(NEXT, "sites/_standalone");
const used = closure(id, ["src/motion/provider.tsx", "src/hooks/use-theme.tsx"]).files.filter((f) => /\.tsx?$/.test(f));
writeFileSync(
  join(standalone, "entry.css"),
  ["/* 由 scripts/build-site.ts 生成, 勿手改 */", '@import "../../src/styles/globals.css" source(none);', ...used.map((f) => `@source "${relative(standalone, f)}";`), ""].join("\n"),
);

if (process.argv.includes("--dev")) {
  const server = await createServer(config({ server: { port: 5180 } }));
  await server.listen();
  server.printUrls();
} else {
  await build(config({ build: { outDir, emptyOutDir: true, sourcemap: process.argv.includes("--map") } }));
  // 放在项目里, SSR 包里的 react 等依赖才能从 node_modules 解析
  const ssrOut = join(NEXT, "node_modules/.cache", `hx-ssr-${id}`);
  await build(config({ build: { ssr: "server.tsx", outDir: ssrOut, emptyOutDir: true, rollupOptions: { output: { entryFileNames: "server.mjs" } } } }));
  const { render, meta } = await import(pathToFileURL(join(ssrOut, "server.mjs")).href);
  const file = join(outDir, "index.html");
  const html = readFileSync(file, "utf8")
    .replaceAll("%SITE%", id)
    .replace("%TITLE%", meta.title)
    .replace("%DESCRIPTION%", meta.description)
    .replace("%THEME_COLOR%", meta.themeColor)
    .replace("%ICON%", meta.icon)
    .replace("<!--app-html-->", render());
  // 首屏 CSS 直接内联: 落地页少一次阻塞渲染的往返 (慢网下约 0.3 到 0.5 秒). 字体等相对路径改成相对 index.html.
  const inlined = html.replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+\.css)"[^>]*>/, (_, name: string) => {
    const css = readFileSync(join(outDir, "assets", name), "utf8").replaceAll("url(./", "url(./assets/");
    return `<style>${css}</style>`;
  });
  writeFileSync(file, inlined);
  rmSync(ssrOut, { recursive: true, force: true });
  console.log(`dist-sites/${id}/index.html 已预渲染并内联 CSS (${(inlined.length / 1024).toFixed(1)} KB)`);
}
