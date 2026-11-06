/**
 * 文档站令牌页 (TokensPage) 的档位清单: 色阶, 控件尺寸, 密度, 栅格演示列数.
 * 这些名字必须与 src/tokens.css 里的变量后缀逐字对应, 页面按它们拼出 var(--...) 渲染;
 * 单独成文件而不进 index 桶: 只给文档站用, 不是库的公共符号.
 */

/** 原始色板的 11 阶, 对应 --palette-<hue>-<step>. */
export const TOKEN_PALETTE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** 控件高度五档, 对应 --control-h-<size>. */
export const TOKEN_CONTROL_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

/** 间距档数: --space-0 .. --space-24. */
export const TOKEN_SPACE_COUNT = 25;

/** data-density 的取值; default 不匹配任何覆盖规则, 即取根上的密度 1. */
export const TOKEN_DENSITY = {
  default: "default",
  compact: "compact",
  comfortable: "comfortable",
} as const;

export type TokenDensity = (typeof TOKEN_DENSITY)[keyof typeof TOKEN_DENSITY];

/** 页面栅格演示画几栏, 与 tokens.css 的 --grid-cols 默认值一致. */
export const TOKEN_GRID_DEMO_COLUMNS = 12;

/** 密度切换按钮的选中 / 未选中文字色. */
export const TOKEN_TOGGLE_CLASS = {
  active: "bg-accent text-foreground",
  idle: "text-muted-foreground",
} as const;
