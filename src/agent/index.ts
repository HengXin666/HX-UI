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
export type { ToolView, ToolViews, ToolViewProps, AgentActions, ActivityKind, ActivityMode, PlanCallDisplay } from "./tool/context";
export { AgentProvider, AgentParts, ActivityGroup, Notice, type AgentProviderProps, type AgentPartsProps, type ActivityGroupProps } from "./agent-parts";
export { Disclosure, StatusPill, type DisclosureProps } from "./parts/disclosure";

// 会话: 消息列表 (含对话内的编排块), 输入框, 实时上下文 / 用量条, 轨迹视图, 子 Agent 只读轨迹
export { Conversation, useStickToBottom, type ConversationProps } from "./conversation";
export { MessageList, UserMessage, AssistantMessage, type MessageListProps, type AssistantMessageProps, type UserMessageProps } from "./message";
export { PromptInput, type PromptInputProps, type PromptSuggestion } from "./prompt-input";
export { AgentModelPicker, EffortControl, EffortSlider, EffortBars, type AgentModelPickerProps, type EffortControlProps, type EffortSliderProps } from "./model-picker";
export { AgentContextView, ContextBar, type AgentContextViewProps, type ContextBarProps } from "./context-view";
export { PlanTree, PlanCard, PlanPanel, PlanProgressBar, TodoCallCard, useSessionPlan, type PlanTreeProps, type PlanCardProps, type PlanPanelProps, type PlanPlacement } from "./plan";
export { WorkingIndicator, ContextMeter, UsageSummary, TurnDuration } from "./status";
export { SessionMeter, TurnUsage, MeterRing, ContextLeft, ComposerMeters, useSessionUsage, type SessionMeterProps, type ContextLeftProps, type ComposerMetersProps, type UseSessionUsageOptions } from "./meter";
export { EffortTrack, EffortBadge, EffortGlyph, type EffortTrackProps, type EffortBadgeProps } from "./effort-track";
export {
  ComposerModelMenu,
  ComposerSelect,
  ComposerActivity,
  ComposerSheet,
  type ComposerModelMenuProps,
  type ComposerSelectProps,
  type ComposerOption,
  type ComposerActivityProps,
  type ComposerSheetProps,
} from "./composer";
export { AgentTrajectory, type AgentTrajectoryProps } from "./trajectory";
export { AgentOrchestraBlock, OrchestraFrame, OrchestraDock, type AgentOrchestraBlockProps, type OrchestraFrameProps, type OrchestraDockProps, type OrchestraDockPosition } from "./orchestra/orchestra-block";
export { AgentThread, SubagentConversation, type AgentThreadProps, type SubagentConversationProps } from "./orchestra/agent-thread";
export { AgentSwitcher, type AgentSwitcherProps } from "./orchestra/agent-switcher";
export {
  AgentSessionProvider,
  useAgentSession,
  useSessionMessages,
  usePlanIndex,
  useOrchestraDock,
  type AgentSessionValue,
  type AgentSessionProviderProps,
  type DockedOrchestra,
  type OrchestraDockValue,
} from "./orchestra/session-context";

// 数据层
export type { AgentMessage, AgentPart, ToolCallData, ToolStatus, AgentUsage, MessageStatus, NoticeKind, TokenMeter, TokenSample, AgentRequestUsage, AgentContextInfo, ContextSource, ContextSample, CompactionInfo } from "./model/types";
export {
  RATE_WINDOW_MS,
  estimateTokens,
  bumpMeter,
  emptyMeter,
  tokenRate,
  messageTiming,
  cacheHitRate,
  contextRatio,
  sumUsage,
  requestUsage,
  addRequestUsage,
  sessionUsage,
  formatRate,
  formatPercent,
  formatCost,
  usageLabels,
  agentTokenRates,
  sumRates,
  MAIN_THREAD,
  type MessageTiming,
  type SessionUsage,
  type SessionUsageOptions,
  type LastRequestUsage,
  type UsageLabels,
} from "./model/usage";
export {
  TODO_TOOL_NAMES,
  isTodoCall,
  isClosedStatus,
  normalizePlanStatus,
  planSnapshotOf,
  planFromParts,
  planOf,
  planProgress,
  planStatus,
  flattenPlan,
  findPlanItem,
  describePlanStep,
  type Plan,
  type PlanItem,
  type PlanStep,
  type PlanStatus,
  type PlanProgress,
} from "./model/todos";
export { buildPlanIndex, isRepeatPlanCall, EMPTY_PLAN_INDEX, type PlanIndex } from "./model/plan-index";
export {
  EFFORT_ORDER,
  EFFORT_LABEL,
  EFFORT_HINT,
  effortsOf,
  nearestEffort,
  defaultEffortOf,
  findModel,
  modelName,
  resolveModelSelection,
  searchModels,
  stepEffort,
  effortKey,
  effortIndexAt,
  effortFractionAt,
  effortIntensity,
  effortLook,
  EFFORT_TONE_ORDER,
  EFFORT_GLYPH_BARS,
  type EffortIntensity,
  type EffortLook,
  type EffortTone,
  type ReasoningEffort,
  type AgentModelOption,
  type AgentClientOption,
  type AgentModelSelection,
} from "./model/models";
export {
  CONTEXT_CATEGORIES,
  CONTEXT_LABEL,
  COMPACT_RATIO,
  NEAR_RATIO,
  contextBreakdown,
  contextTimeline,
  contextEvents,
  contextSeries,
  type ContextSnapshot,
  type ContextSeriesCache,
  type ContextCategory,
  type ContextBreakdown,
  type ContextItem,
  type ContextPoint,
  type ContextEvent,
  type ContextEventKind,
  type ContextLevel,
  type ContextOptions,
} from "./model/context";
export { buildTrajectory, flattenRows, toolText, type TrajectoryRow, type TrajectoryTurn, type TrajectoryKind } from "./model/trajectory";
export { reduceAgentEvent, reduceAgentEvents, emptyAgentState, type AgentEvent, type AgentState } from "./model/events";
export { useAgentStream, type AgentStream } from "./model/use-agent-stream";
export { parsePartialJson, parsePartialArgs } from "./model/partial-json";
export { summarizeActivity, rankActivity, RUNNING_PHRASE, ANALYZING } from "./model/summary";
export { segmentParts, type Segment } from "./model/group";
export { fromAiSdkMessages, fromAiSdkMessage, agentEventsFromAiSdk, type UIMessageLike } from "./adapters/ai-sdk";

// 多 Agent 数据层: 父子树 + 选择器
export {
  reduceAgentTree,
  emptyAgentTree,
  isAgentTreeEvent,
  AGENT_DONE,
  AGENT_WAITING,
  agentRoots,
  childrenOf,
  descendantsOf,
  flattenAgentTree,
  countAgents,
  agentWaits,
  pendingAgents,
  linksOf,
  agentSpan,
  agentSegments,
  partsOfAgent,
  toolSpansOfAgent,
  latestOutput,
  isSubAgent,
  dispatchedAgents,
  pickSubtree,
  orchestraScope,
  threadMessages,
  pendingRequests,
  type AgentRequest,
  type AgentKind,
  type AgentRunStatus,
  type AgentNode,
  type AgentLink,
  type AgentTree,
  type AgentTreeEvent,
  type AgentSpawnEvent,
  type AgentStatusEvent,
  type AgentHandoffEvent,
  type AgentMessageEvent,
  type AgentStatusEntry,
  type AgentCounts,
  type AgentWait,
  type AgentSegment,
  type AgentSegmentKind,
  type AgentToolSpan,
  agentTail,
  toolLine,
  type AgentTail,
} from "./model/agents";

// 多 Agent 可视化: 关系图 / 泳道 / 卡片墙 (编排块内部用, 也可单独使用) + 独立容器
export { AgentOrchestra, type AgentOrchestraProps } from "./orchestra/agent-orchestra";
export { AgentGraph, type AgentGraphProps } from "./orchestra/agent-graph";
export { AgentSwimlanes, type AgentSwimlanesProps } from "./orchestra/agent-swimlanes";
export { AgentCardWall, type AgentCardWallProps } from "./orchestra/agent-card-wall";
export { OrchestraSummary, StatusDot as AgentStatusDot, AgentStatusBadge, TailText, type OrchestraSummaryProps, type TailTextProps } from "./orchestra/shared";
export { ORCHESTRA_VIEWS, STATUS_META as AGENT_STATUS_META, type OrchestraView } from "./orchestra/constants";
export { layoutAgentGraph, timeTicks, formatOffset, type GraphLayout, type GraphBox, type GraphEdge } from "./orchestra/layout";

// 小工具
export { useElapsed } from "./parts/elapsed";
export { formatDuration, formatBytes, formatTokens } from "./parts/format";
export { textOfParts } from "./model/text";
export { parseAnsi, stripAnsi, type AnsiSpan } from "./parts/ansi";
export { diffLines, parseUnifiedDiff, withContext, countDiff, type DiffRow, type DiffFile } from "./parts/diff";
export { CopyIconButton, IconButton, useCopy } from "./parts/copy";
