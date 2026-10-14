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
} as const;
