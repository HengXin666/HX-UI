/**
 * 按路径分流 —— "这一轮改了哪些文件, 该跑哪几组门禁"。
 *
 * 为什么是目录前缀而不是 glob: 判据要能在人脑里一眼算出来, 也要能在 git 失败时
 * 安全退化。glob 的匹配结果取决于 shell 与转义, 前缀不会。
 *
 * 三条兜底**一律偏向"照常跑"**(宁可慢, 不可漏):
 *   1. 算不出变更集 (git 失败 / 不在仓库里) → 跑全部分组
 *   2. 某条路径没被任何 lane 认领 → **不跳过**, 跑全部分组并提示登记
 *   3. 一次改动命中多条 lane → 取**并集**, 只跑一条是漏检的常见来源
 *
 * 分流表本身要被机器校验 —— 症状是"改了东西却一条门禁都不跑", 而它在运行时
 * 完全看不出来 (不报错、不输出)。校验在 check-lanes.mjs, 探针里有一条接线探针钉它。
 */

/** 默认分组顺序: 便宜的先跑, 贵的后跑 (fail-fast 下这决定第一红的等待时间)。 */
export const GROUP_ORDER = ["lib", "docs", "shape", "browser", "guard", "probe"];

/**
 * lane 表: 路径前缀 → 分组集合。
 * 顺序无所谓, 取并集; 但每条前缀只该出现在一个条目里 (重复由探针的控制组钉住)。
 */
export const LANES = [
  {
    name: "lib",
    title: "组件库源码",
    prefixes: ["src/", "tsconfig.json", "package.json", "package-lock.json"],
    groups: ["lib", "shape"],
  },
  {
    name: "docs-shell",
    title: "文档站外壳",
    prefixes: ["docs/"],
    groups: ["docs", "shape", "browser"],
  },
  {
    name: "gates",
    title: "门禁脚本与工程配置",
    prefixes: ["scripts/", ".github/", ".githooks/", ".agents/", "AGENTS.md", "CONTRIBUTING.md"],
    groups: ["guard"],
  },
  {
    name: "contract",
    title: "对外承诺",
    prefixes: ["README.md"],
    groups: ["lib", "docs"],
  },
];

/**
 * 明确"改了它们确实不需要跑门禁"的顶层条目 —— 名单要小, 且每条都要写理由。
 * 这些是纯元数据: 改它们不可能让代码或文档的行为发生变化。
 */
export const NO_GATE_ENTRIES = [
  { prefix: ".gitignore", why: "忽略规则, 不参与构建产物" },
  { prefix: "LICENSE", why: "许可原文, 与运行态无关" },
  { prefix: "NOTICE", why: "第三方归属声明, 与运行态无关" },
  { prefix: "UPSTREAM_COMMIT", why: "上游快照指针, 只被 sync-upstream.sh 读" },
];

/**
 * 把一组变更路径解析成要跑的分组集合。
 * @param {string[] | null} files 仓库相对路径; null 表示算不出来 (git 失败) → 全跑
 * @returns {{ groups: string[], lanes: string[], unclaimed: string[] }}
 */
export function groupsForFiles(files) {
  if (files === null) {
    return { groups: [...GROUP_ORDER], lanes: ["<全部: 变更集不可得>"], unclaimed: [] };
  }
  const hit = new Set();
  const lanes = [];
  const unclaimed = [];
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

/** 分组 → 该组在"不受时间限制的检查点"(CI) 用的 argv 档位。 */
export const STRICT_GROUPS = new Set(["lib", "docs", "browser", "guard", "probe"]);

/**
 * 检查点各自付哪些账。
 *
 * 核心原则一句话: **越慢的检查点越会被绕过, 最后等于没有。**
 * 所以快而能自动修的放前面, 贵而全的放后面 —— 而不是"每个检查点都跑全套"。
 *
 * 这里的耗时是**本仓实测**(2026-10-04, 全部 rc=0):
 *   ui-rules 33ms / typecheck 1.6s / docs-typecheck 2.3s / blueprint 1.0s
 *   line-budget 30ms / registry 50ms / icons 60ms
 *   docs-build 1.3s / smoke 17.5s / shell 1.7s / probe 数十秒
 *
 * 把 17 秒的浏览器冒烟塞进 `git commit` 的结果, 不是"更安全", 是所有人开始
 * 习惯性地 `--no-verify` —— 那时它连一次都不会跑。这不是估计, 是模板里写明的
 * 分层理由, 秒数则按本仓实测重算过。
 */
export const CHECKPOINTS = {
  "pre-commit": {
    title: "提交前 (只碰暂存区, 秒级)",
    groups: ["lib", "docs", "shape"],
  },
  "pre-push": {
    title: "推送前 (完整但仍在分钟以内)",
    groups: ["lib", "docs", "shape", "browser", "guard"],
  },
  ci: {
    title: "CI (含负向探针; 它要起几十个子进程)",
    groups: ["lib", "docs", "shape", "browser", "guard", "probe"],
    strict: true,
  },
};
