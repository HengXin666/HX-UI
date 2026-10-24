/**
 * 流式 Markdown (agent/streaming-markdown.tsx) 用到的取值.
 */

/**
 * 根元素上的主题属性与取值 (tokens.css 用 data-mode 区分明暗).
 * 读不到时按暗色处理: 库的默认皮肤是暗色, 文档站首屏也是暗色.
 */
export const MODE_ATTRIBUTE = "data-mode";
export const MODE_LIGHT = "light";

/** 切段与拼段用的行分隔. */
export const MD_NEWLINE = "\n";

/** typeof 判断宿主全局 (document / MutationObserver) 是否存在时的比较值; SSR 下它们未声明, 只能用 typeof 探测. */
export const TYPEOF_UNDEFINED = "undefined";

/** 段落种类: 普通 Markdown 或围栏代码块. */
export const SEGMENT_KIND = {
  markdown: "markdown",
  code: "code",
} as const;

/** data-streaming 属性的两个取值. */
export const STREAMING_ATTR = {
  done: "false",
  live: "true",
} as const;
