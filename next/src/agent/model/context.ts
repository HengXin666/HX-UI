/**
 * 上下文检视器的数据层 (纯函数, 服务端安全). 对标 DSH 社区插件 dsh-context (github.com/bowenliang123/dsh-context):
 * 把 "上下文 47%" 一个数拆成构成 (系统提示 / 工具定义 / 注入 / 历史 / 用户消息 / 助手回复 / 工具结果), 最大的几项,
 * 每次请求的占用演变 (缓存命中段), 以及上下文为什么变了 (注入, 大块工具结果, 接近压缩线, 压缩).
 *
 * 数据来源与精度 (和 dsh-context 一样分清 "报告值" 与 "估算值"):
 *   - 固定开销与窗口参数来自 context 事件 (message.context: system / tools / toolSchemas / injected / history / compactAt / reservedOutput);
 *   - 对话部分按消息推算: 用户消息, 助手正文 + 思考 + 工具参数, 工具结果 (后端给 resultTokens 就用, 否则按文字估算);
 *   - 总数取 max(最近一次 usage.contextTokens, 估算合计): 报告值比估算大时差额记进 "历史" (说不清来源的部分), 生成中估算先涨;
 *   - 压缩 (compaction 提示) 之前的对话收成一项 "压缩摘要", 大小 = 压缩后 - 固定开销.
 * 组件在 context-view.tsx. 研究笔记: next/docs/dsh-conversation-research.md
 */
import { isSubAgent, type AgentTree } from "./agents";
import type { AgentContextInfo, AgentMessage, AgentPart, ContextSource, ToolCallData } from "./types";
import { estimateTokens } from "./usage";

export type ContextCategory = "system" | "tools" | "injected" | "history" | "user" | "assistant" | "results";

/** 由 "固定在前" 到 "最近加入" 的顺序 (也是条形图从左到右, 与模型读到的先后一致) */
export const CONTEXT_CATEGORIES: readonly ContextCategory[] = ["system", "tools", "injected", "history", "user", "assistant", "results"];

export const CONTEXT_LABEL: Record<ContextCategory, string> = {
  system: "系统提示",
  tools: "工具定义",
  injected: "注入",
  history: "历史",
  user: "用户消息",
  assistant: "助手回复",
  results: "工具结果",
};

/** 不给 compactAt 时, 压缩线 = 窗口 × 这个比例 (DSH 的 COMPACT_THRESHOLD_RATIO) */
export const COMPACT_RATIO = 0.8;
/** 到压缩线的这个比例算 "接近" */
export const NEAR_RATIO = 0.9;
/** 单个工具结果到这么多 token 算 "大块", 记一条事件 */
export const LARGE_RESULT = 2_000;

export interface ContextItem {
  id: string;
  category: ContextCategory;
  label: string;
  detail?: string;
  tokens: number;
  /** 报告值 (后端给的) 还是按文字估算的 */
  estimated: boolean;
  messageId?: string;
  partId?: string;
}

export type ContextLevel = "ok" | "near" | "over";

export interface ContextBreakdown {
  /** 此刻的上下文总量 = max(报告值, 估算合计) */
  total: number;
  /** 最近一次 usage 报告的占用 */
  reported?: number;
  /** 构成里按文字估算的部分 */
  estimatedTokens: number;
  window?: number;
  compactAt?: number;
  reservedOutput?: number;
  /** total / window */
  ratio: number | null;
  level: ContextLevel;
  /** 最近一次请求命中缓存的提示 token (从头开始的前缀; 取最近一份带 cached 的上下文采样) */
  cached?: number;
  byCategory: Record<ContextCategory, number>;
  /** 每一项, 按 token 由大到小 */
  items: ContextItem[];
  /** 压缩过几次 */
  compactions: number;
  /** 有没有任何数据 (没有 usage 也没有消息就是空的) */
  empty: boolean;
}

export interface ContextOptions {
  /** 给了就按树区分主线程与子 Agent */
  agents?: AgentTree;
  /** 只看这个 Agent 的上下文 (子 Agent); 不给是主线程 */
  agentId?: string;
  /** 消息里没报窗口时用 */
  contextWindow?: number;
}

/** 这个线程里的消息 (主线程: 不属于子 Agent 的; 子 Agent: 它自己的) */
export function contextThread(messages: readonly AgentMessage[], opts: ContextOptions = {}): AgentMessage[] {
  const { agents, agentId } = opts;
  if (agentId !== undefined && agents && isSubAgent(agents, agentId)) return messages.filter((m) => m.agentId === agentId);
  if (agents?.order.length) return messages.filter((m) => !isSubAgent(agents, m.agentId));
  return messages.filter((m) => agentId === undefined || !m.agentId || m.agentId === agentId);
}

const firstLine = (s: string, n = 60) => {
  const line = s.trim().split("\n")[0] ?? "";
  return line.length > n ? `${line.slice(0, n - 1)}…` : line;
};

/** 工具调用的对象: 路径 / 命令 / 模式 / 说明 */
export function callTarget(call: Pick<ToolCallData, "args">): string | undefined {
  const a = call.args ?? {};
  for (const k of ["file_path", "path", "command", "pattern", "url", "query", "description"]) {
    const v = a[k];
    if (typeof v === "string" && v) return firstLine(v, 48);
  }
  return undefined;
}

const resultBody = (c: ToolCallData) => (typeof c.result === "string" ? c.result : c.result != null ? JSON.stringify(c.result) : (c.output ?? c.error ?? ""));
const argsBody = (c: ToolCallData) => c.argsText ?? (c.args ? JSON.stringify(c.args) : "");

/** 一个工具结果进上下文的 token (报告值优先) */
export const resultTokensOf = (c: ToolCallData) => c.resultTokens ?? estimateTokens(resultBody(c));

const zero = (): Record<ContextCategory, number> => ({ system: 0, tools: 0, injected: 0, history: 0, user: 0, assistant: 0, results: 0 });

/** 线程里最新的上下文构成 (后面的 context 事件覆盖前面的字段) */
export function latestContextInfo(thread: readonly AgentMessage[]): AgentContextInfo {
  let info: AgentContextInfo = {};
  for (const m of thread) if (m.context) info = { ...info, ...m.context };
  return info;
}

const sourceItems = (list: readonly ContextSource[] | undefined, category: ContextCategory): ContextItem[] =>
  (list ?? []).map((s) => ({ id: `${category}:${s.id}`, category, label: s.label, detail: s.detail, tokens: s.tokens, estimated: false }));

/**
 * 此刻 (或某个子 Agent) 的上下文构成. 逐条消息推算对话部分; 压缩提示把之前的对话收成一项摘要.
 */
export function contextBreakdown(messages: readonly AgentMessage[], opts: ContextOptions = {}): ContextBreakdown {
  const thread = contextThread(messages, opts);
  const info = latestContextInfo(thread);
  let conversation: ContextItem[] = [];
  let compactions = 0;
  // 最近一次压缩: 摘要项 + 压缩后的总量 (摘要大小在拿到固定开销后再算)
  const compacted: { item?: ContextItem; after: number } = { after: 0 };
  let reported: number | undefined;
  let cached: number | undefined;
  let win = opts.contextWindow;
  const add = (it: Omit<ContextItem, "estimated"> & { estimated?: boolean }) => it.tokens > 0 && conversation.push({ estimated: true, ...it });
  const onPart = (m: AgentMessage, p: AgentPart) => {
    if (p.type === "notice" && p.kind === "compaction" && p.compaction) {
      compactions++;
      conversation = [];
      compacted.item = { id: `summary:${p.id}`, category: "history", label: "压缩摘要", detail: `压缩前 ${p.compaction.before.toLocaleString("zh-CN")} tokens`, tokens: 0, estimated: false, messageId: m.id, partId: p.id };
      compacted.after = p.compaction.after;
      return;
    }
    if (m.role === "user") {
      if (p.type === "text") add({ id: p.id, category: "user", label: firstLine(p.text) || "用户消息", tokens: estimateTokens(p.text), messageId: m.id, partId: p.id });
      else if (p.type === "file") add({ id: p.id, category: "user", label: p.name, detail: "附件", tokens: Math.ceil((p.size ?? 0) / 4), messageId: m.id, partId: p.id });
      return;
    }
    if (p.type === "text") add({ id: p.id, category: "assistant", label: firstLine(p.text) || "回复", tokens: estimateTokens(p.text), messageId: m.id, partId: p.id });
    else if (p.type === "reasoning") add({ id: p.id, category: "assistant", label: firstLine(p.text) || "思考", detail: "思考", tokens: estimateTokens(p.text), messageId: m.id, partId: p.id });
    else if (p.type === "tool") {
      const c = p.call;
      const target = callTarget(c);
      add({ id: `${p.id}:args`, category: "assistant", label: `${c.name} 调用`, detail: target, tokens: estimateTokens(argsBody(c)), messageId: m.id, partId: p.id });
      add({ id: `${p.id}:result`, category: "results", label: c.name, detail: target, tokens: resultTokensOf(c), estimated: c.resultTokens == null, messageId: m.id, partId: p.id });
    }
  };
  for (const m of thread) {
    for (const p of m.parts) onPart(m, p);
    if (m.usage?.contextTokens != null) reported = m.usage.contextTokens;
    // 缓存命中取最近一次 usage 采样 (message-end 的累计用量不算 "这次请求")
    for (const smp of m.contextSamples ?? []) if (smp.cached != null) cached = smp.cached;
    if (m.usage?.contextWindow) win = m.usage.contextWindow;
  }
  if (info.window) win = info.window;

  const schemaItems = sourceItems(info.toolSchemas, "tools");
  const fixed: ContextItem[] = [];
  const system = info.system ?? 0;
  if (system > 0) fixed.push({ id: "system", category: "system", label: "系统提示", tokens: system, estimated: false });
  const toolsTotal = info.tools ?? schemaItems.reduce((a, b) => a + b.tokens, 0);
  // 工具定义: 列出的几份 + 其余合成一项
  const listed = schemaItems.reduce((a, b) => a + b.tokens, 0);
  fixed.push(...schemaItems);
  if (toolsTotal > listed) fixed.push({ id: "tools:rest", category: "tools", label: schemaItems.length ? "其余工具定义" : "工具定义", tokens: toolsTotal - listed, estimated: false });
  fixed.push(...sourceItems(info.injected, "injected"));
  const fixedTokens = fixed.reduce((a, b) => a + b.tokens, 0);

  const history: ContextItem[] = [];
  if (compacted.item) history.push({ ...compacted.item, tokens: Math.max(0, compacted.after - fixedTokens) });
  else if (info.history) history.push({ id: "history", category: "history", label: "更早的对话", detail: "本次会话之前", tokens: info.history, estimated: false });

  let items = [...fixed, ...history, ...conversation];
  let sum = items.reduce((a, b) => a + b.tokens, 0);
  // 报告值比估算大: 差额是说不清来源的部分 (记进历史)
  if (reported != null && reported > sum) {
    items.push({ id: "unattributed", category: "history", label: "未细分", detail: "报告值与估算的差额", tokens: reported - sum, estimated: true });
    sum = reported;
  }
  items = items.filter((it) => it.tokens > 0).sort((a, b) => b.tokens - a.tokens);
  const byCategory = zero();
  for (const it of items) byCategory[it.category] += it.tokens;
  const compactAt = info.compactAt ?? (win ? Math.floor(win * COMPACT_RATIO) : undefined);
  const total = sum;
  const level: ContextLevel = compactAt && total >= compactAt ? "over" : compactAt && total >= compactAt * NEAR_RATIO ? "near" : "ok";
  return {
    total,
    reported,
    estimatedTokens: items.filter((it) => it.estimated).reduce((a, b) => a + b.tokens, 0),
    window: win,
    compactAt,
    reservedOutput: info.reservedOutput,
    ratio: win ? Math.min(1, total / win) : null,
    level,
    cached: cached != null ? Math.min(cached, total) : undefined,
    byCategory,
    items,
    compactions,
    empty: total === 0,
  };
}

export interface ContextPoint {
  at: number;
  tokens: number;
  cached?: number;
  compacted?: boolean;
  messageId: string;
}

/** 每次请求的上下文占用 (按时间排), 演变图用 */
export function contextTimeline(messages: readonly AgentMessage[], opts: ContextOptions = {}): ContextPoint[] {
  const out: ContextPoint[] = [];
  for (const m of contextThread(messages, opts)) for (const s of m.contextSamples ?? []) out.push({ ...s, messageId: m.id });
  return out.sort((a, b) => a.at - b.at);
}

export type ContextEventKind = "inject" | "result" | "near" | "over" | "compaction";

export interface ContextEvent {
  kind: ContextEventKind;
  at: number;
  label: string;
  detail?: string;
  /** 带符号的 token 变化 (压缩为负) */
  delta?: number;
  messageId?: string;
  partId?: string;
}

/**
 * 上下文为什么变了: 注入 (第一次出现的注入来源), 大块工具结果 (≥ LARGE_RESULT), 越过 "接近" / 压缩线, 压缩 (回收多少).
 * 按时间排; 没时间的按消息开始时间.
 */
export function contextEvents(messages: readonly AgentMessage[], opts: ContextOptions = {}): ContextEvent[] {
  const thread = contextThread(messages, opts);
  const out: ContextEvent[] = [];
  const seen = new Set<string>();
  let win = opts.contextWindow;
  let compactAt: number | undefined;
  for (const m of thread) {
    const t0 = m.startedAt ?? m.createdAt ?? 0;
    if (m.usage?.contextWindow) win = m.usage.contextWindow;
    if (m.context?.window) win = m.context.window;
    if (m.context?.compactAt) compactAt = m.context.compactAt;
    for (const s of m.context?.injected ?? []) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      out.push({ kind: "inject", at: t0, label: s.label, detail: s.detail ?? (s.kind === "skill" ? "技能" : s.kind === "file" ? "文件" : "指令"), delta: s.tokens, messageId: m.id });
    }
    for (const p of m.parts) {
      if (p.type === "tool" && p.call.endedAt != null) {
        const tokens = resultTokensOf(p.call);
        if (tokens >= LARGE_RESULT) out.push({ kind: "result", at: p.call.endedAt, label: p.call.name, detail: callTarget(p.call), delta: tokens, messageId: m.id, partId: p.id });
      }
      if (p.type === "notice" && p.compaction) out.push({ kind: "compaction", at: p.compaction.at ?? t0, label: "压缩上下文", detail: `${p.compaction.before.toLocaleString("zh-CN")} → ${p.compaction.after.toLocaleString("zh-CN")}`, delta: p.compaction.after - p.compaction.before, messageId: m.id, partId: p.id });
    }
  }
  // 越线: 按采样找第一次从线下到线上
  const line = compactAt ?? (win ? Math.floor(win * COMPACT_RATIO) : undefined);
  if (line) {
    let prev = 0;
    for (const s of contextTimeline(messages, opts)) {
      if (prev < line * NEAR_RATIO && s.tokens >= line * NEAR_RATIO && s.tokens < line) out.push({ kind: "near", at: s.at, label: "接近压缩线", detail: `${Math.round((s.tokens / line) * 100)}% · 压缩线 ${line.toLocaleString("zh-CN")}`, messageId: s.messageId });
      if (prev < line && s.tokens >= line) out.push({ kind: "over", at: s.at, label: "越过压缩线", detail: `${s.tokens.toLocaleString("zh-CN")} ≥ ${line.toLocaleString("zh-CN")}`, messageId: s.messageId });
      prev = s.tokens;
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

/** 演变图的一根柱: 这次请求时的构成 (锚到报告值: 估算比报告多时按比例缩到报告值) */
export interface ContextSnapshot extends ContextPoint {
  byCategory: Record<ContextCategory, number>;
}

/** contextSeries 的缓存: 已算过的采样不再重算 (流式时只算新来的) */
export type ContextSeriesCache = Map<string, Record<ContextCategory, number>>;

/**
 * 每次请求的上下文构成 (dsh-context 的时间线: 一次请求一根按类别堆叠的柱).
 * 每份采样记着当时这条消息有几个部件 (ContextSample.parts), 按它切出 "那一刻" 的线程再算构成;
 * 报告值 (sample.tokens) 是柱高, 估算的各类按比例缩放到它 (报告值更大时差额进 "历史").
 */
export function contextSeries(messages: readonly AgentMessage[], opts: ContextOptions = {}, cache?: ContextSeriesCache): ContextSnapshot[] {
  const thread = contextThread(messages, opts);
  const out: ContextSnapshot[] = [];
  thread.forEach((m, mi) => {
    const samples = m.contextSamples ?? [];
    samples.forEach((s, si) => {
      const key = `${m.id}@${s.at}@${s.tokens}@${s.parts ?? "-"}`;
      let byCategory = cache?.get(key);
      if (!byCategory) {
        const cut: AgentMessage = { ...m, parts: s.parts != null ? m.parts.slice(0, s.parts) : m.parts, usage: { ...m.usage, contextTokens: s.tokens }, contextSamples: samples.slice(0, si + 1) };
        const b = contextBreakdown([...thread.slice(0, mi), cut], { contextWindow: opts.contextWindow });
        const sum = CONTEXT_CATEGORIES.reduce((a, c) => a + b.byCategory[c], 0);
        const k = sum > s.tokens && sum > 0 ? s.tokens / sum : 1;
        byCategory = zero();
        for (const c of CONTEXT_CATEGORIES) byCategory[c] = Math.round(b.byCategory[c] * k);
        cache?.set(key, byCategory);
      }
      out.push({ ...s, messageId: m.id, byCategory });
    });
  });
  return out.sort((a, b) => a.at - b.at);
}
