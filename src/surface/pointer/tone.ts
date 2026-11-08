// 行为规格参照 docs/research/catalog/animations.md 的 Crosshair, GlareHover, TargetCursor 条目 (颜色只走语义 token), 实现为 HX 自有.
/**
 * surface 动画件的色调: 组件只收色调名, DOM 件挂 text-* 语义类用 currentColor, 渐变用 CSS 变量.
 * 画布与着色器件改走 backdrop 内核的 colors (token 名在宿主作用域解析), 不经这里.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-pointer.md
 */

export const TONE_CLASS = {
  primary: "text-primary",
  foreground: "text-foreground",
  muted: "text-muted-foreground",
  link: "text-link",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  done: "text-done",
  background: "text-background",
} as const;

export type SurfaceTone = keyof typeof TONE_CLASS;

/** 色调对应的 token 名, 交给 backdrop 内核的 colors 解析. */
export const TONE_TOKEN: Record<SurfaceTone, string> = {
  primary: "primary",
  foreground: "foreground",
  muted: "muted-foreground",
  link: "link",
  success: "success",
  warning: "warning",
  danger: "danger",
  done: "done",
  background: "background",
};
