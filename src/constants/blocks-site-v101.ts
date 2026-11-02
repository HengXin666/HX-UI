/**
 * 站点区块 (src/blocks/site/, 任务 V1-01) 的取值: 区块名, data-slot, 默认档, 宽度 / tone 映射, 复用类名与 aria 兜底键.
 * 类名写全字面量, Tailwind 才扫得到. 区块只读语义 token, 不写色值.
 */

/**
 * PageComposer 注册名 (design 2: 名词, 不加 Block 后缀).
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-site-v101.md
 */
export const SITE_BLOCK_NAME = {
  header: "SiteHeader",
  megaMenuPanel: "MegaMenuPanel",
  mobileNav: "MobileNav",
  announcement: "AnnouncementBar",
  footer: "SiteFooter",
} as const;

/** 区块自己渲染的 DOM 节点的 data-slot (零件内部节点沿用零件自己的 data-slot). */
export const SITE_BLOCK_SLOT = {
  header: "site-header-block",
  brand: "site-header-block-brand",
  brandLogo: "site-header-block-brand-logo",
  brandLogoLight: "site-header-block-brand-logo-light",
  brandName: "site-header-block-brand-name",
  actions: "site-header-block-actions",
  localNav: "site-header-block-local-nav",
  localNavList: "site-header-block-local-nav-list",
  localNavLink: "site-header-block-local-nav-link",
  mobileAccount: "site-header-block-mobile-account",
  announcement: "announcement-block",
  announcementMessage: "announcement-block-message",
  announcementToggle: "announcement-block-toggle",
  megaPanel: "mega-menu-panel-block",
  megaColumns: "mega-menu-panel-block-columns",
  megaGroup: "mega-menu-panel-block-group",
  megaGroupTitle: "mega-menu-panel-block-group-title",
  megaGroupList: "mega-menu-panel-block-group-list",
  megaLink: "mega-menu-panel-block-link",
  megaLinkIcon: "mega-menu-panel-block-link-icon",
  megaLinkText: "mega-menu-panel-block-link-text",
  megaLinkDescription: "mega-menu-panel-block-link-description",
  megaFeatured: "mega-menu-panel-block-featured",
  megaFeaturedCard: "mega-menu-panel-block-featured-card",
  megaFeaturedImage: "mega-menu-panel-block-featured-image",
  megaFeaturedTitle: "mega-menu-panel-block-featured-title",
  megaFeaturedDescription: "mega-menu-panel-block-featured-description",
  megaFooter: "mega-menu-panel-block-footer",
  mobileNav: "mobile-nav-block",
  mobileFooter: "mobile-nav-block-footer",
  footer: "site-footer-block",
  footerBrand: "site-footer-block-brand",
  footerDescription: "site-footer-block-description",
  footerBadges: "site-footer-block-badges",
  footerBadge: "site-footer-block-badge",
  footerStatus: "site-footer-block-status",
  footerStatusDot: "site-footer-block-status-dot",
  footerEnd: "site-footer-block-end",
  newsletter: "site-footer-block-newsletter",
  newsletterTitle: "site-footer-block-newsletter-title",
  newsletterLead: "site-footer-block-newsletter-lead",
  newsletterRow: "site-footer-block-newsletter-row",
  newsletterInput: "site-footer-block-newsletter-input",
  newsletterSubmit: "site-footer-block-newsletter-submit",
  newsletterConsent: "site-footer-block-newsletter-consent",
  newsletterMessage: "site-footer-block-newsletter-message",
} as const;

/** 站点区块的默认档: 外壳不留纵向白 (零件自带), 外壳根用 div (零件自己输出 header / footer 地标). */
export const SITE_BLOCK_DEFAULT = {
  pad: "none",
  panelPad: "md",
  width: "content",
  shellWidth: "bleed",
  tag: "div",
  sticky: true,
  transparent: false,
  blurOnScroll: true,
  dismissible: true,
  truncate: true,
  open: true,
} as const;

/** BlockWidth -> 零件容器档 (src/constants/site SITE_CONTAINER 的键). */
export const SITE_BLOCK_CONTAINER = {
  prose: "narrow",
  narrow: "narrow",
  content: "content",
  wide: "wide",
  max: "display",
  full: "full",
  bleed: "full",
} as const;

/** BlockTone -> 公告条语义色档 (未给 intent 时使用). */
export const SITE_BLOCK_INTENT = {
  plain: "neutral",
  muted: "neutral",
  card: "neutral",
  inverted: "primary",
  brand: "primary",
  image: "neutral",
} as const;

/** 顶栏外壳的定位类: 外壳承担吸顶 / 覆盖, 零件内部退回 relative. */
export const SITE_BLOCK_POSITION = {
  sticky: "sticky top-0 z-(--z-header)",
  fixed: "fixed inset-x-0 top-0 z-(--z-header)",
  absolute: "absolute inset-x-0 top-0 z-(--z-header)",
  static: "",
} as const;

/** 非 plain tone 时顶栏零件的底色 (含滚动后的半透明玻璃底). */
export const SITE_BLOCK_HEADER_TONE = {
  plain: "",
  muted: "bg-muted data-scrolled:bg-muted/90",
  card: "bg-card text-card-foreground data-scrolled:bg-card/90",
  inverted: "border-background/10 bg-foreground text-background data-scrolled:bg-foreground/90",
  brand: "border-primary-foreground/10 bg-primary text-primary-foreground data-scrolled:bg-primary/90",
  image: "bg-muted data-scrolled:bg-muted/90",
} as const;

/** 运行状态档与对应语义色点. */
export const SITE_BLOCK_STATUS = { ok: "ok", degraded: "degraded", down: "down" } as const;
export const SITE_BLOCK_STATUS_CLASS = { ok: "bg-success", degraded: "bg-warning", down: "bg-danger" } as const;

/** 订阅表单的状态机. */
export const SITE_BLOCK_FORM_STATE = { idle: "idle", pending: "pending", success: "success", error: "error" } as const;
export const SITE_BLOCK_INPUT_TYPE = { email: "email", submit: "submit" } as const;

/** 生成零件所需 id 的前缀与分隔符 (零件以 id 作 React key 与 radix value). */
export const SITE_BLOCK_ID = { nav: "nav", group: "group", social: "social", legal: "legal", local: "local", sep: "-" } as const;

/**
 * 站点区块 aria 名称 -> BlockLabels 兜底键. 调用方用 ariaLabels prop 覆盖; 未覆盖时取 BlocksProvider 的内置包.
 * 兜底只保证"有名称", 正式页面应传具体名称 (例如 "主导航", "法务链接").
 */
export const SITE_BLOCK_ARIA_FALLBACK = {
  nav: "menu",
  localNav: "menu",
  mobileOpen: "menu",
  mobileTitle: "menu",
  back: "previous",
  close: "close",
  announcement: "more",
  dismiss: "close",
  footerNav: "menu",
  social: "more",
  legal: "more",
} as const;

/** 复用三次以上或跨文件共用的类名组合. */
export const SITE_BLOCK_CLASS = {
  shellClear: "bg-transparent",
  inherit: "bg-transparent text-inherit",
  surface: "bg-background",
  partStatic: "relative",
  noBlur: "data-scrolled:supports-backdrop-filter:backdrop-blur-none",
  logo: "h-(--control-h-sm) w-auto",
  logoDark: "in-data-[mode=light]:hidden",
  logoLight: "hidden in-data-[mode=light]:inline-block",
  brandLink: "inline-flex items-center gap-2 rounded-(--radius-sm) font-semibold text-inherit",
  actions: "flex items-center gap-2",
  stack: "flex flex-col gap-2",
  muted: "text-sm text-muted-foreground",
  title: "text-sm font-medium",
  localNav: "border-t border-border",
  localNavList: "flex items-center gap-4 overflow-x-auto py-2",
  centerNav: "justify-center",
  clamp: "line-clamp-1 md:line-clamp-none",
  toggle: "ml-2 text-sm font-medium underline underline-offset-4 md:hidden",
  columns: "grid gap-8 @md:grid-cols-2 @3xl:grid-cols-4",
  featured: "grid gap-4 @md:grid-cols-2",
  card: "flex flex-col gap-2 rounded-(--radius-lg) border border-border bg-card p-4 text-card-foreground",
  image: "aspect-video w-full rounded-(--radius-md) object-cover",
  row: "flex items-start gap-3 rounded-(--radius-md) p-2 transition-colors duration-(--duration-fast) hover:bg-accent",
  dot: "inline-block size-2 rounded-full",
  badges: "flex flex-wrap items-center gap-3",
  badge: "h-(--control-h-md) w-auto",
  formRow: "flex flex-col gap-2 sm:flex-row",
} as const;
