/**
 * 质量指纹: 把"门禁有多严"和"门禁还跑不跑"变成可见的. 放松一条门禁只需改一个数字, 删注册表一行会让
 * 该门禁在所有检查点同时消失, 而每个门禁脚本照样全绿. 两组指纹: "多严" (阈值常量 / 白名单 / 注册表与
 * lane 表, 抽取器在 fingerprint-sources.ts) 与 "还跑不跑" (npm scripts / 仓库内钩子源文件 / CI workflow).
 * 只抽决定严格度的字段, 不抽显示名, 否则报警器会退化成确认键.
 *
 * 用法: node scripts/gates/shared/check-fingerprint.ts --check | --update (有意放松时显式承认)
 * 扫描根: CHECK_UI_ROOT (默认仓库根); 指纹文件也放在扫描根下, 所以探针可以整体指到临时目录.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  CHECK_FLAG, DOCS_REGISTRY_FILE, EXIT_TOOL, FP_STRICTNESS, FP_WIRING, JSON_INDENT, GATES_CONSTANTS_FILE, HOOKS_DIR, NEWLINE, PRE_COMMIT, REPO_UP_FROM_GATE_SUBDIR, UTF8,
} from "../../constants/gates.ts";
import { codeOf, entriesOf, lanesOf, readAt, registryOf, thresholdsOf } from "./fingerprint-sources.ts";

const HERE = import.meta.dirname;
const ROOT = process.env.CHECK_UI_ROOT ? path.resolve(process.env.CHECK_UI_ROOT) : path.resolve(HERE, REPO_UP_FROM_GATE_SUBDIR);
const SNAPSHOT = path.join(ROOT, "scripts", "gates", "gate-fingerprint.json");
const UPDATE_FLAG = "--update";
const UPDATE_CMD = "node scripts/gates/shared/check-fingerprint.ts --update";

const MODE = process.argv.includes(UPDATE_FLAG) ? "update" : "check";
if (!process.argv.includes(CHECK_FLAG) && !process.argv.includes(UPDATE_FLAG)) {
  console.error("check-fingerprint: 必须显式给 --check 或 --update (默认什么都不做, 免得误改)");
  process.exit(EXIT_TOOL);
}

const rel = (p: string): string => path.relative(ROOT, p);
const read = (file: string): string | null => readAt(ROOT, file);
const sha = (s: string): string => createHash("sha256").update(s, UTF8).digest("hex").slice(0, 16);

/**
 * 设计规约在 scripts/quality/checks/ui.ts: 判据写在规则对象数组里, 不是行首大写常量,
 * thresholdsOf 抽不全, 所以对去掉注释与空白后的整份代码求哈希 (宁可多抽).
 * 共享阈值与例外 (UI_ROOT / UI_COLOR_EXEMPT 等) 在 scripts/constants/quality.ts, 一并纳入.
 * 规则的实际扫描范围与 findings 还取决于 ast.ts (注释 / AST), finding.ts (指纹与范围过滤) 和 snapshot.ts (读哪些文件), 它们也算严格度的一部分.
 */
const UI_RULE_SOURCES = [
  "scripts/quality/checks/ui.ts",
  "scripts/constants/quality.ts",
  "scripts/quality/runtime/ast.ts",
  "scripts/quality/runtime/finding.ts",
  "scripts/quality/checks/snapshot.ts",
];
const BROWSER_CONSTANTS = "scripts/constants/browser.ts";

/**
 * 第二组: "还跑不跑".
 * 三个检查点各自的接线  从任何一处摘掉一条, 第一组指纹一个字都不变.
 *
 * .agents/notes/implemented/process/2026-10-14-pr3-quality-gates-ci-fixes.md
 */
function wiringOf(): string {
  const parts: string[] = [];
  // 1. 本地 npm scripts (人手动跑的入口)
  const pkg = read("package.json");
  try {
    const s = JSON.parse(pkg).scripts ?? {};
    parts.push(
      "package.json scripts:\n" +
        Object.keys(s).sort().map((k) => `  ${k} = ${s[k]}`).join(NEWLINE),
    );
  } catch {
    parts.push("package.json scripts: (无法解析)");
  }
  // 2. git hooks: 取仓库里受版本控制的钩子源文件 (scripts/gates/hooks 与 .githooks),
  // 不读本机 .git/hooks: 那是安装状态, CI 的干净 checkout 里永远是"未安装",
  // 以它为指纹会让同一提交在本地与 CI 上算出不同的值
  const hooks: string[] = [];
  for (const dir of [HOOKS_DIR, ".githooks"]) {
    for (const h of [PRE_COMMIT, "pre-push", "post-commit"]) {
      const src = read(path.join(dir, h));
      if (src !== null) hooks.push(`  ${dir}/${h} = sha256:${sha(src)}`);
    }
  }
  parts.push("git hooks:\n" + (hooks.length ? hooks.join(NEWLINE) : "  (仓库内无钩子源文件)"));
  // 3. CI workflow (注册了哪些 job + 跑了什么命令)
  const wfDir = path.join(ROOT, ".github", "workflows");
  if (fs.existsSync(wfDir)) {
    for (const f of fs.readdirSync(wfDir).sort()) {
      const src = fs.readFileSync(path.join(wfDir, f), UTF8);
      const jobs = [...src.matchAll(/^\s{2}([a-z0-9_-]+):\s*$/gm)].map((m) => m[1]);
      const runs = [...src.matchAll(/run:\s*(.+)/g)].map((m) => m[1].trim());
      parts.push(`CI ${f}: jobs=[${jobs.join(",")}] runs=[${runs.join(" ; ")}]`);
    }
  } else {
    parts.push("CI: (.github/workflows 不存在)");
  }
  return parts.join(NEWLINE);
}

/** 指纹来源清单  每条都是"决定严格度或接线"的东西, 删掉某条来源本身也会触发 FAIL. */
const SOURCES: Array<{ name: string; group: string; extract: () => string | Promise<string> }> = [
  { name: "thresholds:check-ui-rules", group: FP_STRICTNESS, extract: () => codeOf(ROOT, UI_RULE_SOURCES) },
  { name: "thresholds:check-smoke", group: FP_STRICTNESS, extract: () => thresholdsOf(ROOT, "scripts/check-smoke.ts") + NEWLINE + codeOf(ROOT, [BROWSER_CONSTANTS]) },
  { name: "thresholds:check-shell", group: FP_STRICTNESS, extract: () => thresholdsOf(ROOT, "scripts/check-shell.ts") + NEWLINE + codeOf(ROOT, [BROWSER_CONSTANTS]) },
  { name: "thresholds:check-blueprint", group: FP_STRICTNESS, extract: () => thresholdsOf(ROOT, "scripts/check-blueprint.mjs") },
  { name: "thresholds:check-docs-registry", group: FP_STRICTNESS, extract: () => thresholdsOf(ROOT, DOCS_REGISTRY_FILE) + NEWLINE + codeOf(ROOT, [GATES_CONSTANTS_FILE]) },
  { name: "whitelists:docs-registry-allow", group: FP_STRICTNESS, extract: () => entriesOf(ROOT, "scripts/gates/frontend/docs-registry-allow.json") },
  { name: "registry:gates", group: FP_STRICTNESS, extract: () => registryOf(ROOT) },
  { name: "registry:lanes", group: FP_STRICTNESS, extract: () => lanesOf(ROOT) },
  { name: "wiring:checkpoints", group: FP_WIRING, extract: wiringOf },
];

const current: Record<string, { group: string; hash: string }> = {};
for (const s of SOURCES) current[s.name] = { group: s.group, hash: sha(await s.extract()) };

if (MODE === "update") {
  const payload = {
    note: "由 scripts/gates/shared/check-fingerprint.ts --update 生成。改动它 = 显式承认门禁严格度或接线变了。",
    hashedAt: new Date().toISOString(),
    sources: current,
  };
  fs.writeFileSync(SNAPSHOT, JSON.stringify(payload, null, JSON_INDENT) + NEWLINE);
  console.log(`check-fingerprint: 已更新 ${rel(SNAPSHOT)} (${SOURCES.length} 条来源)`);
  process.exit(0);
}

if (!fs.existsSync(SNAPSHOT)) {
  console.error(`check-fingerprint: 指纹快照不存在 (${rel(SNAPSHOT)})`);
  console.error(`  初始化: ${UPDATE_CMD}`);
  process.exit(1);
}

let saved: Record<string, { group: string; hash: string }>;
try {
  saved = JSON.parse(fs.readFileSync(SNAPSHOT, UTF8)).sources ?? {};
} catch (err) {
  console.error(`check-fingerprint: 快照无法解析: ${err.message}`);
  process.exit(EXIT_TOOL);
}

const changed: Array<{ name: string; why: string }> = [];
for (const s of SOURCES) {
  const before = saved[s.name];
  const now = current[s.name];
  if (!before) changed.push({ name: s.name, why: "新增来源 (快照里没有它)" });
  else if (before.hash !== now.hash) changed.push({ name: s.name, why: `${before.group} 指纹变化` });
  else if (before.group !== now.group) changed.push({ name: s.name, why: `分组 ${before.group} → ${now.group}` });
}
for (const name of Object.keys(saved)) {
  if (!SOURCES.some((s) => s.name === name)) changed.push({ name, why: "来源被删除 (快照里有, 代码里没有)" });
}

if (changed.length === 0) {
  console.log(`check-fingerprint: 通过 (${SOURCES.length} 条来源: 严格度 ${SOURCES.filter((s) => s.group === FP_STRICTNESS).length} / 接线 ${SOURCES.filter((s) => s.group === FP_WIRING).length})`);
  process.exit(0);
}

console.error(`check-fingerprint: ${changed.length} 条来源变了\n`);
for (const c of changed) console.error(`  ${c.name}\n    → ${c.why}`);
console.error("");
console.error(`这不是"代码有问题", 是"门禁严格度或接线被改了"  需要一个显式动作:`);
console.error(`  1. 确认这次改动是**有意**的 (放松阈值 / 加白名单 / 改注册表 / 摘 hook 都算)`);
console.error(`  2. 写进 Agent Note, 说明为什么放松`);
console.error(`  3. ${UPDATE_CMD}`);
console.error(`     (若第 1 步发现是无意改的, 请改回去而不是 update)`);
process.exit(1);
