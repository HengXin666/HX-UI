/**
 * 电商浏览区块 (V1-07: ProductCard / ProductGrid / ProductRail / CategoryTiles / CampaignHero / PromoStrip) 的取值, 类名与兜底文案.
 * 区块文件只从这里取档, 不写颜色 / 字号 / 间距字面量. 类名写全字面量, Tailwind 才扫得到.
 */

/** data-slot 根名. 子部件为 <根名>-<slot>. */
export const COMMERCE_BROWSE_SLOT = {
  productCard: "product-card",
  productGrid: "product-grid",
  productRail: "product-rail",
  categoryTiles: "category-tiles",
  campaignHero: "campaign-hero",
  promoStrip: "promo-strip",
} as const;

/** 拼 data-slot: product-card + title -> product-card-title. */
export const browseSlot = (root: string, part?: string): string => (part ? `${root}-${part}` : root);

/** 商品网格列数档 (容器查询, 窄栏自动降列). */
export const PRODUCT_GRID_COLS = { 2: 2, 3: 3, 4: 4, 5: 5 } as const;
export type ProductGridCols = keyof typeof PRODUCT_GRID_COLS;

export const PRODUCT_GRID_COLS_CLASS: Readonly<Record<ProductGridCols, string>> = {
  2: "grid-cols-1 @md:grid-cols-2",
  3: "grid-cols-2 @3xl:grid-cols-3",
  4: "grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4",
  5: "grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4 @7xl:grid-cols-5",
};

/** 数据边界状态 (与 layout/DataBoundary 的判序一致: loading > error > empty > ready). */
export const DATA_BOUNDARY = { ready: "ready", loading: "loading", empty: "empty", error: "error" } as const;
export type DataBoundaryState = (typeof DATA_BOUNDARY)[keyof typeof DATA_BOUNDARY];

/** 轨道卡宽档. 窄容器 (移动端) 一律全宽单卡. */
export const RAIL_CARD_SIZE = { sm: "sm", md: "md", lg: "lg" } as const;
export type RailCardSize = (typeof RAIL_CARD_SIZE)[keyof typeof RAIL_CARD_SIZE];
export const RAIL_CARD_WIDTH: Readonly<Record<RailCardSize, string>> = {
  sm: "w-full @md:w-48 @3xl:w-56",
  md: "w-full @md:w-64 @3xl:w-72",
  lg: "w-full @md:w-80 @3xl:w-96",
};

/** 分类砖: 等宽 / 首张加宽; 全出血 / 圆角. */
export const TILE_LAYOUT = { even: "even", featureFirst: "feature-first" } as const;
export type TileLayout = (typeof TILE_LAYOUT)[keyof typeof TILE_LAYOUT];
export const TILE_SHAPE = { bleed: "bleed", rounded: "rounded" } as const;
export type TileShape = (typeof TILE_SHAPE)[keyof typeof TILE_SHAPE];
export const TILE_MIN = 2;
export const TILE_MAX = 4;

/** 按砖数与版式给栅格列; 首张加宽时首砖占两列. */
export const TILE_GRID_CLASS: Readonly<Record<number, Record<TileLayout, string>>> = {
  2: { even: "@2xl:grid-cols-2", "feature-first": "@2xl:grid-cols-3" },
  3: { even: "@2xl:grid-cols-3", "feature-first": "@2xl:grid-cols-4" },
  4: { even: "@2xl:grid-cols-2 @5xl:grid-cols-4", "feature-first": "@2xl:grid-cols-3 @5xl:grid-cols-5" },
};
export const TILE_FEATURE_SPAN = "@2xl:col-span-2";
/** 首砖占的列数; 比例同乘它, 让首砖与其余砖等高. */
export const TILE_FEATURE_COLS = 2;

/** 营销首屏版式与文字位置. */
export const HERO_LAYOUT = { overlay: "overlay", split: "split", splitReverse: "split-reverse" } as const;
export type HeroLayout = (typeof HERO_LAYOUT)[keyof typeof HERO_LAYOUT];
export const HERO_POSITION = { start: "start", center: "center", end: "end" } as const;
export type HeroPosition = (typeof HERO_POSITION)[keyof typeof HERO_POSITION];
export const HERO_POSITION_CLASS: Readonly<Record<HeroPosition, string>> = {
  start: "items-start justify-end text-start",
  center: "items-center justify-center text-center",
  end: "items-end justify-end text-end",
};

/** 促销条语气档. */
export const PROMO_STRIP_TONE = { neutral: "neutral", brand: "brand", inverted: "inverted", sale: "sale", success: "success" } as const;
export type PromoStripTone = (typeof PROMO_STRIP_TONE)[keyof typeof PROMO_STRIP_TONE];
export const PROMO_STRIP_TONE_CLASS: Readonly<Record<PromoStripTone, string>> = {
  neutral: "bg-muted text-foreground",
  brand: "bg-primary text-primary-foreground",
  inverted: "bg-foreground text-background",
  sale: "bg-destructive text-destructive-foreground",
  success: "bg-success/15 text-foreground",
};

/** 数值: 比例, 轮播, 倒计时, 轨道翻页. */
export const BROWSE_NUMBERS = {
  /** 商品图默认比例 (Apple / Nike 方图). */
  cardRatio: 1,
  /** shopify 拼贴的 16:10. */
  wideRatio: 16 / 10,
  tileRatio: 4 / 5,
  heroRatio: 16 / 9,
  splitRatio: 4 / 3,
  skeletonCount: 8,
  /** 轨道一次翻过视口宽度的比例. */
  railPage: 0.9,
  /** 判断已到边缘的容差 px. */
  railEdge: 2,
  /** 轮播自动播放的最短间隔 ms (WCAG 2.2.2 要求可暂停, 由按钮与 hover/focus 暂停保证). */
  autoplayMin: 3000,
  tickMs: 1000,
  msPerSecond: 1000,
  secondsPerMinute: 60,
  minutesPerHour: 60,
  hoursPerDay: 24,
  twoDigits: 2,
  first: 0,
} as const;

/** 比例串 "16/9" 的分隔符. */
export const RATIO_SEPARATOR = "/";

/** 倒计时的 Intl unit 名与 ListFormat 选项. */
export const COUNTDOWN_UNITS = ["day", "hour", "minute", "second"] as const;
export const COUNTDOWN_INTL = {
  unit: "unit",
  narrow: "narrow",
  long: "long",
} as const;

/** 收藏 / 加购 / 关闭等图标 (solar, 与 commerce 层同族). */
export const BROWSE_ICON = {
  favorite: "icon-[solar--heart-linear]",
  favorited: "icon-[solar--heart-bold]",
  cart: "icon-[solar--cart-plus-linear]",
  close: "icon-[solar--close-circle-linear]",
  previous: "icon-[solar--alt-arrow-left-linear]",
  next: "icon-[solar--alt-arrow-right-linear]",
  pause: "icon-[solar--pause-linear]",
  play: "icon-[solar--play-linear]",
  arrow: "icon-[solar--arrow-right-linear]",
} as const;

/** 区块内置的 aria 兜底与少量默认可见文案; 全部可经各区块的 texts prop 覆盖. */
export const BROWSE_TEXT_ZH = {
  favorite: "收藏",
  unfavorite: "取消收藏",
  quickAdd: "加入购物袋",
  soldOut: "售罄",
  products: "商品列表",
  slides: "活动轮播",
  slide: "第 {n} 张",
  dismiss: "关闭促销信息",
  countdown: "距结束",
  retry: "重试",
} as const;
export const BROWSE_TEXT_EN = {
  favorite: "Add to favorites",
  unfavorite: "Remove from favorites",
  quickAdd: "Add to bag",
  soldOut: "Sold out",
  products: "Products",
  slides: "Campaign slides",
  slide: "Slide {n}",
  dismiss: "Dismiss promotion",
  countdown: "Ends in",
  retry: "Retry",
} as const satisfies Record<keyof typeof BROWSE_TEXT_ZH, string>;
export type BrowseTexts = { [K in keyof typeof BROWSE_TEXT_ZH]: string };
export const BROWSE_TEXT_PACKS = { zh: BROWSE_TEXT_ZH, en: BROWSE_TEXT_EN } as const;
export const BROWSE_TEXT_FALLBACK = "zh";
export const BROWSE_PLACEHOLDER_N = "{n}";
export const LANG_SEPARATOR = "-";

/** 类名组合. */
export const BROWSE_CLASS = {
  focus: "outline-none focus-visible:outline-1 focus-visible:outline-ring focus-visible:outline-offset-2",
  fade: "transition-opacity duration-(--duration-slow) ease-out motion-reduce:transition-none",
  colors: "transition-[color,background-color,border-color,opacity] duration-(--duration-fast) ease-out",
  iconButton:
    "relative z-10 inline-flex size-(--control-h-md,calc(var(--spacing)*9)) items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-sm hover:bg-background disabled:cursor-not-allowed disabled:opacity-40",
  icon: "size-4 bg-current",
  srOnly: "sr-only",
  /* ProductCard */
  card: "group/card relative isolate flex min-w-0 flex-col gap-3 text-start",
  cardMedia: "relative overflow-hidden rounded-(--radius-lg) bg-muted",
  cardSoldOut: "opacity-60 grayscale",
  cardHover: "absolute inset-0 opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100",
  cardBadges: "pointer-events-none absolute start-2 top-2 z-10 flex flex-wrap gap-1",
  cardActions: "absolute end-2 top-2 z-10 flex flex-col gap-2",
  cardQuick: "absolute inset-x-2 bottom-2 z-10 opacity-100 @md:opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100",
  cardQuickButton:
    "relative z-10 inline-flex h-(--control-h-md,calc(var(--spacing)*9)) w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50",
  cardBody: "flex min-w-0 flex-col gap-1",
  cardTitle: "text-base font-medium text-foreground text-pretty",
  cardLink: "after:absolute after:inset-0 after:z-0 after:content-['']",
  cardSubtitle: "text-sm text-muted-foreground",
  cardMeta: "flex flex-wrap items-center gap-x-3 gap-y-1",
  raise: "relative z-10",
  /* ProductGrid */
  grid: "grid gap-x-4 gap-y-8",
  gridItem: "min-w-0",
  skeletonStack: "flex flex-col gap-3",
  skeletonMedia: "w-full rounded-(--radius-lg)",
  skeletonLine: "h-3 w-2/3",
  skeletonLineShort: "h-3 w-1/3",
  /* ProductRail */
  railRoot: "relative flex flex-col gap-4",
  railHead: "flex items-end justify-between gap-4",
  railControls: "hidden items-center gap-2 @md:flex",
  railHeadActions: "flex shrink-0 items-center gap-3",
  railHeading: "mb-0 min-w-0",
  iconFlip: "rtl:-scale-x-100",
  railViewport:
    "flex w-full snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  railItem: "shrink-0 snap-start",
  /* CategoryTiles */
  tiles: "grid grid-cols-1",
  tilesBleed: "gap-px",
  tilesRounded: "gap-4",
  tile: "group/tile relative isolate block overflow-hidden text-background",
  tileRounded: "rounded-(--radius-xl)",
  tileMedia: "transition-transform duration-(--duration-slow) ease-out group-hover/tile:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/tile:scale-100",
  scrim: "pointer-events-none absolute inset-0 bg-linear-to-t from-foreground/70 via-foreground/15 to-transparent",
  tileBody: "absolute inset-x-0 bottom-0 z-10 flex flex-col items-start gap-2 p-6",
  tileEyebrow: "text-sm font-medium",
  tileTitle: "text-[length:var(--fs-display-sm,var(--text-3xl))] font-semibold leading-tight text-balance uppercase",
  tileCta: "inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground",
  /* CampaignHero */
  hero: "relative isolate overflow-hidden",
  heroSlide: "relative",
  heroOverlay: "relative grid",
  heroOverlayMedia: "absolute inset-0 -z-10 [&>[data-radix-aspect-ratio-wrapper]]:!h-full [&>[data-radix-aspect-ratio-wrapper]]:!pb-0",
  heroFill: "size-full",
  heroDark: "pointer-events-none absolute inset-0 -z-10 bg-foreground/45",
  heroContent: "flex min-h-[var(--hero-min-h,70svh)] flex-col gap-4 px-6 py-16 @3xl:px-12",
  heroOnDark: "text-background",
  heroSplit: "grid items-center gap-8 @3xl:grid-cols-2",
  heroSplitReverse: "@3xl:[&>*:first-child]:order-last",
  heroSplitText: "flex flex-col gap-4 px-6 py-10 @3xl:px-12",
  heroKicker: "text-sm font-medium uppercase tracking-wide",
  heroTitle:
    "text-[length:var(--fs-display-3xl,var(--text-8xl))] font-bold leading-[var(--lh-display,1.05)] tracking-[var(--tracking-display,-0.02em)] text-balance uppercase [&:lang(zh)]:tracking-[var(--tracking-display-cjk,0)]",
  heroBody: "max-w-prose text-lg text-pretty",
  heroDots: "absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2",
  heroDot: "size-2 rounded-full bg-background/50 data-[state=active]:bg-background",
  heroNav: "absolute end-4 bottom-4 z-10 flex items-center gap-2",
  /* PromoStrip */
  strip: "relative w-full",
  stripInner: "mx-auto flex min-h-10 w-full max-w-[var(--container-content,var(--container-7xl))] items-center justify-center gap-3 px-10 py-2 text-sm",
  stripText: "text-center text-pretty",
  stripLink: "font-medium underline underline-offset-4",
  stripTimer: "font-medium tabular-nums",
  stripClose: "absolute end-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full hover:bg-current/10",
} as const;

/** 视频 MIME / 分屏默认. */
export const HERO_DEFAULT = { layout: "overlay", position: "start", interval: 6000 } as const;
export const ARIA_ROLEDESCRIPTION = { carousel: "carousel", slide: "slide" } as const;
export const ARIA_LIVE = { off: "off", polite: "polite" } as const;
export const DATA_STATE = { active: "active", inactive: "inactive" } as const;
