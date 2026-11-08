/**
 * 按路径分流: "这一轮改了哪些文件, 该跑哪几组门禁".
 *
 * 判据是目录前缀而不是 glob: 要能在人脑里一眼算出来, 也要能在 git 失败时安全退化.
 * 三条兜底一律偏向"照常跑" (宁可慢, 不可漏): 算不出变更集 -> 全跑; 有路径没被认领 -> 全跑并提示登记;
 * 一次改动命中多条 lane -> 取并集. 分流表本身由 check-lanes.ts 机器校验, 探针里有一条接线探针钉它.
 */
import {
  GROUP_BROWSER, GROUP_DOCS, GROUP_GUARD, GROUP_LIB, GROUP_PROBE, GROUP_SHAPE,
} from "../constants/gates.ts";

type Lane = { name: string; title: string; prefixes: string[]; groups: string[] };
type Checkpoint = { title: string; groups: string[]; strict?: boolean };
export type LaneResult = { groups: string[]; lanes: string[]; unclaimed: string[] };

/** 默认分组顺序: 便宜的先跑, 贵的后跑 (fail-fast 下这决定第一红的等待时间). */
export const GROUP_ORDER: string[] = [GROUP_LIB, GROUP_DOCS, GROUP_SHAPE, GROUP_BROWSER, GROUP_GUARD, GROUP_PROBE];

/**
 * lane 表: 路径前缀 → 分组集合.
 * 顺序无所谓, 取并集; 但每条前缀只该出现在一个条目里 (重复由探针的控制组钉住).
 * 顶层条目 (tests/, vitest.config.ts, CHANGELOG.md) 的归属决策:
 * .agents/notes/implemented/process/2026-11-03-lanes-top-level-coverage.md
 */
export const LANES: Lane[] = [
  {
    name: GROUP_LIB,
    title: "组件库源码",
    prefixes: ["src/", "tests/", "vitest.config.ts", "tsconfig.json", "tsconfig.build.json", "package.json", "package-lock.json"],
    groups: [GROUP_LIB, GROUP_SHAPE],
  },
  {
    name: "docs-shell",
    title: "文档站外壳",
    prefixes: ["docs/"],
    groups: [GROUP_DOCS, GROUP_SHAPE, GROUP_BROWSER],
  },
  {
    name: "gates",
    title: "门禁脚本与工程配置",
    prefixes: ["scripts/", ".github/", ".githooks/", ".agents/", "AGENTS.md", "CONTRIBUTING.md"],
    groups: [GROUP_GUARD],
  },
  {
    name: "contract",
    title: "对外承诺",
    prefixes: ["README.md", "CHANGELOG.md"],
    groups: [GROUP_LIB, GROUP_DOCS],
  },
];

/**
 * 明确"改了它们确实不需要跑门禁"的顶层条目  名单要小, 且每条都要写理由.
 * 这些是纯元数据: 改它们不可能让代码或文档的行为发生变化.
 */
export const NO_GATE_ENTRIES: Array<{ prefix: string; why: string }> = [
  { prefix: ".gitignore", why: "忽略规则, 不参与构建产物" },
  { prefix: "LICENSE", why: "许可原文, 与运行态无关" },
  { prefix: "NOTICE", why: "第三方归属声明, 与运行态无关" },
  { prefix: "UPSTREAM_COMMIT", why: "上游快照指针, 只被 sync-upstream.sh 读" },
];

/**
 * 把一组变更路径解析成要跑的分组集合.
 * @param files 仓库相对路径; null 表示算不出来 (git 失败) → 全跑
 */
export function groupsForFiles(files: string[] | null): LaneResult {
  if (files === null) {
    return { groups: [...GROUP_ORDER], lanes: ["<全部: 变更集不可得>"], unclaimed: [] };
  }
  const hit = new Set<string>();
  const lanes: string[] = [];
  const unclaimed: string[] = [];
  for (const f of files) {
    const owners = LANES.filter((l) => l.prefixes.some((p) => f === p || f.startsWith(p)));
    if (owners.length === 0) {
      if (!NO_GATE_ENTRIES.some((e) => f === e.prefix || f.startsWith(e.prefix))) unclaimed.push(f);
      continue;
    }
    for (const o of owners) {
      if (!lanes.includes(o.name)) lanes.push(o.name);
      for (const g of o.groups) hit.add(g);
    }
  }
  // 未认领路径 → 不跳过, 全跑 (第 2 条兜底)
  if (unclaimed.length > 0) {
    return { groups: [...GROUP_ORDER], lanes, unclaimed };
  }
  const groups = GROUP_ORDER.filter((g) => hit.has(g));
  return { groups, lanes, unclaimed };
}

/** 分组 → 该组在"不受时间限制的检查点"(CI) 用的 argv 档位. */
export const STRICT_GROUPS = new Set([GROUP_LIB, GROUP_DOCS, GROUP_BROWSER, GROUP_GUARD, GROUP_PROBE]);

/** 提交前三组: 秒级, 只碰暂存区. */
const COMMIT_GROUPS = [GROUP_LIB, GROUP_DOCS, GROUP_SHAPE];

/**
 * 检查点各自付哪些账.
 *
 * 核心原则一句话: **越慢的检查点越会被绕过, 最后等于没有. **
 * 所以快而能自动修的放前面, 贵而全的放后面  而不是"每个检查点都跑全套".
 *
 * 这里的耗时是**本仓实测**(2026-10-04, 全部 rc=0):
 * ui-rules 33ms / typecheck 1.6s / docs-typecheck 2.3s / blueprint 1.0s
 * line-budget 30ms / registry 50ms / icons 60ms
 * docs-build 1.3s / smoke 17.5s / shell 1.7s / probe 数十秒
 *
 * 把 17 秒的浏览器冒烟塞进 `git commit` 的结果, 不是"更安全", 是所有人开始
 * 习惯性地 `--no-verify`  那时它连一次都不会跑. 这不是估计, 是模板里写明的
 * 分层理由, 秒数则按本仓实测重算过.
 */
export const CHECKPOINTS: Record<string, Checkpoint> = {
  "pre-commit": {
    title: "提交前 (只碰暂存区, 秒级)",
    groups: [...COMMIT_GROUPS],
  },
  "pre-push": {
    title: "推送前 (完整但仍在分钟以内)",
    groups: [...COMMIT_GROUPS, GROUP_BROWSER, GROUP_GUARD],
  },
  ci: {
    title: "CI (含负向探针; 它要起几十个子进程)",
    groups: [...GROUP_ORDER],
    strict: true,
  },
};
