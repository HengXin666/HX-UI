/**
 * Vercel AI SDK (v5 / v6) 的 UIMessage -> AgentMessage (纯函数, 不依赖 "ai" 包, 按结构识别).
 *
 *   const { messages, status } = useChat();
 *   const agentMessages = fromAiSdkMessages(messages, { streaming: status === "streaming" });
 *
 * 工具状态对应: input-streaming -> preparing, input-available -> running, approval-requested -> awaiting-approval,
 * output-available -> success, output-error -> error, output-denied -> denied.
 *
 * 多 Agent (agentEventsFromAiSdk):
 * - 消息 metadata.agentId -> AgentMessage.agentId; 工具 / 文本 part 本身没有 Agent 归属字段, 继承消息的.
 * - 自定义数据 part "data-agent-spawn" / "data-agent-status" / "data-agent-handoff" / "data-agent-message"
 *   (服务端 writer.write({ type: "data-agent-spawn", data: {...} })), data 的字段与同名 AgentEvent 一致, 原样转成事件.
 * - 名字在 subagentTools 里的工具调用 (默认 task / agent) 当作一次派发: toolCallId 作 agentId,
 *   input.subagent_type / description / prompt / model 填名字, 任务与模型, 工具状态映射成 Agent 状态, output 作为回传结果.
 * - 映射不了的: AI SDK 不流式下发子 Agent 内部的事件 (子线程的文字 / 工具) 也没有时间戳, 所以子 Agent 的时间线,
 *   交接和中途的消息只能靠上面的数据 part 由服务端自己发; 没发就只有 "派出 -> 结束" 两点, 时刻取 opts.at (默认调用时的 Date.now()).
 */
import type { AgentRunStatus, AgentTreeEvent } from "../model/agents";
import type { AgentMessage, AgentPart, ToolStatus } from "../model/types";

interface UIPartLike {
  type: string;
  text?: string;
  state?: string;
  toolCallId?: string;
  toolName?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  mediaType?: string;
  url?: string;
  filename?: string;
  providerMetadata?: unknown;
  [k: string]: unknown;
}
export interface UIMessageLike {
  id: string;
  role: "user" | "assistant" | "system";
  parts: UIPartLike[];
  metadata?: unknown;
}

const TOOL_STATE: Record<string, ToolStatus> = {
  "input-streaming": "preparing",
  "input-available": "running",
  "approval-requested": "awaiting-approval",
  "approval-responded": "running",
  "output-available": "success",
  "output-error": "error",
  "output-denied": "denied",
};

export function fromAiSdkPart(p: UIPartLike, i: number, messageId: string, last: boolean, streaming: boolean): AgentPart | null {
  const id = p.toolCallId ?? `${messageId}:${i}`;
  if (p.type === "text") return { type: "text", id, text: p.text ?? "", streaming: p.state ? p.state === "streaming" : last && streaming };
  if (p.type === "reasoning") return { type: "reasoning", id, text: p.text ?? "", streaming: p.state ? p.state === "streaming" : last && streaming };
  if (p.type === "file") return { type: "file", id, name: p.filename ?? "文件", mediaType: p.mediaType, url: p.url };
  if (p.type === "dynamic-tool" || p.type.startsWith("tool-")) {
    const name = p.type === "dynamic-tool" ? (p.toolName ?? "tool") : p.type.slice(5);
    let status = TOOL_STATE[p.state ?? ""] ?? "running";
    if (!streaming && (status === "running" || status === "preparing")) status = "interrupted";
    const args = p.input && typeof p.input === "object" && !Array.isArray(p.input) ? (p.input as Record<string, unknown>) : undefined;
    return { type: "tool", id, call: { id, name, status, args, result: p.output, error: p.errorText } };
  }
  return null;
}

export function fromAiSdkMessage(m: UIMessageLike, opts: { streaming?: boolean } = {}): AgentMessage {
  const streaming = !!opts.streaming;
  const parts = m.parts.map((p, i) => fromAiSdkPart(p, i, m.id, i === m.parts.length - 1, streaming)).filter((p): p is AgentPart => p !== null);
  const agentId = metaAgentId(m);
  return { id: m.id, role: m.role, parts, status: streaming ? "streaming" : "done", ...(agentId ? { agentId } : null) };
}

const metaAgentId = (m: UIMessageLike): string | undefined => {
  const meta = m.metadata;
  const id = meta && typeof meta === "object" ? (meta as { agentId?: unknown }).agentId : undefined;
  return typeof id === "string" ? id : undefined;
};

const AGENT_DATA_PREFIX = "data-agent-";
const DATA_EVENT_TYPES: ReadonlySet<string> = new Set(["agent-spawn", "agent-status", "agent-handoff", "agent-message"]);

/** 工具状态 -> 子 Agent 状态 (派发型工具) */
const TOOL_TO_AGENT: Record<ToolStatus, AgentRunStatus> = {
  preparing: "queued",
  "awaiting-approval": "awaiting-approval",
  running: "running",
  success: "done",
  error: "error",
  interrupted: "interrupted",
  denied: "interrupted",
};

const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);

/**
 * 从 AI SDK 消息里取出 Agent 树事件, 交给 reduceAgentEvents (或 reduceAgentTree 逐个) 得到父子树.
 * rootAgentId: 主线程 Agent 的 id, 消息没有 metadata.agentId 时用它当派发型工具的父, 并作为回传结果的接收方.
 */
export function agentEventsFromAiSdk(
  messages: readonly UIMessageLike[],
  opts: { subagentTools?: readonly string[]; rootAgentId?: string; at?: number } = {},
): AgentTreeEvent[] {
  const tools = new Set(opts.subagentTools ?? ["task", "agent"]);
  const at = opts.at ?? Date.now();
  const out: AgentTreeEvent[] = [];
  messages.forEach((m, mi) => {
    const parent = metaAgentId(m) ?? opts.rootAgentId;
    const streaming = mi === messages.length - 1 && m.role === "assistant";
    m.parts.forEach((p, i) => {
      if (p.type.startsWith(AGENT_DATA_PREFIX)) {
        const type = p.type.slice(5);
        const data = p.data;
        if (DATA_EVENT_TYPES.has(type) && data && typeof data === "object") out.push({ ...(data as object), type } as AgentTreeEvent);
        return;
      }
      const part = fromAiSdkPart(p, i, m.id, false, streaming);
      if (!part || part.type !== "tool" || !tools.has(part.call.name)) return;
      const input = part.call.args ?? {};
      const agentId = part.id;
      out.push({
        type: "agent-spawn",
        agentId,
        parentAgentId: parent,
        name: str(input.subagent_type) ?? str(input.description) ?? part.call.name,
        role: str(input.subagent_type),
        model: str(input.model),
        task: str(input.prompt) ?? str(input.description),
        kind: "subagent",
        messageId: m.id,
        callId: part.id,
        at,
      });
      const status = TOOL_TO_AGENT[part.call.status];
      out.push({ type: "agent-status", agentId, status, at, summary: part.call.error });
      const result = typeof part.call.result === "string" ? part.call.result : part.call.result !== undefined ? JSON.stringify(part.call.result) : undefined;
      if (parent && result && status === "done") out.push({ type: "agent-message", from: agentId, to: parent, text: result, kind: "result", at });
    });
  });
  return out;
}

/** 整个对话; streaming 只作用于最后一条助手消息 */
export function fromAiSdkMessages(messages: readonly UIMessageLike[], opts: { streaming?: boolean } = {}): AgentMessage[] {
  return messages.map((m, i) => fromAiSdkMessage(m, { streaming: !!opts.streaming && i === messages.length - 1 && m.role === "assistant" }));
}
