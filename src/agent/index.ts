/**
 * agent/ 面向 AI 与 Agent 交互的组件: 工具调用卡, 流式文本, 用量计量, 变更对比.
 * 与 chat/ 的分工: chat/ 是对话外壳 (消息, 气泡, 滚动), agent/ 是过程可视化与操作确认.
 */
export { StreamingText, type StreamingTextProps } from "./streaming-text";
export { ToolCallCard, type ToolCallCardProps, type ToolCallStatus } from "./tool-call-card";
export { DiffView, UsageMeter, type DiffLine, type DiffLineType, type DiffViewProps, type UsageMeterProps } from "./usage-meter";
