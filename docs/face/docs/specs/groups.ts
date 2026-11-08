/** 可调组件页的分类名, 左栏分类页签与索引页的分类下拉都读它. */
export const SPEC_GROUP = {
  text: "文字动效",
  background: "背景",
  effect: "效果",
} as const;

/** 动效件的运行时依赖 (@hx/ui 的 dependencies, 随包安装). */
export const MOTION_DEPS: readonly string[] = ["motion"];
