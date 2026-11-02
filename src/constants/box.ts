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
  gridItem: "grid-item",
  containerContent: "container-content",
  sectionMedia: "section-media",
  sectionHeader: "section-header",
  sectionEyebrow: "section-eyebrow",
  sectionTitle: "section-title",
  sectionDescription: "section-description",
  sectionActions: "section-actions",
} as const;

/** 可聚焦元素的统一焦点环 (语义 ring 色, 1px). */
export const BOX_FOCUS_RING =
  "outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background";

/* ── V0-04 容器与栅格扩展 ─────────────────────────────────────────────── */

/** 契约第 4 节的 classNames 插槽: 每个 slot 一段类名, root 等价于 className. */
export type BoxSlotClassNames<S extends string> = Partial<Record<S, string>>;

/**
 * 宽屏档 (1280 / 1440 / 1536): 只引用 tokens 的 --container-content / wide / max (V0-01 落地),
 * 方括号里的回退值仅在 token 尚未定义时生效.
 */
export const BOX_WIDE_WIDTH = {
  content: "max-w-[var(--container-content,80rem)]",
  wide: "max-w-[var(--container-wide,90rem)]",
  max: "max-w-[var(--container-max,96rem)]",
} as const;

/** Container 的出血方式: none 正常限宽; full 外层铺满父级, 内容回中; breakout 冲出父级限宽直到视口两侧. */
export const BOX_BLEED = { none: "none", full: "full", breakout: "breakout" } as const;

/** 出血外层的类名. breakout 用负外边距抵消父容器的限宽 (50% - 50vw), 需父级未开 overflow 裁切. */
export const BOX_BLEED_CLASS = {
  none: "",
  full: "w-full min-w-0",
  breakout: "relative w-screen max-w-none mx-[calc(50%-50vw)]",
} as const satisfies Record<keyof typeof BOX_BLEED, string>;

/** Section 纵向节奏档: 读 tokens 的 --section-pad-*, 给了 rhythm 即覆盖 pad (pad 原档位与默认值不变). */
export const SECTION_RHYTHM = {
  sm: "py-[var(--section-pad-sm,2.5rem)]",
  md: "py-[var(--section-pad-md,4rem)]",
  lg: "py-[var(--section-pad-lg,6rem)]",
  xl: "py-[var(--section-pad-xl,8rem)]",
} as const;

/** 节奏档名. */
export type SectionRhythm = keyof typeof SECTION_RHYTHM;

/** Section 底色档. plain / muted / card 与旧版逐字一致, 其余为新增; 只用语义 token. */
export const SECTION_TONE = {
  plain: "",
  muted: "bg-muted/40",
  card: "bg-card",
  inverted: "bg-foreground text-background",
  brand: "bg-primary text-primary-foreground",
  image: "relative isolate overflow-hidden text-foreground",
} as const;

/** 底色档名. */
export type SectionTone = keyof typeof SECTION_TONE;

/** 深底档 (文字取 currentColor, 不再用 text-primary / text-foreground). */
export const SECTION_ON_COLOR: ReadonlyArray<SectionTone> = ["inverted", "brand"];

/** Section 标题尺度档. md 即旧版写死的 text-xl, 是默认值. */
export const SECTION_TITLE_SIZE = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-3xl",
  display: "text-4xl text-balance sm:text-5xl lg:text-6xl",
} as const;

/** 标题尺度档名. */
export type SectionTitleSize = keyof typeof SECTION_TITLE_SIZE;

/** Section 标题区对齐. */
export const SECTION_ALIGN = { left: "left", center: "center" } as const;

/** 标题区各部件在两种对齐下的类名. left 与旧版逐字一致. */
export const SECTION_HEADER_CLASS = {
  left: { header: "mb-8 flex flex-wrap items-end justify-between gap-4", text: "flex min-w-0 flex-col gap-1", description: "" },
  center: { header: "mb-8 flex flex-col items-center gap-4 text-center", text: "flex min-w-0 flex-col items-center gap-1", description: "mx-auto text-balance" },
} as const satisfies Record<keyof typeof SECTION_ALIGN, Record<"header" | "text" | "description", string>>;

/** 标题区文字类名. base 与旧版逐字一致, onColor 用于深底档. */
export const SECTION_TEXT_CLASS = {
  eyebrow: "text-xs font-medium uppercase tracking-wide",
  eyebrowTone: "text-primary",
  title: "font-semibold tracking-tight",
  titleTone: "text-foreground",
  onColor: "text-current",
  onColorMuted: "text-current opacity-80",
  actions: "flex shrink-0 items-center gap-2",
  media: "absolute inset-0 -z-10 [&>img]:size-full [&>img]:object-cover",
  scrim: "after:absolute after:inset-0 after:bg-background/60 after:content-['']",
} as const;

/** 12 列栅格的列数. */
export const GRID_COLUMNS = 12;

/** 栅格断点 (base 不带前缀). Grid 的列数与 GridItem 的 span / start 共用. */
export const GRID_BREAKPOINTS = ["base", "sm", "md", "lg", "xl"] as const;

/** 断点名. */
export type GridBreakpoint = (typeof GRID_BREAKPOINTS)[number];

/** 某个数值按断点给出: 数字等于所有断点同值. */
export type GridResponsive = number | Partial<Record<GridBreakpoint, number>>;

/**
 * GridItem 的跨度 / 起点类名. 数值写进 CSS 变量 --gi-span(-bp) / --gi-start(-bp),
 * 类名是固定字面量, Tailwind 扫得到, 任意 1..12 都不必枚举 48 个类.
 */
export const GRID_ITEM_CLASS = {
  span: {
    base: "col-span-(--gi-span)",
    sm: "sm:col-span-(--gi-span-sm)",
    md: "md:col-span-(--gi-span-md)",
    lg: "lg:col-span-(--gi-span-lg)",
    xl: "xl:col-span-(--gi-span-xl)",
  },
  start: {
    base: "col-start-(--gi-start)",
    sm: "sm:col-start-(--gi-start-sm)",
    md: "md:col-start-(--gi-start-md)",
    lg: "lg:col-start-(--gi-start-lg)",
    xl: "xl:col-start-(--gi-start-xl)",
  },
} as const satisfies Record<"span" | "start", Record<GridBreakpoint, string>>;

/** CSS 变量名前缀 (base 断点不带后缀). */
export const GRID_VAR = { cols: "--grid-cols", span: "--gi-span", start: "--gi-start" } as const;

/** 文档页 (docs/src/pages/box/LayoutGridDemo.tsx) 的不对称双栏与属性表. */
export const GRID_DOC = {
  split75: [7, 5],
  split84: [8, 4],
  centered: { span: 8, offset: 2 },
  ruler: 12,
} as const;

/** LayoutGridDemo 的属性表. */
export const GRID_PAGE_PROPS: ReadonlyArray<BoxPropRow> = [
  { name: "Container.size", type: '... | "content" | "wide" | "max"', default: '"lg"', desc: "新增宽屏档, 读 --container-content / wide / max (1280 / 1440 / 1536)." },
  { name: "Container.bleed", type: '"none" | "full" | "breakout"', default: '"none"', desc: "full: 外层铺满, 内层回中; breakout: 冲出父级限宽到视口两侧." },
  { name: "Container.classNames", type: "{ root, content }", desc: "出血时的外层与回中内容层." },
  { name: "Section.align", type: '"left" | "center"', default: '"left"', desc: "标题区对齐." },
  { name: "Section.titleSize", type: '"sm" | "md" | "lg" | "display"', default: '"md"', desc: "标题尺度档, md 即旧版 text-xl." },
  { name: "Section.rhythm", type: '"sm" | "md" | "lg" | "xl"', desc: "读 --section-pad-*; 给了即覆盖 pad (pad 原档位不变)." },
  { name: "Section.tone", type: '"plain" | "muted" | "card" | "inverted" | "brand" | "image"', default: '"plain"', desc: "image 配合 media 槽放背景图并自动加遮罩." },
  { name: "Grid.cols", type: "number | { base, sm, md, lg, xl }", desc: "cols={12} 即 12 列栅格." },
  { name: "GridItem.span / start / offset", type: "number | { base, sm, md, lg, xl }", desc: "跨列数, 起始列, 行首偏移 (offset = start - 1)." },
];
