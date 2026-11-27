/**
 * 活动摘要 (纯函数): 一串工具调用 -> "运行了 2 条命令, 修改了 3 个文件, 读取了 1 个文件 等 4 项".
 * 照 DSH 的分组标题规则: 按次数从多到少排, 次数相同按第一次出现的先后, 最多点名三类, 其余合成 "等 N 项";
 * 只有思考时说 "思考过程". 运行中的分组用正在进行的那一类的进行时 ("正在运行命令"), 没有在跑的工具时 "正在分析".
 */
export type ActivityKind = "command" | "read" | "edit" | "search" | "web" | "todo" | "question" | "agent" | "image" | "other";

const PHRASE: Record<ActivityKind, (n: number) => string> = {
  command: (n) => `运行了 ${n} 条命令`,
  read: (n) => `读取了 ${n} 个文件`,
  edit: (n) => `修改了 ${n} 个文件`,
  search: (n) => `搜索了 ${n} 次`,
  web: (n) => `访问了 ${n} 个网页`,
  todo: () => "更新了计划",
  question: (n) => `提了 ${n} 个问题`,
  agent: (n) => `派出 ${n} 个子 Agent`,
  image: (n) => `查看了 ${n} 张图片`,
  other: (n) => `调用了 ${n} 个工具`,
};

/** 运行中的分组标题: 正在进行的那一类 */
export const RUNNING_PHRASE: Record<ActivityKind, string> = {
  command: "正在运行命令",
  read: "正在读取文件",
  edit: "正在修改文件",
  search: "正在搜索代码",
  web: "正在访问网页",
  todo: "正在更新计划",
  question: "等待你的操作",
  agent: "正在协调子 Agent",
  image: "正在查看图片",
  other: "正在调用工具",
};

/** 运行中但没有在跑的工具 (模型在想下一步) */
export const ANALYZING = "正在分析";

/** 各类的次数, 从多到少; 次数相同按第一次出现的先后 (没有固定优先级) */
export function rankActivity(kinds: readonly ActivityKind[]): { kind: ActivityKind; count: number }[] {
  const counts = new Map<ActivityKind, number>();
  for (const k of kinds) counts.set(k, (counts.get(k) ?? 0) + 1);
  const first = [...counts.keys()];
  return first.map((kind) => ({ kind, count: counts.get(kind)! })).sort((a, b) => b.count - a.count || first.indexOf(a.kind) - first.indexOf(b.kind));
}

export function summarizeActivity(kinds: readonly ActivityKind[], opts: { reasoning?: number; maxNamed?: number } = {}): string {
  const max = opts.maxNamed ?? 3;
  if (!kinds.length) return opts.reasoning ? "思考过程" : "";
  const ranked = rankActivity(kinds);
  const named = ranked.slice(0, max).map((r) => PHRASE[r.kind](r.count));
  const rest = ranked.slice(max).reduce((n, r) => n + r.count, 0);
  return rest ? `${named.join(", ")} 等 ${rest} 项` : named.join(", ");
}
