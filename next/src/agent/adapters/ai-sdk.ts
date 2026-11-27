/**
 * Vercel AI SDK (v5 / v6) 的 UIMessage -> AgentMessage (纯函数, 不依赖 "ai" 包, 按结构识别).
 *
 *   const { messages, status } = useChat();
 *   const agentMessages = fromAiSdkMessages(messages, { streaming: status === "streaming" });
 *
 * 工具状态对应: input-streaming -> preparing, input-available -> running, approval-requested -> awaiting-approval,
 * output-available -> success, output-error -> error, output-denied -> denied.
 */
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
  return { id: m.id, role: m.role, parts, status: streaming ? "streaming" : "done" };
}

/** 整个对话; streaming 只作用于最后一条助手消息 */
export function fromAiSdkMessages(messages: readonly UIMessageLike[], opts: { streaming?: boolean } = {}): AgentMessage[] {
  return messages.map((m, i) => fromAiSdkMessage(m, { streaming: !!opts.streaming && i === messages.length - 1 && m.role === "assistant" }));
}
