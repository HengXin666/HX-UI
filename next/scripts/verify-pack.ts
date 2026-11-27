/**
 * 检查 npm pack 出来的 tarball 能不能发.  Run (在 next/ 里):
 *   npm run build:lib && npm pack --json --ignore-scripts > pack.json && node scripts/verify-pack.ts
 * 也可以直接给 tarball 路径: node scripts/verify-pack.ts hx-ui-2.0.0.tgz
 *
 * 检查项 (任一失败 exit 1):
 *   1. package.json 的 exports 每个目标都在包里; 通配 ("./ui/*") 至少命中一个
 *   2. 每个 JS 入口都有同名 .d.ts; 其余 JS 只允许内部模块 (_virtual/, 数据文件) 没有 .d.ts
 *   3. JS 和 .d.ts 里没有残留的 "@/" 导入; 相对导入都能在包里找到文件
 *   4. JS 里的裸导入都在 dependencies / peerDependencies 里声明过
 *   5. 不带 site/, src/, dist-site/, tsbuildinfo 等文档站或构建垃圾
 *   6. styles.css 是预编译的核心样式 (令牌 + .dark + 关键帧), tailwind.css 带 @source; 两者都不含蓝图.
 *      蓝图拓展包: blueprint/styles.css 预编译 (只含蓝图, 不重复 Preflight / 令牌), blueprint.css 带指向 blueprint/ 的 @source;
 *      根入口 index.js 不引蓝图. Agent 拓展包同理: agent/styles.css 预编译, agent.css 的 @source 只指 agent/
 *   7. "use client" 只出现在文件第一行 (RSC 打包器只认这里); 服务端安全的入口 (theme, utils, 图表工具) 不带
 * 最后打印体积报告.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

// ---- 找 tarball
let tgz = process.argv[2];
if (!tgz) {
  const packJson = join(ROOT, "pack.json");
  if (!existsSync(packJson)) {
    console.error("verify-pack: 没有 pack.json, 先跑 npm pack --json --ignore-scripts > pack.json (或传 tarball 路径)");
    process.exit(1);
  }
  const info = JSON.parse(readFileSync(packJson, "utf8"));
  // npm <= 11: [{ filename }]; npm 12: { "<name>": { filename } }
  const entry = Array.isArray(info) ? info[0] : "filename" in info ? info : Object.values<{ filename: string }>(info)[0];
  tgz = entry.filename;
}
tgz = resolve(ROOT, tgz);
if (!existsSync(tgz)) {
  console.error(`verify-pack: 找不到 ${tgz}`);
  process.exit(1);
}

// ---- 解包
const tmp = mkdtempSync(join(tmpdir(), "hx-ui-pack-"));
execFileSync("tar", ["-xzf", tgz, "-C", tmp]);
const PKG = join(tmp, "package");
function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const files = walk(PKG).map((f) => relative(PKG, f).replace(/\\/g, "/"));
const has = new Set(files);
const pkg = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8"));
console.log(`verify-pack: ${pkg.name}@${pkg.version}  (${files.length} 个文件)`);

// ---- 1 + 2. exports
const entryJs = new Set<string>();
const strip = (p: string) => p.replace(/^\.\//, "");
for (const [key, target] of Object.entries<Record<string, string> | string>(pkg.exports ?? {})) {
  const targets = typeof target === "string" ? { default: target } : target;
  for (const [cond, t] of Object.entries(targets)) {
    const path = strip(t);
    if (path.includes("*")) {
      const re = new RegExp("^" + path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace("*", "([^/]+)") + "$");
      const hits = files.filter((f) => re.test(f));
      if (!hits.length) fail(`exports["${key}"].${cond} -> ${t}: 包里一个都没匹配到`);
      if (cond === "default") hits.forEach((h) => entryJs.add(h));
    } else {
      if (!has.has(path)) fail(`exports["${key}"].${cond} -> ${t}: 包里没有这个文件`);
      if (cond === "default" && path.endsWith(".js")) entryJs.add(path);
    }
  }
}
for (const js of entryJs) if (!has.has(js.replace(/\.js$/, ".d.ts"))) fail(`入口 ${js} 没有 .d.ts`);
const internalNoDts = /^dist\/(_virtual\/|data\/charts\/geo\/)/;
const jsFiles = files.filter((f) => f.endsWith(".js"));
const dtsFiles = files.filter((f) => f.endsWith(".d.ts"));
for (const js of jsFiles) {
  if (!has.has(js.replace(/\.js$/, ".d.ts")) && !internalNoDts.test(js)) fail(`${js} 没有 .d.ts`);
}

// ---- 3 + 4. 导入
const declared = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})]);
const SPEC = /(?:^|[\s;])(?:import|export)\s[^"'`;]*?from\s*["']([^"']+)["']|(?:^|[\s;])import\s*["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/gm;
const bareUsed = new Map<string, number>();
for (const f of [...jsFiles, ...dtsFiles]) {
  const code = readFileSync(join(PKG, f), "utf8");
  for (const m of code.matchAll(SPEC)) {
    const spec = m[1] ?? m[2] ?? m[3];
    if (spec.startsWith("@/")) {
      fail(`${f}: 残留 "@/" 导入 ${spec}`);
      continue;
    }
    if (spec.startsWith(".")) {
      const target = relative(PKG, resolve(dirname(join(PKG, f)), spec)).replace(/\\/g, "/");
      if (!has.has(target)) fail(`${f}: 相对导入 ${spec} 在包里找不到`);
      continue;
    }
    if (f.endsWith(".js")) {
      const name = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
      bareUsed.set(name, (bareUsed.get(name) ?? 0) + 1);
      if (!declared.has(name)) fail(`${f}: 用了 "${spec}", 但 ${name} 不在 dependencies / peerDependencies`);
    }
  }
}

// ---- 5. 不该进包的东西
for (const f of files) {
  if (/^(site|src|dist-site|dist-sites|docs|tests|scripts|node_modules)\//.test(f) || /\.tsbuildinfo$|(^|\/)pack\.json$|\.tgz$/.test(f)) fail(`不该进包: ${f}`);
}

// ---- 6. 样式
const css = (p: string) => (has.has(p) ? readFileSync(join(PKG, p), "utf8") : "");
const styles = css("dist/styles.css");
const mustStyles: [string, RegExp][] = [
  ["令牌 --brand", /--brand:/],
  ["暗色 .dark", /\.dark\s*\{|\.dark\{/],
  ["Tailwind 工具类 (.bg-background)", /\.bg-background[{,\s]/],
  ["特效关键帧", /@keyframes\s*hx-/],
  ["Preflight", /box-sizing:\s*border-box/],
];
for (const [what, re] of mustStyles) if (!re.test(styles)) fail(`styles.css 缺 ${what}`);
const BP_TOKEN = /--bp-graph-bg/;
if (BP_TOKEN.test(styles)) fail("styles.css 不应带蓝图样式 (蓝图是拓展包, 走 blueprint/styles.css)");
const bpStyles = css("dist/blueprint/styles.css");
if (!BP_TOKEN.test(bpStyles)) fail("blueprint/styles.css 缺蓝图样式 --bp-graph-bg");
if (/box-sizing:\s*border-box/.test(bpStyles) || /--brand:/.test(bpStyles)) fail("blueprint/styles.css 不应再带 Preflight 或核心令牌 (由 styles.css 提供)");
// 只去掉行首开始的注释块: "@source \"./x/**/*.js\"" 里的 "/**/" 不是注释
const noComments = (s: string) => s.replace(/^\s*\/\*[\s\S]*?\*\//gm, "");
const sourcesOf = (s: string) => [...s.matchAll(/@source\s+["']([^"']+)["']/g)].map((m) => m[1]);
const checkTwEntry = (name: string) => {
  const text = noComments(css(name));
  if (!sourcesOf(text).length) fail(`${name} 没有 @source`);
  if (/@import\s+["']tailwindcss["']/.test(text)) fail(`${name} 不应自己引 tailwindcss (由使用方引)`);
  for (const m of text.matchAll(/@import\s+["'](\.[^"']+)["']/g)) if (!has.has(join(dirname(name), strip(m[1])).replace(/\\/g, "/"))) fail(`${name} 引了不存在的 ${m[1]}`);
  return text;
};
const tw = checkTwEntry("dist/tailwind.css");
if (/blueprint/.test(tw)) fail("tailwind.css 不应引蓝图样式或扫描 blueprint/ (蓝图走 blueprint.css)");
// 每条都得是 "./<目录>/**/*.js": dist 根上的源 ("./**/*.js", "./*.js", "./index.js") 会让整个 dist 被扫, 把蓝图带回来
for (const s of sourcesOf(tw)) if (!/^\.\/[^/*]+\/\*\*\/\*\.js$/.test(s)) fail(`tailwind.css 的 @source ${s} 会扫到整个 dist (含 blueprint/)`);
const bpTw = checkTwEntry("dist/blueprint.css");
if (!sourcesOf(bpTw).every((s) => s.startsWith("./blueprint/"))) fail("blueprint.css 的 @source 只应指向 ./blueprint/");
if (/\bblueprint\//.test(css("dist/index.js"))) fail("根入口 index.js 不应引蓝图 (蓝图从 @hx/ui/blueprint/* 引)");
// Agent 拓展包
const AGENT_TOKEN = /--hx-code-bg/;
if (AGENT_TOKEN.test(styles)) fail("styles.css 不应带 Agent 样式 (Agent 是拓展包, 走 agent/styles.css)");
const agentStyles = css("dist/agent/styles.css");
if (!AGENT_TOKEN.test(agentStyles)) fail("agent/styles.css 缺 Agent 样式 --hx-code-bg");
if (/box-sizing:\s*border-box/.test(agentStyles) || /--brand:/.test(agentStyles)) fail("agent/styles.css 不应再带 Preflight 或核心令牌 (由 styles.css 提供)");
if (/\bagent\//.test(tw)) fail("tailwind.css 不应引 Agent 样式或扫描 agent/ (Agent 走 agent.css)");
const agentTw = checkTwEntry("dist/agent.css");
if (!sourcesOf(agentTw).every((s) => s.startsWith("./agent/"))) fail("agent.css 的 @source 只应指向 ./agent/");
if (/\bagent\//.test(css("dist/index.js"))) fail("根入口 index.js 不应引 Agent 拓展包 (从 @hx/ui/agent 引)");

// ---- 7. "use client"
const DIRECTIVE = /^["']use client["'];?\s*$/;
let clientJs = 0;
for (const f of jsFiles) {
  const lines = readFileSync(join(PKG, f), "utf8").split("\n");
  if (DIRECTIVE.test(lines[0].trim())) clientJs++;
  else if (lines.some((l) => DIRECTIVE.test(l.trim()))) fail(`${f}: "use client" 不在第一行, 打包器会忽略`);
}
if (clientJs === 0) fail('包里一个带 "use client" 的模块都没有, build:lib 的指令补回失效了');
for (const f of ["dist/hooks/theme.js", "dist/hooks/theme-script.js", "dist/lib/utils.js", "dist/data/charts/helpers.js", "dist/blueprint/index.js", "dist/agent/index.js", "dist/agent/code/highlight.js", "dist/agent/markdown/fence.js"]) {
  if (has.has(f) && DIRECTIVE.test(readFileSync(join(PKG, f), "utf8").split("\n", 1)[0].trim())) fail(`${f} 应该是服务端安全的, 却带了 "use client"`);
}

// ---- 体积报告
const size = (f: string) => statSync(join(PKG, f)).size;
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
const byDir = new Map<string, number>();
for (const f of files) {
  const parts = f.split("/");
  const key = parts[0] === "dist" && parts.length > 2 ? `dist/${parts[1]}/` : f;
  byDir.set(key, (byDir.get(key) ?? 0) + size(f));
}
const unpacked = files.reduce((n, f) => n + size(f), 0);
console.log(`\n体积: tarball ${kb(statSync(tgz).size)}, 解包 ${kb(unpacked)}, JS ${jsFiles.length} 个 / .d.ts ${dtsFiles.length} 个, 入口 ${entryJs.size} 个, "use client" 模块 ${clientJs} 个`);
for (const [k, v] of [...byDir].sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`  ${kb(v).padStart(10)}  ${k}`);
console.log("  最大的文件:");
for (const f of [...files].sort((a, b) => size(b) - size(a)).slice(0, 6)) console.log(`  ${kb(size(f)).padStart(10)}  ${f}`);
console.log(`  运行时裸依赖: ${[...bareUsed.keys()].sort().join(", ")}`);

rmSync(tmp, { recursive: true, force: true });
if (errors.length) {
  console.error(`\nverify-pack: ${errors.length} 个问题`);
  for (const e of errors.slice(0, 60)) console.error("  x " + e);
  process.exit(1);
}
console.log("\nverify-pack: OK");
