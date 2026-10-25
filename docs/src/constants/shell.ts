import { DOC, DOC_SAMPLE } from "@hx/ui";

/**
 * 文档站外壳 (侧栏, 顶栏, 品牌标, 模板页) 跨文件复用的取值.
 * 原始字面量登记在 src/constants/docs.ts (PROJECT-CONST-DUP 认可的常量目录), 这里只按用途重新命名.
 */

/** 品牌标的边长: 默认, 侧栏标题, 顶栏. */
export const BRAND_LOGO_SIZE = {
  base: DOC_SAMPLE.logoSize,
  sidebar: DOC_SAMPLE.logoSidebar,
  topBar: DOC_SAMPLE.logoTopBar,
} as const;

/** 站外链接: 新标签页打开且不带 referrer. */
export const EXTERNAL_LINK = {
  target: DOC.newTab,
  rel: DOC.noReferrer,
} as const;

/** 装饰性 svg 不进入 Tab 序列 (focusable 属性取字符串). */
export const SVG_FOCUSABLE_OFF = DOC.focusableOff;

/** 外壳排版里复用的类名. */
export const SHELL_CLASSES = {
  shrink: DOC.shrink,
  grow: DOC.grow,
  stackSnug: DOC.stackSnug,
} as const;

/** 行内文本之间的单个空格. */
export const INLINE_SPACE = DOC.space;
