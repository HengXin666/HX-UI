/**
 * 单文件行数上限 (ts<=450 / tsx<=250, 取 2026-10-04 本仓 p90 附近) + 存量棘轮.
 * 已超标文件登记在 baselines/line-budget.json, 以当前值为上限, 只许降不许涨; 阈值与基线进指纹.
 *
 * 用法: node scripts/gates/frontend/check-line-budget.ts [--update]  (--update 只许降水位)
 * 扫描根: CHECK_UI_ROOT (默认仓库根); 基线可用 CHECK_UI_BASELINE 覆盖 (探针用).
 * 退出码: 0=通过 / 1=违规 / 2=输入坏了
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { EXIT_TOOL, GIT, JSON_INDENT, NEWLINE, REPO_UP_FROM_GATE_SUBDIR, UTF8, WALK_SKIP } from "../../constants/gates.ts";

const HERE = import.meta.dirname;
const ROOT = process.env.CHECK_UI_ROOT ? path.resolve(process.env.CHECK_UI_ROOT) : path.resolve(HERE, REPO_UP_FROM_GATE_SUBDIR);
const BASELINE = process.env.CHECK_UI_BASELINE
  ? path.resolve(process.env.CHECK_UI_BASELINE)
  : path.join(ROOT, "scripts", "gates", "baselines", "line-budget.json");

const UPDATE = process.argv.includes("--update");

/** 行数口径: 换行符个数 (与 `wc -l` 一致). 测法写在这里, 免得两处算法不同.
 * .agents/notes/implemented/process/2026-10-08-repository-agent-notes-v2-adoption.md
 */
function linesOf(file: string): number {
  return fs.readFileSync(file, UTF8).split(NEWLINE).length - 1;
}

/**
 * 待量的 ts / tsx 文件: 优先 git ls-files, 夹具无 git 时遍历目录.
 *
 * .agents/notes/implemented/process/2026-11-08-gates-ts.md
 */
function listFiles(): string[] {
  const r = spawnSync(GIT, ["ls-files", "*.ts", "*.tsx"], { cwd: ROOT, encoding: UTF8 });
  if (r.status === 0) return (r.stdout ?? "").split(NEWLINE).map((s) => s.trim()).filter(Boolean);
  // 探针夹具可能是无 git 的目录树
  const out: string[] = [];
  const SKIP = new Set(WALK_SKIP);
  (function walk(dir: string): void {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(e.name)) out.push(path.relative(ROOT, full));
    }
  })(ROOT);
  return out;
}

/** 上限按扩展名分档: tsx 是页面与组件, ts 里有纯逻辑模块, 两者分布不同. */
function kindOf(file: string): string {
  return file.endsWith(".tsx") ? "tsx" : "ts";
}

if (!fs.existsSync(BASELINE)) {
  console.error(`check-line-budget: 基线不存在 (${BASELINE})`);
  console.error(`  初始化: node scripts/gates/frontend/check-line-budget.ts --update`);
  process.exit(EXIT_TOOL);
}
let base: { limits?: Record<string, number>; frozen?: Record<string, number> };
try {
  base = JSON.parse(fs.readFileSync(BASELINE, UTF8));
} catch (err) {
  console.error(`check-line-budget: 基线无法解析: ${err.message}`);
  process.exit(EXIT_TOOL);
}
const LIMITS: Record<string, number> = base.limits ?? { ts: 450, tsx: 250 };
const FROZEN: Record<string, number> = base.frozen ?? {};

const files = listFiles();
const measured = files.map((f) => ({ file: f, lines: linesOf(path.join(ROOT, f)) }));

if (UPDATE) {
  const frozen: Record<string, number> = {};
  const over = measured.filter((m) => m.lines > (LIMITS[kindOf(m.file)] ?? Infinity));
  over.sort((a, b) => b.lines - a.lines).forEach((m) => (frozen[m.file] = m.lines));
  // 棘轮只许降: 已有条目的上限只能变小, 不允许 --update 顺手抬高
  const raised = Object.keys(frozen).filter((f) => FROZEN[f] !== undefined && frozen[f] > FROZEN[f]);
  if (raised.length > 0) {
    console.error("check-line-budget: --update 拒绝抬高水位 (棘轮只许降):");
    for (const f of raised) console.error(`  ${f}: ${FROZEN[f]} → ${frozen[f]}`);
    console.error("  水位要涨说明文件变长了  先拆文件, 而不是改基线。");
    process.exit(1);
  }
  fs.writeFileSync(BASELINE, JSON.stringify({ ...base, limits: LIMITS, frozen }, null, JSON_INDENT) + NEWLINE);
  console.log(`check-line-budget: 已更新水位 (冻结 ${Object.keys(frozen).length} 个文件, 只降不升)`);
  process.exit(0);
}

const violations: Array<{ file: string; rule: string; msg: string; hint: string }> = [];
for (const m of measured) {
  const limit = LIMITS[kindOf(m.file)];
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
      hint: "删掉这条  基线只该缩小, 留着会让人以为还有一笔债。",
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
