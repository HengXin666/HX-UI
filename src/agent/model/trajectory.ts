/**
 * 轨迹账本 (纯函数, 对标 DSH 的 Trajectory 视图): 把消息拆成按轮分组的行 ——
 * 用户 / 助手 (这一次请求的用量与计时) / 思考 / 工具 / 子 Agent, 工具的嵌套调用与子 Agent 的工作作为子行挂在父行下 (可折叠).
 * 每行带开始 / 结束时刻 (运行中只有开始), 输入 / 输出 / 思考 token, 状态; 视图按轮的时间范围画计时条.
 */
import { agentSpan, dispatchedAgents, partsOfAgent, threadMessages, type AgentTree } from "./agents";
import { TOOL_DONE, type AgentMessage, type AgentPart, type AgentUsage } from "./types";
import { messageTiming, sumUsage } from "./usage";
import { COMMAND_KEYS, DESC_KEYS, firstLine, PATH_KEYS, QUERY_KEYS, str, URL_KEYS } from "../tool/args";

/** 账本里的一行说明: 去掉 Markdown 记号 (加粗, 行内代码, 标题, 列表) */
export function plainLine(s: string, max = 120): string {
  return firstLine(s.replace(/[*`#>|]+/g, "").replace(/\s+/g, " ").trim(), max);
}

export type TrajectoryKind = "user" | "assistant" | "reasoning" | "tool" | "subtool" | "agent" | "text" | "notice";

export interface TrajectoryRow {
  id: string;
  kind: TrajectoryKind;
  /** 工具名 / Agent 名 / 模型 */
  label?: string;
  text: string;
  start?: number;
  end?: number;
  /** 还在进行 (没有结束时刻) */
  live: boolean;
  /** 失败 / 中断 / 拒绝 / 等批准 */
  status?: "error" | "interrupted" | "denied" | "waiting";
  input?: number;
  output?: number;
  think?: number;
  /** 助手行: 首 token 延迟 (计时条上分成 "等首 token" 与 "生成" 两段) */
  ttftMs?: number;
  children?: TrajectoryRow[];
}

export interface TrajectoryTurn {
  index: number;
  start?: number;
  end?: number;
  live: boolean;
  rows: TrajectoryRow[];
  usage: AgentUsage;
}

/** 工具行的说明: 命令 / 路径 / 查询 / 网址 / 描述 */
export function toolText(args: Record<string, unknown> | undefined): string {
  return firstLine(str(args, ...COMMAND_KEYS) ?? str(args, ...PATH_KEYS) ?? str(args, ...QUERY_KEYS) ?? str(args, ...URL_KEYS) ?? str(args, ...DESC_KEYS) ?? str(args, "prompt", "task") ?? "", 120);
}

const toolStatus = (s: string): TrajectoryRow["status"] =>
  s === "error" ? "error" : s === "interrupted" ? "interrupted" : s === "denied" ? "denied" : s === "awaiting-approval" ? "waiting" : undefined;

function partRows(parts: readonly AgentPart[], sub: boolean): TrajectoryRow[] {
  const out: TrajectoryRow[] = [];
  for (const p of parts) {
    if (p.type === "reasoning") out.push({ id: p.id, kind: "reasoning", text: firstLine(p.text, 120), start: p.startedAt, end: p.endedAt, live: !!p.streaming });
    else if (p.type === "text" && p.text.trim()) out.push({ id: p.id, kind: "text", text: plainLine(p.text), live: !!p.streaming });
    else if (p.type === "notice") out.push({ id: p.id, kind: "notice", text: p.text, live: false, status: p.kind === "error" ? "error" : undefined });
    else if (p.type === "tool") {
      const c = p.call;
      const children = c.children?.length ? partRows(c.children, true) : undefined;
      out.push({ id: p.id, kind: sub ? "subtool" : "tool", label: c.name, text: toolText(c.args), start: c.startedAt, end: c.endedAt, live: !TOOL_DONE.has(c.status), status: toolStatus(c.status), children });
    }
  }
  return out;
}

/** 子 Agent 一行: 名字, 任务, 运行时长, 它自己的用量; 它的工作 (工具 / 文字) 是子行 */
function agentRow(messages: readonly AgentMessage[], tree: AgentTree, id: string, now: number): TrajectoryRow {
  const n = tree.nodes[id];
  const used = sumUsage(messages.filter((m) => m.agentId === id));
  const { start, end } = agentSpan(n, now);
  const done = n.endedAt != null;
  return {
    id: `agent:${id}`,
    kind: "agent",
    label: n.name,
    text: n.task ?? n.summary ?? "",
    start,
    end: done ? end : undefined,
    live: !done,
    status: n.status === "error" ? "error" : n.status === "interrupted" ? "interrupted" : n.status === "awaiting-approval" || n.status === "awaiting-input" ? "waiting" : undefined,
    input: used.inputTokens,
    output: used.outputTokens,
    think: used.reasoningTokens,
    children: partRows(partsOfAgent(messages, tree, id), true),
  };
}

/**
 * 按轮切开: 每条用户消息开一轮. 主线程消息出行, 子 Agent 自己的消息挂在派它的那次调用 (或这条消息末尾) 的 "子 Agent" 行下.
 * now 用来算还在跑的子 Agent 的时长 (行上不显示假时长, 只用于排序).
 */
export function buildTrajectory(messages: readonly AgentMessage[], tree: AgentTree | undefined, now: number): TrajectoryTurn[] {
  const t = tree ?? { nodes: {}, order: [], links: [] };
  const main = threadMessages(messages, t);
  const turns: TrajectoryTurn[] = [];
  const bucket = new Map<TrajectoryTurn, AgentMessage[]>();
  for (const m of main) {
    let turn = turns.at(-1);
    if (m.role === "user" || !turn) {
      turn = { index: turns.length + 1, live: false, rows: [], usage: {} };
      turns.push(turn);
    }
    if (m.role === "user") {
      const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ");
      turn.rows.push({ id: m.id, kind: "user", text: plainLine(text), start: m.createdAt, end: m.createdAt, live: false });
      continue;
    }
    const timing = messageTiming(m);
    const live = m.status === "streaming";
    turn.rows.push({
      id: m.id,
      kind: "assistant",
      label: m.model,
      text: plainLine(m.parts.filter((p) => p.type === "text").map((p) => (p.type === "text" ? p.text : "")).join(" ")) || (live ? "生成中" : ""),
      start: m.startedAt,
      end: live ? undefined : m.endedAt,
      live,
      status: m.status === "error" ? "error" : m.status === "stopped" ? "interrupted" : undefined,
      input: m.usage?.inputTokens,
      output: m.usage?.outputTokens ?? (m.meter?.streamedTokens || undefined),
      think: m.usage?.reasoningTokens,
      ttftMs: timing.ttftMs,
    });
    const rows = partRows(m.parts.filter((p) => !p.agentId || p.agentId === m.agentId), false);
    // 派出的子 Agent: 挂在派发调用下; 没有调用的放在这条消息末尾
    const callIds = m.parts.flatMap((p) => (p.type === "tool" ? [p.id] : []));
    for (const n of dispatchedAgents(t, m.id, callIds)) {
      const row = agentRow(messages, t, n.id, now);
      const host = n.callId ? rows.find((r) => r.id === n.callId) : undefined;
      if (host) host.children = [...(host.children ?? []), row];
      else rows.push(row);
    }
    turn.rows.push(...rows);
    bucket.set(turn, [...(bucket.get(turn) ?? []), m]);
  }
  for (const turn of turns) {
    turn.usage = sumUsage(bucket.get(turn) ?? []);
    const flat = flattenRows(turn.rows);
    const starts = flat.map((r) => r.start).filter((x): x is number => x != null);
    const ends = flat.map((r) => r.end ?? r.start).filter((x): x is number => x != null);
    turn.live = flat.some((r) => r.live);
    turn.start = starts.length ? Math.min(...starts) : undefined;
    turn.end = ends.length ? Math.max(...ends) : undefined;
  }
  return turns;
}

/** 先序展开所有行 (含子行) */
export function flattenRows(rows: readonly TrajectoryRow[]): TrajectoryRow[] {
  const out: TrajectoryRow[] = [];
  const walk = (list: readonly TrajectoryRow[]) => {
    for (const r of list) {
      out.push(r);
      if (r.children) walk(r.children);
    }
  };
  walk(rows);
  return out;
}
