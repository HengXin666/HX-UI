/**
 * 构建发布包 @hx/ui 到 dist/.  Run: node scripts/build-lib.ts   (Node 22.18+, 直接跑 TS)
 *
 *   1. JS      vite build -c vite.lib.config.ts   (ESM, preserveModules, 依赖全 external)
 *   2. 类型    tsc -p tsconfig.lib.json           (只出 .d.ts)
 *   3. 改写    .d.ts 里的 "@/x" 改成相对路径, 相对路径补上 .js 后缀 (nodenext 使用方也能解析)
 *   4. 样式    dist/styles.css   预编译 (@tailwindcss/cli 扫 src/), 不装 Tailwind 也能用
 *              dist/tailwind.css 给 Tailwind v4 使用方: 令牌 + @theme + @source 指向 dist (不含 dist/blueprint)
 *              蓝图拓展包另出两份: dist/blueprint.css (Tailwind v4 入口, @source 只指 dist/blueprint)
 *                                  dist/blueprint/styles.css (预编译, 配 styles.css 用)
 *              dist/fonts.css    可选, Geist 字体 (@fontsource-variable/*)
 *   5. 校验    scripts/check-client.ts --dist: 源码带 "use client" 的模块, 产物逐文件保留指令; 不带的也没被加上
 * 不引新依赖: 改写脚本就是下面几十行.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const bin = (name: string) => join(ROOT, "node_modules", ".bin", name);
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit" });
const step = (s: string) => console.log(`\n[build:lib] ${s}`);

function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

rmSync(DIST, { recursive: true, force: true });

step("JS (vite library mode)");
run(bin("vite"), ["build", "-c", "vite.lib.config.ts"]);

step("类型声明 (tsc -p tsconfig.lib.json)");
run(bin("tsc"), ["-p", "tsconfig.lib.json"]);

step("改写 .d.ts 路径");
const toRel = (fromFile: string, target: string) => {
  let r = relative(dirname(fromFile), target).replace(/\\/g, "/");
  if (!r.startsWith(".")) r = "./" + r;
  return r;
};
/** dist 里的目标 (不带后缀) -> 带 .js 的具体文件 */
const withExt = (abs: string): string | null => {
  if (existsSync(abs + ".d.ts") || existsSync(abs + ".js")) return abs + ".js";
  if (existsSync(join(abs, "index.d.ts"))) return join(abs, "index.js");
  if (/\.js$/.test(abs) && existsSync(abs)) return abs;
  return null;
};
const SPEC = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])([^"']+)\2/g;
let rewritten = 0;
const unresolved: string[] = [];
for (const file of walk(DIST).filter((f) => f.endsWith(".d.ts"))) {
  const src = readFileSync(file, "utf8");
  // tsc 会把 `import "./x.css"` 原样留在 .d.ts 里; 包里不带组件级 CSS, 删掉
  const out = src.replace(/^import\s+["'][^"']+\.css["'];?[ \t]*\r?\n?/gm, "").replace(SPEC, (all, pre: string, q: string, spec: string) => {
    let abs: string | null = null;
    if (spec.startsWith("@/")) abs = join(DIST, spec.slice(2));
    else if (spec === "." || spec === ".." || spec.startsWith("./") || spec.startsWith("../")) abs = resolve(dirname(file), spec);
    else return all;
    const target = withExt(abs.replace(/\.(js|ts|tsx)$/, ""));
    if (!target) {
      unresolved.push(`${relative(DIST, file)}: ${spec}`);
      return all;
    }
    return `${pre}${q}${toRel(file, target)}${q}`;
  });
  if (out !== src) {
    writeFileSync(file, out);
    rewritten++;
  }
}
console.log(`  ${rewritten} 个 .d.ts 已改写`);
if (unresolved.length) {
  console.error("  解析不到的导入:\n  " + unresolved.join("\n  "));
  process.exit(1);
}

step("样式 (styles.css 预编译 / tailwind.css / fonts.css)");
run(bin("tailwindcss"), ["-i", "src/styles/lib.css", "-o", "dist/styles.css", "--minify"]);
run(bin("tailwindcss"), ["-i", "src/styles/blueprint-lib.css", "-o", "dist/blueprint/styles.css", "--minify"]);
const copies: [string, string][] = [
  ["src/styles/theme.css", "dist/styles/theme.css"],
  ["src/styles/effects.css", "dist/styles/effects.css"],
  ["src/blueprint/ui/blueprint.css", "dist/blueprint/ui/blueprint.css"],
  ["src/components/ui/spin.css", "dist/components/ui/spin.css"],
];
for (const [from, to] of copies) {
  mkdirSync(dirname(join(ROOT, to)), { recursive: true });
  copyFileSync(join(ROOT, from), join(ROOT, to));
}
// 蓝图是拓展包: 核心入口的 @source 逐个列出 dist 下除 blueprint/ 以外的目录 (不用 `@source not`,
// 免得它把使用方另引的 blueprint.css 里的 @source 也排除掉).
// dist 根上的 index.js 只做再导出, 没有类名, 不列: 实测 (tailwindcss 4.3.5) 根上的 "./*.js" 或 "./index.js"
// 会让整个 dist 被扫描, 蓝图的工具类又回到核心 CSS 里.
const EXTENSIONS = new Set(["blueprint"]);
const coreSources = readdirSync(DIST)
  .filter((d) => statSync(join(DIST, d)).isDirectory() && !EXTENSIONS.has(d))
  .sort()
  .map((d) => `@source "./${d}/**/*.js";`);
writeFileSync(
  join(DIST, "tailwind.css"),
  `/*
 * @hx/ui 2 · 给 Tailwind v4 使用方的样式入口. 用法 (你自己的 CSS 里):
 *   @import "tailwindcss";
 *   @import "@hx/ui/tailwind.css";
 *   @import "@hx/ui/blueprint.css";   (只在用蓝图时)
 * 带上令牌 (:root / .dark), @theme 映射, 基础样式, 特效关键帧, Spin 的样式;
 * 组件用到的工具类由你的 Tailwind 扫描下面的 @source 生成 (不要再引 styles.css). 不含蓝图.
 */
@import "./styles/theme.css";
@import "./components/ui/spin.css";
${coreSources.join("\n")}
`,
);
writeFileSync(
  join(DIST, "blueprint.css"),
  `/*
 * @hx/ui 2 · 蓝图拓展包的 Tailwind v4 样式入口, 排在 tailwind.css 之后:
 *   @import "tailwindcss";
 *   @import "@hx/ui/tailwind.css";
 *   @import "@hx/ui/blueprint.css";
 * 带上蓝图样式 (--bp-* 令牌, 画布, 节点), 并让你的 Tailwind 扫描蓝图用到的工具类.
 * 不用 Tailwind 的项目改引 "@hx/ui/blueprint/styles.css" (预编译, 排在 styles.css 之后).
 */
@import "./blueprint/ui/blueprint.css";
@source "./blueprint/**/*.js";
`,
);
writeFileSync(
  join(DIST, "fonts.css"),
  `/* @hx/ui 2 · 可选: Geist / Geist Mono 字体 (令牌里 --font-sans / --font-mono 的首选). 需要打包器解析 CSS @import. */
@import "@fontsource-variable/geist";
@import "@fontsource-variable/geist-mono";
`,
);

const leftover = walk(DIST).filter((f) => /\.(js|d\.ts)$/.test(f) && /(from\s*|import\s*\(\s*|import\s+)["']@\//.test(readFileSync(f, "utf8")));
if (leftover.length) {
  console.error("[build:lib] 产物里还有 @/ 导入:\n  " + leftover.map((f) => relative(DIST, f)).join("\n  "));
  process.exit(1);
}
step('"use client" 逐文件核对 (scripts/check-client.ts --dist)');
run(process.execPath, [join(ROOT, "scripts", "check-client.ts"), "--dist"]);

const files = walk(DIST);
const kb = files.reduce((n, f) => n + statSync(f).size, 0) / 1024;
console.log(`\n[build:lib] 完成: ${files.length} 个文件, ${kb.toFixed(0)} KB -> dist/`);
