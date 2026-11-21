/**
 * sections 下电商区块的类名, 文案与节奏常量.
 */

/** ReviewBoard 的类名. 颜色只用语义 token, 线条 1px. */
export const REVIEW_CLASS = {
  board: "grid items-start gap-10 @3xl:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]",
  side: "flex flex-col gap-5 @3xl:sticky @3xl:top-(--sticky-offset,calc(var(--spacing)*24))",
  bars: "flex flex-col gap-1.5",
  bar: "group grid grid-cols-[2.5rem_minmax(0,1fr)_3rem] items-center gap-3 rounded-(--radius-md) px-2 py-1 text-sm text-muted-foreground hover:bg-muted aria-pressed:bg-muted aria-pressed:text-foreground outline-none focus-visible:outline-1 focus-visible:outline-ring transition-[background-color,color] duration-(--duration-fast) ease-out motion-reduce:transition-none",
  track: "h-1.5 overflow-hidden rounded-full bg-muted-foreground/15",
  fill: "block h-full origin-left rounded-full bg-foreground transition-[transform] duration-(--duration-slow) ease-out motion-reduce:transition-none rtl:origin-right",
  count: "text-end tabular-nums",
  list: "flex flex-col divide-y divide-border",
  item: "flex flex-col gap-2 py-5 first:pt-0",
  meta: "flex flex-wrap items-baseline gap-x-3 text-sm text-muted-foreground",
  author: "font-medium text-foreground",
  stars: "tabular-nums text-foreground",
  body: "text-pretty text-foreground",
  clear: "self-start text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground",
  empty: "py-5 text-sm text-muted-foreground",
} as const;

/** ReviewBoard 的默认文案 (zh-CN). */
export const REVIEW_TEXT = {
  filter: "按星级筛选",
  star: "星",
  clear: "显示全部评价",
  empty: "这个星级还没有评价",
  showing: "条",
} as const;

/** 星级条入场: 发牌式, 间隔从 70ms 收紧到 30ms. */
export const REVIEW_DEAL = { firstMs: 70, lastMs: 30 } as const;

/** 列表一次显示的评价条数. */
export const REVIEW_PAGE = 6;

/** BuyBar 的类名: 贴底, 只动 transform 进出; 窄屏只留价格与按钮. */
export const BUYBAR_CLASS = {
  bar: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-transform duration-(--duration-slow) ease-out motion-reduce:transition-none data-[shown=false]:translate-y-full",
  inner: "mx-auto flex max-w-(--container-6xl,72rem) items-center gap-4 px-4 py-3",
  thumb: "hidden size-12 shrink-0 rounded-(--radius-md) object-cover @md:block sm:block",
  text: "hidden min-w-0 flex-1 flex-col sm:flex",
  title: "truncate text-sm font-medium text-foreground",
  meta: "truncate text-xs text-muted-foreground",
  price: "ms-auto shrink-0 text-base font-semibold tabular-nums text-foreground sm:ms-0",
  cta: "shrink-0 rounded-(--radius-md) bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
} as const;

/** BuyBar 的默认文案. */
export const BUYBAR_TEXT = {
  region: "快捷购买",
  choose: "选择",
  soldOut: "已售罄",
  from: "起",
} as const;

/** ShotGallery 的类名: 主图叠放, 切换只动 opacity 与 transform. */
export const GALLERY_CLASS = {
  root: "flex flex-col gap-3",
  stage: "relative aspect-square overflow-hidden rounded-(--radius-lg) bg-muted outline-none focus-visible:outline-1 focus-visible:outline-ring",
  slide: "absolute inset-0 size-full object-cover transition-[opacity,transform] ease-out motion-reduce:transition-none",
  thumbs: "flex gap-2 overflow-x-auto",
  thumb: "size-16 shrink-0 overflow-hidden rounded-(--radius-md) border border-transparent opacity-60 outline-none transition-opacity hover:opacity-100 aria-selected:border-foreground aria-selected:opacity-100 focus-visible:outline-1 focus-visible:outline-ring motion-reduce:transition-none",
  thumbImg: "size-full object-cover",
  counter: "absolute bottom-3 end-3 rounded-full bg-background/80 px-2.5 py-1 text-xs tabular-nums text-foreground",
} as const;

/** ShotGallery 的默认文案. */
export const GALLERY_TEXT = {
  label: "商品图片",
  thumbs: "选择图片",
  of: "/",
} as const;

/**
 * 画廊镜头: 进场图从 scale 起推到 1 (推镜), 出场图略放大并淡出; 方向键切换时按前后方向带少量横移.
 * 数值偏小是有意的: 商品图要看清, 动作只交代 "换了一张".
 */
export const GALLERY_SHOT = {
  pushIn: { from: 1.04, to: 1 },
  out: 1.02,
  driftPct: 3,
  ms: 420,
} as const;
