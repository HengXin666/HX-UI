#!/usr/bin/env node
/**
 * 文档注册表对账。
 *
 * ## 拦什么
 *
 * 文档站把一个页面拆成**五处**各自独立的声明, 它们必须同时存在:
 *
 *   docs/src/nav.ts        页面 id + 标题 (导航里能看见, check-smoke 的页面清单也取自这里)
 *   docs/src/App.tsx       页面 id → 组件 的分支
 *   docs/src/App.tsx       import 的页面组件 ↔ docs/src/pages/*.tsx 文件
 *   docs/src/navIcons.ts   页面 id → 图标
 *   src/index.ts           组件文件 → 对外导出
 *
 * ## 为什么必须机械化 (这条是实测出来的, 不是想当然)
 *
 * App.tsx 的 `renderPage` 有一个 `default:` 分支返回 `PlaceholderPage`。它的本意是
 * "还没写文档的占位", 但实际效果是: **在 nav 里加了 id 而 App 忘了加 case 时,
 * 页面照样渲染、有 h1、DOM 体积达标** 
 *
 *   实测 (2026-10-04): 往 nav.ts 注入一个没有 case 的 id, `check-smoke` 输出
 *   「41/41 页渲染正常」并 exit 0。**幽灵页完美通过了唯一会打开浏览器的门禁。**
 *
 * 也就是说这是"渲染正常但内容不是你要的"这一类故障, 冒烟抓不到它, 只有对账能抓。
 * 同理: 图标写错名 → 那个位置静默留白 (由 check-icons 拦名字, 由本脚本拦"键有没有对应页面");
 * 组件写好了但忘了从 index.ts 导出 → 使用方 `import { X } from "@hx/ui"` 直接失败。
 *
 * ## 扫描根
 *
 * 读 CHECK_UI_ROOT (默认仓库根)  负向探针靠它把夹具指到临时目录。
 *
 * ## 两种页面登记写法 (2026-10-18 起并存)
 *
 *   nav.ts   旧写法 `{ id: "x" }` 与新写法 多行清单里的 `x ~ 标签 ~ 说明` (docs/src/spec.ts 解析)
 *   路由     App.tsx 的 `case "x":` 与 docs/src/pages/parity/index.ts 的 PARITY_PAGES 键 (default 分支查表)
 *   页面文件 docs/src/pages/*.tsx 由 App.tsx 引用; 带 index.ts 的子目录 (parity/) 里的 *.tsx 由该 index.ts 引用
 *
 * 同一个 id 同时出现在 case 与 PARITY_PAGES = 违规 (查表那份永远走不到)。
 *
 * 用法: node scripts/gates/frontend/check-docs-registry.mjs
 * 退出码: 0=通过 / 1=有违规 / 2=扫描根或输入坏了 (区别于"内容违规")
 */
import fs from "node:fs";
import path from "node:path";

const HERE = import.meta.dirname;
const ROOT = process.env.CHECK_UI_ROOT ? path.resolve(process.env.CHECK_UI_ROOT) : path.resolve(HERE, "..", "..", "..");

const NAV = path.join(ROOT, "docs", "src", "nav.ts");
const APP = path.join(ROOT, "docs", "src", "App.tsx");
const ICONS = path.join(ROOT, "docs", "src", "navIcons.ts");
const PAGES = path.join(ROOT, "docs", "src", "pages");
const INDEX = path.join(ROOT, "src", "index.ts");
const UTF8 = "utf8";
/** 子目录页面组的入口文件名 (pages/parity/index.ts 之类)。 */
const GROUP_ENTRY = "index.ts";
const PARITY_INDEX = path.join(PAGES, "parity", GROUP_ENTRY);
const TEMPLATE_INDEX = path.join(PAGES, "templates", GROUP_ENTRY);

function die(msg, code = 2) {
  console.error(`check-docs-registry: ${msg}`);
  process.exit(code);
}

for (const f of [NAV, APP, ICONS, INDEX]) {
  if (!fs.existsSync(f)) die(`找不到输入文件 ${path.relative(ROOT, f)} (扫描根 = ${ROOT})`);
}
if (!fs.existsSync(PAGES)) die(`找不到页面目录 docs/src/pages (扫描根 = ${ROOT})`);

const navSrc = fs.readFileSync(NAV, UTF8);
const appSrc = fs.readFileSync(APP, UTF8);
const iconSrc = fs.readFileSync(ICONS, UTF8);
const indexSrc = fs.readFileSync(INDEX, UTF8);

/**
 * 豁免: 少数页面的"页面 id 与图标表键名不同"之类的历史差异。
 * 每条必须**说明理由**, 且必须**当前真的还在豁免某样东西**  目标消失了还留着 = FAIL (陈旧条目)。
 */
const WHITELIST = path.join(ROOT, "scripts", "gates", "frontend", "docs-registry-allow.json");
let allow = { navWithoutIcon: [], navWithoutCase: [], unexportedModules: [] };
if (fs.existsSync(WHITELIST)) {
  try {
    allow = { ...allow, ...JSON.parse(fs.readFileSync(WHITELIST, UTF8)).allow };
  } catch (err) {
    die(`豁免文件无法解析: ${err.message}`);
  }
}

// ── 解析四张表 ────────────────────────────────────────────────────
/** nav.ts: `{ id: "x", ... }` 或多行清单里的 `x ~ 标签 ~ 说明` (与 scripts/check-smoke.ts 的 readPages 同一判据) */
const navIds = [
  ...navSrc.matchAll(/\{\s*id:\s*"([a-z0-9-]+)"/g),
  ...navSrc.matchAll(/^([a-z0-9-]+) ~ /gm),
].map((m) => m[1]);
/** App.tsx: case "x": (允许 fallthrough, 所以顺序收集) */
const switchIds = [...appSrc.matchAll(/case\s+"([a-z0-9-]+)":/g)].map((m) => m[1]);
/**
 * 查表 (PARITY_PAGES / TEMPLATE_PAGES) 的键: `"x": XPage` 或 `x: XPage`。只取 `表名 ... = {` 到第一个 `};` 之间,
 * 免得把文件里别的对象字面量当成路由。App.tsx 没引用该表时这张表视为空。
 * .agents/notes/implemented/feature/2026-10-18-docs-shadcn-site-pages.md
 */
function readTableIds(table, file) {
  if (!new RegExp(`\\b${table}\\b`).test(appSrc) || !fs.existsSync(file)) return [];
  const body = fs.readFileSync(file, UTF8).match(new RegExp(`${table}[^{]*\\{([\\s\\S]*?)\\n\\};`));
  if (!body) die(`找不到 ${table} 对象字面量 (${path.relative(ROOT, file)})`);
  return [...body[1].matchAll(/^\s*(?:"([a-z0-9-]+)"|([a-z][a-z0-9]*))\s*:/gm)].map((m) => m[1] ?? m[2]);
}
/** 模板页 (templates-*) 由 pages/templates 的 TEMPLATE_PAGES 单独登记, 与 PARITY_PAGES 同为 default 分支查表。 */
const parityIds = [...readTableIds("PARITY_PAGES", PARITY_INDEX), ...readTableIds("TEMPLATE_PAGES", TEMPLATE_INDEX)];
const caseIds = [...switchIds, ...parityIds];
/** App.tsx: import { XPage } from "./pages/XPage" (或页面组目录 "./pages/parity") */
const importedPages = [...appSrc.matchAll(/from "\.\/pages\/([\w-]+)"/g)].map((m) => m[1]);
/**
 * navIcons.ts: `"x": "icon-[..."` 或 `x: "icon-[..."`。
 * **两种键写法都要匹配**  第一版只写了带引号的那种, 于是 40 个键里只读到 16 个,
 * 剩下 24 个成了永远不会被检查的死区。这是正则式解析最典型的失败形态:
 * 漏报和通过长得一模一样。
 */
const iconKeys = [...iconSrc.matchAll(/(?:"([a-z0-9-]+)"|(?<![\w-])([a-z][a-z0-9-]*))\s*:\s*"icon-\[/g)].map(
  (m) => m[1] ?? m[2],
);

const pageFiles = fs.existsSync(PAGES)
  ? fs.readdirSync(PAGES).filter((f) => f.endsWith(".tsx")).map((f) => f.replace(/\.tsx$/, ""))
  : [];
/** 带入口文件的子目录 = 页面组, 整组由 App.tsx 以目录名引用。 */
const pageGroups = fs
  .readdirSync(PAGES, { withFileTypes: true })
  .filter((e) => e.isDirectory() && fs.existsSync(path.join(PAGES, e.name, GROUP_ENTRY)))
  .map((e) => e.name);

/** src/index.ts 里被 export 的模块路径 (相对 src/) */
const exportedModules = [...indexSrc.matchAll(/from\s+"\.\/([^"]+)"/g)].map((m) => m[1]);

const dup = (a) => a.filter((x, i) => a.indexOf(x) !== i);
const violations = [];

// ── R1: 页面 id 双向对账 ──────────────────────────────────────────
for (const id of dup(navIds)) violations.push({ rule: "nav-duplicate-id", where: `docs/src/nav.ts 的 ${id}`, hint: "同一个页面 id 出现了两次, 路由与页面清单会取错一个。" });
for (const id of dup(caseIds)) violations.push({ rule: "app-duplicate-case", where: `docs/src/App.tsx 的 case "${id}"`, hint: "同一个 id 有两个分支, 后面的写法会变成死代码。" });

const navWithoutCase = navIds.filter((i) => !caseIds.includes(i) && !allow.navWithoutCase.includes(i));
for (const id of navWithoutCase) {
  violations.push({
    rule: "nav-without-case",
    where: `docs/src/nav.ts 的 ${id}`,
    hint:
      "nav 里有这个页面, 但 App.tsx 的 renderPage 没有对应分支  它会落进 default 分支渲染成占位页, " +
      "于是**有 h1、DOM 够大、冒烟通过**, 而用户看到的是\"这一页的示例还没写\"。",
  });
}
for (const id of caseIds.filter((i) => !navIds.includes(i))) {
  violations.push({ rule: "case-without-nav", where: `docs/src/App.tsx 的 case "${id}"`, hint: "分支永远走不到 (页面清单里没有这个 id), 是死代码。" });
}
for (const id of parityIds.filter((i) => switchIds.includes(i))) {
  violations.push({ rule: "case-and-parity", where: `PARITY_PAGES 的 ${id}`, hint: "App.tsx 的 switch 已有这个 case, 查表永远走不到, 删掉其中一处。" });
}

// ── R2: 页面组件 ↔ 文件 双向对账 ──────────────────────────────────
for (const p of importedPages.filter((i) => !pageFiles.includes(i) && !pageGroups.includes(i))) {
  violations.push({ rule: "import-without-file", where: `docs/src/App.tsx 引用 ./pages/${p}`, hint: "文件不存在 (改名或删除后忘了同步 import)。" });
}
for (const f of pageFiles.filter((f) => !importedPages.includes(f))) {
  violations.push({ rule: "page-file-unused", where: `docs/src/pages/${f}.tsx`, hint: "没有任何页面引用这个文件, 它既不渲染也不被检查, 是死文件。" });
}

for (const g of pageGroups) {
  if (!importedPages.includes(g)) {
    violations.push({ rule: "page-group-unused", where: `docs/src/pages/${g}/${GROUP_ENTRY}`, hint: "App.tsx 没有引用这个页面组入口, 整组页面都不会渲染, 是死代码。" });
    continue;
  }
  const dir = path.join(PAGES, g);
  const entrySrc = fs.readFileSync(path.join(dir, GROUP_ENTRY), UTF8);
  const used = [...entrySrc.matchAll(/from "\.\/([\w-]+)"/g)].map((m) => m[1]);
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".tsx")).map((f) => f.replace(/\.tsx$/, ""))) {
    if (!used.includes(f)) {
      violations.push({ rule: "page-file-unused", where: `docs/src/pages/${g}/${f}.tsx`, hint: `${g}/${GROUP_ENTRY} 没有引用这个文件, 它既不渲染也不被检查, 是死文件。` });
    }
  }
}

// ── R3: 图标表 ────────────────────────────────────────────────────
const iconOrphans = iconKeys.filter((k) => !navIds.includes(k) && !allow.navWithoutIcon.includes(k));
for (const k of iconOrphans) {
  violations.push({ rule: "icon-without-nav", where: `docs/src/navIcons.ts 的 ${k}`, hint: "这个图标键对应不到任何页面 (页面 id 改名后残留)。" });
}

// ── R4: 组件与逻辑模块 ↔ 库导出 / 同仓引用 ────────────────────────
//
// ## 判据: 每个模块必须【从 src/index.ts 导出】或【被同仓模块 import】, 二者至少一个
//
// 我一开始把 .tsx 与 .ts 分成两类判据 (.tsx 必须导出, .ts 允许只被引用),
// 复杂度上去了而收益是零  实测发现 `src/blueprint/canvas-parts.tsx` 就是
// **渲染拆分件**: 它和 `layout-parts.ts` 一样是行数棘轮的正确产物 (主文件超预算后
// 把独立部分拆出来), 只是恰好含 JSX。对它要求"必须对外导出"同样是
// **门禁在惩罚它自己推荐的修复动作**。
//
// 统一判据之后, 这条拦的是真正坏的味道: **既没导出、也没人引用的死文件**。
// 同时它仍然拦住原本的目标  "组件写好了但忘了接上"必然同时满足
// "没导出"和"没人 import", 所以那条真实缺口照样红。
//
// ⚠️ 引用检测是**文本级**的 (匹配 `from "...<模块名>"`), 不是 AST。
// 代价: 只在注释里提到模块名会被误判为"被引用"。收益: 不需要 TS 编译器 API。
// 这是刻意的取舍  报错信息里写清了判据, 误判时可以一眼看出原因。
const COMPONENT_DIRS = ["primitives", "layout", "charts", "blueprint", "chat"];
const allSources = [];
for (const d of COMPONENT_DIRS) {
  const abs = path.join(ROOT, "src", d);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs)) {
    if (/\.tsx?$/.test(f)) allSources.push(`${d}/${f.replace(/\.tsx?$/, "")}`);
  }
}
/** 某个模块是否被 src/ 下任何其它文件 import (含 index.ts 的 re-export)。 */
function isReferencedBySiblings(mod) {
  const base = mod.split("/").pop();
  const hits = [];
  const esc = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(e.name)) continue;
      const rel = path.relative(path.join(ROOT, "src"), full).replace(/\.tsx?$/, "");
      if (rel === mod) continue;
      const text = fs.readFileSync(full, UTF8);
      if (new RegExp(`from\\s+"[^"]*\\b${esc}"`).test(text)) hits.push(rel);
    }
  };
  walk(path.join(ROOT, "src"));
  return hits;
}

const unexported = [];
for (const m of allSources) {
  if (exportedModules.includes(m) || allow.unexportedModules.includes(m)) continue;
  // 目录入口 (src/chat/index.ts) 以目录名导出: `export * from "./chat"`
  if (m.endsWith("/index") && exportedModules.includes(m.slice(0, -"/index".length))) continue;
  if (isReferencedBySiblings(m).length > 0) continue;
  unexported.push(m);
}
for (const m of unexported) {
  violations.push({
    rule: "module-unreachable",
    where: `src/${m}.ts(x)`,
    hint:
      "既没有从 src/index.ts 导出, 也没有任何同仓模块 import 它  使用方拿不到, 仓内也没人用。" +
      "要么加一行导出, 要么让用它的人 import 它, 要么删掉。",
  });
}

for (const m of exportedModules.filter(
  (m) =>
    !fs.existsSync(path.join(ROOT, "src", m)) &&
    !fs.existsSync(path.join(ROOT, "src", `${m}.ts`)) &&
    !fs.existsSync(path.join(ROOT, "src", `${m}.tsx`)),
)) {
  violations.push({
    rule: "export-without-file",
    where: `src/index.ts 引用 ./${m}`,
    hint: "导出指向不存在的文件  使用方 import 时会直接报错。",
  });
}

// ── R5: 豁免双向对账 (陈旧条目 = FAIL) ────────────────────────────
const stale = [];
for (const id of allow.navWithoutCase) if (!navIds.includes(id)) stale.push(`navWithoutCase: ${id}`);
for (const id of allow.navWithoutIcon) if (!iconKeys.includes(id)) stale.push(`navWithoutIcon: ${id}`);
for (const m of allow.unexportedModules) if (!allSources.includes(m)) stale.push(`unexportedModules: ${m}`);
for (const s of stale) {
  violations.push({ rule: "stale-allowance", where: `scripts/gates/frontend/docs-registry-allow.json 的 ${s}`, hint: "这条豁免的目标已经不存在了, 删掉它  留着会让这条豁免永远生效且没人敢删。" });
}

// ── 结论 ──────────────────────────────────────────────────────────
if (violations.length === 0) {
  console.log(
    `check-docs-registry: 通过 (${navIds.length} 个页面 id / ${caseIds.length} 个分支 / ${pageFiles.length} 个页面文件 / ${iconKeys.length} 个图标 / ${allSources.length} 个组件与逻辑模块全对账)`,
  );
  process.exit(0);
}

console.error(`check-docs-registry: ${violations.length} 处违规\n`);
for (const v of violations) {
  console.error(`  [${v.rule}] ${v.where}`);
  console.error(`    → ${v.hint}\n`);
}
process.exit(1);
