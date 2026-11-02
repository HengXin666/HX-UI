/**
 * 作品集区块 (src/blocks/portfolio) 的取值, 默认档, 兜底文案与视觉类名.
 * 区块内不写颜色 / 字号 / 间距字面量, 一律引用这里的语义类名 (只用语义 token, 线宽 1px).
 * 契约见 docs/reference/2026-ui-library-blocks-design.md 第 4.6 节.
 */

/** ProfileHero 版式: 左对齐 / 居中 / 极简纯文字 (leerob). */
export const PORTFOLIO_HERO_LAYOUT = { start: "start", centered: "centered", minimal: "minimal" } as const;

/** ProjectGrid 两档: 网格卡片 / 列表行. */
export const PORTFOLIO_PROJECT_LAYOUT = { grid: "grid", list: "list" } as const;

/** ExperienceTimeline / ProjectGrid / PostList 的数据驱动 data-* 状态值. */
export const PORTFOLIO_FLAG = { on: "true" } as const;

/** 区块默认档. */
export const PORTFOLIO_DEFAULT = {
  heroLayout: "start",
  projectLayout: "grid",
  avatarRatio: 1,
  thumbRatio: 16 / 9,
  /** 页内导航判定区: 视口上 20% 以下, 下 60% 以上的带状区域内的节视为当前. */
  spyRootMargin: "-20% 0px -60% 0px",
  spyThreshold: 0,
  hashPrefix: "#",
  /** Media.ratio 字符串 "16/9" 的分隔符. */
  ratioSeparator: "/",
  previewWidth: 240,
  previewHeight: 150,
  /** 悬停预览跟随指针的 CSS 变量名. */
  previewXVar: "--hx-preview-x",
  pxUnit: "px",
} as const;

/** 可见兜底文案 (均可经 props 覆盖). */
export const PORTFOLIO_TEXT_ZH = {
  nav: "页内导航",
  social: "社交链接",
  featured: "精选",
  current: "在职",
  rss: "RSS 订阅",
  allPosts: "全部文章",
  experience: "经历",
  projects: "项目",
  posts: "文章",
} as const;

/** data-slot 名. */
export const PORTFOLIO_SLOT = {
  hero: "profile-hero",
  heroName: "profile-hero-name",
  heroRole: "profile-hero-role",
  heroBio: "profile-hero-bio",
  heroAvatar: "profile-hero-avatar",
  social: "profile-social",
  sticky: "sticky-profile-layout",
  stickyAside: "sticky-profile-aside",
  stickyNav: "sticky-profile-nav",
  stickyMain: "sticky-profile-main",
  timeline: "experience-timeline",
  timelineItem: "experience-timeline-item",
  timelineToggle: "experience-timeline-toggle",
  tags: "portfolio-tags",
  projects: "project-grid",
  project: "project-card",
  posts: "post-list",
  postYear: "post-list-year",
  post: "post-list-item",
  preview: "hover-preview-link",
} as const;

/** 视觉类名. 尺寸与色彩全部走 token / Tailwind 语义刻度. */
export const PORTFOLIO_CLASS = {
  srOnly: "sr-only",
  /* ProfileHero */
  heroRoot: "flex flex-col gap-6",
  heroCentered: "items-center text-center",
  heroStart: "items-start text-start",
  heroRow: "flex flex-col gap-6 @2xl:flex-row @2xl:items-center",
  heroText: "flex min-w-0 flex-col gap-3",
  heroName: "text-heading text-[length:var(--fs-display-lg,var(--text-5xl))]",
  heroNameMinimal: "text-heading text-[length:var(--fs-2xl,var(--text-2xl))] font-semibold tracking-tight",
  heroRole: "text-[length:var(--fs-xl,var(--text-xl))] font-medium text-foreground",
  heroBio: "max-w-prose text-muted-foreground",
  avatar: "size-24 shrink-0 overflow-hidden rounded-full border border-border @2xl:size-32",
  /* 社交链接 */
  socialList: "flex flex-wrap items-center gap-4",
  socialLink: "inline-flex items-center gap-2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring",
  socialIcon: "inline-flex size-5 items-center justify-center",
  /* StickyProfileLayout */
  stickyRoot: "flex flex-col gap-12 @5xl:flex-row @5xl:justify-between @5xl:gap-8",
  stickyAside: "flex flex-col gap-8 @5xl:sticky @5xl:top-0 @5xl:max-h-dvh @5xl:w-5/12 @5xl:justify-between @5xl:py-[var(--section-pad-md,calc(var(--spacing)*20))]",
  stickyMain: "min-w-0 @5xl:w-7/12 @5xl:py-[var(--section-pad-md,calc(var(--spacing)*20))]",
  stickyHeader: "flex flex-col gap-3",
  stickyNav: "hidden @5xl:block",
  stickyNavList: "flex flex-col gap-1",
  stickyNavLink: "group flex items-center gap-4 rounded-sm py-2 text-sm font-medium tracking-wide text-muted-foreground uppercase hover:text-foreground focus-visible:outline-1 focus-visible:outline-ring aria-[current=location]:text-foreground",
  stickyNavLine: "h-px w-8 bg-border transition-[width] duration-(--duration-fast,150ms) group-hover:w-16 group-hover:bg-foreground group-aria-[current=location]:w-16 group-aria-[current=location]:bg-foreground motion-reduce:transition-none",
  /* 标签 chips */
  tagList: "flex flex-wrap gap-2",
  tag: "inline-flex items-center rounded-full bg-[var(--primary-subtle)] px-3 py-1 text-xs font-medium text-primary",
  /* ExperienceTimeline */
  timelineList: "flex flex-col gap-10",
  timelineItem: "group relative grid gap-2 rounded-(--radius-md) border border-transparent @2xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] @2xl:gap-6 data-[current=true]:border-border data-[current=true]:bg-card data-[current=true]:p-4",
  timelinePeriod: "text-xs font-semibold tracking-wide text-muted-foreground uppercase tabular-nums",
  timelineBody: "flex min-w-0 flex-col gap-3",
  timelineTitle: "font-medium leading-snug text-heading",
  timelineOrgLink: "rounded-sm hover:text-link focus-visible:outline-1 focus-visible:outline-ring",
  timelineSep: "text-muted-foreground",
  currentBadge: "ms-2 inline-flex items-center rounded-full border border-primary px-2 text-xs font-medium text-primary",
  toggle: "mt-8 inline-flex items-center gap-2 rounded-sm text-sm font-medium text-link hover:underline focus-visible:outline-1 focus-visible:outline-ring",
  /* ProjectGrid */
  gridLayout: "grid gap-6 @xl:grid-cols-2 @4xl:grid-cols-3",
  listLayout: "flex flex-col gap-8",
  card: "group relative flex flex-col gap-4 rounded-(--radius-lg) border border-border bg-card p-4 hover:border-foreground/30",
  row: "group relative grid gap-4 rounded-(--radius-md) @xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] @xl:gap-6",
  thumb: "overflow-hidden rounded-(--radius-md) border border-border",
  thumbImage: "transition-transform duration-(--duration-normal,300ms) group-hover:scale-105 group-focus-within:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-within:scale-100",
  cardBody: "flex min-w-0 flex-col gap-3",
  cardTitleRow: "flex flex-wrap items-center gap-2",
  cardTitle: "font-medium leading-snug text-heading",
  cardLink: "inline-flex items-center gap-1 rounded-sm group-hover:text-link focus-visible:outline-1 focus-visible:outline-ring after:absolute after:inset-0 after:content-['']",
  arrow: "inline-flex size-4 transition-transform duration-(--duration-fast,150ms) group-hover:translate-x-1 group-hover:-translate-y-1 group-focus-within:translate-x-1 group-focus-within:-translate-y-1 motion-reduce:transition-none motion-reduce:transform-none rtl:-scale-x-100",
  featured: "inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground",
  extraLinks: "relative z-10 flex flex-wrap gap-4 text-sm",
  /* PostList */
  postsHeader: "mb-8 flex flex-wrap items-center justify-between gap-4",
  postsActions: "flex items-center gap-4",
  rssLink: "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-1 focus-visible:outline-ring",
  allPostsLink: "inline-flex items-center gap-1 rounded-sm text-sm font-medium text-link hover:underline focus-visible:outline-1 focus-visible:outline-ring",
  yearGroup: "grid gap-4 border-t border-border pt-6 first:border-t-0 first:pt-0 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,5fr)]",
  yearLabel: "text-sm font-semibold text-muted-foreground tabular-nums",
  postItems: "flex flex-col gap-6",
  postsGroups: "flex flex-col gap-10",
  postRow: "flex flex-col gap-1",
  postHead: "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1",
  postDate: "shrink-0 text-sm text-muted-foreground tabular-nums",
  /* HoverPreviewLink */
  previewHost: "group/preview relative inline-block",
  previewCard: "pointer-events-none absolute bottom-full start-[var(--hx-preview-x,0px)] z-20 mb-3 -translate-x-1/2 translate-y-1 overflow-hidden rounded-(--radius-md) border border-border bg-popover opacity-0 shadow-(--shadow-lg,var(--shadow-md)) transition-[opacity,translate] duration-(--duration-fast,150ms) group-hover/preview:translate-y-0 group-hover/preview:opacity-100 group-focus-within/preview:translate-y-0 group-focus-within/preview:opacity-100 motion-reduce:transition-none rtl:translate-x-1/2",
} as const;

/** 文档页 (docs/src/pages/blocks/portfolio-v111) 的演示取值与类名. */
export const PORTFOLIO_DOC = {
  /** 三皮肤演示 (设计文档 7: default / mono / retail 回归组合). */
  skins: ["default", "mono", "retail"],
  imageLabels: ["Atlas", "Lumen", "Orbit", "Quill"],
  avatarLabel: ["HX"],
  stage: "w-full overflow-hidden rounded-(--radius-lg) border border-border bg-background",
  skinGrid: "grid w-full gap-6",
  skinFrame: "overflow-hidden rounded-(--radius-lg) border border-border bg-background text-foreground",
  skinTag: "border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground",
  inline: "text-muted-foreground",
  timelineLimit: 3,
  postLimit: 4,
} as const;
