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
  /** 结果进上下文的 token 数 (后端报, tool-result 的 tokens); 不给时上下文检视器按文字估算 */
  resultTokens?: number;
  /** 子 Agent 的时间线嵌在这次调用里 (tool-child) 时, 它的流式计量记在这里, 速率按它归给派出的那个 Agent */
  meter?: TokenMeter;
  /** 其余由使用方自定义的字段 (视图自己读) */
  meta?: Record<string, unknown>;
}

export type NoticeKind = "info" | "retry" | "compaction" | "error" | "stopped";

/**
 * 多 Agent 时 part 可带 agentId (哪个 Agent 产出的); 不带就归所在消息的 agentId, 消息也不带就是主线程.
 * 子 Agent 的树与状态在 model/agents.ts.
 */
export type AgentPart =
  | { type: "text"; id: string; text: string; streaming?: boolean; agentId?: string }
  | { type: "reasoning"; id: string; text: string; streaming?: boolean; startedAt?: number; endedAt?: number; agentId?: string }
  | { type: "tool"; id: string; call: ToolCallData; agentId?: string }
  | { type: "notice"; id: string; kind: NoticeKind; text: string; detail?: string; agentId?: string; compaction?: CompactionInfo }
  | { type: "file"; id: string; name: string; mediaType?: string; url?: string; size?: number; agentId?: string };

/** 一次上下文压缩: 前后 token 数; 压缩前的对话在之后的请求里只剩摘要 */
export interface CompactionInfo {
  before: number;
  after: number;
  /** 摘要文字 (可选) */
  summary?: string;
  at?: number;
}

/** 上下文里一个具名的来源: 注入的 AGENTS.md / 技能 / 引用的文件, 或一份工具定义 */
export interface ContextSource {
  id: string;
  label: string;
  tokens: number;
  kind?: "instructions" | "skill" | "file" | "memory" | "tool" | "other";
  /** 次要说明 (路径, 提供方 "mcp:github") */
  detail?: string;
}

/**
 * 后端报的上下文构成 (context 事件, 合并进 message.context): 固定开销 (系统提示 / 工具定义 / 注入) 与窗口参数.
 * 对话部分 (用户消息, 助手回复, 工具结果) 由消息推算, 见 model/context.ts.
 */
export interface AgentContextInfo {
  window?: number;
  system?: number;
  /** 工具定义合计; 不给按 toolSchemas 相加 */
  tools?: number;
  toolSchemas?: readonly ContextSource[];
  injected?: readonly ContextSource[];
  /** 本会话之前就在上下文里的历史 (恢复的会话, 不在 messages 里) */
  history?: number;
  /** 自动压缩线 (token); 不给取窗口的 80% (DSH 的 COMPACT_THRESHOLD_RATIO) */
  compactAt?: number;
  /** 给输出预留的空间 (画在窗口末尾) */
  reservedOutput?: number;
}

/** 上下文占用的一次采样 (每次 usage 报 contextTokens, 以及每次压缩后) */
export interface ContextSample {
  at: number;
  tokens: number;
  /** 这次请求命中缓存的提示 token */
  cached?: number;
  /** 压缩后的第一份 */
  compacted?: boolean;
  /** 采样时这条消息已有几个部件 (演变图按它切出 "这次请求时" 的构成) */
  parts?: number;
}

export type MessageStatus = "streaming" | "done" | "error" | "stopped";

export interface AgentUsage {
  /** 提示侧 token 总数 (含命中缓存的部分) */
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  /** 命中缓存读取的提示 token (inputTokens 的子集); 命中率 = cachedInputTokens / inputTokens */
  cachedInputTokens?: number;
  /** 本次写入缓存的提示 token */
  cacheWriteTokens?: number;
  /** 当前上下文占用 / 上限, 用量环用 */
  contextTokens?: number;
  contextWindow?: number;
  /** 费用 (美元) */
  cost?: number;
}

/** 一次请求的用量快照 (AgentMessage.request) */
export interface AgentRequestUsage extends AgentUsage {
  /** 收到这份快照的时刻 */
  at?: number;
}

/** 一次 token 采样: 时刻 + 这一刻新到的输出 token 数 */
export interface TokenSample {
  at: number;
  tokens: number;
}

/**
 * 流式计量 (reducer 维护, 算实时 tokens/s 与首 token 延迟用).
 * 没收到 usage-delta 时按文字长度估算 (exact = false); 收到第一条 usage-delta 起换成精确计数.
 */
export interface TokenMeter {
  /** 第一个输出 token (文字 / 思考 / 工具参数) 到达的时刻 */
  firstTokenAt?: number;
  /** 最近一个输出 token 到达的时刻 */
  lastTokenAt?: number;
  /** 最近的采样 (只留滑动窗口需要的一小段) */
  samples: readonly TokenSample[];
  /** 流式累计的输出 token */
  streamedTokens: number;
  /** 计数来自 usage-delta (精确) 还是按文字估算 */
  exact: boolean;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: AgentPart[];
  /** 发出这条消息的 Agent (多 Agent 时); 不给是主线程 */
  agentId?: string;
  status?: MessageStatus;
  createdAt?: number;
  /** 这一轮从开始到结束 */
  startedAt?: number;
  endedAt?: number;
  model?: string;
  /** 累计用量 (这条消息发出的所有请求加起来; message-end 带的 usage 视为权威的累计值) */
  usage?: AgentUsage;
  /** 最近一次请求的用量 (usage 事件 scope: "request" 时记): 本次请求的提示 / 缓存命中 / 上下文, 与累计分开 */
  request?: AgentRequestUsage;
  /** 这条消息发过几次请求 (scope: "request" 的 usage 个数) */
  requests?: number;
  /** 流式计量: 实时速率, 首 token 延迟 (见 model/usage.ts) */
  meter?: TokenMeter;
  /** 这次请求的上下文构成 (context 事件) */
  context?: AgentContextInfo;
  /** 上下文占用的采样 (usage 的 contextTokens 与压缩), 上下文检视器的 "演变" 用 */
  contextSamples?: readonly ContextSample[];
  error?: string;
}
