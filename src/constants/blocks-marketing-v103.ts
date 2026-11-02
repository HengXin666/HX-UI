/**
 * V1-03 营销区块 B (特性与数据) 的取值, 类名, data-slot 与纯函数. 区块只从这里取档, 不在组件里写字面量.
 * 类名写全字面量, Tailwind 才扫得到; 栅格一律用容器查询 (@container 由 BlockShell 内容层提供).
 */
import { MEDIA_KIND } from "./blocks";

/** FeatureGrid 外观: 卡片 (边框 + 底色) / 无边框. */
export const FEATURE_GRID_VARIANT = { card: "card", plain: "plain" } as const;

/** 列数档 -> 容器查询栅格类 (1 -> 2 -> n). */
export const FEATURE_GRID_COLS = {
  2: "@2xl:grid-cols-2",
  3: "@2xl:grid-cols-2 @4xl:grid-cols-3",
  4: "@2xl:grid-cols-2 @5xl:grid-cols-4",
} as const;

/** StatBand 外观: 横排分隔线 / 卡片. */
export const STAT_BAND_VARIANT = { inline: "inline", card: "card" } as const;

/** 指标个数 -> 栅格类 (4 -> 2 列, 小容器单列). */
export const STAT_BAND_COLS = {
  2: "@xl:grid-cols-2",
  3: "@xl:grid-cols-3",
  4: "@xl:grid-cols-2 @4xl:grid-cols-4",
} as const;

/** StatBand 指标个数上下限 (2 到 4). */
export const STAT_BAND_RANGE = { min: 2, max: 4 } as const;

/** FeatureAlternating 首段媒体所在侧, 之后逐段交替. */
export const MEDIA_SIDE = { start: "start", end: "end" } as const;

/** Showcase 外框. */
export const SHOWCASE_FRAME = { browser: "browser", none: "none" } as const;

/** BentoFeatures 行高档 (与 box/Bento 的 rowHeight 同名). */
export const BENTO_FEATURES_ROW = { sm: "sm", md: "md", lg: "lg" } as const;

/** Bento 格子跨度取值 (lg 起生效; 与 box/Bento 的 colSpan / rowSpan 一致). */
export const BENTO_COL_SPANS = [1, 2, 3, 4, "full"] as const;
export const BENTO_ROW_SPANS = [1, 2, 3] as const;

/** 默认档位. */
export const MV103_DEFAULT = {
  featureCols: 3,
  featureVariant: FEATURE_GRID_VARIANT.card,
  statVariant: STAT_BAND_VARIANT.inline,
  statFrom: 0,
  bentoCols: 3,
  bentoRow: BENTO_FEATURES_ROW.md,
  mediaRatio: 16 / 9,
  mediaSide: MEDIA_SIDE.start,
  frame: SHOWCASE_FRAME.browser,
  figurePrefix: "Fig",
  figureMajor: 0,
} as const;

/** data-slot 取值: root 即区块名, 子部件为 <区块>-<slot>. */
export const MV103_SLOT = {
  featureGrid: "feature-grid",
  featureGridList: "feature-grid-list",
  featureGridItem: "feature-grid-item",
  featureGridIcon: "feature-grid-icon",
  featureGridTitle: "feature-grid-title",
  featureGridBody: "feature-grid-body",
  featureAlt: "feature-alternating",
  featureAltItem: "feature-alternating-item",
  featureAltMedia: "feature-alternating-media",
  featureAltText: "feature-alternating-text",
  featureAltBullets: "feature-alternating-bullets",
  bento: "bento-features",
  bentoTile: "bento-features-tile",
  bentoMedia: "bento-features-media",
  bentoHover: "bento-features-hover-media",
  bentoText: "bento-features-text",
  stat: "stat-band",
  statList: "stat-band-list",
  statItem: "stat-band-item",
  statValue: "stat-band-value",
  statLabel: "stat-band-label",
  showcase: "showcase",
  showcaseTabs: "showcase-tabs",
  showcaseStage: "showcase-stage",
  showcaseFeatures: "showcase-features",
  figure: "figure-grid",
  figureList: "figure-grid-list",
  figureItem: "figure-grid-item",
  figureLabel: "figure-grid-label",
  figureMedia: "figure-grid-media",
} as const;

/** 区块内复用的类名组合 (颜色只取语义 token, 线宽 1px, 过渡列出具体属性). */
export const MV103_CLASS = {
  list: "grid grid-cols-1 gap-6",
  listTight: "grid grid-cols-1 gap-px",
  cardItem: "relative flex flex-col gap-3 rounded-(--radius-lg) border border-border bg-card p-6 text-card-foreground transition-[border-color] duration-(--duration-fast) hover:border-primary/40 focus-within:border-ring",
  plainItem: "relative flex flex-col gap-3",
  itemBody: "flex flex-col gap-3",
  icon: "inline-flex size-10 items-center justify-center rounded-(--radius-md) border border-border bg-muted text-primary [&_svg]:size-5",
  title: "text-lg font-semibold text-balance",
  body: "text-pretty text-base text-muted-foreground in-data-[block-tone=inverted]:text-background/70 in-data-[block-tone=brand]:text-primary-foreground/80",
  stretchedLink: "after:absolute after:inset-0 after:content-[''] focus-visible:outline-1 focus-visible:outline-ring focus-visible:outline-offset-2",
  itemFooter: "mt-auto pt-2",
  altStack: "flex flex-col gap-[var(--block-gap-lg,calc(var(--spacing)*20))]",
  altRow: "grid grid-cols-1 items-center gap-8 @3xl:grid-cols-2 @3xl:gap-16",
  altMediaEnd: "@3xl:order-last",
  altText: "flex flex-col items-start gap-4",
  altTitle: "text-[length:var(--fs-display-sm,var(--text-3xl))] font-semibold text-balance leading-[var(--lh-display,1.1)]",
  eyebrow: "text-sm font-medium tracking-wide text-primary",
  bullets: "flex flex-col gap-2",
  bullet: "flex items-start gap-2 text-base",
  bulletIcon: "mt-1 size-4 shrink-0 text-primary",
  mediaBox: "relative w-full overflow-hidden rounded-(--radius-lg) border border-border bg-muted",
  fullWidth: "w-full",
  bentoTile: "relative flex size-full flex-col",
  bentoTileBackground: "relative isolate flex size-full flex-col",
  bentoMedia: "relative min-h-0 flex-1 overflow-hidden",
  bentoBase: "transition-opacity duration-(--duration-normal,300ms) group-hover/bento:opacity-0 group-focus-within/bento:opacity-0",
  bentoHover: "absolute inset-0 opacity-0 transition-opacity duration-(--duration-normal,300ms) group-hover/bento:opacity-100 group-focus-within/bento:opacity-100",
  bentoBackground: "absolute inset-0 -z-10",
  bentoScrim: "absolute inset-0 -z-10 bg-gradient-to-t from-card via-card/70 to-transparent",
  bentoText: "relative flex flex-col gap-2 p-6",
  bentoTextOver: "relative mt-auto flex flex-col gap-2 p-6",
  statCard: "flex flex-col gap-2 rounded-(--radius-lg) border border-border bg-card p-6 text-card-foreground",
  statInline: "flex flex-col gap-2 border-s border-border ps-6",
  statValue: "flex items-baseline gap-1 font-semibold tabular-nums leading-none tracking-[var(--tracking-display,-0.02em)] text-[length:var(--fs-display-lg,var(--text-5xl))]",
  statAffix: "text-[length:var(--fs-display-sm,var(--text-3xl))] text-muted-foreground in-data-[block-tone=brand]:text-primary-foreground/80",
  statLabel: "text-base font-medium",
  statLink: "underline-offset-4 hover:underline focus-visible:outline-1 focus-visible:outline-ring focus-visible:outline-offset-2",
  showcaseStack: "flex flex-col gap-8",
  showcaseTabs: "flex flex-col items-center gap-6",
  showcaseCaption: "flex flex-col gap-1 text-center",
  showcaseFeatures: "grid grid-cols-1 gap-6 @2xl:grid-cols-2 @4xl:grid-cols-3",
  figureList: "grid grid-cols-1 border-y border-border @3xl:grid-cols-3 @3xl:divide-x @3xl:divide-border",
  figureItem: "flex flex-col gap-4 border-b border-border py-8 last:border-b-0 @3xl:border-b-0 @3xl:px-8 @3xl:first:ps-0 @3xl:last:pe-0",
  figureLabel: "font-mono text-xs uppercase tracking-wide text-muted-foreground",
  figureMedia: "relative overflow-hidden rounded-(--radius-md) text-muted-foreground",
} as const;

/** 比例档串 ("16/9") 的分隔符. */
export const RATIO_SEPARATOR = "/";

/** 媒体比例: 数字原样; "16/9" 这类档串折算; 缺省 16:9. 结果交给 media/Image 的 ratio. */
export function mediaRatioOf(ratio: string | number | undefined): number {
  if (typeof ratio === "number" && ratio > 0) return ratio;
  if (typeof ratio === "string") {
    const [w, h] = ratio.split(RATIO_SEPARATOR).map(Number);
    if (w > 0 && h > 0) return w / h;
  }
  return MV103_DEFAULT.mediaRatio;
}

/** 焦点 [x, y] (0 到 1) -> object-position. */
export function focalOf(focal: readonly [number, number] | undefined): string | undefined {
  if (!focal) return undefined;
  return `${focal[0] * 100}% ${focal[1] * 100}%`;
}

/** 媒体种类判定: 给了 node 即自定义节点; 否则按 kind, 缺省 image. */
export function mediaKindOf(media: { kind?: string; node?: unknown }): string {
  if (media.node !== undefined) return MEDIA_KIND.node;
  return media.kind ?? MEDIA_KIND.image;
}

/** 编号说明标签: Fig 0.1 / Fig 0.2 ... */
export function figureLabelOf(prefix: string, major: number, index: number): string {
  return `${prefix} ${major}.${index + 1}`;
}

/** 指标个数夹到 2..4, 作为 STAT_BAND_COLS 的键. */
export function statColsOf(count: number): keyof typeof STAT_BAND_COLS {
  return Math.min(STAT_BAND_RANGE.max, Math.max(STAT_BAND_RANGE.min, count)) as keyof typeof STAT_BAND_COLS;
}
