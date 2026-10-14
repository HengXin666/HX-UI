#!/usr/bin/env node
/**
 * 分流表覆盖校验  保证"改了任何文件, 至少有一条门禁会被触发"。
 *
 * ## 为什么必须有这一条 (分流设计里唯一必须自动化的一环)
 *
 * lane 表的失败形态是**静默**的: 仓库里新加了一个顶层目录, 它没被任何 lane 的前缀
 * 认领, 于是改那里的代码**一条门禁都不跑**。而这件事在运行时完全看不出来 
 * 不报错、不输出、退出码 0, 和"检查全过"长得一模一样。
 *
 * 所以: 仓库里每个被 git 跟踪的顶层条目, 必须被某条 lane 前缀或一份
 * 明确写了理由的 NO_GATE_ENTRIES 认领。
 *
 * ## 双向对账
 *
 * 只查单向 (lane 里的前缀还有没有对应文件) 不够  还要查反向:
 *   · 顶层条目没被认领        → 新增一类路径会静默免检
 *   · NO_GATE 条目已经不存在  → 名单在腐烂, 留着让"免检"无声扩张
 *   · lane 前缀指向不存在的路径 → 前缀写错 (改名后), 该 lane 永不触发
 *
 * 用法: node scripts/gates/shared/check-lanes.mjs
 * 扫描根: CHECK_UI_ROOT (默认仓库根)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { LANES, NO_GATE_ENTRIES } from "../lanes.mjs";

/**
 * HX-UI 接入 Agent Notes v2
 * .agents/notes/implemented/process/2026-10-08-repository-agent-notes-v2-adoption.md
 */
const ROOT = process.env.CHECK_UI_ROOT ? path.resolve(process.env.CHECK_UI_ROOT) : path.resolve(import.meta.dirname, "..", "..", "..");

// --cached --others --exclude-standard: 已跟踪的 + 未跟踪但没被忽略的。
// 只用 `git ls-files` 会漏掉刚创建还没 add 的文件  而"新加了一个顶层目录"
// 正是这条门禁最该抓的场景, 用索引会把那个场景整个漏掉。
const r = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
  cwd: ROOT,
  encoding: "utf8",
});
let files;
let source = "git ls-files --cached --others";
if (r.status === 0) {
  files = (r.stdout ?? "").split("\n");
} else {
  // 探针夹具是临时目录里的最小仓库, 可能没有 .git。
  // 退回文件系统遍历 (跳过与 lane 无关的重目录), 而不是直接失败 
  // 这条门禁要能在两种输入上都跑得起来。
  source = "fs walk (无 git)";
  files = [];
  const SKIP = new Set(["node_modules", ".git", "dist", ".vite", ".bpprobe"]);
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else files.push(path.relative(ROOT, full));
    }
  })(ROOT);
}
files = files.map((s) => s.trim()).filter(Boolean);

/** 顶层条目: 第一个路径段; 单段路径就是文件本身。 */
const topLevel = [...new Set(files.map((f) => (f.includes("/") ? f.split("/")[0] : f)))].sort();

/**
 * 前缀匹配: 目录型前缀 "src/" 要能认领顶层条目 "src" (顶层条目本身不带斜杠),
 * 也要能认领 "src/a/b.ts"。这是第一版漏掉的地方  它把 src/docs/scripts
 * 三个最常改的目录都报成"未认领", 而它们明明是最该被认领的。
 */
const norm = (p) => p.replace(/\/+$/, "");
const matches = (p, prefix) => {
  const np = norm(p);
  const nf = norm(prefix);
  return np === nf || np.startsWith(nf + "/");
};

const claimed = (p) => LANES.some((l) => l.prefixes.some((x) => matches(p, x)));
const exempt = (p) => NO_GATE_ENTRIES.some((e) => matches(p, e.prefix));

const violations = [];

for (const t of topLevel) {
  if (!claimed(t) && !exempt(t)) {
    violations.push({
      rule: "unclaimed-top-level",
      where: t,
      hint:
        "这个顶层条目没被任何 lane 认领  改它**一条门禁都不会跑**, 而运行时看不出任何异常。" +
        "把它加进 scripts/gates/lanes.mjs 的某条 lane, 或加进 NO_GATE_ENTRIES 并写清理由。",
    });
  }
}

for (const l of LANES) {
  for (const p of l.prefixes) {
    const hit = files.some((f) => f === p || f.startsWith(p));
    // 文件型前缀与目录型前缀都按"有没有匹配"判; 一个都匹配不到 = 前缀已失效
    const isFileLike = !p.endsWith("/");
    if (!hit && (isFileLike ? !files.includes(p) : true)) {
      violations.push({
        rule: "dead-lane-prefix",
        where: `lane "${l.name}" 的前缀 ${p}`,
        hint: "仓库里没有任何文件匹配这个前缀 (改名或删除后残留)。它会让该 lane 静默失效  以为跑了, 其实没跑。",
      });
    }
  }
}

for (const e of NO_GATE_ENTRIES) {
  if (!topLevel.some((t) => t === e.prefix || t.startsWith(e.prefix))) {
    violations.push({
      rule: "stale-exemption",
      where: `NO_GATE_ENTRIES 的 ${e.prefix}`,
      hint: "这条免检声明的目标已不存在, 删掉它  名单只该缩小, 靠自觉的名单一定会长。",
    });
  }
}

if (violations.length === 0) {
  const laneCount = LANES.length;
  console.log(
    `check-lanes: 通过 (${topLevel.length} 个顶层条目全部被 ${laneCount} 条 lane 或 ${NO_GATE_ENTRIES.length} 条免检声明认领; 来源=${source})`,
  );
  process.exit(0);
}

console.error(`check-lanes: ${violations.length} 处问题\n`);
for (const v of violations) {
  console.error(`  [${v.rule}] ${v.where}`);
  console.error(`    → ${v.hint}\n`);
}
process.exit(1);
