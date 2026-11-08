/**
 * 门禁总线: 本仓红线集的唯一入口, 所有检查点 (pre-commit / pre-push / CI / 手动) 都走它, 判据只定义一次.
 * 防"看起来跑了"的五条机制: 参数闭集 (未知参数 exit 2) / preflight (门禁文件不存在即报错) /
 * produces-requires (只认本次运行产出的产物) / fail-fast 并打印复现命令 / --dry-run 只打印计划.
 *
 * 用法: node scripts/gates/run.ts [--checkpoint <名>] [--group <g,g>] [--all] [--strict]
 * [--staged] [--from <ref>] [--list] [--dry-run]; 无参数时按工作区改动选 lane.
 * 退出码: 0=全过 / 1=有门禁失败 / 2=用法或 preflight 错误
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { GATES, GROUPS, REPO_ROOT } from "./registry.ts";
import type { Gate } from "./registry.ts";
import { CHECKPOINTS, GROUP_ORDER, groupsForFiles } from "./lanes.ts";
import { gitOutput, nameLines, parsePorcelain } from "./git-changes.ts";
import {
  FLAG_ALL, FLAG_CHECKPOINT, FLAG_DRY_RUN, FLAG_FROM, FLAG_GROUP, FLAG_HELP, FLAG_LIST, FLAG_STAGED, REPO_CWD, STRICT_FLAG,
  ARGV_START, EXIT_TOOL, ID_WIDTH, LIST_SEP, MS_PER_SECOND, SECONDS_DIGITS, SPACE,
} from "../constants/gates.ts";

const KNOWN_FLAGS = [FLAG_LIST, FLAG_DRY_RUN, FLAG_ALL, STRICT_FLAG, FLAG_STAGED, FLAG_HELP];
const KNOWN_VALUED = [FLAG_GROUP, FLAG_FROM, FLAG_CHECKPOINT];
/** preflight 认的门禁文件: 脚本 (.ts / .mjs) 与配置 (.json). 迁到 .ts 后只认 .mjs 会让整批门禁跳过 preflight. */
const GATE_FILE = /\.(?:ts|mjs|json)$/;
const NAME_ONLY = ["diff", "--name-only", "--diff-filter=ACMR"];

const argv = process.argv.slice(ARGV_START);
const flags = new Set<string>();
const valued: Record<string, string> = {};
const unknown: string[] = [];
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (KNOWN_VALUED.includes(a)) {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) unknown.push(a);
    else {
      valued[a] = v;
      i += 1;
    }
  } else if (KNOWN_FLAGS.includes(a)) flags.add(a);
  else unknown.push(a);
}
if (unknown.length > 0) {
  console.error(`run.ts: 未知参数 ${unknown.join(SPACE)}`);
  console.error(`  合法: ${[...KNOWN_FLAGS, ...KNOWN_VALUED].join(SPACE)}`);
  console.error(`  分组: ${GROUPS.join(SPACE)}`);
  process.exit(EXIT_TOOL);
}
if (flags.has(FLAG_HELP)) {
  console.log(`用法: node scripts/gates/run.ts [--group <g,g>] [--all] [--staged] [--from <ref>] [--strict] [--list] [--dry-run]`);
  console.log(`分组: ${GROUPS.join(LIST_SEP)}`);
  process.exit(0);
}

/**
 * 扫描根必须可被覆盖, 否则负向探针没有输入可喂  门禁脚本一律读 CHECK_UI_ROOT,
 * 探针把它指向临时目录. 总线自己也从这里取根, 保证两边看到同一个仓库.
 */
const ROOT = process.env.CHECK_UI_ROOT ? path.resolve(process.env.CHECK_UI_ROOT) : REPO_ROOT;

// ── 选门禁 ──────────────────────────────────────────────────────────
if (flags.has(FLAG_LIST)) {
  for (const g of GATES) {
    const extra = [g.produces ? `produces=${g.produces}` : "", g.requires ? `requires=${g.requires}` : ""]
      .filter(Boolean)
      .join(SPACE);
    console.log(`${g.group.padEnd(8)} ${g.id.padEnd(ID_WIDTH)} ${g.label}${extra ? `  [${extra}]` : ""}`);
  }
  process.exit(0);
}

let chosenGroups: string[];
let laneNote = "";
let checkpointStrict = false;
let checkpointFiles: string[] | null = null;
const cpName = valued[FLAG_CHECKPOINT];
if (cpName !== undefined) {
  const cp = CHECKPOINTS[cpName];
  if (!cp) {
    console.error(`run.ts: 未知检查点 ${cpName} (可选: ${Object.keys(CHECKPOINTS).join(LIST_SEP)})`);
    process.exit(EXIT_TOOL);
  }
  chosenGroups = cp.groups.filter((g) => GROUP_ORDER.includes(g));
  checkpointStrict = cp.strict === true;
  laneNote = `<检查点 ${cpName}: ${cp.title}>`;
  // 检查点档位与显式分组不该同时给  两个"跑哪些"的来源会让人分不清生效的是哪个
  if (flags.has(FLAG_ALL) || valued[FLAG_GROUP] !== undefined) {
    console.error("run.ts: --checkpoint 不能与 --all / --group 同时使用 (跑哪些只能有一个来源)");
    process.exit(EXIT_TOOL);
  }
  // --checkpoint 决定"跑哪些", 与变更集无关 (本仓门禁多为全仓分析器).
  // 但仍把变更集算出来打在输出里  它回答"这次改动落在哪几条 lane 上",
  // 是排查"为什么这条没跑"时的第一手信息.
  const f = changedFiles();
  if (f !== null) checkpointFiles = f;
} else if (flags.has(FLAG_ALL)) {
  chosenGroups = [...GROUP_ORDER];
  laneNote = "<全部>";
} else if (valued[FLAG_GROUP] !== undefined) {
  const want = valued[FLAG_GROUP].split(",").map((s) => s.trim()).filter(Boolean);
  const bad = want.filter((w) => !GROUPS.includes(w));
  if (bad.length > 0) {
    console.error(`run.ts: 未知分组 ${bad.join(LIST_SEP)} (可选: ${GROUPS.join(LIST_SEP)})`);
    process.exit(EXIT_TOOL);
  }
  chosenGroups = GROUP_ORDER.filter((g) => want.includes(g));
  laneNote = `<指定: ${chosenGroups.join(",")}>`;
} else {
  const files = changedFiles();
  const lane = groupsForFiles(files);
  chosenGroups = lane.groups;
  laneNote = lane.lanes.length > 0 ? `<lane: ${lane.lanes.join(" + ")}>` : "<lane: 无命中>";
  if (lane.unclaimed.length > 0) {
    console.error(`run.ts: 有路径没被任何 lane 认领, 按兜底跑全部分组:`);
    for (const u of lane.unclaimed.slice(0, 10)) console.error(`  ${u}`);
    console.error(`   请把它登记进 scripts/gates/lanes.ts (改它们会一条门禁都不跑, 而运行时看不出来)`);
    laneNote = "<lane: 未认领路径 → 全量兜底>";
  }
}

/** 取本次要检查的文件列表; 算不出来返回 null (调用方按"全跑"处理). */
function changedFiles(): string[] | null {
  if (flags.has(FLAG_STAGED)) return git([...NAME_ONLY, "--cached"]);
  if (valued[FLAG_FROM] !== undefined) return git([...NAME_ONLY, `${valued[FLAG_FROM]}...HEAD`]);
  // porcelain 走单独的解析: 状态码常以空格开头 (" M docs/x"), 按行 trim 会把它截成 "ocs/x"
  const out = gitOutput(["status", "--porcelain", "--untracked-files=all"], ROOT);
  if (out === null) return null;
  const files = parsePorcelain(out);
  // 工作区干净: 用最近一次提交的改动面, 避免"干净=什么都不跑"这个诱人的错误默认值
  if (files.length === 0) return git([...NAME_ONLY, "HEAD~1", "HEAD"]);
  return files;
}

/** --name-only 一类输出: 每行一个路径, 两端空白可以去掉. */
function git(args: string[]): string[] | null {
  const out = gitOutput(args, ROOT);
  return out === null ? null : nameLines(out);
}

let chosen = GATES.filter((g) => chosenGroups.includes(g.group));

// ── produces / requires: 依赖产物时自动把生产者拉进来 ──────────────
// requires 指的是**产物名** (如 dist), 不是门禁 id. 所以这里先按产物名找到生产者,
// 再判断它是否已在计划里  漏掉后一个判断会让同一条门禁在输出里出现两次
// (实测: --group browser 打出 4 条, 其中 docs-build 重复).
const planned = new Set(chosen.map((g) => g.id));
const producers = GATES.filter(
  (p) => p.produces && chosen.some((g) => g.requires === p.produces) && !planned.has(p.id),
);
for (const p of producers) {
  chosen.push(p);
  planned.add(p.id);
}
if (producers.length > 0) {
  console.log(
    `run.ts: 计划里有依赖产物的门禁, 已自动加入其生产者: ${producers.map((p) => p.id).join(LIST_SEP)}`,
  );
}
/** 本次运行真正产出过的产物名  只有它能让 requires 成立 (防读旧产物变绿). */
const produced = new Set<string>();
// 同组内按"生产者先跑"排序, 否则 requires 会先于 produces 求值, 于是被 SKIP.
// 组间顺序仍按 GROUP_ORDER (便宜的先跑).
const prodOf = new Map(GATES.filter((g) => g.produces).map((g) => [g.produces, g.id]));
chosen.sort((a, b) => {
  const byGroup = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
  if (byGroup !== 0) return byGroup;
  const aProducer = prodOf.get(a.produces) === a.id ? 0 : 1;
  const bProducer = prodOf.get(b.produces) === b.id ? 0 : 1;
  return aProducer - bProducer;
});

// ── preflight: 门禁文件不存在 = 报错, 不是通过 ─────────────────────
const missingFiles: Array<{ id: string; p: string }> = [];
for (const g of chosen) {
  const script = g.args.find((a) => GATE_FILE.test(a));
  if (script !== undefined && !existsSync(path.resolve(ROOT, g.cwd, script))) {
    missingFiles.push({ id: g.id, p: path.join(g.cwd, script) });
  }
}
if (missingFiles.length > 0) {
  console.error(`run.ts: preflight 失败  注册表里的门禁文件不存在:`);
  for (const m of missingFiles) console.error(`  ${m.id}: ${m.p}`);
  console.error(`  一次改名就会让整条门禁静默消失, 所以这里直接报错而不是跳过。`);
  process.exit(EXIT_TOOL);
}

const STRICT = flags.has(STRICT_FLAG) || checkpointStrict;
const argvFor = (g: Gate): string[] => (STRICT && g.strictArgs ? g.strictArgs : g.args);
const reproOf = (g: Gate): string => {
  /**
   * HX-UI 接入 Agent Notes v2
   * .agents/notes/implemented/process/2026-10-08-repository-agent-notes-v2-adoption.md
   */
  const cmd = [process.execPath, "scripts/gates/run.ts"].concat(
    flags.has(FLAG_ALL) ? [FLAG_ALL] : [FLAG_GROUP, g.group],
  );
  if (STRICT) cmd.push(STRICT_FLAG);
  return `cd ${ROOT} && ${[...cmd, "# 单条复现:", ...argvFor(g)].join(SPACE)}`;
};

if (flags.has(FLAG_DRY_RUN)) {
  console.log(`== 门禁 dry-run (root=${ROOT}, strict=${STRICT}) ==`);
  console.log(`   lane: ${laneNote}`);
  chosen.forEach((g, i) => {
    console.log(`  ${i + 1}. [${g.group}] ${g.id} — ${g.label}`);
    console.log(`     复现: cd ${g.cwd === REPO_CWD ? ROOT : path.join(ROOT, g.cwd)} && ${argvFor(g).join(SPACE)}`);
  });
  process.exit(0);
}

// ── 执行: fail-fast + 计时 ─────────────────────────────────────────
const t0 = Date.now();
console.log(`== 门禁 (root=${ROOT}${STRICT ? ", strict" : ""}) ${laneNote} ==`);
if (checkpointFiles !== null) {
  const lane = groupsForFiles(checkpointFiles);
  console.log(
    `   本次改动 ${checkpointFiles.length} 个文件 → lane ${lane.lanes.join(" + ") || "(无命中)"}` +
      (lane.unclaimed.length > 0 ? `; 其中 ${lane.unclaimed.length} 个路径未认领 (请登记进 lanes.ts)` : ""),
  );
}
const failed: string[] = [];
for (let i = 0; i < chosen.length; i += 1) {
  const g = chosen[i];
  if (g.requires && !produced.has(g.requires)) {
    console.log(`  [${i + 1}/${chosen.length}] ${g.id.padEnd(ID_WIDTH)} SKIP (产物 ${g.requires} 不是本次运行产出的)`);
    // 严格档下这是失败: 说明生产者没被拉进来, 而这条门禁其实没验证任何东西
    if (STRICT) {
      failed.push(`${g.id}(缺产物 ${g.requires})`);
      break;
    }
    continue;
  }
  process.stdout.write(`  [${i + 1}/${chosen.length}] ${g.id.padEnd(ID_WIDTH)} `);
  const cwd = g.cwd === REPO_CWD ? ROOT : path.join(ROOT, g.cwd);
  const started = Date.now();
  const r = spawnSync(argvFor(g)[0], argvFor(g).slice(1), {
    cwd,
    encoding: "utf8",
    env: { ...process.env, CHECK_UI_ROOT: ROOT },
  });
  const secs = ((Date.now() - started) / MS_PER_SECOND).toFixed(SECONDS_DIGITS);
  if (r.error) {
    console.log(`FAIL  (无法启动: ${r.error.message})`);
    failed.push(g.id);
    console.log(`      ${g.label}`);
    console.log(`      复现: cd ${cwd} && ${argvFor(g).join(SPACE)}`);
    break;
  }
  if (r.status === 0) {
    console.log(`PASS  (${secs}s)`);
    if (g.produces) produced.add(g.produces);
    continue;
  }
  console.log(`FAIL  (exit ${r.status}, ${secs}s)`);
  console.log(`      ${g.label}`);
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trimEnd();
  if (out) console.log(out.split("\n").slice(-25).map((l) => `      ${l}`).join("\n"));
  console.log(`      复现: cd ${cwd} && ${argvFor(g).join(SPACE)}`);
  failed.push(g.id);
  break; // fail-fast
}

if (failed.length > 0) {
  console.error(`门禁: FAILED — ${failed.join(LIST_SEP)} (总耗时 ${((Date.now() - t0) / MS_PER_SECOND).toFixed(SECONDS_DIGITS)}s)`);
  process.exit(1);
}
console.log(`门禁: ALL PASS (${chosen.length} 条, ${((Date.now() - t0) / MS_PER_SECOND).toFixed(SECONDS_DIGITS)}s)`);
