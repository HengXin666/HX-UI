/**
 * 负向探针: 证明每一条门禁真的会红, 以及它真的被接上了. 规则改坏, 锚点删掉, 正则写漏都会让门禁静默失效,
 * 而失效和"没发现问题"一样是退出码 0. 2026-10-04 实测: 注册表门禁第一版的图标键正则只认带引号写法, 照样打印通过.
 * 三类探针缺一不可: 违规组必须 FAIL 且说出正确理由 / 控制组必须 PASS / 接线组摘注册表, 接 `|| true`, 摘 hook 必须 FAIL.
 * 夹具建在系统临时目录, 跑完即删, 绝不写真实仓库; 它要起几十个子进程, 所以只在 CI 与手动命令里跑.
 *
 * 用法: node scripts/gates/shared/probe-gates.ts [--only=<关键字>]
 * 退出码: 0=全部符合预期 / 1=有探针不符合预期 / 2=探针自身坏了
 */
import { EXIT_TOOL, NEWLINE } from "../../constants/gates.ts";
import { EXPECT_FAIL, cleanup, tmpRoot } from "./probes/kit.ts";
import type { Probe, ProbeResult } from "./probes/kit.ts";
import { STATIC_PROBES } from "./probes/static-cases.ts";
import { WIRING_PROBES } from "./probes/wiring-cases.ts";

/**
 * 失败时每条探针最多打印多少行输出.
 *
 * .agents/notes/implemented/process/2026-11-08-gates-ts.md
 */
const MAX_PRINTED_LINES = 30;
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) ?? "").split("=")[1] ?? "";
const probes: Probe[] = [...STATIC_PROBES, ...WIRING_PROBES];

const selected = ONLY ? probes.filter((p) => p.name.includes(ONLY)) : probes;
if (selected.length === 0) {
  console.error(`probe-gates: --only=${ONLY} 没有匹配到任何探针`);
  process.exit(EXIT_TOOL);
}

console.log(`probe-gates: ${selected.length} 条探针 (夹具根 ${tmpRoot})\n`);

let pass = 0;
let fail = 0;
const failures: string[] = [];

for (const p of selected) {
  let r: ProbeResult;
  try {
    r = p.run();
  } catch (err) {
    r = { status: -1, output: `抛异常: ${err.message}` };
  }
  const okStatus = p.expect === EXPECT_FAIL ? r.status === 1 : r.status === 0;
  const missing = (p.expectIn ?? []).filter((s) => !r.output.includes(s));

  if (okStatus && missing.length === 0) {
    pass += 1;
    console.log(`  PASS  ${p.name}`);
    continue;
  }
  fail += 1;
  console.log(`  FAIL  ${p.name}`);
  console.log(`        期望 status=${p.expect === EXPECT_FAIL ? 1 : 0}, 实际 ${r.status}`);
  if (missing.length > 0) console.log(`        输出里缺少: ${missing.join(", ")}`);
  console.log(`        为什么重要: ${p.reason}`);
  console.log(
    r.output
      .trimEnd()
      .split(NEWLINE)
      .slice(0, MAX_PRINTED_LINES)
      .map((l) => `        | ${l}`)
      .join(NEWLINE),
  );
  console.log("");
  failures.push(p.name);
}

const skipped = probes.length - selected.length;

cleanup();

if (fail > 0) {
  console.error(
    `probe-gates: FAILED — ${fail} 条探针不符合预期 (${pass} 通过${skipped > 0 ? `, ${skipped} 跳过` : ""})`,
  );
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`probe-gates: 全部符合预期 (${pass} 通过${skipped > 0 ? `, ${skipped} 跳过 (--only)` : ""})`);
