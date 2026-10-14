#!/usr/bin/env node
/**
 * 门禁总线  本仓红线集的唯一入口。所有检查点 (pre-commit / pre-push / CI / 手动) 都走它。
 *
 * 为什么要有它: 判据定义只能有一份。同一套检查在三个检查点上各写一遍时, 差别不会
 * 报错, 只会**悄悄出现**  某个检查点漏掉一条, 表现和"全绿"完全一样。
 *
 * 五条防"跑错"的机制 (门禁最危险的失败形态是"它看起来跑了"):
 *   1. 参数是闭集, 未知参数 exit 2  否则新 flag 会被静默当成组名
 *   2. preflight  门禁脚本文件不存在就**立刻报错**, 不当成通过 (一次改名会让整条门禁静默消失)
 *   3. produces/requires  依赖产物的门禁只认**本次运行内**产出的产物, 生产者不在计划里就自动拉进来
 *      (缺这条的症状: 读到上一轮留在磁盘上的旧 dist 而静默变绿)
 *   4. fail-fast  第一条红就停, 并打印可直接复制的复现命令
 *   5. --dry-run  只打印会跑什么与真实参数, 不执行 (写文档、排查、code review 都要它)
 *
 * 用法:
 *   node scripts/gates/run.mjs                          # 按工作区改动选 lane
 *   node scripts/gates/run.mjs --checkpoint pre-commit   # 检查点档位 (钩子调它)
 *   node scripts/gates/run.mjs --group lib,docs          # 指定分组
 *   node scripts/gates/run.mjs --all                     # 全部 (含 probe)
 *   node scripts/gates/run.mjs --all --strict            # CI 档: 缺依赖不再静默跳过
 *   node scripts/gates/run.mjs --list | --dry-run
 *   node scripts/gates/run.mjs --staged                  # 只看暂存区 (pre-commit)
 *   node scripts/gates/run.mjs --from main               # 从分支点算起 (pre-push)
 *
 * 退出码: 0=全过 / 1=有门禁失败 / 2=用法或 preflight 错误
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { GATES, GROUPS, REPO_ROOT, gateById } from "./registry.mjs";
import { CHECKPOINTS, GROUP_ORDER, groupsForFiles } from "./lanes.mjs";

const KNOWN_FLAGS = ["--list", "--dry-run", "--all", "--strict", "--staged", "--help"];
const KNOWN_VALUED = ["--group", "--from", "--checkpoint"];

const argv = process.argv.slice(2);
const flags = new Set();
const valued = {};
const unknown = [];
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
  console.error(`run.mjs: 未知参数 ${unknown.join(" ")}`);
  console.error(`  合法: ${[...KNOWN_FLAGS, ...KNOWN_VALUED].join(" ")}`);
  console.error(`  分组: ${GROUPS.join(" ")}`);
  process.exit(2);
}
if (flags.has("--help")) {
  console.log(`用法: node scripts/gates/run.mjs [--group <g,g>] [--all] [--staged] [--from <ref>] [--strict] [--list] [--dry-run]`);
  console.log(`分组: ${GROUPS.join(", ")}`);
  process.exit(0);
}

/**
 * 扫描根必须可被覆盖, 否则负向探针没有输入可喂  门禁脚本一律读 CHECK_UI_ROOT,
 * 探针把它指向临时目录。总线自己也从这里取根, 保证两边看到同一个仓库。
 */
const ROOT = process.env.CHECK_UI_ROOT ? path.resolve(process.env.CHECK_UI_ROOT) : REPO_ROOT;

// ── 选门禁 ──────────────────────────────────────────────────────────
if (flags.has("--list")) {
  for (const g of GATES) {
    const extra = [g.produces ? `produces=${g.produces}` : "", g.requires ? `requires=${g.requires}` : ""]
      .filter(Boolean)
      .join(" ");
    console.log(`${g.group.padEnd(8)} ${g.id.padEnd(14)} ${g.label}${extra ? `  [${extra}]` : ""}`);
  }
  process.exit(0);
}

let chosenGroups;
let laneNote = "";
let checkpointStrict = false;
let checkpointFiles = null;
const cpName = valued["--checkpoint"];
if (cpName !== undefined) {
  const cp = CHECKPOINTS[cpName];
  if (!cp) {
    console.error(`run.mjs: 未知检查点 ${cpName} (可选: ${Object.keys(CHECKPOINTS).join(", ")})`);
    process.exit(2);
  }
  chosenGroups = cp.groups.filter((g) => GROUP_ORDER.includes(g));
  checkpointStrict = cp.strict === true;
  laneNote = `<检查点 ${cpName}: ${cp.title}>`;
  // 检查点档位与显式分组不该同时给  两个"跑哪些"的来源会让人分不清生效的是哪个
  if (flags.has("--all") || valued["--group"] !== undefined) {
    console.error("run.mjs: --checkpoint 不能与 --all / --group 同时使用 (跑哪些只能有一个来源)");
    process.exit(2);
  }
  // --checkpoint 决定"跑哪些", 与变更集无关 (本仓门禁多为全仓分析器)。
  // 但仍把变更集算出来打在输出里  它回答"这次改动落在哪几条 lane 上",
  // 是排查"为什么这条没跑"时的第一手信息。
  const f = changedFiles();
  if (f !== null) checkpointFiles = f;
} else if (flags.has("--all")) {
  chosenGroups = [...GROUP_ORDER];
  laneNote = "<全部>";
} else if (valued["--group"] !== undefined) {
  const want = valued["--group"].split(",").map((s) => s.trim()).filter(Boolean);
  const bad = want.filter((w) => !GROUPS.includes(w));
  if (bad.length > 0) {
    console.error(`run.mjs: 未知分组 ${bad.join(", ")} (可选: ${GROUPS.join(", ")})`);
    process.exit(2);
  }
  chosenGroups = GROUP_ORDER.filter((g) => want.includes(g));
  laneNote = `<指定: ${chosenGroups.join(",")}>`;
} else {
  const files = changedFiles();
  const lane = groupsForFiles(files);
  chosenGroups = lane.groups;
  laneNote = lane.lanes.length > 0 ? `<lane: ${lane.lanes.join(" + ")}>` : "<lane: 无命中>";
  if (lane.unclaimed.length > 0) {
    console.error(`run.mjs: 有路径没被任何 lane 认领, 按兜底跑全部分组:`);
    for (const u of lane.unclaimed.slice(0, 10)) console.error(`  ${u}`);
    console.error(`   请把它登记进 scripts/gates/lanes.mjs (改它们会一条门禁都不跑, 而运行时看不出来)`);
    laneNote = "<lane: 未认领路径 → 全量兜底>";
  }
}

/** 取本次要检查的文件列表; 算不出来返回 null (调用方按"全跑"处理)。 */
function changedFiles() {
  if (flags.has("--staged")) {
    const r = git(["diff", "--name-only", "--cached", "--diff-filter=ACMR"]);
    return r;
  }
  if (valued["--from"] !== undefined) {
    const r = git(["diff", "--name-only", "--diff-filter=ACMR", `${valued["--from"]}...HEAD`]);
    return r;
  }
  const r = git(["status", "--porcelain", "--untracked-files=all"]);
  if (r === null) return null;
  // porcelain 每行是 "XY<空格><路径>"。**不能先 trim 再 slice(3)** 
  // 状态码常以空格开头 (" M docs/x"), trim 会吃掉它, 得到 "ocs/x"。
  const files = r.map((l) => l.replace(/^..\s/, "").trim()).filter(Boolean);
  // 工作区干净: 用最近一次提交的改动面, 避免"干净=什么都不跑"这个诱人的错误默认值
  if (files.length === 0) return git(["diff", "--name-only", "--diff-filter=ACMR", "HEAD~1", "HEAD"]);
  return files;
}

function git(args) {
  const r = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) return null;
  return (r.stdout ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
}

let chosen = GATES.filter((g) => chosenGroups.includes(g.group));

// ── produces / requires: 依赖产物时自动把生产者拉进来 ──────────────
// requires 指的是**产物名** (如 dist), 不是门禁 id。所以这里先按产物名找到生产者,
// 再判断它是否已在计划里  漏掉后一个判断会让同一条门禁在输出里出现两次
// (实测: --group browser 打出 4 条, 其中 docs-build 重复)。
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
    `run.mjs: 计划里有依赖产物的门禁, 已自动加入其生产者: ${producers.map((p) => p.id).join(", ")}`,
  );
}
/** 本次运行真正产出过的产物名  只有它能让 requires 成立 (防读旧产物变绿)。 */
const produced = new Set();
// 同组内按"生产者先跑"排序, 否则 requires 会先于 produces 求值, 于是被 SKIP。
// 组间顺序仍按 GROUP_ORDER (便宜的先跑)。
const prodOf = new Map(GATES.filter((g) => g.produces).map((g) => [g.produces, g.id]));
chosen.sort((a, b) => {
  const byGroup = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
  if (byGroup !== 0) return byGroup;
  const aProducer = prodOf.get(a.produces) === a.id ? 0 : 1;
  const bProducer = prodOf.get(b.produces) === b.id ? 0 : 1;
  return aProducer - bProducer;
});

// ── preflight: 门禁文件不存在 = 报错, 不是通过 ─────────────────────
const missingFiles = [];
for (const g of chosen) {
  const script = g.args.find((a) => a.endsWith(".mjs") || a.endsWith(".json"));
  if (script !== undefined && !existsSync(path.resolve(ROOT, g.cwd, script))) {
    missingFiles.push({ id: g.id, p: path.join(g.cwd, script) });
  }
}
if (missingFiles.length > 0) {
  console.error(`run.mjs: preflight 失败  注册表里的门禁文件不存在:`);
  for (const m of missingFiles) console.error(`  ${m.id}: ${m.p}`);
  console.error(`  一次改名就会让整条门禁静默消失, 所以这里直接报错而不是跳过。`);
  process.exit(2);
}

const STRICT = flags.has("--strict") || checkpointStrict;
const argvFor = (g) => (STRICT && g.strictArgs ? g.strictArgs : g.args);
const reproOf = (g) => {
  /**
   * HX-UI 接入 Agent Notes v2
   * .agents/notes/implemented/process/2026-10-08-repository-agent-notes-v2-adoption.md
   */
  const cmd = [process.execPath, "scripts/gates/run.mjs"].concat(
    flags.has("--all") ? ["--all"] : ["--group", g.group],
  );
  if (STRICT) cmd.push("--strict");
  return `cd ${ROOT} && ${[...cmd, "# 单条复现:", ...argvFor(g)].join(" ")}`;
};

if (flags.has("--dry-run")) {
  console.log(`== 门禁 dry-run (root=${ROOT}, strict=${STRICT}) ==`);
  console.log(`   lane: ${laneNote}`);
  chosen.forEach((g, i) => {
    console.log(`  ${i + 1}. [${g.group}] ${g.id} — ${g.label}`);
    console.log(`     复现: cd ${g.cwd === "." ? ROOT : path.join(ROOT, g.cwd)} && ${argvFor(g).join(" ")}`);
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
      (lane.unclaimed.length > 0 ? `; 其中 ${lane.unclaimed.length} 个路径未认领 (请登记进 lanes.mjs)` : ""),
  );
}
const failed = [];
for (let i = 0; i < chosen.length; i += 1) {
  const g = chosen[i];
  if (g.requires && !produced.has(g.requires)) {
    console.log(`  [${i + 1}/${chosen.length}] ${g.id.padEnd(14)} SKIP (产物 ${g.requires} 不是本次运行产出的)`);
    // 严格档下这是失败: 说明生产者没被拉进来, 而这条门禁其实没验证任何东西
    if (STRICT) {
      failed.push(`${g.id}(缺产物 ${g.requires})`);
      break;
    }
    continue;
  }
  process.stdout.write(`  [${i + 1}/${chosen.length}] ${g.id.padEnd(14)} `);
  const cwd = g.cwd === "." ? ROOT : path.join(ROOT, g.cwd);
  const started = Date.now();
  const r = spawnSync(argvFor(g)[0], argvFor(g).slice(1), {
    cwd,
    encoding: "utf8",
    env: { ...process.env, CHECK_UI_ROOT: ROOT },
  });
  const secs = ((Date.now() - started) / 1000).toFixed(2);
  if (r.error) {
    console.log(`FAIL  (无法启动: ${r.error.message})`);
    failed.push(g.id);
    console.log(`      ${g.label}`);
    console.log(`      复现: cd ${cwd} && ${argvFor(g).join(" ")}`);
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
  console.log(`      复现: cd ${cwd} && ${argvFor(g).join(" ")}`);
  failed.push(g.id);
  break; // fail-fast
}

if (failed.length > 0) {
  console.error(`门禁: FAILED — ${failed.join(", ")} (总耗时 ${((Date.now() - t0) / 1000).toFixed(2)}s)`);
  process.exit(1);
}
console.log(`门禁: ALL PASS (${chosen.length} 条, ${((Date.now() - t0) / 1000).toFixed(2)}s)`);
