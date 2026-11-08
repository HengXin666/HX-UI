/**
 * 负向探针的夹具工具: 临时目录, 仓库副本, 子进程执行与最小 docs+src 骨架.
 * 夹具一律建在系统临时目录, 跑完即删, 绝不写真实仓库.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CHECK_FLAG, CHECK_LANES_FILE, DOCS_REGISTRY_FILE, EMPTY_JSON, FINGERPRINT_FILE, GIT, JSON_INDENT, LINE_BUDGET_FILE,
  NEWLINE, PROBE_BROKEN, REPO_UP_FROM_PROBES, UTF8, WALK_SKIP,
} from "../../../constants/gates.ts";

export type ProbeResult = { status: number | null; output: string };
export type Probe = {
  name: string;
  gate: string;
  expect: string;
  reason: string;
  run: () => ProbeResult;
  expectIn?: string[];
};

export const EXPECT_FAIL = "fail";
export const EXPECT_PASS = "pass";

/** 门禁子进程的扫描根覆盖. */
export const rootAt = (dir: string): Record<string, string> => ({ CHECK_UI_ROOT: dir });

/**
 * 扫描根: CHECK_UI_ROOT 或仓库根; 接线探针从这里复制副本.
 *
 * .agents/notes/implemented/process/2026-11-08-gates-ts.md
 */
export const ROOT = process.env.CHECK_UI_ROOT
  ? path.resolve(process.env.CHECK_UI_ROOT)
  : path.resolve(import.meta.dirname, REPO_UP_FROM_PROBES);

/** 输出上限: 门禁打太多行会把"通过"伪装成 ENOBUFS 失败. */
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

export const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "hxui-probe-"));
const created = [tmpRoot];

/** 删掉本次建的全部夹具; 清不掉就留给系统清理. */
export function cleanup(): void {
  for (const d of created.reverse()) {
    try {
      fs.rmSync(d, { recursive: true, force: true });
    } catch {
      /* 清不掉就留给系统清理 */
    }
  }
}

/** 建一个临时夹具目录. */
export function fixture(name: string): string {
  const dir = path.join(tmpRoot, name);
  fs.mkdirSync(dir, { recursive: true });
  created.push(dir);
  return dir;
}

/** 把 { 相对路径: 内容 } 写进夹具目录. */
export function writeFiles(base: string, files: Record<string, string>): void {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(base, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
}

/**
 * 把仓库复制一份到临时目录 (排除 node_modules/.git/dist/.bpprobe).
 * 接线探针要真的去改注册表和检查点配置, 只能在副本上改  绝不碰真实仓库.
 *
 * 指纹第二组读的是仓库内受版本控制的钩子源文件 (scripts/gates/hooks 与 .githooks),
 * 不读本机 .git/hooks 安装状态, 所以副本无需额外复制 .git/hooks, 干净 CI checkout 上也能跑.
 */
export function repoCopy(label: string): string {
  const dir = path.join(tmpRoot, label);
  fs.mkdirSync(dir, { recursive: true });
  fs.cpSync(ROOT, dir, {
    recursive: true,
    filter: (src) => !WALK_SKIP.includes(path.basename(src)),
  });
  created.push(dir);
  return dir;
}

/** 跑一条门禁脚本, 返回 {status, output}. */
export function run(script: string, args: string[], env: Record<string, string>, cwd?: string): ProbeResult {
  const r = spawnSync(process.execPath, [script, ...args], {
    cwd: cwd ?? ROOT,
    encoding: UTF8,
    maxBuffer: MAX_OUTPUT_BYTES,
    // 夹具根可能落在另一个 git 仓库里 (系统临时目录被设到某个工作区下): 不设天花板时门禁的 git ls-files
    // 会在外层仓库里"成功"返回空清单, 而不是退回目录遍历, 于是所有分流与行数探针读到一个空仓库
    env: { ...process.env, GIT_CEILING_DIRECTORIES: tmpRoot, ...env },
  });
  if (r.error) return { status: PROBE_BROKEN, output: r.error.message };
  return { status: r.status, output: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

const G = (rel: string): string => path.join(ROOT, rel);
/** 与 package.json 的 check:ui 同一组规则; 质量入口按 git ls-files 取文件, 夹具要先 git init. */
const UI_RULES = [
  "PROJECT-UI-PALETTE", "PROJECT-UI-HEX", "PROJECT-UI-RGB", "PROJECT-UI-LINE-1PX", "PROJECT-UI-BW",
  "PROJECT-UI-TRANSITION-ALL", "PROJECT-UI-BUTTON-TYPE", "PROJECT-UI-ICON-DECLARED",
  "PROJECT-UI-DEV-DIARY", "PROJECT-UI-JSX-COMMENT-LEAK",
].join(",");

/** 设计规约在夹具上跑: 质量入口按 git ls-files 取文件, 先 git init. */
export function runUiRules(dir: string): ProbeResult {
  const init = spawnSync(GIT, ["init", "-q", dir], { encoding: UTF8 });
  if (init.status !== 0) return { status: PROBE_BROKEN, output: `夹具失败: git init ${init.stderr}` };
  const [script, args] = CHECK.uiRules;
  return run(script, [...args, "--root", dir], {}, dir);
}
export const CHECK: Record<string, [string, string[]]> = {
  // 设计规约已并入 scripts/quality; --baseline none 让夹具里的每条违规都算新增
  uiRules: [G("scripts/quality/index.ts"), ["check", "--mode", "all", "--rule", UI_RULES, "--baseline", "none", "--format", "findings"]],
  registry: [G(DOCS_REGISTRY_FILE), []],
  lineBudget: [G(LINE_BUDGET_FILE), []],
  lanes: [G(CHECK_LANES_FILE), []],
  fingerprint: [G(FINGERPRINT_FILE), [CHECK_FLAG]],
};

/**
 * 最小 docs+src 骨架  给"注册表对账 / 行数 / 分流"三条门禁喂最小输入.
 * 这不是可构建的站点: 这三条门禁都只做静态对账, 不跑构建.
 *
 * 注意: App.tsx 必须写成 `switch (page) { case "a": ... }` 的形式 
 * 门禁的判据是"页面 id 在 renderPage 里有对应 case". 夹具写成别的形式
 * (例如直接 return) 会让**控制组**报红, 而这正是控制组的价值:
 * 它证明门禁不是靠"有没有 import"这类弱信号在放行.
 */
export function docsSkeleton(overrides: Record<string, string> = {}): Record<string, string> {
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
    ".githooks/pre-commit": "",
    ".agents/x.txt": "",
    "AGENTS.md": "",
    "CONTRIBUTING.md": "",
    "scripts/x.txt": "",
    "README.md": "",
    "CHANGELOG.md": "",
    "tests/x.txt": "",
    "vitest.config.ts": "",
    ".gitignore": "",
    "LICENSE": "",
    "NOTICE": "",
    "UPSTREAM_COMMIT": "",
    "package.json": EMPTY_JSON,
    "tsconfig.json": EMPTY_JSON,
    "tsconfig.build.json": EMPTY_JSON,
    "package-lock.json": EMPTY_JSON,
    ...overrides,
  };
}

/**
 * 行数门禁的基线夹具.
 * 注意: check-lanes 的 LANES 表来自它自己所在的模块 (import), 不由扫描根覆盖, 所以夹具只能验证
 * "多出来的顶层条目会被拦下"与"真实 lane 表能认领干净骨架"; 改 lane 表本身由指纹的 registry:lanes 覆盖.
 */
export const budgetBase = (frozen: Record<string, number>, limits = { ts: 450, tsx: 250 }): string =>
  JSON.stringify({ limits, frozen }, null, JSON_INDENT) + NEWLINE;
