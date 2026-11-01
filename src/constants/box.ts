/**
 * 布局原语 (src/box/) 的统一档位: 间距, 内容最大宽度, 自适应列最小宽度, 分区纵向留白.
 * 所有 box 组件只从这里取档, 不各写一套; 类名写全字面量, Tailwind 才扫得到.
 */

/**
 * 间距档: Stack / Grid / AutoGrid / Bento 的 gap 共用这一套, 节奏按 4px 基数递增.
 *
 * .agents/notes/implemented/feature/2026-11-01-layout-box-primitives.md
 */
export const BOX_GAP = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
  "2xl": "gap-12",
} as const;

/** 间距档名. */
export type BoxGap = keyof typeof BOX_GAP;

/** 分区纵向留白档: Section 的 py, 与间距档同名同序但取更大的一阶. */
export const BOX_PAD_Y = {
  none: "py-0",
  xs: "py-4",
  sm: "py-6",
  md: "py-10",
  lg: "py-16",
  xl: "py-24",
  "2xl": "py-32",
} as const satisfies Record<BoxGap, string>;

/** 容器水平内边距 (随断点放宽). */
export const BOX_GUTTER = "px-4 sm:px-6 lg:px-8";

/** AutoGrid 单列最小宽度档 (写进 --box-min, 由 minmax 消费). */
export const BOX_MIN_COL = {
  xs: "8rem",
  sm: "12rem",
  md: "16rem",
  lg: "20rem",
  xl: "24rem",
} as const;

/** 单列最小宽度档名. */
export type BoxMinCol = keyof typeof BOX_MIN_COL;

/** Bento 行高档 (写进 --bento-row). */
export const BENTO_ROW = {
  sm: "8rem",
  md: "11rem",
  lg: "14rem",
} as const;

/** Bento 行高档名. */
export type BentoRow = keyof typeof BENTO_ROW;

/** Stack 的排列方向取值 (cva 变体名与 data-direction 共用). */
export const STACK_DIRECTION = {
  row: "row",
  column: "column",
  rowReverse: "rowReverse",
  columnReverse: "columnReverse",
} as const;

/** 交叉轴对齐 (Stack / Grid / Center 共用). */
export const BOX_ITEMS = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const;

/** 主轴分布 (Stack / Center 共用). */
export const BOX_JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
} as const;

/** 不启用某个响应式行为时的档名. */
export const BOX_NONE = "none";

/** 档名本身 (文档示例与默认值引用, 与 BOX_GAP 的键一一对应). */
export const BOX_STEP = {
  none: "none",
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
  "2xl": "2xl",
} as const satisfies Record<BoxGap, BoxGap>;

/** Center 的铺满方式取值. */
export const BOX_FILL = { none: "none", parent: "parent", screen: "screen" } as const;

/** Center 的显示类型 (块级 / 行内). */
export const BOX_DISPLAY = { block: "flex", inline: "inline-flex" } as const;

/** Section 标题层级. */
export const BOX_HEADING = { section: 2, subsection: 3 } as const;

/** box 组件与文档页复用的类名. */
export const BOX_CLASS = {
  fullWidth: "w-full",
  mutedText: "text-sm text-muted-foreground",
} as const;

/** 文档页 (docs/src/pages/box/) 演示用的取值. 库本身不引用. */
export const BOX_DOC = {
  cols: 3,
  splitId: "docs-box-demo",
  /** Bento 演示: 宽磁贴, 高磁贴的跨度与全宽档. */
  wide: 2,
  tall: 2,
  full: "full",
  /** 迷你柱状图的柱高 (百分比). */
  bars: [40, 65, 30, 80, 55, 90, 70],
  /** 选中结果的播报方式. */
  live: "polite",
} as const;

/** 文档页属性表的一行 (与 DocKit 的 PropsTable 同形). */
interface BoxPropRow {
  readonly name: string;
  readonly type: string;
  readonly default?: string;
  readonly desc: string;
}

/** BoxPage 的属性表. */
export const BOX_PAGE_PROPS: ReadonlyArray<BoxPropRow> = [
  { name: "gap", type: '"none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"', default: '"md"', desc: "Stack / Grid / AutoGrid / Bento 共用的间距档." },
  { name: "align / justify", type: "start | center | end | ...", desc: "Stack 的交叉轴对齐与主轴分布." },
  { name: "divided / stackBelow", type: 'boolean / "sm" | "md" | "lg"', desc: "1px 分隔线; 断点以下折成竖排." },
  { name: "cols", type: "number | { base, sm, md, lg }", default: "{ base: 1, md: 2 }", desc: "Grid 每个断点的列数." },
  { name: "min / fit", type: "BoxMinCol | CSS 长度 / boolean", default: '"md" / false', desc: "AutoGrid 单列最小宽度; fit 时少量子项拉伸撑满." },
  { name: "size / maxWidth", type: '"prose" | "sm" | "md" | "lg" | "xl" | "full"', default: '"lg"', desc: "Container / Section / Center 共用的宽度档." },
  { name: "autoSaveId / storage", type: "string / LayoutStorage", desc: "SplitView 持久化键与存储实现, 默认 localStorage." },
];

/** BentoPage 的属性表. */
export const BENTO_PAGE_PROPS: ReadonlyArray<BoxPropRow> = [
  { name: "Bento.cols", type: "number", default: "4", desc: "lg 断点起的列数." },
  { name: "Bento.rowHeight", type: '"sm" | "md" | "lg"', default: '"md"', desc: "行高档 (minmax 的下限)." },
  { name: "Bento.gap", type: "BoxGap", default: '"md"', desc: "与 Stack / Grid 同一套间距档." },
  { name: "colSpan", type: '1 | 2 | 3 | 4 | "full"', default: "1", desc: "lg 起的列跨度; sm 时最多 2, 手机单列." },
  { name: "rowSpan", type: "1 | 2 | 3", default: "1", desc: "sm 起的行跨度." },
  { name: "surface", type: '"card" | "muted" | "outline" | "plain"', default: '"card"', desc: "磁贴的面. 只用语义色与 1px 边." },
  { name: "href / onSelect", type: "string / () => void", desc: "整块可点. 链接或按钮热区, 二选一." },
  { name: "icon / title / description / footer", type: "ReactNode", desc: "内置槽位; children 渲染在上方的示意区." },
];

/** 数字原始值判定 (typeof 收窄必须是字面量比较, 只留这一份). */
export const isNumber = (value: unknown): value is number => typeof value === "number";

/** 默认档位. */
export const BOX_DEFAULT = {
  gap: "md",
  width: "lg",
  pad: "lg",
  minCol: "md",
  bentoCols: 4,
  bentoRow: "md",
  gridCols: { base: 1, md: 2 },
} as const;

/** SplitView 的持久化键前缀, 默认首栏百分比与两栏的 id 后缀. */
export const SPLIT_VIEW = {
  storagePrefix: "hx-split:",
  defaultStart: 30,
  minStart: 15,
  maxStart: 85,
  startSuffix: "-start",
  endSuffix: "-end",
  handleLabel: "调整分栏大小",
} as const;

/** box 组件共用的 data-slot 取值. */
export const BOX_SLOT = {
  stack: "stack",
  spacer: "spacer",
  grid: "grid",
  autoGrid: "auto-grid",
  container: "container",
  section: "section",
  center: "center",
  bento: "bento",
  bentoItem: "bento-item",
  splitView: "split-view",
} as const;

/** 可聚焦元素的统一焦点环 (语义 ring 色, 1px). */
export const BOX_FOCUS_RING =
  "outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background";
