/**
 * 与传输无关的 Agent 事件 + reducer (纯函数).
 * 只改动到的那条消息和那个 part 换新对象, 其余引用不变: 组件逐条 / 逐个 part memo, 一个工具调用更新不会重渲染兄弟.
 */
import { parsePartialArgs } from "./partial-json";
import { TOOL_DONE, type AgentMessage, type AgentPart, type AgentUsage, type MessageStatus, type NoticeKind, type ToolCallData, type ToolStatus } from "./types";

export type AgentEvent =
  | { type: "message-start"; messageId: string; role?: AgentMessage["role"]; model?: string; at?: number }
  | { type: "message-end"; messageId: string; status?: MessageStatus; usage?: AgentUsage; error?: string; at?: number }
  | { type: "user-message"; messageId: string; text: string; at?: number }
  | { type: "text-delta"; messageId: string; partId: string; delta: string }
  | { type: "text-end"; messageId: string; partId: string }
  | { type: "reasoning-delta"; messageId: string; partId: string; delta: string; at?: number }
  | { type: "reasoning-end"; messageId: string; partId: string; at?: number }
  | { type: "tool-start"; messageId: string; callId: string; name: string; at?: number; meta?: Record<string, unknown> }
  | { type: "tool-args-delta"; messageId: string; callId: string; delta: string }
  | { type: "tool-args"; messageId: string; callId: string; args: Record<string, unknown> }
  | { type: "tool-status"; messageId: string; callId: string; status: ToolStatus; at?: number }
  | { type: "tool-output-delta"; messageId: string; callId: string; delta: string }
  | { type: "tool-result"; messageId: string; callId: string; result?: unknown; error?: string; exitCode?: number | null; status?: ToolStatus; at?: number }
  /** 子 Agent 的事件: 嵌进父调用的 children */
  | { type: "tool-child"; messageId: string; callId: string; event: AgentEvent }
  | { type: "notice"; messageId: string; partId: string; kind: NoticeKind; text: string; detail?: string }
  | { type: "usage"; messageId: string; usage: AgentUsage };

export interface AgentState {
  messages: AgentMessage[];
}

export const emptyAgentState = (): AgentState => ({ messages: [] });

const now = (at?: number) => at ?? Date.now();

function lastIndex<T extends { id: string }>(arr: readonly T[], id: string): number {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i].id === id) return i;
  return -1;
}

function updateMessage(state: AgentState, id: string, fn: (m: AgentMessage) => AgentMessage, create?: () => AgentMessage): AgentState {
  const i = lastIndex(state.messages, id);
  if (i < 0) {
    if (!create) return state;
    return { messages: [...state.messages, fn(create())] };
  }
  const next = fn(state.messages[i]);
  if (next === state.messages[i]) return state;
  const messages = state.messages.slice();
  messages[i] = next;
  return { messages };
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
      return updatePart(base, e.partId, (p) => (p && p.type === "text" ? { ...p, text: p.text + e.delta, streaming: true } : { type: "text", id: e.partId, text: e.delta, streaming: true }));
    }
    case "text-end":
      return updatePart(parts, e.partId, (p) => (p && p.type === "text" ? { ...p, streaming: false } : p));
    case "reasoning-delta": {
      const at = now(e.at);
      const base = closeStreaming(parts, e.partId, at);
      return updatePart(base, e.partId, (p) => (p && p.type === "reasoning" ? { ...p, text: p.text + e.delta, streaming: true } : { type: "reasoning", id: e.partId, text: e.delta, streaming: true, startedAt: at }));
    }
    case "reasoning-end":
      return updatePart(parts, e.partId, (p) => (p && p.type === "reasoning" ? { ...p, streaming: false, endedAt: now(e.at) } : p));
    case "tool-start": {
      const at = now(e.at);
      const base = closeStreaming(parts, e.callId, at);
      return updatePart(base, e.callId, (p) => p ?? { type: "tool", id: e.callId, call: { id: e.callId, name: e.name, status: "preparing", startedAt: at, meta: e.meta } });
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
      return updateCall(parts, e.callId, (c) => ({ ...c, result: e.result ?? c.result, error: e.error, exitCode: e.exitCode !== undefined ? e.exitCode : c.exitCode, status: e.status ?? (e.error ? "error" : "success"), endedAt: now(e.at) }));
    case "tool-child":
      return updateCall(parts, e.callId, (c) => ({ ...c, children: applyToParts(c.children ?? [], e.event) }));
    case "notice":
      return updatePart(parts, e.partId, () => ({ type: "notice", id: e.partId, kind: e.kind, text: e.text, detail: e.detail }));
    default:
      return parts;
  }
}

export function reduceAgentEvent(state: AgentState, e: AgentEvent): AgentState {
  switch (e.type) {
    case "user-message":
      return updateMessage(state, e.messageId, (m) => m, () => ({ id: e.messageId, role: "user", parts: [{ type: "text", id: `${e.messageId}:text`, text: e.text }], status: "done", createdAt: now(e.at) }));
    case "message-start":
      return updateMessage(state, e.messageId, (m) => ({ ...m, role: e.role ?? m.role, model: e.model ?? m.model, status: "streaming", startedAt: m.startedAt ?? now(e.at) }), () => ({ ...newAssistant(e.messageId), createdAt: now(e.at), startedAt: now(e.at) }));
    case "message-end": {
      const at = now(e.at);
      const status = e.status ?? (e.error ? "error" : "done");
      return updateMessage(state, e.messageId, (m) => ({ ...m, status, error: e.error, usage: e.usage ? { ...m.usage, ...e.usage } : m.usage, endedAt: at, parts: settleParts(m.parts, status, at) }));
    }
    case "usage":
      return updateMessage(state, e.messageId, (m) => ({ ...m, usage: { ...m.usage, ...e.usage } }));
    default:
      return updateMessage(
        state,
        e.messageId,
        (m) => {
          const parts = applyToParts(m.parts, e);
          return parts === m.parts ? m : { ...m, parts };
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
