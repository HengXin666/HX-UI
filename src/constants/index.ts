/**
 * Constant library of HX-UI: a string or number literal used three or more times in src or docs/src
 * is defined here once and imported, enforced by PROJECT-CONST-DUP (docs/reference/quality/rules.md).
 * 收窄不了的判据 (typeof 比较要字面量) 以 type guard 形式收在这里.
 */

/**
 * 字符串原始值判定. `typeof` 收窄必须是字面量比较, 所以字面量只留这一份.
 *
 * .agents/notes/implemented/architecture/2026-10-15-constant-library.md
 */
export const isString = (value: unknown): value is string => typeof value === "string";

/** 会话角色值 (ChatStream 的 role 与表格列的数据字段名共用). */
export const USER = "user";

/** 会话状态值 (失败态). */
export const ERROR = "error";

/** 时间戳补零的宽度与填充字符. */
export const PAD_WIDTH = 2;
export const PAD_CHAR = "0";

/** 会话流粘底判定的容差 (px): 末尾换行与内边距会让严格等于永远不成立. */
export const STICK_TOLERANCE = 48;

/** 复用三次以上的类名组合. */
export const CLASSES = {
  /** 可增长且可截断的列 (`min-w-0` 是 flex 子项允许收缩的前提). */
  grow: "min-w-0 flex-1",
  /** 次要元信息 (时间戳 / 计数). */
  meta: "text-[11px] text-muted-foreground",
  /** 纵向堆叠容器. */
  stack: "flex flex-col gap-2",
  /** 表单控件的禁用态: 不可点的指针 + 半透明. */
  disabled: "disabled:cursor-not-allowed disabled:opacity-50",
} as const;

/**
 * 语义状态文字色 (对应 tokens.css 的 --success / --warning / --danger).
 * 无后缀用于图标与圆点, Fg 后缀是深灰底上可读的正文色.
 */
export const TONE = {
  success: "text-success",
  warning: "text-warning",
  successFg: "text-success-fg",
  warningFg: "text-warning-fg",
  dangerFg: "text-danger-fg",
} as const;

/** 组件变体与尺寸的取值 (Button / Alert / 水波纹共用), as const 保留字面量类型供 cva 推断. */
export const VARIANT = {
  default: "default",
  primary: "primary",
  ghost: "ghost",
  link: "link",
  icon: "icon",
  iconSm: "icon-sm",
  sm: "sm",
  warning: "warning",
  danger: "danger",
} as const;

/** ARIA 角色与属性取值. */
export const ARIA = {
  alert: "alert",
  status: "status",
  page: "page",
  true: "true",
  hidden: "aria-hidden",
  disabled: "aria-disabled",
} as const;

/** 键盘事件的 key 值. */
export const KEY = {
  enter: "Enter",
  space: " ",
} as const;

/** 按钮的 type: 显式写 button, 放进 form 里点击不会触发提交. */
export const BUTTON_TYPE = "button";

/** 求中心点时的除数. */
export const HALF_DIVISOR = 2;

/**
 * 水波纹宿主属性的取值与波纹 span 的类名 (keyframes 在 motion.css).
 * on 是常规尺寸, icon 是图标尺寸 (更低的不透明度).
 */
export const RIPPLE = {
  on: "on",
  icon: "icon",
  className: "hx-ripple",
  /** 直径取宿主对角线的倍数: 2 倍保证从任意一点按下都能盖满宿主. */
  diameterFactor: 2,
} as const;

/**
 * 分页器页码序列的形状: 首页 + 末页 + 当前页 + 两个省略位共 5 个固定位,
 * 当前页两侧各 siblings 个; 省略位至少要省掉 2 页才出现.
 */
export const PAGINATION = {
  fixedSlots: 5,
  sides: 2,
  edgeSlots: 2,
  minGap: 2,
} as const;

export * from "./ui";
export * from "./docs";
export { AGENT_AUTO_RIGHT, AGENT_ROW, AGENT_STREAM_LABEL, AGENT_STREAM_STOP, AGENT_STREAMING_LABEL, AGENT_TEXT_MUTED } from "./agent";
