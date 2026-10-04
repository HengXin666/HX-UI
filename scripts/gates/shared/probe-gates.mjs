#!/usr/bin/env node
/**
 * 负向探针 —— 证明每一条门禁**真的会红**, 以及它**真的被接上了**。
 *
 * ## 为什么必须有它
 *
 * "我加了检查规则"和"检查规则真的会拦下违规"是两件事。规则被改坏、锚点被删掉、
 * 正则写漏、路径算错, 都会让门禁**静默失效** —— 而失效的表现和"没发现问题"完全一样:
 * 退出码 0、没有输出、CI 上还是绿的。
 *
 * 本仓已经有过一次实例 (2026-10-04 实测): 文档注册表门禁的第一版把图标键正则写成
 * 只匹配带引号的写法, 于是一半的键落在检查之外 —— 它照样打印「通过」。
 * 那条正则是在写完本探针、发现违规组不 FAIL 之后才改对的。
 *
 * ## 三类探针缺一不可
 *
 *   违规组: 故意违规的输入 → 必须 FAIL (且输出要说出**正确理由**, 光看退出码不够)
 *   控制组: 合规输入 → 必须 PASS
 *   接线组: 摘掉注册表 / 接 `|| true` / 摘 hook → 指纹必须 FAIL; 只改 label → 必须 PASS
 *
 * 只有违规组时, 一个「对任何输入都报红」的坏门禁会显得完美; 只有控制组时,
 * 一个「什么都不检查」的空门禁同样完美。
 *
 * ## 安全与代价
 *
 * 夹具一律建在系统临时目录, 跑完即删, **绝不写真实仓库**。
 * 它要起几十个子进程, 所以**不进提交级检查点**, 只在 CI 与手动命令里跑。
 *
 * 用法: node scripts/gates/shared/probe-gates.mjs [--only=<关键字>]
 * 退出码: 0=全部符合预期 / 1=有探针不符合预期 / 2=探针自身坏了
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.env.CHECK_UI_ROOT
  ? path.resolve(process.env.CHECK_UI_ROOT)
  : path.resolve(import.meta.dirname, "..", "..", "..");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) ?? "").split("=")[1] ?? "";

/** 输出上限: 门禁打太多行会把「通过」伪装成 ENOBUFS 失败。 */
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
const MAX_PRINTED_LINES = 30;

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hxui-probe-"));
const created = [tmpRoot];

/** 建一个临时夹具目录。 */
function fixture(name) {
  const dir = path.join(tmpRoot, name);
  fs.mkdirSync(dir, { recursive: true });
  created.push(dir);
  return dir;
}

function writeFiles(base, files) {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(base, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
}

/**
 * 把仓库复制一份到临时目录 (排除 node_modules/.git/dist/.bpprobe)。
 * 接线探针要真的去改注册表和检查点配置, 只能在副本上改 —— 绝不碰真实仓库。
 *
 * `.git/hooks` 单独复制过来: 指纹第二组要读"hook 装没装"这个事实,
 * 不复制它的话所有副本都会算成「未安装」, 指纹控制组就永远不 PASS。
 */
function repoCopy(label) {
  const dir = path.join(tmpRoot, label);
  fs.mkdirSync(dir, { recursive: true });
  fs.cpSync(ROOT, dir, {
    recursive: true,
    filter: (src) =>
      !["node_modules", ".git", "dist", ".vite", ".bpprobe"].includes(path.basename(src)),
  });
  const hooksSrc = path.join(ROOT, ".git", "hooks");
  if (fs.existsSync(hooksSrc)) {
    fs.cpSync(hooksSrc, path.join(dir, ".git", "hooks"), { recursive: true });
  }
  created.push(dir);
  return dir;
}

/** 跑一条门禁脚本, 返回 {status, output}。 */
function run(script, args, env, cwd) {
  const r = spawnSync(process.execPath, [script, ...args], {
    cwd: cwd ?? ROOT,
    encoding: "utf8",
    maxBuffer: MAX_OUTPUT_BYTES,
    env: { ...process.env, ...env },
  });
  if (r.error) return { status: -1, output: r.error.message };
  return { status: r.status, output: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

const G = (rel) => path.join(ROOT, rel);
const CHECK = {
  uiRules: [G("scripts/check-ui-rules.mjs"), ["src"]],
  registry: [G("scripts/gates/frontend/check-docs-registry.mjs"), []],
  lineBudget: [G("scripts/gates/frontend/check-line-budget.mjs"), []],
  lanes: [G("scripts/gates/shared/check-lanes.mjs"), []],
  fingerprint: [G("scripts/gates/shared/check-fingerprint.mjs"), ["--check"]],
};

/** ── 夹具模板 ──────────────────────────────────────────────────── */

/**
 * 最小 docs+src 骨架 —— 给「注册表对账 / 行数 / 分流」三条门禁喂最小输入。
 * 这不是可构建的站点: 这三条门禁都只做静态对账, 不跑构建。
 *
 * ⚠️ App.tsx 必须写成 `switch (page) { case "a": ... }` 的形式 ——
 * 门禁的判据是"页面 id 在 renderPage 里有对应 case"。夹具写成别的形式
 * (例如直接 return) 会让**控制组**报红, 而这正是控制组的价值:
 * 它证明门禁不是靠"有没有 import"这类弱信号在放行。
 */
function docsSkeleton(overrides = {}) {
  return {
    "docs/src/nav.ts": `export const DOCS = [
  { id: "a", label: "A", group: "g", desc: "d" },
];
`,
    "docs/src/App.tsx": `import { APage } from "./pages/APage";
export function renderPage(page: string) {
  switch (page) {
    case "a": return <APage />;
    default: return null;
  }
}
`,
    "docs/src/navIcons.ts": `export const NAV_ICONS = { a: "icon-[solar--graph-linear]" };
`,
    "docs/src/pages/APage.tsx": `export function APage() { return null; }
`,
    "src/index.ts": `export { A } from "./primitives/a";
`,
    "src/primitives/a.tsx": `export const A = 1;
`,
    // 让 lane 前缀都有活目标 (否则会额外报 dead-lane-prefix, 混淆探针意图)
    ".github/workflows/x.yml": "name: x\n",
    "scripts/x.txt": "",
    "README.md": "",
    ".gitignore": "",
    "LICENSE": "",
    "NOTICE": "",
    "UPSTREAM_COMMIT": "",
    "package.json": "{}\n",
    "tsconfig.json": "{}\n",
    "package-lock.json": "{}\n",
    ...overrides,
  };
}

/**
 * 注意: check-lanes 的 LANES 表来自它**自己所在的模块** (import), 不由扫描根覆盖 ——
 * 所以夹具只能验证"多出来的顶层条目会被拦下"与"真实 lane 表能认领干净骨架",
 * 不能验证"改 lane 表本身"。后者由指纹的 registry:lanes 来源覆盖。
 */

/** 行数门禁的基线夹具。 */
const budgetBase = (frozen, limits = { ts: 450, tsx: 250 }) =>
  JSON.stringify({ limits, frozen }, null, 2) + "\n";

/** ── 探针定义 ──────────────────────────────────────────────────── */

const probes = [
  // ───── 设计规约 (check-ui-rules) ─────
  {
    name: "ui-rules 违规组: 硬编调色盘 + 非 1px 边框 + 漏写 type 的 button",
    gate: "check-ui-rules",
    expect: "fail",
    reason: "正则或扫描根被改坏时, 这套库会慢慢长回随机颜色, 而没有任何东西报错",
    run: () => {
      const dir = fixture("ui-rules-bad");
      writeFiles(dir, {
        "src/bad.tsx": `export const X = () => <button className="bg-slate-500 border-2">hi</button>;\n`,
      });
      return run(...CHECK.uiRules, { CHECK_UI_ROOT: dir });
    },
    expectIn: ["no-palette", "border-1px", "button-type"],
  },
  {
    name: "ui-rules 控制组: 语义 token + type=button",
    gate: "check-ui-rules",
    expect: "pass",
    reason: "防误报: 合规写法被拦下会让人直接绕过这条门禁",
    run: () => {
      const dir = fixture("ui-rules-ok");
      writeFiles(dir, {
        "src/ok.tsx": `export const Y = () => <button type="button" className="bg-primary border-border">hi</button>;\n`,
      });
      return run(...CHECK.uiRules, { CHECK_UI_ROOT: dir });
    },
  },

  // ───── 注册表对账 (check-docs-registry) ─────
  {
    name: "registry 违规组: nav 里有 id 但 App 没有 case (幽灵页)",
    gate: "check-docs-registry",
    expect: "fail",
    reason:
      "这是本探针存在的直接理由: 幽灵页会落进 default 分支渲染成占位页 —— 有 h1、DOM 够大, " +
      "实测 check-smoke 会报「41/41 页渲染正常」并 exit 0",
    run: () => {
      const dir = fixture("registry-ghost");
      writeFiles(
        dir,
        docsSkeleton({
          "docs/src/nav.ts": `export const DOCS = [
  { id: "a", label: "A", group: "g", desc: "d" },
  { id: "ghost", label: "G", group: "g", desc: "d" },
];
`,
        }),
      );
      return run(...CHECK.registry, { CHECK_UI_ROOT: dir });
    },
    expectIn: ["nav-without-case", "ghost"],
  },
  {
    name: "registry 违规组: 模块既没从 src/index.ts 导出、也没人 import (死文件)",
    gate: "check-docs-registry",
    expect: "fail",
    reason:
      "「组件写好了但忘了接上」必然同时满足这两条, 所以这条同时拦住真实的接线缺口。" +
      "反过来也要成立: 行数棘轮拆出来的内部件 (只被主文件 import、不对外导出) **必须放行** —— " +
      "否则门禁在惩罚它自己推荐的修复动作 (实测踩过: canvas-parts.tsx 就被误报过)",
    run: () => {
      const dir = fixture("registry-unexported");
      writeFiles(dir, docsSkeleton({ "src/layout/orphan.tsx": `export const Orphan = 1;\n` }));
      return run(...CHECK.registry, { CHECK_UI_ROOT: dir });
    },
    expectIn: ["module-unreachable", "orphan"],
  },
  {
    name: "registry 控制组: 内部拆分件 (只被同目录模块 import, 不对外导出)",
    gate: "check-docs-registry",
    expect: "pass",
    reason:
      "这条控制组钉住上面那条的边界。它防的是「门禁把正确的拆分动作报成违规」—— " +
      "而那种误报的结局是所有人学会无视这条门禁",
    run: () => {
      const dir = fixture("registry-splitparts");
      writeFiles(
        dir,
        docsSkeleton({
          // host 从 index.ts 导出 (对外入口), inner 只被 host import (内部拆分件)
          "src/index.ts": `export { A } from "./primitives/a";\nexport { host } from "./blueprint/host";\n`,
          "src/blueprint/host.ts": `export { helper } from "./inner";\nexport const host = 1;\n`,
          "src/blueprint/inner.tsx": `export const helper = () => null;\n`,
        }),
      );
      return run(...CHECK.registry, { CHECK_UI_ROOT: dir });
    },
  },
  {
    name: "registry 违规组: 图标表键对应不到任何页面 (id 改名后残留)",
    gate: "check-docs-registry",
    expect: "fail",
    reason: "图标键改名后残留时, 导航里那一项静默留白, 没有任何东西会报错",
    run: () => {
      const dir = fixture("registry-staleicon");
      writeFiles(
        dir,
        docsSkeleton({
          "docs/src/navIcons.ts": `export const NAV_ICONS = { a: "icon-[solar--graph-linear]", gone: "icon-[solar--bell-linear]" };\n`,
        }),
      );
      return run(...CHECK.registry, { CHECK_UI_ROOT: dir });
    },
    expectIn: ["icon-without-nav"],
  },
  {
    name: "registry 控制组: 四方对账一致的骨架",
    gate: "check-docs-registry",
    expect: "pass",
    reason: "防误报: 正常的加页面流程 (nav + case + import + 文件 + 导出) 必须放行",
    run: () => {
      const dir = fixture("registry-ok");
      writeFiles(dir, docsSkeleton());
      return run(...CHECK.registry, { CHECK_UI_ROOT: dir });
    },
  },

  // ───── 行数棘轮 (check-line-budget) ─────
  {
    name: "line-budget 违规组: 已冻结文件长过水位",
    gate: "check-line-budget",
    expect: "fail",
    reason: "棘轮只许降; 水位被抬高就等于门禁不存在",
    run: () => {
      const dir = fixture("linebudget-grew");
      writeFiles(dir, {
        "src/big.tsx": "// pad\n".repeat(30),
        "scripts/gates/baselines/line-budget.json": budgetBase({ "src/big.tsx": 20 }),
      });
      return run(...CHECK.lineBudget, { CHECK_UI_ROOT: dir });
    },
    expectIn: ["frozen-grew", "20"],
  },
  {
    name: "line-budget 违规组: 新文件直接超上限",
    gate: "check-line-budget",
    expect: "fail",
    reason: "上限本身被调大时, 新文件会悄悄变成下一个 800 行文件",
    run: () => {
      const dir = fixture("linebudget-over");
      writeFiles(dir, {
        "src/huge.ts": "// pad\n".repeat(500),
        "scripts/gates/baselines/line-budget.json": budgetBase({}),
      });
      return run(...CHECK.lineBudget, { CHECK_UI_ROOT: dir });
    },
    expectIn: ["over-limit", "上限 450"],
  },
  {
    name: "line-budget 违规组: 基线里的文件已不存在 (腐烂的豁免)",
    gate: "check-line-budget",
    expect: "fail",
    reason: "只查「有没有超」会让基线只增不减, 攒满一堆没人敢删的死条目",
    run: () => {
      const dir = fixture("linebudget-stale");
      writeFiles(dir, {
        "src/small.ts": `export const x = 1;\n`,
        "scripts/gates/baselines/line-budget.json": budgetBase({ "src/deleted.ts": 900 }),
      });
      return run(...CHECK.lineBudget, { CHECK_UI_ROOT: dir });
    },
    expectIn: ["stale-baseline", "src/deleted.ts"],
  },
  {
    name: "line-budget 控制组: 未冻结文件在下限内",
    gate: "check-line-budget",
    expect: "pass",
    reason: "防误报: 普通小文件必须放行, 否则每个 PR 都在改基线",
    run: () => {
      const dir = fixture("linebudget-ok");
      writeFiles(dir, {
        "src/small.ts": `export const x = 1;\n`,
        "src/small.tsx": `export const Y = () => null;\n`,
        "scripts/gates/baselines/line-budget.json": budgetBase({}),
      });
      return run(...CHECK.lineBudget, { CHECK_UI_ROOT: dir });
    },
  },

  // ───── 分流覆盖 (check-lanes) ─────
  {
    name: "lanes 违规组: 出现一个没被任何 lane 认领的顶层目录",
    gate: "check-lanes",
    expect: "fail",
    reason:
      "症状是「改了东西却一条门禁都不跑」; 它在运行时完全看不出来 (不报错、不输出、退出码 0), " +
      "所以这是分流设计里唯一必须自动化的一环",
    run: () => {
      const dir = fixture("lanes-unclaimed");
      writeFiles(dir, docsSkeleton({ "brand-new-dir/a.txt": "" }));
      return run(...CHECK.lanes, { CHECK_UI_ROOT: dir });
    },
    expectIn: ["unclaimed-top-level", "brand-new-dir"],
  },
  {
    name: "lanes 控制组: 全部顶层条目都被认领",
    gate: "check-lanes",
    expect: "pass",
    reason: "防误报: 前缀匹配写成 p === prefix 时, 目录型前缀会认不出任何东西",
    run: () => {
      const dir = fixture("lanes-ok");
      writeFiles(dir, docsSkeleton());
      return run(...CHECK.lanes, { CHECK_UI_ROOT: dir });
    },
  },

  // ───── 指纹 (check-fingerprint): 接线探针 ─────
  {
    name: "接线: 从注册表删掉一条门禁 → 指纹必须 FAIL",
    gate: "check-fingerprint",
    expect: "fail",
    reason:
      "第一组指纹一个字都没变, 而那条门禁在**所有**检查点上同时消失 —— " +
      "这是单条门禁自身与违规探针都拦不住的一类失效",
    run: () => {
      const dir = repoCopy("fp-drop-gate");
      const p = path.join(dir, "scripts/gates/registry.mjs");
      const src = fs.readFileSync(p, "utf8");
      const before = src.length;
      // 删掉 typecheck 这一整条门禁定义
      const next = src.replace(/\n  \{\n    id: "typecheck",[\s\S]*?\n  \},/, "");
      if (next.length === before) return { status: -1, output: "夹具失败: registry.mjs 里没匹配到 typecheck 定义" };
      fs.writeFileSync(p, next);
      return run(...CHECK.fingerprint, { CHECK_UI_ROOT: dir });
    },
    expectIn: ["registry:gates"],
  },
  {
    name: "接线: 给 package.json 的门禁入口接上 `|| true` → 指纹必须 FAIL",
    gate: "check-fingerprint",
    expect: "fail",
    reason: "给门禁接 `|| true` 是最典型的「让它永远绿」的做法, 而单条门禁自身没有任何感觉",
    run: () => {
      const dir = repoCopy("fp-mask");
      const p = path.join(dir, "package.json");
      const pkg = JSON.parse(fs.readFileSync(p, "utf8"));
      pkg.scripts = pkg.scripts ?? {};
      const cur = pkg.scripts["check:ui"] ?? "node scripts/check-ui-rules.mjs src";
      pkg.scripts["check:ui"] = `${cur} || true`;
      fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n");
      return run(...CHECK.fingerprint, { CHECK_UI_ROOT: dir });
    },
    expectIn: ["wiring:checkpoints"],
  },
  {
    name: "接线: 摘掉 .git/hooks/pre-commit → 指纹必须 FAIL",
    gate: "check-fingerprint",
    expect: "fail",
    reason: "hook 被摘掉后提交流程里一条门禁都不跑, 而所有门禁脚本本身完好无损",
    run: () => {
      const dir = repoCopy("fp-drop-hook");
      const h = path.join(dir, ".git/hooks/pre-commit");
      if (!fs.existsSync(h)) return { status: -1, output: "夹具失败: 真仓库未安装 pre-commit, 无法验证「摘掉后必须 FAIL」" };
      fs.rmSync(h);
      return run(...CHECK.fingerprint, { CHECK_UI_ROOT: dir });
    },
    expectIn: ["wiring:checkpoints"],
  },
  {
    name: "接线 控制组: 只改某条门禁的 label 文案 → 必须 PASS",
    gate: "check-fingerprint",
    expect: "pass",
    reason:
      "指纹抽多了会天天报警, 所有人去跑 --update, 报警器就退化成确认键。" +
      "这条控制组把「显示名不算严格度」钉死",
    run: () => {
      const dir = repoCopy("fp-relabel");
      const p = path.join(dir, "scripts/gates/registry.mjs");
      const src = fs.readFileSync(p, "utf8");
      const next = src.replace(/label:\s*"[^"]*"/, 'label: "换了一段完全等价的文案 (内容没变)"');
      if (next === src) return { status: -1, output: "夹具失败: registry.mjs 里没匹配到 label" };
      fs.writeFileSync(p, next);
      return run(...CHECK.fingerprint, { CHECK_UI_ROOT: dir });
    },
  },
  {
    name: "接线: 改门禁脚本里的调色盘禁令正则 → 指纹必须 FAIL",
    gate: "check-fingerprint",
    expect: "fail",
    reason:
      "这条钉的是**指纹抽取器本身**。实测过它退化的形态: 第一版只抽 `const X = <字面量>`," +
      "而 check-ui-rules 的禁令是正则、白名单是 new Set([...]), 一个都没读到 —— " +
      "于是三条门禁的指纹哈希完全相同, 它却照样打印「通过」。哈希相同就是抽取器瞎了的判据。",
    run: () => {
      const dir = repoCopy("fp-regex");
      const p = path.join(dir, "scripts/check-ui-rules.mjs");
      const src = fs.readFileSync(p, "utf8");
      // 把禁令正则改宽 (加入 emerald 允许色被移除的效果): 这是真放松, 必须被看见
      const next = src.replace(/const PALETTE_BAN\s*=[\s\S]*?;/, "const PALETTE_BAN = /\\bnever-matches-[a-z]*-[0-9]{2,3}\\b/;");
      if (next === src) return { status: -1, output: "夹具失败: check-ui-rules.mjs 里没匹配到 PALETTE_BAN" };
      fs.writeFileSync(p, next);
      return run(...CHECK.fingerprint, { CHECK_UI_ROOT: dir });
    },
    expectIn: ["thresholds:check-ui-rules"],
  },
  {
    name: "接线: 控制组 —— 未改动的副本指纹必须 PASS",
    gate: "check-fingerprint",
    expect: "pass",
    reason: "防误报: 指纹对「同样的内容」必须稳定, 否则它是个随机数生成器",
    run: () => {
      const dir = repoCopy("fp-clean");
      return run(...CHECK.fingerprint, { CHECK_UI_ROOT: dir });
    },
  },
];

/** ── 执行 ──────────────────────────────────────────────────────── */
const selected = ONLY ? probes.filter((p) => p.name.includes(ONLY)) : probes;
if (selected.length === 0) {
  console.error(`probe-gates: --only=${ONLY} 没有匹配到任何探针`);
  process.exit(2);
}

console.log(`probe-gates: ${selected.length} 条探针 (夹具根 ${tmpRoot})\n`);

let pass = 0;
let fail = 0;
const failures = [];

for (const p of selected) {
  let r;
  try {
    r = p.run();
  } catch (err) {
    r = { status: -1, output: `抛异常: ${err.message}` };
  }
  const okStatus = p.expect === "fail" ? r.status === 1 : r.status === 0;
  const missing = (p.expectIn ?? []).filter((s) => !r.output.includes(s));

  if (okStatus && missing.length === 0) {
    pass += 1;
    console.log(`  PASS  ${p.name}`);
    continue;
  }
  fail += 1;
  console.log(`  FAIL  ${p.name}`);
  console.log(`        期望 status=${p.expect === "fail" ? 1 : 0}, 实际 ${r.status}`);
  if (missing.length > 0) console.log(`        输出里缺少: ${missing.join(", ")}`);
  console.log(`        为什么重要: ${p.reason}`);
  console.log(
    r.output
      .trimEnd()
      .split("\n")
      .slice(0, MAX_PRINTED_LINES)
      .map((l) => `        | ${l}`)
      .join("\n"),
  );
  console.log("");
  failures.push(p.name);
}

const skipped = probes.length - selected.length;

for (const d of created.reverse()) {
  try {
    fs.rmSync(d, { recursive: true, force: true });
  } catch {
    /* 清不掉就留给系统清理 */
  }
}

if (fail > 0) {
  console.error(
    `probe-gates: FAILED — ${fail} 条探针不符合预期 (${pass} 通过${skipped > 0 ? `, ${skipped} 跳过` : ""})`,
  );
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`probe-gates: 全部符合预期 (${pass} 通过${skipped > 0 ? `, ${skipped} 跳过 (--only)` : ""})`);
