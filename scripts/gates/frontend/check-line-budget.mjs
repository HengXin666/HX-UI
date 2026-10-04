#!/usr/bin/env node
/**
 * 单文件行数上限 (架构维度) + 存量棘轮。
 *
 * ## 拦什么
 *
 * 一个文件长到几百行之后, 每次改动都会碰到与本次目的无关的逻辑, review 也只能靠
 * 肉眼扫。本仓的读数 (2026-10-04, 命令见下):
 *
 *   git ls-files "*.tsx" | xargs wc -l | ...   → n=93, median=128, p75=200, p90=250, max=801
 *   git ls-files "*.ts"  | xargs wc -l | ...   → n=24, median=171, p75=334, p90=422, max=533
 *
 * 上限取 p90 附近 (tsx 250 / ts 450): 允许绝大多数文件自由生长, 只卡住最离谱的那几个。
 * "tsx 是页面与组件, ts 里有纯逻辑模块, 两者分布不同" 是分开定阈值的理由, 不是抄来的。
 *
 * ## 棘轮怎么用 (存量不因老债直接全仓红)
 *
 * 已经超标的 12 个文件全部登记在 baselines/line-budget.json, 各自以**当前值**为上限。
 * 于是第一次接入就是全绿, 而它们**只许降不许涨** —— 涨 1 行即 FAIL。
 *
 * ## 为什么阈值与基线进指纹
 *
 * 否则"放松一条门禁"只是改一个数字, 在 diff 里毫不起眼。见 check-fingerprint.mjs。
 *
 * 用法:
 *   node scripts/gates/frontend/check-line-budget.mjs              # 检查
 *   node scripts/gates/frontend/check-line-budget.mjs --update     # 显式降水位 (只许降)
 * 扫描根: CHECK_UI_ROOT (默认仓库根); 基线可用 CHECK_UI_BASELINE 覆盖 (探针用)。
 * 退出码: 0=通过 / 1=违规 / 2=输入坏了
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HERE = import.meta.dirname;
const ROOT = process.env.CHECK_UI_ROOT ? path.resolve(process.env.CHECK_UI_ROOT) : path.resolve(HERE, "..", "..", "..");
const BASELINE = process.env.CHECK_UI_BASELINE
  ? path.resolve(process.env.CHECK_UI_BASELINE)
  : path.join(ROOT, "scripts", "gates", "baselines", "line-budget.json");

const UPDATE = process.argv.includes("--update");

/** 行数口径: 换行符个数 (与 `wc -l` 一致)。测法写在这里, 免得两处算法不同。 */
function linesOf(file) {
  return fs.readFileSync(file, "utf8").split("\n").length - 1;
}

function listFiles() {
  const r = spawnSync("git", ["ls-files", "*.ts", "*.tsx"], { cwd: ROOT, encoding: "utf8" });
  if (r.status === 0) return (r.stdout ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  // 探针夹具可能是无 git 的目录树
  const out = [];
  const SKIP = new Set(["node_modules", ".git", "dist", ".vite", ".bpprobe"]);
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(e.name)) out.push(path.relative(ROOT, full));
    }
  })(ROOT);
  return out;
}

if (!fs.existsSync(BASELINE)) {
  console.error(`check-line-budget: 基线不存在 (${BASELINE})`);
  console.error(`  初始化: node scripts/gates/frontend/check-line-budget.mjs --update`);
  process.exit(2);
}
let base;
try {
  base = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
} catch (err) {
  console.error(`check-line-budget: 基线无法解析: ${err.message}`);
  process.exit(2);
}
const LIMITS = base.limits ?? { ts: 450, tsx: 250 };
const FROZEN = base.frozen ?? {};

const files = listFiles();
const measured = files.map((f) => ({ file: f, lines: linesOf(path.join(ROOT, f)) }));

if (UPDATE) {
  const frozen = {};
  const over = measured.filter((m) => m.lines > (LIMITS[m.file.endsWith(".tsx") ? "tsx" : "ts"] ?? Infinity));
  over.sort((a, b) => b.lines - a.lines).forEach((m) => (frozen[m.file] = m.lines));
  // 棘轮只许降: 已有条目的上限只能变小, 不允许 --update 顺手抬高
  const raised = Object.keys(frozen).filter((f) => FROZEN[f] !== undefined && frozen[f] > FROZEN[f]);
  if (raised.length > 0) {
    console.error("check-line-budget: --update 拒绝抬高水位 (棘轮只许降):");
    for (const f of raised) console.error(`  ${f}: ${FROZEN[f]} → ${frozen[f]}`);
    console.error("  水位要涨说明文件变长了 —— 先拆文件, 而不是改基线。");
    process.exit(1);
  }
  fs.writeFileSync(BASELINE, JSON.stringify({ ...base, limits: LIMITS, frozen }, null, 2) + "\n");
  console.log(`check-line-budget: 已更新水位 (冻结 ${Object.keys(frozen).length} 个文件, 只降不升)`);
  process.exit(0);
}

const violations = [];
for (const m of measured) {
  const limit = LIMITS[m.file.endsWith(".tsx") ? "tsx" : "ts"];
  const frozen = FROZEN[m.file];
  if (frozen !== undefined) {
    if (m.lines > frozen) {
      violations.push({
        file: m.file,
        rule: "frozen-grew",
        msg: `已冻结文件从 ${frozen} 行长到 ${m.lines} 行 (棘轮只许降)`,
        hint: `把新增的部分拆出去, 或至少不要让它继续长。降到位后可 --update 收窄水位。`,
      });
    }
    continue;
  }
  if (m.lines > limit) {
    violations.push({
      file: m.file,
      rule: "over-limit",
      msg: `${m.lines} 行 > 上限 ${limit}`,
      hint: `按职责拆成多个文件 (例如把纯逻辑抽到同目录的 impl/ 或独立模块), 而不是把整个文件加进基线。`,
    });
  }
}

// 双向对账: 基线里的路径必须仍然存在, 否则是腐烂的豁免
for (const f of Object.keys(FROZEN)) {
  if (!measured.some((m) => m.file === f)) {
    violations.push({
      file: f,
      rule: "stale-baseline",
      msg: "基线里登记了这个文件, 但它已经不在仓库里 (改名或删除)",
      hint: "删掉这条 —— 基线只该缩小, 留着会让人以为还有一笔债。",
    });
  }
}

if (violations.length === 0) {
  const frozenCount = Object.keys(FROZEN).length;
  const worst = measured.slice().sort((a, b) => b.lines - a.lines)[0];
  console.log(
    `check-line-budget: 通过 (${measured.length} 个文件; 上限 ts=${LIMITS.ts} tsx=${LIMITS.tsx}; 冻结 ${frozenCount} 个只降不升; 最大 ${worst.file} ${worst.lines} 行)`,
  );
  process.exit(0);
}

console.error(`check-line-budget: ${violations.length} 处违规\n`);
for (const v of violations) {
  console.error(`  [${v.rule}] ${v.file}`);
  console.error(`    ${v.msg}`);
  console.error(`    → ${v.hint}\n`);
}
process.exit(1);
