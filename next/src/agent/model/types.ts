/**
 * Agent 会话的数据模型 (纯类型). 组件只吃这些快照, 不关心传输 (SSE, WebSocket, AI SDK ...).
 * 事件流 -> reduceAgentEvents -> AgentMessage[] -> 组件.
 */

/** 工具调用的生命周期 (参考 DSH 的 preparing / start / result 三段) */
export type ToolStatus =
  /** 模型还在写参数 (参数 JSON 流式增长) */
  | "preparing"
  /** 等用户批准 */
  | "awaiting-approval"
  | "running"
  | "success"
  | "error"
  /** 被用户停止 / 轮次中断 */
  | "interrupted"
  /** 用户或策略拒绝, 没有执行 */
  | "denied";

export const TOOL_DONE: ReadonlySet<ToolStatus> = new Set(["success", "error", "interrupted", "denied"]);

export interface ToolCallData {
  id: string;
  /** 工具在线路上的名字 (bash, read_file, edit ...), 按它找专门视图 */
  name: string;
  status: ToolStatus;
  /** 已解析的参数; preparing 阶段是部分解析的结果 */
  args?: Record<string, unknown>;
  /** 原始参数文本 (流式拼接中可能不完整) */
  argsText?: string;
  /** 运行中流式追加的输出 (终端 stdout / stderr 合并) */
  output?: string;
  /** 结构化结果 */
  result?: unknown;
  /** 失败原因 */
  error?: string;
  /** 进程退出码 / 信号 */
  exitCode?: number | null;
  startedAt?: number;
  endedAt?: number;
  /** 子 Agent: 嵌套的一段时间线 */
  children?: AgentPart[];
  /** 其余由使用方自定义的字段 (视图自己读) */
  meta?: Record<string, unknown>;
}

export type NoticeKind = "info" | "retry" | "compaction" | "error" | "stopped";

export type AgentPart =
  | { type: "text"; id: string; text: string; streaming?: boolean }
  | { type: "reasoning"; id: string; text: string; streaming?: boolean; startedAt?: number; endedAt?: number }
  | { type: "tool"; id: string; call: ToolCallData }
  | { type: "notice"; id: string; kind: NoticeKind; text: string; detail?: string }
  | { type: "file"; id: string; name: string; mediaType?: string; url?: string; size?: number };

export type MessageStatus = "streaming" | "done" | "error" | "stopped";

export interface AgentUsage {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  /** 当前上下文占用 / 上限, 用量环用 */
  contextTokens?: number;
  contextWindow?: number;
  /** 费用 (美元) */
  cost?: number;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: AgentPart[];
  status?: MessageStatus;
  createdAt?: number;
  /** 这一轮从开始到结束 */
  startedAt?: number;
  endedAt?: number;
  model?: string;
  usage?: AgentUsage;
  error?: string;
}
