/**
 * 文档站四个既有页 (Card / Button / Tabs / Tokens) 反复出现的取值, 按用途具名.
 * 跨页重复的值 (变体名, 对齐, 属性表的类型与默认值) 只登记一份; 库本身不引用这里.
 */

/** 属性表 "类型" 列的文字. */
export const API_TYPE_BOOLEAN = "boolean";
export const API_TYPE_STRING = "string";

/** 属性表 "默认值" 列的文字 (是字面写法, 不是布尔值本身). */
export const API_DEFAULT_FALSE = "false";
export const API_DEFAULT_TRUE = "true";
/** 默认值为字符串 "default" 时, 表格里带引号的写法. */
export const API_DEFAULT_QUOTED_DEFAULT = '"default"';

/** 属性表 "属性名" 列里跨页重复的名字. */
export const API_PROP = {
  variant: "variant",
  size: "size",
} as const;

/** 演示组件的 variant 值 (Button / Card / Badge / TabsList 共用). */
export const DEMO_VARIANT = {
  default: "default",
  primary: "primary",
  outline: "outline",
  secondary: "secondary",
  ghost: "ghost",
  destructive: "destructive",
  solid: "solid",
  muted: "muted",
  pill: "pill",
} as const;

/** 演示按钮的 size 值. */
export const DEMO_SIZES = {
  xs: "xs",
  sm: "sm",
  lg: "lg",
  icon: "icon",
  iconSm: "icon-sm",
} as const;

/** Preview 容器的子元素对齐方式. */
export const DEMO_ALIGN = {
  start: "start",
  center: "center",
  stretch: "stretch",
} as const;

/** 演示里复用的类名组合. */
export const DEMO_CLASS = {
  fullWidth: "w-full",
  foreground: "text-foreground",
  mutedText: "text-muted-foreground",
  /** 正文里的行内代码片. */
  inlineCode: "rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]",
  /** 变体对比用的小卡片. */
  cardSwatch: "w-44 p-3 text-[12.5px]",
  /** 演示里的次要说明文字. */
  caption: "text-[12.5px] text-muted-foreground",
  /** 标签页面板的正文. */
  tabPanel: "pt-3 text-[12.5px] text-muted-foreground",
  stackLoose: "flex flex-col gap-4",
  rows: "space-y-2",
  padLoose: "p-4",
  fontSize12: "text-[12px]",
} as const;

/** 图标按钮的无障碍名. */
export const DEMO_ARIA = {
  settings: "设置",
} as const;

/** Tabs 演示: 同一对象的三个视图. */
export const DEMO_TAB_VIEW = {
  overview: "overview",
  runs: "runs",
  config: "config",
} as const;

/** Tabs 演示: 只作占位的标签值. */
export const DEMO_TAB_KEY = {
  a: "a",
  b: "b",
  c: "c",
  first: "1",
} as const;

/** StatGrid 演示的列数. */
export const DEMO_STAT_COLUMNS = 3;

/** StatCard 演示的迷你折线数据 (按时间排列). */
export const DEMO_STAT_SERIES: Record<"active" | "latency" | "queue", number[]> = {
  active: [8, 9, 7, 11, 12, 10, 14],
  latency: [150, 160, 158, 171, 168, 182],
  queue: [37, 36, 38, 37],
};

/** StatCard 演示的趋势: 活跃会话传百分数简写, 延迟是越低越好的指标. */
export const DEMO_STAT_TREND: { active: number; latency: { value: number; better: "down"; label: string } } = {
  active: 12.4,
  latency: { value: 6.1, better: "down", label: "较上周" },
};

/** 原生 button 的 type. */
export const NATIVE_BUTTON_TYPE = "button";

/** 明暗模式: 写在 html 上的属性名与取值. */
export const THEME_MODE_ATTR = "data-mode";
export const THEME_MODE = {
  dark: "dark",
  light: "light",
} as const;
