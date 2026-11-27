/**
 * @hx/ui/agent: Agent 界面拓展包 (不进根入口).
 * 样式: Tailwind v4 使用方引 "@hx/ui/agent.css" (排在 tailwind.css 之后); 不用 Tailwind 的引 "@hx/ui/agent/styles.css" (排在 styles.css 之后).
 * 可选能力单独入口: "@hx/ui/agent/mermaid" (需装 mermaid), "@hx/ui/agent/math" (需装 @streamdown/math katex).
 */
// 流式 Markdown 与代码块
export { Markdown, type MarkdownProps } from "./markdown/markdown";
export type { FenceRenderer, FenceRendererProps, FenceRenderers } from "./markdown/context";
export { parseFence, splitInfo, normalizeLang, LANG_ALIAS, type FenceMeta } from "./markdown/fence";
export { CodeBlock, type CodeBlockProps, type CodeTheme } from "./code/code-block";
export { highlight, preloadHighlighter, ONE_DARK, ONE_AUTO, type CodeThemePair, type HighlightResult } from "./code/highlight";
export { SvgFence } from "./fences/svg";
export { HtmlFence } from "./fences/html";
export { DiagramFrame, type DiagramFrameProps } from "./parts/diagram-frame";

// 过程: 思考, 工具调用, 活动分组
export { Reasoning, type ReasoningProps } from "./reasoning";
export { ToolCall, type ToolCallProps } from "./tool/tool-call";
export { DiffView, DiffStat } from "./tool/diff-view";
export { TerminalOutput, type TerminalOutputProps } from "./tool/terminal-output";
export {
  defaultToolViews,
  resolveToolView,
  terminalView,
  readView,
  writeView,
  editView,
  searchView,
  webFetchView,
  webSearchView,
  imageView,
  todoView,
  questionView,
  subagentView,
  genericView,
  TodoList,
  ApprovalBar,
  PathLink,
  type TodoItem,
  type TodoStatus,
  type QuestionItem,
  type QuestionOption,
} from "./tool/views";
export type { ToolView, ToolViews, ToolViewProps, AgentActions, ActivityKind, ActivityMode } from "./tool/context";
export { AgentProvider, AgentParts, ActivityGroup, Notice, type AgentProviderProps, type AgentPartsProps, type ActivityGroupProps } from "./agent-parts";
export { Disclosure, StatusPill, type DisclosureProps } from "./parts/disclosure";

// 会话
export { Conversation, useStickToBottom, type ConversationProps } from "./conversation";
export { MessageList, UserMessage, AssistantMessage, type MessageListProps, type AssistantMessageProps, type UserMessageProps } from "./message";
export { PromptInput, type PromptInputProps, type PromptSuggestion } from "./prompt-input";
export { WorkingIndicator, ContextMeter, UsageSummary, TurnDuration } from "./status";

// 数据层
export type { AgentMessage, AgentPart, ToolCallData, ToolStatus, AgentUsage, MessageStatus, NoticeKind } from "./model/types";
export { reduceAgentEvent, reduceAgentEvents, emptyAgentState, type AgentEvent, type AgentState } from "./model/events";
export { useAgentStream, type AgentStream } from "./model/use-agent-stream";
export { parsePartialJson, parsePartialArgs } from "./model/partial-json";
export { summarizeActivity } from "./model/summary";
export { segmentParts, type Segment } from "./model/group";
export { fromAiSdkMessages, fromAiSdkMessage, type UIMessageLike } from "./adapters/ai-sdk";

// 小工具
export { useElapsed } from "./parts/elapsed";
export { formatDuration, formatBytes, formatTokens } from "./parts/format";
export { textOfParts } from "./model/text";
export { parseAnsi, stripAnsi, type AnsiSpan } from "./parts/ansi";
export { diffLines, parseUnifiedDiff, withContext, countDiff, type DiffRow, type DiffFile } from "./parts/diff";
export { CopyIconButton, IconButton, useCopy } from "./parts/copy";
