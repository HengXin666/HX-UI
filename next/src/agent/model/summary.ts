/**
 * 活动摘要 (纯函数): 一串工具调用 -> "运行了 2 条命令, 修改了 3 个文件, 还有 4 项".
 * 照 T3 Code 的规则: 最多点名两类, 其余合成 "还有 N 项"; 只有思考时说 "思考过程".
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

/** 点名的优先级: 改动 > 命令 > 子 Agent > 网页 > 读 > 搜 */
const ORDER: ActivityKind[] = ["edit", "command", "agent", "web", "read", "search", "question", "image", "todo", "other"];

export function summarizeActivity(kinds: readonly ActivityKind[], opts: { reasoning?: number; maxNamed?: number } = {}): string {
  const max = opts.maxNamed ?? 2;
  if (!kinds.length) return opts.reasoning ? "思考过程" : "";
  const counts = new Map<ActivityKind, number>();
  for (const k of kinds) counts.set(k, (counts.get(k) ?? 0) + 1);
  const ranked = ORDER.filter((k) => counts.has(k));
  const named = ranked.slice(0, max).map((k) => PHRASE[k](counts.get(k)!));
  const rest = ranked.slice(max).reduce((n, k) => n + counts.get(k)!, 0);
  if (rest) named.push(`还有 ${rest} 项`);
  return named.join(", ");
}
