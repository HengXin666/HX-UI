#!/usr/bin/env node
/**
 * 质量指纹 —— 把"门禁有多严"和"门禁还跑不跑"变成可见的。
 *
 * ## 问题
 *
 * 放松一条门禁只需要改一个数字 (MIN_DOM_BYTES 从 20000 改成 500), 而那个数字
 * 在 review 的 diff 里毫不起眼; 删掉注册表里的一行, 该门禁在**所有**检查点上
 * 同时消失, 而每一个单独的门禁脚本一个字都没变, 照样全绿。
 *
 * ## 做法: 两组指纹, 它们回答两个不同的问题
 *
 *   第一组 "多严": 门禁脚本里的阈值常量 / 白名单条目集 / 注册表与 lane 表
 *   第二组 "还跑不跑": package.json 的 scripts / .git/hooks 的钩子 / CI workflow 的 job
 *
 * 第二组容易被忽略, 但第一组有个说不出口的前提: **它们都假设门禁确实会被执行**。
 *
 * ## 只抽"决定严格度"的字段, 不抽显示名
 *
 * 改 label 文案、重排格式都不该动指纹 —— 否则会天天报警, 所有人去跑 --update,
 * 报警器就退化成确认键。探针里有一条控制组专门钉这件事 (只改 label 必须 PASS)。
 *
 * ## 用法
 *   node scripts/gates/shared/check-fingerprint.mjs --check    # 门禁 / CI
 *   node scripts/gates/shared/check-fingerprint.mjs --update   # 有意放松时显式承认
 *
 * 扫描根: CHECK_UI_ROOT (默认仓库根)。指纹文件也放在扫描根下, 所以探针可以整体指到临时目录。
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const HERE = import.meta.dirname;
const ROOT = process.env.CHECK_UI_ROOT ? path.resolve(process.env.CHECK_UI_ROOT) : path.resolve(HERE, "..", "..", "..");
const SNAPSHOT = path.join(ROOT, "scripts", "gates", "gate-fingerprint.json");

const MODE = process.argv.includes("--update") ? "update" : "check";
if (!process.argv.includes("--check") && !process.argv.includes("--update")) {
  console.error("check-fingerprint: 必须显式给 --check 或 --update (默认什么都不做, 免得误改)");
  process.exit(2);
}

const rel = (p) => path.relative(ROOT, p);
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);
const sha = (s) => createHash("sha256").update(s, "utf8").digest("hex").slice(0, 16);

/**
 * 从门禁脚本里抽"决定严格度的常量"。
 *
 * ## 为什么第一版是错的 (实测发现)
 *
 * 第一版只收 `const NAME = <字面量>` 形式的单行声明。结果三条门禁的指纹哈希
 * **完全相同** —— 因为 check-ui-rules 的调色盘禁令是个正则、白名单是个 `new Set([...])`、
 * check-shell 的期望值是模板串, 一个都不匹配, 于是三条都退化成同一句
 * "(无字面量阈值常量)"。哈希相同本身就说明抽取器什么都没读到, 而它**照样打印"通过"**。
 *
 * 这正是本仓那条教训的又一个实例: 一个覆盖不到的检查, 和"没问题"长得一模一样。
 *
 * ## 现在的口径
 *
 * 抓所有行首全大写常量名的声明行 (去掉尾部注释), 加上紧随其后的续行直到语句结束。
 * 宁可多抽一点: 改扫描根、改白名单、改正则、改阈值都**应该**要显式承认,
 * 它们都是"门禁有多严/覆盖多宽"的一部分。少抽的代价是静默放松, 那比偶尔多报严重得多。
 */
function thresholdsOf(script) {
  const src = read(path.join(ROOT, script));
  if (src === null) return `(缺文件 ${script})`;
  const lines = src.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^const\s+([A-Z][A-Z0-9_]{2,})\s*=/);
    if (!m) continue;
    // 从声明行起收集到第一个以 ; 或 ) 结尾的行 (多行 Set / 对象 / 正则)
    let text = lines[i];
    let j = i;
    while (!/[;)]\s*(?:\/\/.*)?$/.test(text) && j < Math.min(lines.length - 1, i + 30)) {
      j += 1;
      text += "\n" + lines[j];
    }
    i = j;
    out.push(text.replace(/\/\/.*$/gm, "").replace(/\s+/g, " ").trim());
  }
  return out.length > 0 ? out.join("\n") : "(无大写常量声明 —— 抽取器没读到任何严格度字段)";
}

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

function codeOf(files) {
  return files
    .map((file) => {
      const src = read(path.join(ROOT, file));
      if (src === null) return `(缺文件 ${file})`;
      const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      return `${file}:\n${code.replace(/\s+/g, " ").trim()}`;
    })
    .join("\n");
}

/** 白名单条目集: 去注释与空行后排序 (顺序变化不该改指纹, 条目增删必须改)。 */
function entriesOf(file) {
  const src = read(path.join(ROOT, file));
  if (src === null) return "(缺文件)";
  try {
    const json = JSON.parse(src);
    const a = json.allow ?? json;
    const lines = [];
    for (const key of Object.keys(a).sort()) lines.push(`${key}: ${[...(a[key] ?? [])].sort().join(", ")}`);
    return lines.join("\n") || "(空)";
  } catch {
    return src
      .split("\n")
      .map((l) => l.replace(/^\s*\/\/.*$/, "").trim())
      .filter(Boolean)
      .sort()
      .join("\n");
  }
}

/**
 * 注册表: 只抽 id/group/produces/requires/args/*Args 与 lane 表。
 * **不抽 label** —— 那是显示名。
 */
function registryOf() {
  const src = read(path.join(ROOT, "scripts", "gates", "registry.mjs"));
  if (src === null) return "(缺注册表)";
  const ids = [...src.matchAll(/id:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
  const groups = [...src.matchAll(/group:\s*"([a-z]+)"/g)].map((m) => m[1]);
  const dirs = [...src.matchAll(/cwd:\s*"([^"]+)"/g)].map((m) => m[1]);
  const produces = [...src.matchAll(/produces:\s*"([^"]+)"/g)].map((m) => m[1]);
  const requires = [...src.matchAll(/requires:\s*"([^"]+)"/g)].map((m) => m[1]);
  const args = [...src.matchAll(/args:\s*\[([^\]]*)\]/g)].map((m) => m[1].replace(/\s+/g, " ").trim());
  const strict = [...src.matchAll(/strictArgs:\s*\[([^\]]*)\]/g)].map((m) => m[1].replace(/\s+/g, " ").trim());
  const lines = ids.map((id, i) => `${id} | ${groups[i]} | ${dirs[i]} | args=${args[i] ?? "(继承)"} | strict=${strict[i] ?? "(同 args)"}`);
  for (const p of produces) lines.push(`produces: ${p}`);
  for (const r of requires) lines.push(`requires: ${r}`);
  return lines.join("\n");
}

function lanesOf() {
  const src = read(path.join(ROOT, "scripts", "gates", "lanes.mjs"));
  if (src === null) return "(缺 lane 表)";
  const names = [...src.matchAll(/name:\s*"([a-z-]+)"/g)].map((m) => m[1]);
  const prefixBlocks = [...src.matchAll(/prefixes:\s*\[([^\]]*)\]/g)].map((m) =>
    m[1].replace(/\s+/g, " ").trim(),
  );
  const groupBlocks = [...src.matchAll(/groups:\s*\[([^\]]*)\]/g)].map((m) => m[1].replace(/\s+/g, " ").trim());
  const lines = names.map((n, i) => `${n} | ${prefixBlocks[i]} | ${groupBlocks[i]}`);
  const noGate = read(path.join(ROOT, "scripts", "gates", "lanes.mjs")).match(
    /NO_GATE_ENTRIES\s*=\s*\[([\s\S]*?)\];/,
  );
  if (noGate) {
    const entries = [...noGate[1].matchAll(/prefix:\s*"([^"]+)"/g)].map((m) => m[1]);
    lines.push(`NO_GATE: ${entries.sort().join(", ")}`);
  }
  return lines.join("\n");
}

/**
 * 第二组: "还跑不跑"。
 * 三个检查点各自的接线 —— 从任何一处摘掉一条, 第一组指纹一个字都不变。
 */
function wiringOf() {
  const parts = [];
  // 1. 本地 npm scripts (人手动跑的入口)
  const pkg = read(path.join(ROOT, "package.json"));
  try {
    const s = JSON.parse(pkg).scripts ?? {};
    parts.push(
      "package.json scripts:\n" +
        Object.keys(s).sort().map((k) => `  ${k} = ${s[k]}`).join("\n"),
    );
  } catch {
    parts.push("package.json scripts: (无法解析)");
  }
  // 2. git hooks (.git/hooks —— 不在版本控制里, 所以要显式登记它的存在与内容 hash)
  const hookNames = ["pre-commit", "pre-push"];
  const hooks = [];
  for (const h of hookNames) {
    const src = read(path.join(ROOT, ".git", "hooks", h));
    hooks.push(`  ${h} = ${src === null ? "(未安装)" : `sha256:${sha(src)}`}`);
  }
  parts.push("git hooks:\n" + hooks.join("\n"));
  // 3. CI workflow (注册了哪些 job + 跑了什么命令)
  const wfDir = path.join(ROOT, ".github", "workflows");
  if (fs.existsSync(wfDir)) {
    for (const f of fs.readdirSync(wfDir).sort()) {
      const src = read(path.join(wfDir, f));
      const jobs = [...src.matchAll(/^\s{2}([a-z0-9_-]+):\s*$/gm)].map((m) => m[1]);
      const runs = [...src.matchAll(/run:\s*(.+)/g)].map((m) => m[1].trim());
      parts.push(`CI ${f}: jobs=[${jobs.join(",")}] runs=[${runs.join(" ; ")}]`);
    }
  } else {
    parts.push("CI: (.github/workflows 不存在)");
  }
  return parts.join("\n");
}

/** 指纹来源清单 —— 每条都是"决定严格度或接线"的东西, 删掉某条来源本身也会触发 FAIL。 */
const SOURCES = [
  { name: "thresholds:check-ui-rules", group: "strictness", extract: () => codeOf(UI_RULE_SOURCES) },
  { name: "thresholds:check-smoke", group: "strictness", extract: () => thresholdsOf("scripts/check-smoke.ts") + "\n" + codeOf([BROWSER_CONSTANTS]) },
  { name: "thresholds:check-shell", group: "strictness", extract: () => thresholdsOf("scripts/check-shell.ts") + "\n" + codeOf([BROWSER_CONSTANTS]) },
  { name: "thresholds:check-blueprint", group: "strictness", extract: () => thresholdsOf("scripts/check-blueprint.mjs") },
  { name: "thresholds:check-docs-registry", group: "strictness", extract: () => thresholdsOf("scripts/gates/frontend/check-docs-registry.mjs") },
  { name: "whitelists:docs-registry-allow", group: "strictness", extract: () => entriesOf("scripts/gates/frontend/docs-registry-allow.json") },
  { name: "registry:gates", group: "strictness", extract: registryOf },
  { name: "registry:lanes", group: "strictness", extract: lanesOf },
  { name: "wiring:checkpoints", group: "wiring", extract: wiringOf },
];

const current = {};
for (const s of SOURCES) current[s.name] = { group: s.group, hash: sha(s.extract()) };

if (MODE === "update") {
  const payload = {
    note: "由 scripts/gates/shared/check-fingerprint.mjs --update 生成。改动它 = 显式承认门禁严格度或接线变了。",
    hashedAt: new Date().toISOString(),
    sources: current,
  };
  fs.writeFileSync(SNAPSHOT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`check-fingerprint: 已更新 ${rel(SNAPSHOT)} (${SOURCES.length} 条来源)`);
  process.exit(0);
}

if (!fs.existsSync(SNAPSHOT)) {
  console.error(`check-fingerprint: 指纹快照不存在 (${rel(SNAPSHOT)})`);
  console.error(`  初始化: node scripts/gates/shared/check-fingerprint.mjs --update`);
  process.exit(1);
}

let saved;
try {
  saved = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8")).sources ?? {};
} catch (err) {
  console.error(`check-fingerprint: 快照无法解析: ${err.message}`);
  process.exit(2);
}

const changed = [];
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
  console.log(`check-fingerprint: 通过 (${SOURCES.length} 条来源: 严格度 ${SOURCES.filter((s) => s.group === "strictness").length} / 接线 ${SOURCES.filter((s) => s.group === "wiring").length})`);
  process.exit(0);
}

console.error(`check-fingerprint: ${changed.length} 条来源变了\n`);
for (const c of changed) console.error(`  ${c.name}\n    → ${c.why}`);
console.error("");
console.error(`这不是"代码有问题", 是"门禁严格度或接线被改了" —— 需要一个显式动作:`);
console.error(`  1. 确认这次改动是**有意**的 (放松阈值 / 加白名单 / 改注册表 / 摘 hook 都算)`);
console.error(`  2. 写进 Agent Note, 说明为什么放松`);
console.error(`  3. node scripts/gates/shared/check-fingerprint.mjs --update`);
console.error(`     (若第 1 步发现是无意改的, 请改回去而不是 update)`);
process.exit(1);
