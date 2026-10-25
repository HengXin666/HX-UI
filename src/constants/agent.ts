/** agent 组件族共用的类名与文案, 放常量池避免同一字面量散落各处. */
export const AGENT_TEXT_MUTED = "text-[12px] text-muted-foreground";
export const AGENT_ROW = "flex items-center gap-2";
export const AGENT_AUTO_RIGHT = "ml-auto";
export const AGENT_STREAMING_LABEL = "正在生成";
export const AGENT_STREAM_LABEL = "流式输出";
export const AGENT_STREAM_STOP = "停止";

/** 换行符, 用字符码构造: 生成代码的链路会吞掉转义序列. */
export const AGENT_NEWLINE = String.fromCharCode(10);

/** 思考块与过程件的数值. */
export const AGENT_NUMBERS = {
  /** 实时摘要的最大字数, 再长就截断, 防止一行撑破布局. */
  headlineMax: 60,
  /** 计时刷新周期, 也是毫秒换算到秒的除数. */
  tickMs: 1000,
  /** 贴底跟随的容差 (px): 距底部小于它视为仍在底部. */
  stickPx: 24,
} as const;

/** 过程件的 data-slot 值, 样式与文档按它定位. */
/** 分层待办的节点状态: 比 TASK_STATUS 多一个 skipped (被跳过也算收尾). */
export const TODO_STATUS = {
  pending: "pending",
  running: "running",
  done: "done",
  error: "error",
  skipped: "skipped",
} as const;

export const AGENT_SLOT = {
  thinking: "thinking",
} as const;

/** 过程件 (思考, 子代理, 分层待办) 共用的类名与文案, 同一串类只在这里写一次. */
export const AGENT_CLS = {
	collapse: "overflow-hidden data-[state=closed]:animate-[hx-collapse-up_var(--duration-base)_var(--ease-in)] data-[state=open]:animate-[hx-collapse-down_var(--duration-base)_var(--ease-out)]",
	shimmer: "hx-shimmer",
	truncMuted: "min-w-0 flex-1 truncate text-muted-foreground",
	trunc: "min-w-0 flex-1 truncate",
	colGap: "flex flex-col gap-1.5",
	icon: "size-3.5 shrink-0",
	iconLg: "size-4 shrink-0",
	heading: "font-medium text-heading",
	medium: "font-medium",
	nums: "tabular-nums",
	colMin: "flex min-w-0 flex-col",
	col: "flex flex-col",
	shrink: "shrink-0",
	fg: "text-foreground",
	rotate: "rotate-90",
} as const;

export const AGENT_TOGGLE = { collapse: "收起", expand: "展开" } as const;
export const AGENT_UNIT = { second: "s", slash: "/" } as const;
/** 判断思考内容是否为纯文本; 写成类型守卫是为了让调用方保留类型收窄. */
export function isAgentText(value: unknown): value is string {
  return typeof value === "string";
}
export const AGENT_BUTTON_TYPE = "button";
