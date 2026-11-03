/**
 * 营销区块 A (V1-02: Hero / LogoWall / CtaBanner / Newsletter) 的取值, 类名与默认档位.
 * 区块文件只从这里与 src/constants/blocks.ts 取档, 组件里不写颜色/字号/间距字面量.
 * 类名整串写出, Tailwind 才扫得到; 颜色一律是语义令牌工具类, 间距与字号走令牌 (var() 带回退).
 * 契约: docs/reference/2026-ui-library-blocks-design.md 第 4.2 节.
 */

/* ---------- 档位 ---------- */

/** Hero 版式: 居中 / 分屏 / 媒体底 / 视频底 / 产品 (mock 或截图在标题下) / editorial (标题左, 导语右, 基线对齐; N1). */
export const HERO_LAYOUT = {
  centered: "centered",
  split: "split",
  mediaBg: "media-bg",
  videoBg: "video-bg",
  product: "product",
  editorial: "editorial",
} as const;

/** Hero 顶部留白档 (N13): 映射 tokens.css 的 --hero-pad-top-*, 只作用于 Hero 根节点. */
export const HERO_PAD_TOP = { sm: "sm", md: "md", lg: "lg", xl: "xl" } as const;
export const HERO_PAD_TOP_VAR = {
  sm: "var(--hero-pad-top-sm)",
  md: "var(--hero-pad-top-md)",
  lg: "var(--hero-pad-top-lg)",
  xl: "var(--hero-pad-top-xl)",
} as const;
/** Hero 根节点读取的自定义属性名与取值. */
export const HERO_PAD_TOP_PROP = { name: "--hero-pad-top", value: "var(--hero-pad-top)" } as const;

/**
 * Hero 媒体外框: 无 / 浏览器框 (vercel, react.dev 式截图) / 设备框 (media/DeviceFrame, 笔记本机身) /
 * 产品界面 (media/ProductMockFrame: 透视倾斜 + 渐隐, linear / supabase 式) /
 * 窗口 (BrowserFrame 去掉工具栏: 只有 1px 描边 + 圆角, 无地址栏, linear / vercel 极简式).
 */
export const HERO_FRAME = { none: "none", browser: "browser", device: "device", mock: "mock", window: "window" } as const;

/** 分屏时媒体在起始侧还是结束侧 (逻辑方向, RTL 自动翻转). */
export const HERO_MEDIA_SIDE = { start: "start", end: "end" } as const;

/** LogoWall 模式. */
export const LOGO_WALL_MODE = { grid: "grid", marquee: "marquee" } as const;

/** LogoWall 网格列数 (宽容器下). */
export const LOGO_WALL_COLS = { 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 } as const;

/** CtaBanner 形态. */
export const CTA_BANNER_VARIANT = { inline: "inline", boxed: "boxed", full: "full" } as const;

/** CtaBanner 底纹: 无 / 品牌渐变 / mesh. */
export const CTA_BANNER_FILL = { none: "none", gradient: "gradient", mesh: "mesh" } as const;

/** Newsletter 形态与状态机. */
export const NEWSLETTER_VARIANT = { inline: "inline", card: "card" } as const;
export const NEWSLETTER_STATUS = { idle: "idle", submitting: "submitting", success: "success", error: "error" } as const;

/** 背景规格 mask.fade -> MaskFade direction (起止用逻辑名, 这里映射到物理边). */
export const MV102_MASK_DIRECTION = { radial: "radial", top: "top", bottom: "bottom", start: "left", end: "right" } as const;

/** 默认值. */
export const MV102_DEFAULT = {
  heroLayout: "centered",
  heroTitleSize: "xl",
  heroTitleLevel: 1,
  heroFrame: "none",
  heroDevice: "laptop",
  /** frame="mock" 时的倾斜角 (deg) 与渐隐边 (ProductMockFrame tilt / fade). */
  heroMockTilt: 8,
  heroMockFade: "bottom",
  heroMediaSide: "end",
  heroPad: "lg",
  heroLeadMeasure: "default",
  heroScrim: true,
  logoMode: "grid",
  logoCols: 5,
  logoGrayscale: true,
  logoAutoMarquee: true,
  logoMarqueeRepeat: 3,
  logoHeight: 32,
  logoWidth: 120,
  ctaVariant: "boxed",
  ctaFill: "none",
  ctaTitleSize: "lg",
  newsletterVariant: "inline",
  newsletterTitleSize: "md",
  inputType: "email",
  inputAutoComplete: "email",
  inputName: "email",
  submitType: "submit",
  commandPrompt: "$",
  meshIntensity: 0.6,
  grainOpacity: 0.12,
} as const;

/** data-slot 取值: 根即区块名, 子部件为 <区块>-<slot>. */
export const MV102_SLOT = {
  hero: "marketing-hero",
  heroText: "marketing-hero-text",
  heroPill: "marketing-hero-pill",
  heroEyebrow: "marketing-hero-eyebrow",
  heroTitle: "marketing-hero-title",
  heroRotate: "marketing-hero-rotate",
  heroLead: "marketing-hero-lead",
  heroActions: "marketing-hero-actions",
  heroCommand: "marketing-hero-command",
  heroMedia: "marketing-hero-media",
  heroTrust: "marketing-hero-trust",
  heroAside: "marketing-hero-aside",
  heroVideoToggle: "marketing-hero-video-toggle",
  logoWall: "marketing-logo-wall",
  logoWallGrid: "marketing-logo-wall-grid",
  logoWallMarquee: "marketing-logo-wall-marquee",
  logoWallCaption: "marketing-logo-wall-caption",
  logo: "marketing-logo",
  ctaBanner: "marketing-cta-banner",
  ctaBannerPanel: "marketing-cta-banner-panel",
  ctaBannerText: "marketing-cta-banner-text",
  ctaBannerActions: "marketing-cta-banner-actions",
  newsletter: "marketing-newsletter",
  newsletterForm: "marketing-newsletter-form",
  newsletterStatus: "marketing-newsletter-status",
  newsletterConsent: "marketing-newsletter-consent",
} as const;

/* ---------- 类名 (令牌工具类, 无字面色值) ---------- */

/** 共享件: 背景层, 遮罩, 媒体, logo. */
export const MV102_CLASS = {
  fill: "absolute inset-0 size-full",
  effectHost: "absolute inset-0 overflow-hidden isolate",
  scrim: "absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30",
  scrimInverted: "absolute inset-0 bg-foreground/60",
  srOnly: "sr-only",
  justifyCenter: "justify-center",
  itemsCenter: "items-center text-center",
  underlay: "-z-10",
  contents: "contents",
  mediaBox: "relative w-full overflow-hidden rounded-(--radius-lg) border border-border bg-card shadow-(--shadow-lg,var(--shadow-md))",
  mediaPlain: "relative w-full overflow-hidden rounded-(--radius-lg)",
  logoItem: "inline-flex shrink-0 items-center justify-center",
  logoLink: "inline-flex items-center justify-center rounded-(--radius-sm) outline-none focus-visible:outline-1 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring",
  logoImg: "h-[var(--logo-wall-height,calc(var(--spacing)*8))] w-auto",
  logoGray: "opacity-70 grayscale transition-[filter,opacity] duration-(--duration-normal,200ms) hover:opacity-100 hover:grayscale-0 focus-within:opacity-100 focus-within:grayscale-0 motion-reduce:transition-none",
  logoText: "text-sm font-medium text-muted-foreground",
  /** 内联节点 logo (svg 字标): 高度由 style 给, svg 等高自适应宽. */
  logoNode: "inline-flex items-center [&>svg]:h-full [&>svg]:w-auto",
} as const;

/** Hero. */
export const HERO_CLASS = {
  text: "flex min-w-0 flex-col gap-[var(--block-gap-sm,calc(var(--spacing)*6))]",
  textCenter: "items-center text-center",
  textStart: "items-start text-start",
  rotateLine: "block text-primary in-data-[block-tone=inverted]:text-background",
  pill: "inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-sm text-foreground backdrop-blur hover:bg-muted",
  pillBadge: "rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground",
  command: "inline-flex items-center gap-2 rounded-(--radius-md) border border-border bg-muted px-4 py-2 font-mono text-sm text-foreground",
  commandPrompt: "select-none text-muted-foreground",
  split: "grid items-center gap-[var(--block-gap-lg,calc(var(--spacing)*12))] @3xl:grid-cols-2",
  splitMediaStart: "@3xl:order-first",
  product: "flex flex-col gap-[var(--block-gap-lg,calc(var(--spacing)*12))]",
  bgMinHeight: "flex min-h-[var(--hero-min-height,80svh)] flex-col justify-center",
  /** product 与 centered 版式共用: 媒体在文本下方, 水平居中; 上间距由外层 product 容器的 gap 提供. */
  productMedia: "mx-auto w-full",
  trust: "flex flex-col gap-4",
  trustCenter: "items-center",
  trustText: "text-sm text-muted-foreground",
  trustLogos: "flex flex-wrap items-center gap-x-[var(--block-gap-md,calc(var(--spacing)*10))] gap-y-4",
  videoToggle: "self-start",
  /** editorial (N1): 两列 grid, items-baseline 按各列首基线对齐; 窄容器堆叠. */
  editorial: "grid gap-[var(--block-gap-md,calc(var(--spacing)*10))] @3xl:grid-cols-2 @3xl:items-baseline @3xl:gap-x-[var(--block-gap-lg,calc(var(--spacing)*12))]",
  editorialHead: "min-w-0 text-start",
  /** inline-block 的基线是它最后一行: 包住 pill + 标题后, 左列的首基线 = h1 末行基线. */
  editorialHeadInner: "inline-block w-full align-baseline space-y-[var(--block-gap-sm,calc(var(--spacing)*6))]",
  /** 右列 flex 的首基线 = lead 第一行, 与左列 (h1 末行) 落在同一条基线上. */
  editorialAside: "flex min-w-0 flex-col items-start gap-[var(--block-gap-sm,calc(var(--spacing)*6))] text-start",
} as const;

/** LogoWall. */
export const LOGO_WALL_CLASS = {
  grid: "grid grid-cols-2 items-center justify-items-center gap-x-[var(--block-gap-md,calc(var(--spacing)*10))] gap-y-[var(--block-gap-sm,calc(var(--spacing)*8))] @md:grid-cols-3",
  gridAutoHidden: "hidden @md:grid",
  marqueeAutoOnly: "@md:hidden",
  marqueeGap: "var(--block-gap-md, calc(var(--spacing) * 12))",
  /** 说明小字 (N2): 正文档字号 + 弱化前景, 不走区块标题通道. */
  caption: "mb-[var(--block-gap-sm,calc(var(--spacing)*8))] text-center text-[length:var(--fs-base)] text-muted-foreground",
} as const;

/** 宽容器下的列数 (容器查询). */
export const LOGO_WALL_COLS_CLASS = {
  3: "@3xl:grid-cols-3",
  4: "@3xl:grid-cols-4",
  5: "@3xl:grid-cols-5",
  6: "@3xl:grid-cols-6",
  /** 7 / 8 列只在 @5xl (64rem) 以上铺满一行, 中宽先 4 列, 免得 logo 被挤到 60px 一格. */
  7: "@3xl:grid-cols-4 @5xl:grid-cols-7",
  8: "@3xl:grid-cols-4 @5xl:grid-cols-8",
} as const;

/** CtaBanner. */
export const CTA_BANNER_CLASS = {
  panel: "relative isolate overflow-hidden",
  boxed: "rounded-(--radius-xl,var(--radius-lg)) border border-border bg-card px-[var(--block-gap-md,calc(var(--spacing)*10))] py-[var(--section-pad-sm,calc(var(--spacing)*12))] text-card-foreground",
  inline: "border-y border-border py-[var(--block-gap-md,calc(var(--spacing)*10))]",
  full: "",
  row: "flex flex-col gap-[var(--block-gap-sm,calc(var(--spacing)*6))] @3xl:flex-row @3xl:items-center @3xl:justify-between",
  column: "flex flex-col items-center gap-[var(--block-gap-sm,calc(var(--spacing)*6))] text-center",
  text: "flex min-w-0 flex-col gap-3",
  gradient: "absolute inset-0 bg-(image:--gradient-brand) opacity-20",
} as const;

/** Newsletter. */
export const NEWSLETTER_CLASS = {
  card: "rounded-(--radius-xl,var(--radius-lg)) border border-border bg-card p-[var(--block-gap-md,calc(var(--spacing)*10))] text-card-foreground",
  layout: "flex flex-col gap-[var(--block-gap-sm,calc(var(--spacing)*6))]",
  layoutSplit: "@3xl:flex-row @3xl:items-end @3xl:justify-between",
  form: "flex w-full max-w-md flex-col gap-3 @md:flex-row",
  input: "h-10 flex-1",
  button: "h-10 shrink-0",
  status: "min-h-[1lh] text-sm",
  statusSuccess: "text-success",
  statusError: "text-destructive",
  consent: "text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-2",
  formWrap: "flex w-full max-w-md flex-col gap-2",
} as const;
