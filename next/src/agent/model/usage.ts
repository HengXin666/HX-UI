/**
 * 实时用量 (纯函数, 无 "use client", 服务端安全): 流式计量的采样, 滑动窗口 tokens/s, 首 token 延迟,
 * 缓存命中率, 上下文占用, 以及整段会话 / 本轮的汇总. 会话里的用量条 (SessionMeter) 与每轮的用量胶囊都读这里.
 * 指标口径对照 DSH: 速率 = 输出 token / 生成时长 (首 token 之后), 命中率 = 缓存读取 / 提示侧总量, 上下文 = 已用 / 窗口.
 */
import type { AgentTree } from "./agents";
import type { AgentMessage, AgentPart, AgentRequestUsage, AgentUsage, TokenMeter, TokenSample } from "./types";
import { formatTokens } from "../parts/format";

/** 实时速率的滑动窗口 */
export const RATE_WINDOW_MS = 2000;
/** 采样只留这么久 (够窗口用, 再多就是内存) */
const KEEP_MS = 6000;
/** 采样个数上限 */
const KEEP_MAX = 96;
/** 窗口刚开始时的最小分母, 避免第一块 token 算出一个天文数字 */
const MIN_SPAN_MS = 250;
/** 生成时长短于这个就不报吞吐 (DSH: 时长过短) */
const MIN_DECODE_MS = 200;

const CJK = /[\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/g;

/** 按文字估 token: 中日韩字符 1 个算 1 个, 其余约 4 个字符 1 个. 只在没有 usage-delta 时兜底 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const cjk = text.match(CJK)?.length ?? 0;
  return cjk + Math.ceil((text.length - cjk) / 4);
}

export const emptyMeter = (): TokenMeter => ({ samples: [], streamedTokens: 0, exact: false });

/**
 * 记一次输出: at 时刻新到 tokens 个. exact 为 true 表示来自 usage-delta 的精确计数:
 * 第一次收到精确计数时丢掉之前的估算, 之后估算的输入 (文字长度) 只更新时刻, 不再计数.
 */
export function bumpMeter(meter: TokenMeter | undefined, at: number, tokens: number, exact: boolean): TokenMeter {
  const m = meter ?? emptyMeter();
  const switching = exact && !m.exact;
  const counted = m.exact && !exact ? 0 : tokens;
  const base: readonly TokenSample[] = switching ? [] : m.samples;
  const samples = counted > 0 ? [...base, { at, tokens: counted }].filter((s) => s.at > at - KEEP_MS).slice(-KEEP_MAX) : base;
  return {
    firstTokenAt: m.firstTokenAt ?? at,
    lastTokenAt: Math.max(m.lastTokenAt ?? at, at),
    samples,
    streamedTokens: (switching ? 0 : m.streamedTokens) + counted,
    exact: m.exact || exact,
  };
}

/** 滑动窗口里的输出速率 (tokens/s). 窗口里没有采样 (在等工具 / 已结束) 时为 0 */
export function tokenRate(meter: TokenMeter | undefined, now: number, windowMs = RATE_WINDOW_MS): number {
  if (!meter?.samples.length) return 0;
  let sum = 0;
  let first = Number.POSITIVE_INFINITY;
  for (const s of meter.samples) {
    if (s.at <= now - windowMs || s.at > now) continue;
    sum += s.tokens;
    first = Math.min(first, s.at);
  }
  if (!sum) return 0;
  // 刚开始生成时分母只取已经过去的时长 (从首 token 起), 不拿整个窗口去除
  const since = now - Math.min(first, meter.firstTokenAt ?? first);
  const span = Math.max(MIN_SPAN_MS, Math.min(windowMs, since));
  return (sum * 1000) / span;
}

export interface MessageTiming {
  /** 首 token 延迟: 开始到第一个输出 token */
  ttftMs?: number;
  /** 生成时长: 首 token 到最后一个 token */
  decodeMs?: number;
  /** 输出 token: usage 报的优先, 否则用流式累计 */
  outputTokens?: number;
  /** 平均吞吐: outputTokens / decodeMs */
  tokensPerSecond?: number;
}

/** 一条消息的计时: 结束后也能读 (DSH 的 TTFT / 生成 / 吞吐) */
export function messageTiming(m: Pick<AgentMessage, "startedAt" | "usage" | "meter">): MessageTiming {
  const meter = m.meter;
  const out: MessageTiming = {};
  if (meter?.firstTokenAt != null && m.startedAt != null) out.ttftMs = Math.max(0, meter.firstTokenAt - m.startedAt);
  if (meter?.firstTokenAt != null && meter.lastTokenAt != null) out.decodeMs = meter.lastTokenAt - meter.firstTokenAt;
  const tokens = m.usage?.outputTokens ?? (meter?.streamedTokens || undefined);
  if (tokens != null) out.outputTokens = tokens;
  if (tokens && out.decodeMs != null && out.decodeMs >= MIN_DECODE_MS) out.tokensPerSecond = (tokens * 1000) / out.decodeMs;
  return out;
}

/** 缓存命中率 0..1; 没有提示侧 token 时为 null */
export function cacheHitRate(u: AgentUsage | undefined): number | null {
  if (!u?.inputTokens) return null;
  return Math.min(1, (u.cachedInputTokens ?? 0) / u.inputTokens);
}

/** 上下文占用 0..1; 不知道窗口时为 null */
export function contextRatio(u: Pick<AgentUsage, "contextTokens" | "contextWindow"> | undefined): number | null {
  if (u?.contextTokens == null || !u.contextWindow) return null;
  return Math.min(1, u.contextTokens / u.contextWindow);
}

/** 一次请求的提示侧: 没报 inputTokens 时按这次请求的上下文占用算; 命中不超过提示侧 */
export function requestUsage(u: AgentUsage, at?: number): AgentRequestUsage {
  const input = u.inputTokens ?? u.contextTokens;
  const cached = u.cachedInputTokens != null ? Math.min(u.cachedInputTokens, input ?? u.cachedInputTokens) : undefined;
  return { ...u, ...(input != null ? { inputTokens: input } : null), ...(cached != null ? { cachedInputTokens: cached } : null), ...(at != null ? { at } : null) };
}

/** 把一次请求累加进累计用量 (提示侧 / 缓存 / 写入 / 费用相加, 上下文取这次的, 输出不动: 输出由 usage-delta 计) */
export function addRequestUsage(total: AgentUsage | undefined, u: AgentUsage): AgentUsage {
  const r = requestUsage(u);
  const t = total ?? {};
  const add = (a: number | undefined, b: number | undefined) => (b == null ? a : (a ?? 0) + b);
  return {
    ...t,
    inputTokens: add(t.inputTokens, r.inputTokens),
    cachedInputTokens: add(t.cachedInputTokens, r.cachedInputTokens),
    cacheWriteTokens: add(t.cacheWriteTokens, r.cacheWriteTokens),
    cost: add(t.cost, r.cost),
    ...(u.outputTokens != null && t.outputTokens == null ? { outputTokens: u.outputTokens } : null),
    ...(u.reasoningTokens != null && t.reasoningTokens == null ? { reasoningTokens: u.reasoningTokens } : null),
    contextTokens: r.contextTokens ?? t.contextTokens,
    contextWindow: r.contextWindow ?? t.contextWindow,
  };
}

const USAGE_KEYS = ["inputTokens", "outputTokens", "reasoningTokens", "cachedInputTokens", "cacheWriteTokens", "cost"] as const;

/** 把几条消息的用量加起来 (上下文取最后一条报了的) */
export function sumUsage(messages: readonly Pick<AgentMessage, "usage" | "meter">[]): AgentUsage {
  const out: AgentUsage = {};
  for (const m of messages) {
    const u = m.usage;
    for (const k of USAGE_KEYS) {
      // 还在流式的消息: usage 里没有输出时用流式累计
      const v = k === "outputTokens" ? (u?.outputTokens ?? (m.meter?.streamedTokens || undefined)) : u?.[k];
      if (v != null) out[k] = (out[k] ?? 0) + v;
    }
    if (u?.contextTokens != null) out.contextTokens = u.contextTokens;
    if (u?.contextWindow != null) out.contextWindow = u.contextWindow;
  }
  return out;
}

/** 嵌在调用里的子 Agent 时间线的速率 (call.meter), 并入会话总速率 */
function nestedRate(parts: readonly AgentPart[], now: number): number {
  let r = 0;
  for (const p of parts) {
    if (p.type !== "tool") continue;
    if (p.call.meter) r += tokenRate(p.call.meter, now);
    if (p.call.children?.length) r += nestedRate(p.call.children, now);
  }
  return r;
}

/** 最近一次请求 (底栏悬停 / 明细里与累计并列) */
export interface LastRequestUsage {
  inputTokens?: number;
  cachedInputTokens?: number;
  cacheHitRate: number | null;
  contextTokens?: number;
  at?: number;
}

export interface SessionUsage extends AgentUsage {
  /** 缓存命中率 (整段会话的累计值: 累计命中 / 累计提示, 不随单次请求跳动) */
  cacheHitRate: number | null;
  /** 最近一次请求 (宿主按 scope: "request" 报用量时才有) */
  lastRequest?: LastRequestUsage;
  /** 请求次数 (同上) */
  requests: number;
  /** 上下文占用 (主线程最近一次) */
  contextRatio: number | null;
  /** 此刻的输出速率: 所有还在生成的消息 (含子 Agent) 加起来 */
  tokensPerSecond: number;
  /** 正在生成的消息数 (并行的子 Agent 各算一条) */
  streams: number;
  /** 平均吞吐 (已有计时的消息按 token 加权) */
  avgTokensPerSecond?: number;
  /** 最近一条消息的首 token 延迟 */
  lastTtftMs?: number;
  /** 本轮: 最后一条用户消息之后 */
  turn: { startedAt?: number; endedAt?: number; cost?: number; outputTokens?: number; live: boolean };
  /** 有消息还在生成 */
  live: boolean;
}

export interface SessionUsageOptions {
  /** 哪些消息算主线程 (取上下文占用); 默认没有 agentId 的 */
  isMain?: (m: AgentMessage) => boolean;
  /** 已知的上下文窗口 (消息里没报时用) */
  contextWindow?: number;
}

/**
 * 整段会话的实时用量: 累计 token / 费用 / 命中率, 主线程的上下文占用, 此刻的 tokens/s (now 由调用方给, 组件里每 250ms 刷一次),
 * 平均吞吐与首 token, 以及本轮的起止与费用.
 * 研究笔记: next/docs/dsh-conversation-research.md
 */
export function sessionUsage(messages: readonly AgentMessage[], now: number, opts: SessionUsageOptions = {}): SessionUsage {
  const isMain = opts.isMain ?? ((m: AgentMessage) => !m.agentId);
  const total = sumUsage(messages);
  let rate = 0;
  let streams = 0;
  let decodeTokens = 0;
  let decodeMs = 0;
  let lastTtftMs: number | undefined;
  let contextTokens: number | undefined;
  let contextWindow = opts.contextWindow;
  let last: AgentRequestUsage | undefined;
  let lastMain = false;
  let requests = 0;
  for (const m of messages) {
    const live = m.status === "streaming";
    requests += m.requests ?? 0;
    // 最近一次请求: 主线程的优先 (子 Agent 的请求不顶掉编排者的)
    if (m.request) {
      const main = isMain(m);
      if ((main && !lastMain) || (main === lastMain && (m.request.at ?? 0) >= (last?.at ?? 0))) {
        last = m.request;
        lastMain = main;
      }
    }
    if (live) {
      streams++;
      rate += tokenRate(m.meter, now) + nestedRate(m.parts, now);
    }
    const t = messageTiming(m);
    if (t.ttftMs != null && m.role === "assistant") lastTtftMs = t.ttftMs;
    if (!live && t.tokensPerSecond != null && t.outputTokens && t.decodeMs) {
      decodeTokens += t.outputTokens;
      decodeMs += t.decodeMs;
    }
    if (isMain(m) && m.usage?.contextTokens != null) {
      contextTokens = m.usage.contextTokens;
      contextWindow = m.usage.contextWindow ?? contextWindow;
    }
  }
  let lastUser = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      lastUser = i;
      break;
    }
  }
  const turnMsgs = messages.slice(lastUser + 1).filter((m) => m.role === "assistant");
  const turnLive = turnMsgs.some((m) => m.status === "streaming");
  const starts = turnMsgs.map((m) => m.startedAt).filter((x): x is number => x != null);
  const ends = turnMsgs.map((m) => m.endedAt).filter((x): x is number => x != null);
  const turnUsage = sumUsage(turnMsgs);
  const ctx = { contextTokens, contextWindow };
  return {
    ...total,
    contextTokens,
    contextWindow,
    cacheHitRate: cacheHitRate(total),
    ...(last ? { lastRequest: { inputTokens: last.inputTokens, cachedInputTokens: last.cachedInputTokens, cacheHitRate: cacheHitRate(last), contextTokens: last.contextTokens, at: last.at } } : null),
    requests,
    contextRatio: contextRatio(ctx),
    tokensPerSecond: rate,
    streams,
    avgTokensPerSecond: decodeMs > 0 ? (decodeTokens * 1000) / decodeMs : undefined,
    lastTtftMs,
    turn: {
      startedAt: starts.length ? Math.min(...starts) : undefined,
      endedAt: !turnLive && ends.length ? Math.max(...ends) : undefined,
      cost: turnUsage.cost,
      outputTokens: turnUsage.outputTokens,
      live: turnLive,
    },
    live: streams > 0,
  };
}

/** 不带 agentId 的消息 (单 Agent 会话的主线程) 在速率表里的键 */
export const MAIN_THREAD = "";

/**
 * 每个 Agent 此刻的输出速率 (tokens/s), 按归属分开算:
 *   消息的 meter 归消息的 agentId (不带就是 MAIN_THREAD);
 *   子 Agent 的时间线嵌在派发调用里 (tool-child) 时, 调用上的 meter 归那次调用派出的 Agent (spawn 记着 callId).
 * 只算还在生成的: 结束的消息 / 调用为 0. 编排框头部的 "子 Agent 合计" 就是把子 Agent 的值加起来.
 */
export function agentTokenRates(messages: readonly AgentMessage[], tree: AgentTree | undefined, now: number): Map<string, number> {
  const out = new Map<string, number>();
  const add = (id: string, r: number) => r > 0 && out.set(id, (out.get(id) ?? 0) + r);
  const byCall = new Map<string, string>();
  if (tree) for (const id of tree.order) {
    const c = tree.nodes[id]?.callId;
    if (c) byCall.set(c, id);
  }
  const visit = (parts: readonly AgentPart[], live: boolean) => {
    for (const p of parts) {
      if (p.type !== "tool") continue;
      const owner = byCall.get(p.id);
      if (owner && p.call.meter && live) add(owner, tokenRate(p.call.meter, now));
      if (p.call.children?.length) visit(p.call.children, live);
    }
  };
  for (const m of messages) {
    const live = m.status === "streaming";
    if (live) add(m.agentId ?? MAIN_THREAD, tokenRate(m.meter, now));
    if (byCall.size) visit(m.parts, live);
  }
  return out;
}

/** 几个 Agent 的速率之和 (编排框头部的子 Agent 合计) */
export const sumRates = (rates: ReadonlyMap<string, number>, ids: Iterable<string>) => {
  let s = 0;
  for (const id of ids) s += rates.get(id) ?? 0;
  return s;
};

/** 速率文字: 10 以上取整, 以下留一位 (DSH 同款) */
export function formatRate(tps: number): string {
  const v = Math.max(0, tps);
  return v >= 10 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
}

/** 百分比文字: 部分命中不四舍五入成 100% */
export function formatPercent(ratio: number, digits = 0): string {
  const p = Math.max(0, Math.min(1, ratio)) * 100;
  const f = 10 ** digits;
  const r = Math.round(p * f) / f;
  if (r >= 100 && ratio < 1) return (100 - 1 / f).toFixed(digits);
  return r.toFixed(digits);
}

/** 费用文字: 不到 1 美分保留 4 位 */
export const formatCost = (cost: number) => `$${cost < 0.01 ? cost.toFixed(4) : cost.toFixed(2)}`;

/**
 * 底栏两类数字的文字, 刻意分开标签免得混淆:
 *   累计 (整段会话加起来, 只增不减): "累计 398万" — 提示侧 + 输出 token 的总和;
 *   实时上下文 (此刻主线程占了多少窗口, 会涨也会因压缩回落): "上下文 68%" + "13.6万 / 20万".
 * 不知道窗口时 context 为 undefined.
 */
export interface UsageLabels {
  /** 累计 token 总数 (提示侧 + 输出) */
  totalTokens: number;
  /** "累计 398万" */
  total: string;
  context?: {
    /** 0..100 (整数, 部分占用不会四舍五入成 100) */
    percent: number;
    /** "上下文 68%" */
    label: string;
    /** "13.6万 / 20万" */
    amount: string;
    /** 剩余 token */
    left: number;
  };
}

export function usageLabels(u: Pick<AgentUsage, "inputTokens" | "outputTokens" | "contextTokens" | "contextWindow">): UsageLabels {
  const totalTokens = (u.inputTokens ?? 0) + (u.outputTokens ?? 0);
  const ratio = contextRatio(u);
  const out: UsageLabels = { totalTokens, total: `累计 ${formatTokens(totalTokens)}` };
  if (ratio != null) {
    const percent = Number(formatPercent(ratio));
    out.context = {
      percent,
      label: `上下文 ${percent}%`,
      amount: `${formatTokens(u.contextTokens ?? 0)} / ${formatTokens(u.contextWindow ?? 0)}`,
      left: Math.max(0, (u.contextWindow ?? 0) - (u.contextTokens ?? 0)),
    };
  }
  return out;
}
