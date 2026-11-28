/**
 * 多 Agent 编排视图共用的常量 (纯数据, 无 "use client", 服务端安全).
 * 颜色一律是语义令牌 (CSS 变量), 不写色值.
 */
import type { AgentKind, AgentLink, AgentRunStatus } from "../model/agents";

/** 语义令牌 */
export const TOKEN = {
  fg: "var(--foreground)",
  muted: "var(--muted-foreground)",
  border: "var(--border)",
  card: "var(--card)",
  bg: "var(--background)",
  brand: "var(--brand)",
  brandSoft: "var(--brand-soft)",
  info: "var(--info)",
  success: "var(--success)",
  warning: "var(--warning)",
  destructive: "var(--destructive)",
} as const;

export type AgentTone = "brand" | "warning" | "success" | "destructive" | "muted";

export const TONE_COLOR: Record<AgentTone, string> = {
  brand: TOKEN.brand,
  warning: TOKEN.warning,
  success: TOKEN.success,
  destructive: TOKEN.destructive,
  muted: TOKEN.muted,
};

/** Tailwind 背景类 (状态点, 与 Badge 的 dot 同一套) */
export const TONE_BG: Record<AgentTone, string> = {
  brand: "bg-brand",
  warning: "bg-warning",
  success: "bg-success",
  destructive: "bg-destructive",
  muted: "bg-muted-foreground/60",
};

/** Tailwind 文字类 (状态文字) */
export const TONE_TEXT: Record<AgentTone, string> = {
  brand: "text-brand",
  warning: "text-warning",
  success: "text-success",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

export const STATUS_META: Record<AgentRunStatus, { label: string; tone: AgentTone }> = {
  queued: { label: "排队", tone: "muted" },
  running: { label: "运行中", tone: "brand" },
  "awaiting-approval": { label: "等待批准", tone: "warning" },
  "awaiting-input": { label: "等待回答", tone: "warning" },
  done: { label: "完成", tone: "success" },
  error: { label: "失败", tone: "destructive" },
  interrupted: { label: "中断", tone: "muted" },
};

export const KIND_LABEL: Record<AgentKind, string> = {
  subagent: "子 Agent",
  command: "命令",
  monitor: "监视",
  background_task: "后台任务",
};

/** 消息 / 结果 / 交接的光点颜色: 都是强调色 (只在 "活跃" 的一瞬出现), 结果用成功色 */
export const LINK_COLOR: Record<AgentLink["kind"], string> = {
  message: TOKEN.brand,
  result: TOKEN.success,
  handoff: TOKEN.brand,
};

export type OrchestraView = "graph" | "lanes" | "cards";

export const ORCHESTRA_VIEWS: readonly { value: OrchestraView; label: string }[] = [
  { value: "graph", label: "关系图" },
  { value: "lanes", label: "泳道" },
  { value: "cards", label: "卡片墙" },
];

/** 图视图的尺寸 (px). 节点是 HTML 小卡片 (与 Card 同一套圆角 / 边框 / 字号), 连线是底下一层 SVG */
export const GRAPH = { nodeW: 184, nodeH: 52, colGap: 44, rowGap: 10, pad: 4, radius: 8 } as const;

/** 泳道视图的尺寸; 标签列是 HTML, 时间轴是 SVG */
export const LANES = { labelW: 152, laneH: 36, barH: 10, toolH: 4, axisH: 22, pad: 8, minWidth: 520 } as const;

/** 消息光点沿边跑一趟的时长 / 目标节点闪一下的时长 (毫秒) */
export const PULSE_MS = 900;
export const FLASH_MS = 700;

/** 线宽: 只用 1px */
export const STROKE = 1;
/** 虚线: 交接边与等待段 */
export const DASH = "4 3";
