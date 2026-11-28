/**
 * 与传输无关的 Agent 事件 + reducer (纯函数).
 * 只改动到的那条消息和那个 part 换新对象, 其余引用不变: 组件逐条 / 逐个 part memo, 一个工具调用更新不会重渲染兄弟.
 * 多 Agent: agent-spawn / agent-status / agent-handoff / agent-message 交给 agents.ts 维护 state.agents (父子树),
 * 消息与 part 事件可带 agentId 标明出处. 子 Agent 的时间线仍可以走 tool-child 嵌进 task 调用, 两者兼容.
 * 实时用量: 文字 / 思考 / 工具参数的增量顺带记进 message.meter (首 token, 采样); usage-delta 给精确的输出 token 增量,
 * usage 给提示侧 / 缓存 / 上下文的快照. 速率与命中率的计算在 usage.ts.
 * 按 Agent 归属: 子 Agent 的增量嵌在 tool-child 里 (或 usage-delta 带 callId) 时记在那次派发调用的 call.meter 上,
 * 不进父消息的 meter, 于是每个 Agent 的实时速率各算各的 (usage.ts 的 agentTokenRates).
 */
import { emptyAgentTree, isAgentTreeEvent, reduceAgentTree, type AgentTree, type AgentTreeEvent } from "./agents";
import { formatTokens } from "../parts/format";
import { parsePartialArgs } from "./partial-json";
import { addRequestUsage, bumpMeter, estimateTokens, requestUsage } from "./usage";
import { TOOL_DONE, type AgentContextInfo, type AgentMessage, type AgentPart, type AgentUsage, type ContextSample, type MessageStatus, type NoticeKind, type ToolCallData, type ToolStatus } from "./types";

export type AgentEvent =
  | { type: "message-start"; messageId: string; role?: AgentMessage["role"]; model?: string; agentId?: string; at?: number }
  | { type: "message-end"; messageId: string; status?: MessageStatus; usage?: AgentUsage; error?: string; at?: number }
  | { type: "user-message"; messageId: string; text: string; at?: number }
  | { type: "text-delta"; messageId: string; partId: string; delta: string; agentId?: string; at?: number }
  | { type: "text-end"; messageId: string; partId: string }
  | { type: "reasoning-delta"; messageId: string; partId: string; delta: string; at?: number; agentId?: string }
  | { type: "reasoning-end"; messageId: string; partId: string; at?: number }
  | { type: "tool-start"; messageId: string; callId: string; name: string; at?: number; meta?: Record<string, unknown>; agentId?: string }
  | { type: "tool-args-delta"; messageId: string; callId: string; delta: string }
  | { type: "tool-args"; messageId: string; callId: string; args: Record<string, unknown> }
  | { type: "tool-status"; messageId: string; callId: string; status: ToolStatus; at?: number }
  | { type: "tool-output-delta"; messageId: string; callId: string; delta: string }
  /** tokens: 结果进上下文的 token 数 (可选, 上下文检视器用; 不给按文字估算) */
  | { type: "tool-result"; messageId: string; callId: string; result?: unknown; error?: string; exitCode?: number | null; status?: ToolStatus; tokens?: number; at?: number }
  /** 子 Agent 的事件: 嵌进父调用的 children; 嵌的是 agent-* 事件时进 Agent 树, spawn 自动记上这次调用 */
  | { type: "tool-child"; messageId: string; callId: string; event: AgentEvent }
  | { type: "notice"; messageId: string; partId: string; kind: NoticeKind; text: string; detail?: string; agentId?: string }
  /** 上下文构成 (合并进 message.context): 系统提示 / 工具定义 / 注入的大小, 窗口与压缩线; 见 model/context.ts */
  | { type: "context"; messageId: string; context: AgentContextInfo; at?: number }
  /** 上下文压缩: 画一条 compaction 提示, 记一份压缩后的采样, 之前的对话在检视器里收成摘要 */
  | { type: "compaction"; messageId: string; partId: string; before: number; after: number; summary?: string; text?: string; agentId?: string; at?: number }
  /**
   * 用量. scope "total" (默认): 累计值的快照, 合并进 message.usage. scope "request": 一次请求自己的用量 (提示侧 / 缓存 / 上下文 / 费用),
   * 记进 message.request (本次请求) 并累加进 message.usage (累计; 没给 inputTokens 时按 contextTokens 算这次请求的提示侧).
   * 只发 request 的宿主, 命中率读累计值就不会随每次请求跳动. 带 contextTokens 时记一份上下文采样.
   */
  | { type: "usage"; messageId: string; usage: AgentUsage; scope?: "total" | "request"; at?: number }
  /**
   * 流式输出 token 增量 (精确计数, 算实时 tokens/s); 不发时按文字长度估算.
   * 子 Agent 的时间线嵌在父调用里时, 带 callId (或包在 tool-child 里) 记到那次调用上, 速率归给子 Agent 而不是父消息.
   */
  | { type: "usage-delta"; messageId: string; outputTokens: number; reasoningTokens?: number; callId?: string; at?: number }
  /** 多 Agent: 派出 / 状态 / 交接 / 消息 (见 agents.ts) */
  | AgentTreeEvent;

export interface AgentState {
  messages: AgentMessage[];
  /** 多 Agent 父子树; 没有 agent-* 事件时为空树 */
  agents: AgentTree;
}

export const emptyAgentState = (): AgentState => ({ messages: [], agents: emptyAgentTree() });

const now = (at?: number) => at ?? Date.now();

function lastIndex<T extends { id: string }>(arr: readonly T[], id: string): number {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i].id === id) return i;
  return -1;
}

function updateMessage(state: AgentState, id: string, fn: (m: AgentMessage) => AgentMessage, create?: () => AgentMessage): AgentState {
  const i = lastIndex(state.messages, id);
  if (i < 0) {
    if (!create) return state;
    return { ...state, messages: [...state.messages, fn(create())] };
  }
  const next = fn(state.messages[i]);
  if (next === state.messages[i]) return state;
  const messages = state.messages.slice();
  messages[i] = next;
  return { ...state, messages };
}

function updatePart(parts: AgentPart[], id: string, fn: (p: AgentPart | undefined) => AgentPart | undefined): AgentPart[] {
  const i = lastIndex(parts, id);
  const next = fn(i < 0 ? undefined : parts[i]);
  if (!next || (i >= 0 && next === parts[i])) return parts;
  if (i < 0) return [...parts, next];
  const out = parts.slice();
  out[i] = next;
  return out;
}

function updateCall(parts: AgentPart[], callId: string, fn: (c: ToolCallData) => ToolCallData): AgentPart[] {
  return updatePart(parts, callId, (p) => (p && p.type === "tool" ? { ...p, call: fn(p.call) } : p));
}

/** 消息结束时把还没收尾的 part 收尾: 流式标记去掉, 还在跑的工具记为中断 */
function settleParts(parts: AgentPart[], status: MessageStatus, at: number): AgentPart[] {
  return parts.map((p) => {
    if ((p.type === "text" || p.type === "reasoning") && p.streaming) return p.type === "reasoning" ? { ...p, streaming: false, endedAt: p.endedAt ?? at } : { ...p, streaming: false };
    if (p.type === "tool" && !TOOL_DONE.has(p.call.status)) return { ...p, call: { ...p.call, status: status === "done" ? "success" : "interrupted", endedAt: p.call.endedAt ?? at } };
    return p;
  });
}

/** 新的 text / reasoning 开始时, 前面还在流式的同类 part 收尾 */
function closeStreaming(parts: AgentPart[], except: string, at: number): AgentPart[] {
  let changed = false;
  const out = parts.map((p) => {
    if (p.id !== except && (p.type === "text" || p.type === "reasoning") && p.streaming) {
      changed = true;
      return p.type === "reasoning" ? { ...p, streaming: false, endedAt: p.endedAt ?? at } : { ...p, streaming: false };
    }
    return p;
  });
  return changed ? out : parts;
}

const newAssistant = (id: string): AgentMessage => ({ id, role: "assistant", parts: [], status: "streaming", startedAt: Date.now() });

function applyToParts(parts: AgentPart[], e: AgentEvent): AgentPart[] {
  switch (e.type) {
    case "text-delta": {
      const base = closeStreaming(parts, e.partId, Date.now());
      return updatePart(base, e.partId, (p) => (p && p.type === "text" ? { ...p, text: p.text + e.delta, streaming: true } : { type: "text", id: e.partId, text: e.delta, streaming: true, agentId: e.agentId }));
    }
    case "text-end":
      return updatePart(parts, e.partId, (p) => (p && p.type === "text" ? { ...p, streaming: false } : p));
    case "reasoning-delta": {
      const at = now(e.at);
      const base = closeStreaming(parts, e.partId, at);
      return updatePart(base, e.partId, (p) => (p && p.type === "reasoning" ? { ...p, text: p.text + e.delta, streaming: true } : { type: "reasoning", id: e.partId, text: e.delta, streaming: true, startedAt: at, agentId: e.agentId }));
    }
    case "reasoning-end":
      return updatePart(parts, e.partId, (p) => (p && p.type === "reasoning" ? { ...p, streaming: false, endedAt: now(e.at) } : p));
    case "tool-start": {
      const at = now(e.at);
      const base = closeStreaming(parts, e.callId, at);
      return updatePart(base, e.callId, (p) => p ?? { type: "tool", id: e.callId, agentId: e.agentId, call: { id: e.callId, name: e.name, status: "preparing", startedAt: at, meta: e.meta } });
    }
    case "tool-args-delta":
      return updateCall(parts, e.callId, (c) => {
        const argsText = (c.argsText ?? "") + e.delta;
        return { ...c, argsText, args: parsePartialArgs(argsText) ?? c.args };
      });
    case "tool-args":
      return updateCall(parts, e.callId, (c) => ({ ...c, args: e.args, argsText: c.argsText ?? JSON.stringify(e.args) }));
    case "tool-status":
      return updateCall(parts, e.callId, (c) => ({ ...c, status: e.status, endedAt: TOOL_DONE.has(e.status) ? now(e.at) : c.endedAt, startedAt: e.status === "running" && c.status === "preparing" ? now(e.at) : c.startedAt }));
    case "tool-output-delta":
      return updateCall(parts, e.callId, (c) => ({ ...c, status: c.status === "preparing" ? "running" : c.status, output: (c.output ?? "") + e.delta }));
    case "tool-result":
      return updateCall(parts, e.callId, (c) => ({ ...c, result: e.result ?? c.result, error: e.error, exitCode: e.exitCode !== undefined ? e.exitCode : c.exitCode, status: e.status ?? (e.error ? "error" : "success"), endedAt: now(e.at), ...(e.tokens != null ? { resultTokens: e.tokens } : null) }));
    case "tool-child":
      if (isAgentTreeEvent(e.event)) return parts;
      return updateCall(parts, e.callId, (c) => ({ ...c, children: applyToParts(c.children ?? [], e.event) }));
    case "notice":
      return updatePart(parts, e.partId, () => ({ type: "notice", id: e.partId, kind: e.kind, text: e.text, detail: e.detail, agentId: e.agentId }));
    default:
      return parts;
  }
}

/** 模型输出的增量 (算首 token 与估算速率): 文字, 思考, 工具参数 */
function outputOf(e: AgentEvent): { text: string; at?: number } | null {
  if (e.type === "text-delta" || e.type === "reasoning-delta") return { text: e.delta, at: e.at };
  if (e.type === "tool-args-delta") return { text: e.delta };
  return null;
}

/** 树事件: state.agents 换新, messages 引用不变. 嵌在 tool-child 里的 spawn 记上派它的调用 */
function reduceTree(state: AgentState, e: AgentTreeEvent, via?: { messageId: string; callId: string }): AgentState {
  const ev = via && e.type === "agent-spawn" ? { ...e, messageId: e.messageId ?? via.messageId, callId: e.callId ?? via.callId } : e;
  const agents = reduceAgentTree(state.agents ?? emptyAgentTree(), ev);
  return agents === state.agents ? state : { ...state, agents };
}

/** 每条消息最多留这么多份上下文采样 (够画演变, 不无限长) */
export const MAX_CONTEXT_SAMPLES = 240;

/** 追加一份采样: 与上一份同值同类就不记 */
function addSample(list: readonly ContextSample[] | undefined, s: ContextSample): readonly ContextSample[] {
  const prev = list?.[list.length - 1];
  if (prev && prev.tokens === s.tokens && prev.cached === s.cached && !s.compacted) return list as readonly ContextSample[];
  const out = [...(list ?? []), s];
  return out.length > MAX_CONTEXT_SAMPLES ? out.slice(out.length - MAX_CONTEXT_SAMPLES) : out;
}

export function reduceAgentEvent(state: AgentState, e: AgentEvent): AgentState {
  if (isAgentTreeEvent(e)) return reduceTree(state, e);
  if (e.type === "tool-child" && isAgentTreeEvent(e.event)) return reduceTree(state, e.event, e);
  switch (e.type) {
    case "user-message":
      return updateMessage(state, e.messageId, (m) => m, () => ({ id: e.messageId, role: "user", parts: [{ type: "text", id: `${e.messageId}:text`, text: e.text }], status: "done", createdAt: now(e.at) }));
    case "message-start":
      return updateMessage(state, e.messageId, (m) => ({ ...m, role: e.role ?? m.role, model: e.model ?? m.model, agentId: e.agentId ?? m.agentId, status: "streaming", startedAt: m.startedAt ?? now(e.at) }), () => ({ ...newAssistant(e.messageId), createdAt: now(e.at), startedAt: now(e.at) }));
    case "message-end": {
      const at = now(e.at);
      const status = e.status ?? (e.error ? "error" : "done");
      return updateMessage(state, e.messageId, (m) => ({ ...m, status, error: e.error, usage: e.usage ? { ...m.usage, ...e.usage } : m.usage, endedAt: at, parts: settleParts(m.parts, status, at) }));
    }
    case "usage":
      return updateMessage(state, e.messageId, (m) => {
        const u = e.usage;
        const at = now(e.at);
        const contextSamples = u.contextTokens != null ? addSample(m.contextSamples, { at, tokens: u.contextTokens, parts: m.parts.length, ...(u.cachedInputTokens != null ? { cached: u.cachedInputTokens } : null) }) : m.contextSamples;
        if (e.scope !== "request") return { ...m, usage: { ...m.usage, ...u }, contextSamples };
        return { ...m, usage: addRequestUsage(m.usage, u), request: requestUsage(u, at), requests: (m.requests ?? 0) + 1, contextSamples };
      });
    case "context":
      return updateMessage(state, e.messageId, (m) => ({ ...m, context: { ...m.context, ...e.context } }), () => newAssistant(e.messageId));
    case "compaction": {
      const at = now(e.at);
      const compaction = { before: e.before, after: e.after, summary: e.summary, at };
      return updateMessage(
        state,
        e.messageId,
        (m) => ({
          ...m,
          parts: updatePart(m.parts, e.partId, () => ({ type: "notice", id: e.partId, kind: "compaction", text: e.text ?? "已压缩上下文", detail: `${formatTokens(e.before)} → ${formatTokens(e.after)}`, agentId: e.agentId, compaction })),
          usage: { ...m.usage, contextTokens: e.after },
          contextSamples: addSample(m.contextSamples, { at, tokens: e.after, compacted: true, parts: m.parts.length + 1 }),
        }),
        () => newAssistant(e.messageId),
      );
    }
    case "usage-delta": {
      const at = now(e.at);
      if (e.callId) {
        const callId = e.callId;
        return updateMessage(state, e.messageId, (m) => {
          const parts = updateCall(m.parts, callId, (c) => ({ ...c, meter: bumpMeter(c.meter, at, e.outputTokens, true) }));
          return parts === m.parts ? m : { ...m, parts };
        });
      }
      return updateMessage(
        state,
        e.messageId,
        (m) => ({
          ...m,
          usage: { ...m.usage, outputTokens: (m.meter?.exact ? (m.usage?.outputTokens ?? 0) : 0) + e.outputTokens, ...(e.reasoningTokens ? { reasoningTokens: (m.usage?.reasoningTokens ?? 0) + e.reasoningTokens } : null) },
          meter: bumpMeter(m.meter, at, e.outputTokens, true),
        }),
        () => newAssistant(e.messageId),
      );
    }
    default:
      return updateMessage(
        state,
        e.messageId,
        (m) => {
          // 嵌在父调用里的子 Agent 输出: 计量记到那次调用上 (按 Agent 归属速率)
          if (e.type === "tool-child") {
            const inner = e.event;
            const exact = inner.type === "usage-delta";
            const out = exact ? null : outputOf(inner);
            const tokens = exact ? inner.outputTokens : out ? estimateTokens(out.text) : 0;
            const at = now(exact ? inner.at : out?.at);
            let parts = exact ? m.parts : applyToParts(m.parts, e);
            if (tokens > 0) parts = updateCall(parts, e.callId, (c) => ({ ...c, meter: bumpMeter(c.meter, at, tokens, exact) }));
            return parts === m.parts ? m : { ...m, parts };
          }
          const parts = applyToParts(m.parts, e);
          if (parts === m.parts) return m;
          const out = outputOf(e);
          return out == null ? { ...m, parts } : { ...m, parts, meter: bumpMeter(m.meter, now(out.at), estimateTokens(out.text), false) };
        },
        () => newAssistant(e.messageId),
      );
  }
}

export function reduceAgentEvents(state: AgentState, events: readonly AgentEvent[]): AgentState {
  let s = state;
  for (const e of events) s = reduceAgentEvent(s, e);
  return s;
}
