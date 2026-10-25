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

/** 流式代码块重跑高亮的间隔 (ms): 围栏未闭合时按这个节奏刷新, 避免每个 token 跑一次 shiki. */
export const LIVE_HIGHLIGHT_MS = 300;

/** data-streaming 属性的两个取值. */
export const STREAMING_ATTR = {
  done: "false",
  live: "true",
} as const;

/**
 * 列表项里的围栏不切出去, 而是在原位换成这个自定义标签, 由 markstream 当作 list_item 的子节点渲染,
 * 再把标签映射回本库 CodeBlock. data-i 是围栏在本段 fences 表里的下标.
 */
export const NESTED_FENCE_TAG = "hx-fence";
export const NESTED_FENCE_INDEX_ATTR = "data-i";
