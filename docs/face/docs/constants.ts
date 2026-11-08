/**
 * 文档外壳 (组件页, 组件索引, 安装页) 共用的 id, 尺寸与类名串.
 * 同一串在多个文件里出现时收在这里, 栅格尺寸对齐 reactbits.dev 1440 宽实拍.
 */

/** 组件索引页的路由 id: #/components. */
export const INDEX_ID = "components";
/** 安装页的路由 id, 与 docs/src/nav.ts 的上手组第一项一致. */
export const INSTALL_ID = "install";

/** 外壳四周留白与两侧栏宽 (px). 中栏 = 视口 - 两栏 - 留白, 1440 宽时正好 756. */
export const SHELL = {
  gutter: 16,
  left: 256,
  right: 300,
} as const;

/** 预览台高度 (px), 对齐 reactbits 实拍: 文字类 356, 背景类 534. */
export const STAGE_PX = { text: 356, fill: 534 } as const;
/** 手机预览的宽度 (px). */
export const PHONE_PX = 390;

/** 圆角卡: 侧栏卡, Customize, Props, 依赖与右栏卡同一外观. */
export const CARD = "rounded-2xl border border-border bg-card";
/** 卡内再嵌一层的深色面板 (Customize 的控件网格, Props 的表格). */
export const INSET = "m-1.5 rounded-xl border border-border/60 bg-background/60";
/** 工具条上的描边小按钮组. */
export const TOOL_GROUP = "flex h-9 items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5";
/** 工具条里的单个图标按钮. */
export const TOOL_BTN =
  "grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground";
/** 区段标题 (h2) 与说明. */
export const SECTION_TITLE = "scroll-mt-24 text-[15px] font-semibold tracking-tight text-foreground";
export const SECTION_DESC = "mt-1 text-[13px] text-muted-foreground";
/** 等宽小字. */
export const MONO = "font-mono text-[12px]";
/** 图标的公共尺寸类. */
export const ICON_SM = "size-4 shrink-0 bg-current";
export const ICON_XS = "size-3.5 shrink-0 bg-current";

/** 用到的图标 (都在 @iconify-json/solar 里). */
export const ICON = {
  all: "icon-[solar--widget-linear]",
  text: "icon-[solar--text-linear]",
  background: "icon-[solar--gallery-linear]",
  effect: "icon-[solar--magic-stick-3-linear]",
  component: "icon-[solar--cursor-square-linear]",
  block: "icon-[solar--layers-linear]",
  search: "icon-[solar--magnifier-linear]",
  copy: "icon-[solar--copy-linear]",
  desktop: "icon-[solar--monitor-linear]",
  phone: "icon-[solar--smartphone-linear]",
  replay: "icon-[solar--refresh-linear]",
  eye: "icon-[solar--eye-linear]",
  code: "icon-[solar--code-linear]",
  out: "icon-[solar--arrow-right-up-linear]",
  down: "icon-[solar--alt-arrow-down-linear]",
  prev: "icon-[solar--arrow-left-linear]",
  next: "icon-[solar--arrow-right-linear]",
  link: "icon-[solar--link-linear]",
  doc: "icon-[solar--document-text-linear]",
  grid: "icon-[solar--widget-4-linear]",
} as const;

/** 复制成功的提示文案. */
export const COPIED = "已复制";
/** 包名, 安装命令与 import 语句里都用它. */
export const PKG = "@hx/ui";
/** 仓库源码的分支, 拼 GitHub 源码链接. */
export const SOURCE_BRANCH = "main";
