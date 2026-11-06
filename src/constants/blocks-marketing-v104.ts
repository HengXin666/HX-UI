/**
 * V1-04 营销区块 C (社证): Testimonials / CaseStudies / ChangelogList / TweetWall 的取值, 类名与默认档.
 * 区块只从这里取类名与档位, 组件里不写颜色 / 字号 / 间距字面量. 类名写全字面量, Tailwind 才扫得到.
 * 契约见 docs/reference/2026-ui-library-blocks-design.md 4.2; 公共类型在 src/blocks/_shared/types.ts.
 */

/* ---------- 形态 ---------- */

export const TESTIMONIALS_VARIANT = { cards: "cards", carousel: "carousel", marquee: "marquee" } as const;
export const CASE_STUDIES_VARIANT = { tabs: "tabs", accordion: "accordion" } as const;
export const CHANGELOG_VARIANT = { list: "list", cards: "cards" } as const;
export const CHANGELOG_GROUP = { none: "none", month: "month", version: "version" } as const;

/** 引言截断行数档 (false 为不截断). */
export const QUOTE_CLAMP_CLASS = {
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
  8: "line-clamp-8",
} as const;
export type QuoteClampLines = keyof typeof QUOTE_CLAMP_CLASS;

/** 网格列数档 (容器查询, 区块放进窄栏也正确). */
export const SOCIAL_COLS_CLASS = {
  1: "grid-cols-1",
  2: "grid-cols-1 @2xl:grid-cols-2",
  3: "grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-3",
  4: "grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-3 @6xl:grid-cols-4",
} as const;
export type SocialColumns = keyof typeof SOCIAL_COLS_CLASS;

/** 瀑布流列数档 (TweetWall). */
export const SOCIAL_MASONRY_CLASS = {
  2: "columns-1 @2xl:columns-2",
  3: "columns-1 @2xl:columns-2 @5xl:columns-3",
  4: "columns-1 @2xl:columns-2 @5xl:columns-3 @6xl:columns-4",
} as const;
export type SocialMasonryColumns = keyof typeof SOCIAL_MASONRY_CLASS;

/** 轮播每屏张数档. */
export const CAROUSEL_BASIS_CLASS = {
  1: "basis-full",
  2: "basis-full @2xl:basis-1/2",
  3: "basis-full @2xl:basis-1/2 @5xl:basis-1/3",
} as const;
export type CarouselPerView = keyof typeof CAROUSEL_BASIS_CLASS;

/** Badge.tone -> layout/Badge 的 variant. */
export const SOCIAL_BADGE_VARIANT = {
  neutral: "secondary",
  primary: "default",
  success: "success",
  warning: "warning",
  danger: "destructive",
  info: "outline",
} as const;

/* ---------- 默认档 ---------- */

export const SOCIAL_DEFAULT = {
  testimonialsVariant: "cards",
  testimonialsColumns: 3,
  clampLines: 6,
  ratingMax: 5,
  carouselPerView: 2,
  marqueeRows: 1,
  marqueeDuration: 60,
  caseVariant: "tabs",
  changelogVariant: "list",
  changelogGroup: "none",
  changelogColumns: 4,
  tweetColumns: 3,
  mediaRatio: 16 / 9,
  maxInitials: 2,
} as const;

/** 媒体比例串 "16/9" 的分隔符; 版本分组的正则 (前缀 + 主版本 + 次版本). */
export const RATIO_SEPARATOR = "/";
export const VERSION_GROUP_PATTERN = /^(\D*)(\d+)(?:\.(\d+))?/;
export const VERSION_JOIN = ".";
export const MONTH_KEY_PAD = 2;
export const DATE_INVALID_KEY = "invalid";
export const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Intl 日期格式: 条目日期与月分组标题. */
export const CHANGELOG_DATE_FORMAT: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
export const CHANGELOG_MONTH_FORMAT: Intl.DateTimeFormatOptions = { year: "numeric", month: "long" };

/* ---------- data-slot ---------- */

export const SOCIAL_SLOT = {
  testimonials: "testimonials",
  testimonialsList: "testimonials-list",
  testimonial: "testimonial",
  quote: "testimonial-quote",
  quoteToggle: "testimonial-quote-toggle",
  person: "testimonial-person",
  rating: "testimonial-rating",
  logo: "testimonial-logo",
  carousel: "testimonials-carousel",
  controls: "testimonials-controls",
  marquee: "testimonials-marquee",
  caseStudies: "case-studies",
  casePanel: "case-studies-panel",
  caseMetrics: "case-studies-metrics",
  caseProducts: "case-studies-products",
  changelog: "changelog-list",
  changelogGroup: "changelog-list-group",
  changelogEntry: "changelog-list-entry",
  changelogFooter: "changelog-list-footer",
  tweetWall: "tweet-wall",
  tweet: "tweet-wall-item",
  tweetToggle: "tweet-wall-toggle",
} as const;

/* ---------- 图标 (Iconify solar 集, 与 accordion / widgets 同源) ---------- */

export const SOCIAL_ICON = {
  previous: "icon-[solar--arrow-left-linear] size-4",
  next: "icon-[solar--arrow-right-linear] size-4",
  play: "icon-[solar--play-bold] size-4",
  pause: "icon-[solar--pause-bold] size-4",
} as const;

/* ---------- 类名 ---------- */

/** 公共零件: 卡片面, 人物行, 评分, logo, 媒体. */
export const SOCIAL_CLASS = {
  card: "flex h-full min-w-0 flex-col gap-4 rounded-(--card-radius) border border-(--border-subtle) bg-card p-6 text-card-foreground shadow-xs",
  cardTop: "flex min-w-0 items-center justify-between gap-3",
  quote: "min-w-0 text-pretty text-base leading-relaxed text-foreground [overflow-wrap:anywhere]",
  quoteLarge: "min-w-0 text-pretty text-lg leading-relaxed text-foreground [overflow-wrap:anywhere]",
  quoteWrap: "flex min-w-0 flex-1 flex-col items-start gap-1",
  quoteToggle: "h-auto px-0",
  person: "mt-auto flex min-w-0 items-center gap-3",
  personText: "flex min-w-0 flex-col",
  personName: "truncate text-sm font-semibold text-foreground",
  personLink: "truncate text-sm font-semibold text-foreground underline-offset-4 hover:underline",
  personMeta: "truncate text-sm text-muted-foreground",
  avatar: "size-10 shrink-0",
  rating: "inline-flex items-center gap-0.5 text-warning",
  starOn: "icon-[solar--star-bold] size-4",
  starOff: "icon-[solar--star-linear] size-4 text-muted-foreground",
  logo: "h-6 w-auto max-w-32 object-contain",
  logoLight: "hidden in-data-[mode=light]:block",
  logoDark: "block in-data-[mode=light]:hidden",
  logoLink: "inline-flex shrink-0 rounded-(--radius-sm) outline-none focus-visible:ring-1 focus-visible:ring-ring",
  media: "overflow-hidden rounded-(--radius-lg) border border-border",
  srOnly: "sr-only",
  caption: "mt-auto",
  separator: "mx-1",
} as const;

/** Testimonials 三形态. */
export const TESTIMONIALS_CLASS = {
  grid: "grid gap-6",
  carouselItem: "pl-6",
  carouselContent: "-ml-6",
  controls: "mt-6 flex items-center justify-between gap-4",
  controlsGroup: "flex items-center gap-2",
  counter: "min-w-12 text-center text-sm tabular-nums text-muted-foreground",
  dots: "pt-0",
  marqueeStack: "flex flex-col gap-6",
  marqueeItem: "w-[min(24rem,85cqw)] self-stretch",
  marqueePaused: "[&_.hx-marquee-track]:[animation-play-state:paused]",
  marqueeBar: "flex justify-end",
} as const;

/** CaseStudies: tabs / accordion 与面板. */
export const CASE_CLASS = {
  tabsList: "mb-8 flex h-auto w-full flex-wrap justify-start gap-2",
  tabsTrigger: "h-12 px-4",
  tabsTitle: "mb-6 text-balance text-2xl font-semibold text-foreground",
  accordionItem: "border-b border-border",
  accordionTrigger: "gap-4 py-5 text-start text-lg",
  triggerInner: "flex min-w-0 items-center gap-4",
  triggerTitle: "min-w-0 text-pretty font-semibold text-foreground",
  panel: "grid gap-8 @3xl:grid-cols-2 @3xl:items-start",
  panelBody: "flex min-w-0 flex-col gap-6",
  description: "text-pretty text-base leading-relaxed text-muted-foreground",
  metrics: "grid grid-cols-2 gap-6 @lg:grid-cols-3",
  metric: "flex min-w-0 flex-col-reverse gap-1",
  metricValue: "text-3xl font-semibold tracking-tight text-foreground tabular-nums",
  metricLabel: "text-sm text-muted-foreground",
  productsTitle: "mb-2 text-sm font-medium text-foreground",
  products: "flex flex-wrap gap-2",
  productLink: "underline-offset-4 hover:underline",
  quote: "border-s border-primary ps-4",
  content: "pb-6",
} as const;

/** ChangelogList: 列表 (时间线) 与卡片. */
export const CHANGELOG_CLASS = {
  groups: "flex flex-col gap-10",
  groupTitle: "mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground",
  list: "flex flex-col divide-y divide-border border-y border-border",
  listEntry: "grid gap-2 py-6 @2xl:grid-cols-[12rem_1fr] @2xl:gap-8",
  cards: "grid gap-6",
  cardEntry: "flex h-full min-w-0 flex-col gap-3 rounded-(--card-radius) border border-(--border-subtle) bg-card p-5 text-card-foreground",
  meta: "flex flex-wrap items-center gap-2 text-sm text-muted-foreground",
  body: "flex min-w-0 flex-col gap-2",
  title: "text-pretty text-lg font-semibold text-foreground [overflow-wrap:anywhere]",
  titleLink: "underline-offset-4 outline-none hover:underline focus-visible:underline",
  summary: "text-pretty text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]",
  tags: "flex flex-wrap gap-1.5",
  footer: "mt-8 flex",
} as const;

/** TweetWall: 瀑布流 + 水位折叠. */
export const TWEET_CLASS = {
  wall: "gap-6 [column-fill:balance]",
  item: "mb-6 flex break-inside-avoid flex-col gap-3 rounded-(--card-radius) border border-(--border-subtle) bg-card p-5 text-card-foreground",
  head: "flex min-w-0 items-start justify-between gap-3",
  handle: "truncate text-sm text-muted-foreground",
  body: "whitespace-pre-line text-pretty text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]",
  date: "text-xs text-muted-foreground",
  dateLink: "text-xs text-muted-foreground underline-offset-4 hover:underline",
  collapsed: "max-h-[var(--tweet-wall-collapsed,40rem)] overflow-hidden",
  mask: "hx-mask-fade",
  toggleBar: "mt-6 flex justify-center",
} as const;
