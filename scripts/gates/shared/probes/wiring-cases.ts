/** 接线探针: 摘注册表 / 接 `|| true` / 摘钩子 / 改禁令正则 -> 指纹必须 FAIL; 只改 label 与原样副本 -> 必须 PASS. */
import fs from "node:fs";
import path from "node:path";
import { HOOKS_DIR, JSON_INDENT, NEWLINE, PRE_COMMIT, PROBE_BROKEN, REGISTRY_FILE, UTF8 } from "../../../constants/gates.ts";
import { parsePorcelain } from "../../git-changes.ts";
import { CHECK, EXPECT_FAIL, EXPECT_PASS, repoCopy, rootAt, run } from "./kit.ts";
import type { Probe, ProbeResult } from "./kit.ts";

const GATE_FINGERPRINT = "check-fingerprint";
const FP_WIRING_SOURCE = "wiring:checkpoints";
const CHECK_UI_SCRIPT = "check:ui";

/**
 * 总线读工作区变更集的解析: 行首空格的状态码 (" M") 必须原样保留列位置.
 * 旧实现按行 trim 后再切, " M docs/x" 读成 "M docs/x" 或 "ocs/x", 被报成未认领路径并全量兜底.
 */
function porcelainProbe(): ProbeResult {
  const sample = [" M docs/x.md", "M  src/y.ts", "MM scripts/z.ts", "?? tests/new.ts", "R  old/a.ts -> new/a.ts", ""].join(NEWLINE);
  const want = ["docs/x.md", "src/y.ts", "scripts/z.ts", "tests/new.ts", "new/a.ts"];
  const got = parsePorcelain(sample);
  const ok = JSON.stringify(got) === JSON.stringify(want);
  return { status: ok ? 0 : 1, output: `porcelain 解析: ${JSON.stringify(got)} (期望 ${JSON.stringify(want)})` };
}

export const WIRING_PROBES: Probe[] = [
  {
    name: "总线 控制组: porcelain 行首空格状态码 (\" M docs/x\") 解析出完整路径",
    gate: "run",
    expect: EXPECT_PASS,
    reason: "按行 trim 会把只改工作区的文件截成错路径, 于是每次都报未认领路径并全量兜底, lane 分流等于失效",
    run: porcelainProbe,
    expectIn: ["\"docs/x.md\""],
  },
  {
    name: "接线: 从注册表删掉一条门禁 → 指纹必须 FAIL",
    gate: GATE_FINGERPRINT,
    expect: EXPECT_FAIL,
    reason:
      "第一组指纹一个字都没变, 而那条门禁在**所有**检查点上同时消失  " +
      "这是单条门禁自身与违规探针都拦不住的一类失效",
    run: () => {
      const dir = repoCopy("fp-drop-gate");
      const p = path.join(dir, REGISTRY_FILE);
      const src = fs.readFileSync(p, UTF8);
      const before = src.length;
      // 删掉 typecheck 这一整条门禁定义
      const next = src.replace(/\n  \{\n    id: "typecheck",[\s\S]*?\n  \},/, "");
      if (next.length === before) return { status: PROBE_BROKEN, output: "夹具失败: registry.ts 里没匹配到 typecheck 定义" };
      fs.writeFileSync(p, next);
      return run(...CHECK.fingerprint, rootAt(dir));
    },
    expectIn: ["registry:gates"],
  },
  {
    name: "接线: 给 package.json 的门禁入口接上 `|| true` → 指纹必须 FAIL",
    gate: GATE_FINGERPRINT,
    expect: EXPECT_FAIL,
    reason: "给门禁接 `|| true` 是最典型的「让它永远绿」的做法, 而单条门禁自身没有任何感觉",
    run: () => {
      const dir = repoCopy("fp-mask");
      const p = path.join(dir, "package.json");
      const pkg = JSON.parse(fs.readFileSync(p, UTF8));
      pkg.scripts = pkg.scripts ?? {};
      const cur = pkg.scripts[CHECK_UI_SCRIPT] ?? "node scripts/quality/index.ts check --mode all";
      pkg.scripts[CHECK_UI_SCRIPT] = `${cur} || true`;
      fs.writeFileSync(p, JSON.stringify(pkg, null, JSON_INDENT) + NEWLINE);
      return run(...CHECK.fingerprint, rootAt(dir));
    },
    expectIn: [FP_WIRING_SOURCE],
  },
  {
    name: "接线: 摘掉仓库内 pre-commit 钩子源文件 → 指纹必须 FAIL",
    gate: GATE_FINGERPRINT,
    expect: EXPECT_FAIL,
    reason: "hook 被摘掉后提交流程里一条门禁都不跑, 而所有门禁脚本本身完好无损",
    run: () => {
      const dir = repoCopy("fp-drop-hook");
      const h = path.join(dir, HOOKS_DIR, PRE_COMMIT);
      if (!fs.existsSync(h)) return { status: PROBE_BROKEN, output: "夹具失败: 仓库内没有 scripts/gates/hooks/pre-commit, 无法验证「摘掉后必须 FAIL」" };
      fs.rmSync(h);
      return run(...CHECK.fingerprint, rootAt(dir));
    },
    expectIn: [FP_WIRING_SOURCE],
  },
  {
    name: "接线 控制组: 只改某条门禁的 label 文案 → 必须 PASS",
    gate: GATE_FINGERPRINT,
    expect: EXPECT_PASS,
    reason:
      "指纹抽多了会天天报警, 所有人去跑 --update, 报警器就退化成确认键。" +
      "这条控制组把「显示名不算严格度」钉死",
    run: () => {
      const dir = repoCopy("fp-relabel");
      const p = path.join(dir, REGISTRY_FILE);
      const src = fs.readFileSync(p, UTF8);
      const next = src.replace(/label:\s*"[^"]*"/, 'label: "换了一段完全等价的文案 (内容没变)"');
      if (next === src) return { status: PROBE_BROKEN, output: "夹具失败: registry.ts 里没匹配到 label" };
      fs.writeFileSync(p, next);
      return run(...CHECK.fingerprint, rootAt(dir));
    },
  },
  {
    name: "接线: 改门禁脚本里的调色盘禁令正则 → 指纹必须 FAIL",
    gate: GATE_FINGERPRINT,
    expect: EXPECT_FAIL,
    reason:
      "这条钉的是**指纹抽取器本身**。实测过它退化的形态: 第一版只抽 `const X = <字面量>`," +
      "而 check-ui-rules 的禁令是正则、白名单是 new Set([...]), 一个都没读到  " +
      "于是三条门禁的指纹哈希完全相同, 它却照样打印「通过」。哈希相同就是抽取器瞎了的判据。",
    run: () => {
      const dir = repoCopy("fp-regex");
      const p = path.join(dir, "scripts/quality/checks/ui.ts");
      const src = fs.readFileSync(p, UTF8);
      // 把调色盘禁令正则改成永不命中: 这是真放松, 必须被看见
      const next = src.replace(/(id: "PROJECT-UI-PALETTE"[\s\S]*?pattern: )\/[^\n]*?\/g,/, "$1/\\bnever-matches-[a-z]*-[0-9]{2,3}\\b/g,");
      if (next === src) return { status: PROBE_BROKEN, output: "夹具失败: ui.ts 里没匹配到 PROJECT-UI-PALETTE 的 pattern" };
      fs.writeFileSync(p, next);
      return run(...CHECK.fingerprint, rootAt(dir));
    },
    expectIn: ["thresholds:check-ui-rules"],
  },
  {
    name: "接线: 控制组  未改动的副本指纹必须 PASS",
    gate: GATE_FINGERPRINT,
    expect: EXPECT_PASS,
    reason: "防误报: 指纹对「同样的内容」必须稳定, 否则它是个随机数生成器",
    run: () => {
      const dir = repoCopy("fp-clean");
      return run(...CHECK.fingerprint, rootAt(dir));
    },
  },
];
