/**
 * 区块层 (src/blocks/) 的取值, 类名与默认文案. 区块只从这里取档, 不在组件里写字面量.
 * 类名写全字面量, Tailwind 才扫得到; 令牌缺失时用 var() 的回退值兜底 (V0 令牌任务落地后回退自然失效).
 */

/**
 * 区块底色档. 只决定取哪组语义 token, 不感知皮肤名.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-shared-base.md
 */
export const BLOCK_TONE = {
  plain: "plain",
  muted: "muted",
  card: "card",
  inverted: "inverted",
  brand: "brand",
  image: "image",
} as const;

/** 纵向留白档, 映射 --section-pad-* (响应式 clamp 由令牌负责). */
export const BLOCK_PAD = { none: "none", sm: "sm", md: "md", lg: "lg", xl: "xl" } as const;

/** 内容宽度档. prose 约 65 字符; content / wide / max 对应 --container-*; full 不限宽但留 gutter; bleed 连 gutter 都不留. */
export const BLOCK_WIDTH = {
  prose: "prose",
  narrow: "narrow",
  content: "content",
  wide: "wide",
  max: "max",
  full: "full",
  bleed: "bleed",
} as const;

/** 对齐. 用逻辑方向 start, 不用 left (RTL 下语义不变, 见 component-contract 4.6). */
export const BLOCK_ALIGN = { start: "start", center: "center" } as const;

/** 入场编排预设. false 表示关闭. */
export const BLOCK_REVEAL = { fade: "fade", rise: "rise", stagger: "stagger" } as const;

/** BlockShell 可换的根标签. */
export const BLOCK_TAG = {
  section: "section",
  div: "div",
  header: "header",
  footer: "footer",
  aside: "aside",
  article: "article",
} as const;

/** 背景层种类. grid / dots / aurora 由 effects/Backdrop 内置; 其余经 BlocksProvider.backdrops 注入. */
export const BLOCK_BACKDROP = {
  grid: "grid",
  dots: "dots",
  aurora: "aurora",
  mesh: "mesh",
  grain: "grain",
  beam: "beam",
  image: "image",
} as const;

/** 标题尺度档, 与 typography 层 Display sm..2xl 同名. */
export const BLOCK_TITLE_SIZE = { sm: "sm", md: "md", lg: "lg", xl: "xl", "2xl": "2xl" } as const;

/** Cta 的外观与尺寸. */
export const CTA_VARIANT = { primary: "primary", secondary: "secondary", ghost: "ghost", link: "link" } as const;
export const CTA_SIZE = { sm: "sm", md: "md", lg: "lg" } as const;

/** Cta 外观 -> Button variant; Cta 尺寸 -> Button size (Button 迁移到五档前的过渡映射). */
export const CTA_BUTTON_VARIANT = { primary: "primary", secondary: "outline", ghost: "ghost", link: "link" } as const;
export const CTA_BUTTON_SIZE = { sm: "sm", md: "default", lg: "lg" } as const;

/** 媒体种类与比例档. */
export const MEDIA_KIND = { image: "image", video: "video", node: "node" } as const;
export const MEDIA_RATIO = {
  square: "1/1",
  classic: "4/3",
  photo: "3/2",
  video: "16/9",
  cinema: "21/9",
  portrait: "3/4",
} as const;

/** 价格周期. */
export const MONEY_PERIOD = { month: "month", year: "year", once: "once" } as const;

/** 区块密度 (design 3.4): 缩放 --section-pad-* 与 --block-gap-*. */
export const BLOCK_DENSITY = { compact: "compact", comfortable: "comfortable", spacious: "spacious" } as const;

/** 区块层写到 DOM 上的 data 属性名. 兄弟选择器与测试都靠它. */
export const BLOCK_ATTR = {
  tone: "data-block-tone",
  pad: "data-block-pad",
  width: "data-block-width",
  align: "data-align",
  reveal: "data-reveal",
  density: "data-density",
  page: "data-block-page",
} as const;

/** data-slot 取值. root 即组件名, 子部件为 <组件>-<slot>. */
export const BLOCK_SLOT = {
  shell: "block-shell",
  shellBackdrop: "block-shell-backdrop",
  shellContainer: "block-shell-container",
  shellContent: "block-shell-content",
  heading: "section-heading",
  headingEyebrow: "section-heading-eyebrow",
  headingTitle: "section-heading-title",
  headingDescription: "section-heading-description",
  headingActions: "section-heading-actions",
  headingText: "section-heading-text",
  cta: "cta",
  ctaLabel: "cta-label",
  ctaIcon: "cta-icon",
  ctaGroup: "cta-group",
  page: "page-composer",
  pageMissing: "page-composer-missing",
  provider: "blocks-provider",
} as const;

/** classNames 的 slot 元组 (公开 API, 改名为破坏性变更). */
export const BLOCK_SHELL_SLOTS = ["root", "backdrop", "container", "content"] as const;
export const SECTION_HEADING_SLOTS = ["root", "text", "eyebrow", "title", "description", "actions"] as const;
export const CTA_GROUP_SLOTS = ["root", "item", "icon", "label"] as const;
export const PAGE_COMPOSER_SLOTS = ["root", "missing"] as const;

/** 留白令牌 (令牌缺失时回退到 --spacing 的倍数: 48 / 80 / 112 / 160px). */
export const BLOCK_PAD_CLASS = {
  none: "py-0",
  sm: "py-[var(--section-pad-sm,calc(var(--spacing)*12))]",
  md: "py-[var(--section-pad-md,calc(var(--spacing)*20))]",
  lg: "py-[var(--section-pad-lg,calc(var(--spacing)*28))]",
  xl: "py-[var(--section-pad-xl,calc(var(--spacing)*40))]",
} as const;

/**
 * 相邻同 tone 合并留白: 前一个兄弟与自己 tone 相同时收掉自己的 padding-top.
 * 纯 CSS 兄弟选择器 (:where 不加权重), 不做 JS 测量. 每档一条, 只挂在对应 tone 的区块上.
 */
export const BLOCK_TONE_MERGE_CLASS = {
  plain: "[:where([data-block-tone=plain])+&]:pt-0",
  muted: "[:where([data-block-tone=muted])+&]:pt-0",
  card: "[:where([data-block-tone=card])+&]:pt-0",
  inverted: "[:where([data-block-tone=inverted])+&]:pt-0",
  brand: "[:where([data-block-tone=brand])+&]:pt-0",
  image: "[:where([data-block-tone=image])+&]:pt-0",
} as const;

/** tone -> 语义色. inverted 取前景作底; image 由 backdrop 提供图像, 这里只给兜底底色. */
export const BLOCK_TONE_CLASS = {
  plain: "bg-background text-foreground",
  muted: "bg-muted text-foreground",
  card: "bg-card text-card-foreground",
  inverted: "bg-foreground text-background",
  brand: "bg-primary text-primary-foreground",
  image: "bg-muted text-foreground",
} as const;

/** 宽度档 -> 容器类. 令牌缺失时回退到 Tailwind 主题容器宽度. */
export const BLOCK_WIDTH_CLASS = {
  prose: "max-w-prose",
  narrow: "max-w-3xl",
  content: "max-w-[var(--container-content,var(--container-7xl))]",
  wide: "max-w-[var(--container-wide,90rem)]",
  max: "max-w-[var(--container-max,96rem)]",
  full: "max-w-none",
  bleed: "max-w-none",
} as const;

/**
 * 标题字号档. TODO(V0-03 typography): Display 组件落地后改为复用其尺度, 这里只是令牌直写的过渡实现.
 * 令牌缺失时回退到 Tailwind 文本档 (3xl..7xl).
 */
export const BLOCK_TITLE_CLASS = {
  sm: "text-[length:var(--fs-display-sm,var(--text-3xl))]",
  md: "text-[length:var(--fs-display-md,var(--text-4xl))]",
  lg: "text-[length:var(--fs-display-lg,var(--text-5xl))]",
  xl: "text-[length:var(--fs-display-xl,var(--text-6xl))]",
  "2xl": "text-[length:var(--fs-display-2xl,var(--text-7xl))]",
} as const;

/** 区块层复用的类名组合. */
export const BLOCK_CLASS = {
  host: "relative isolate",
  backdrop: "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
  container: "mx-auto w-full min-w-0",
  gutter: "px-4 sm:px-6 lg:px-8",
  contentQuery: "@container",
  alignStart: "text-start",
  alignCenter: "text-center",
  displayType: "font-semibold text-balance leading-[var(--lh-display,1.1)] tracking-[var(--tracking-display,-0.02em)] [&:lang(zh)]:tracking-[var(--tracking-display-cjk,0)] [&:lang(ja)]:tracking-[var(--tracking-display-cjk,0)]",
  eyebrow: "text-sm font-medium tracking-wide text-primary in-data-[block-tone=brand]:text-primary-foreground in-data-[block-tone=inverted]:text-background",
  lead: "max-w-prose text-pretty text-lg text-muted-foreground in-data-[block-tone=brand]:text-primary-foreground/80 in-data-[block-tone=inverted]:text-background/70",
  actions: "flex flex-wrap items-center gap-3",
  missing: "rounded-(--radius-md) border border-dashed border-border p-4 text-sm text-muted-foreground",
} as const;

/** 默认档位. 营销区块默认 spacious 密度由 BlocksProvider 下发. */
export const BLOCK_DEFAULT = {
  tone: "plain",
  pad: "lg",
  width: "content",
  align: "start",
  titleSize: "md",
  headingLevel: 2,
  tag: "section",
  ctaVariant: "primary",
  ctaSize: "md",
  density: "spacious",
} as const;

/** 外链的 rel 与 target. */
export const EXTERNAL_LINK = { target: "_blank", rel: "noopener noreferrer" } as const;

/** 语言子标签分隔符. */
export const BLOCK_LANG_SEPARATOR = "-";

/** 区块内置的无语义 aria 兜底文案 (design 3.2). 区块用 labels prop 或 BlocksProvider 覆盖. */
export const BLOCK_LABELS_ZH = {
  previous: "上一张",
  next: "下一张",
  close: "关闭",
  open: "打开",
  menu: "菜单",
  search: "搜索",
  pause: "暂停",
  play: "播放",
  copy: "复制",
  copied: "已复制",
  loading: "加载中",
  more: "更多",
  expand: "展开",
  collapse: "收起",
  externalLink: "在新窗口打开",
  missingBlock: "未注册的区块",
} as const;

export const BLOCK_LABELS_EN = {
  previous: "Previous",
  next: "Next",
  close: "Close",
  open: "Open",
  menu: "Menu",
  search: "Search",
  pause: "Pause",
  play: "Play",
  copy: "Copy",
  copied: "Copied",
  loading: "Loading",
  more: "More",
  expand: "Expand",
  collapse: "Collapse",
  externalLink: "Opens in a new window",
  missingBlock: "Unregistered block",
} as const satisfies Record<keyof typeof BLOCK_LABELS_ZH, string>;

/** 按语言子标签索引的内置文案包; 未命中时回到 zh (与 LocaleProvider 的内置默认一致). */
export const BLOCK_LABEL_PACKS = { zh: BLOCK_LABELS_ZH, en: BLOCK_LABELS_EN } as const;
export const BLOCK_LABEL_FALLBACK = "zh";
