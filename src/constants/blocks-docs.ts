/**
 * 文档站区块 (src/blocks/docs) 的取值, 默认档, 兜底文案与视觉类名.
 * 区块内不写颜色 / 字号 / 间距字面量, 一律引用这里的语义类名 (只用语义 token, 线宽 1px).
 * 契约见 docs/reference/2026-ui-library-blocks-design.md 第 4.4 节; 结构取证见视觉审计 B17 与 2.5 (shadcn / mantine / ant.design).
 */

/** Callout 四档语义. */
export const CALLOUT_KIND = { note: "note", tip: "tip", warning: "warning", danger: "danger" } as const;

/** Callout 语义 -> 读屏角色: danger 用 alert 之外的 note, 避免静态内容被当作实时告警播报. */
export const CALLOUT_ROLE = { note: "note", tip: "note", warning: "note", danger: "note" } as const;

/** Callout 语义 -> 边框 / 底色 / 图标色 (全部为语义 token). */
export const CALLOUT_TONE_CLASS = {
  note: "border-[var(--info,var(--primary))]/40 bg-[var(--info-subtle,var(--muted))] [--callout-accent:var(--info,var(--primary))]",
  tip: "border-[var(--success,var(--primary))]/40 bg-[var(--success-subtle,var(--muted))] [--callout-accent:var(--success,var(--primary))]",
  warning: "border-[var(--warning,var(--primary))]/40 bg-[var(--warning-subtle,var(--muted))] [--callout-accent:var(--warning,var(--primary))]",
  danger: "border-destructive/40 bg-[var(--destructive-subtle,var(--muted))] [--callout-accent:var(--destructive)]",
} as const;

/** Callout 语义 -> 默认图标 (Iconify 类串, 可经 icon prop 覆盖). */
export const CALLOUT_ICON = {
  note: "icon-[solar--info-circle-linear]",
  tip: "icon-[solar--lightbulb-linear]",
  warning: "icon-[solar--danger-triangle-linear]",
  danger: "icon-[solar--danger-circle-linear]",
} as const;

/** 三栏宽度 token: 皮肤或调用方可在祖先上覆盖这三个变量. */
export const DOCS_WIDTH_VAR = {
  sidebar: "--docs-sidebar-width",
  main: "--docs-main-width",
  toc: "--docs-toc-width",
  header: "--docs-header-height",
} as const;

/** 区块默认档. */
export const DOCS_DEFAULT = {
  calloutKind: "note",
  /** 标题采集: 正文里这些层级的带 id 标题进入 TOC. */
  headingSelector: "h2[id], h3[id]",
  /** 当前节判定带: 视口上 10% 以下, 下 70% 以上. */
  spyRootMargin: "0px 0px -70% 0px",
  spyThreshold: 0,
  hashPrefix: "#",
  /** 类型串长度超过它时折叠 (ApiTable). */
  typeCollapseAt: 48,
  /** TOC 第一级深度; depth 大于它的项缩进. */
  tocBaseDepth: 2,
  tocMaxDepth: 4,
  /** 首页卡片列数 (容器查询). */
  homeCols: 3,
  searchShortcut: "⌘K",
} as const;

/** 可见兜底文案 (中文, 均可经 labels 覆盖). */
export const DOCS_TEXT_ZH = {
  sidebar: "文档导航",
  openSidebar: "打开文档导航",
  toc: "本页目录",
  tocToggle: "本页目录",
  pager: "上一页与下一页",
  prev: "上一页",
  next: "下一页",
  apiName: "属性",
  apiType: "类型",
  apiDefault: "默认值",
  apiDescription: "说明",
  apiRequired: "必填",
  apiCaption: "API",
  expandType: "展开类型",
  collapseType: "收起类型",
  note: "注意",
  tip: "提示",
  warning: "警告",
  danger: "危险",
  search: "搜索文档",
  searchPlaceholder: "搜索文档…",
  skipToContent: "跳到正文",
  empty: "暂无内容",
} as const;

/** 可见兜底文案 (英文). */
export const DOCS_TEXT_EN = {
  sidebar: "Docs navigation",
  openSidebar: "Open docs navigation",
  toc: "On this page",
  tocToggle: "On this page",
  pager: "Previous and next page",
  prev: "Previous",
  next: "Next",
  apiName: "Prop",
  apiType: "Type",
  apiDefault: "Default",
  apiDescription: "Description",
  apiRequired: "Required",
  apiCaption: "API",
  expandType: "Expand type",
  collapseType: "Collapse type",
  note: "Note",
  tip: "Tip",
  warning: "Warning",
  danger: "Danger",
  search: "Search docs",
  searchPlaceholder: "Search docs…",
  skipToContent: "Skip to content",
  empty: "Nothing here yet",
} as const satisfies Record<keyof typeof DOCS_TEXT_ZH, string>;

export const DOCS_TEXT_PACKS = { zh: DOCS_TEXT_ZH, en: DOCS_TEXT_EN } as const;
export const DOCS_TEXT_FALLBACK = "zh";

/** data-slot 名. */
export const DOCS_SLOT = {
  shell: "docs-shell",
  topbar: "docs-topbar",
  sidebar: "docs-sidebar",
  sidebarGroup: "docs-sidebar-group",
  sidebarLink: "docs-sidebar-link",
  main: "docs-main",
  article: "docs-article",
  aside: "docs-aside",
  toc: "docs-toc",
  tocItem: "docs-toc-item",
  tocMobile: "docs-toc-mobile",
  pager: "docs-pager",
  pagerLink: "docs-pager-link",
  api: "api-table",
  apiRow: "api-table-row",
  apiType: "api-table-type",
  callout: "callout",
  calloutIcon: "callout-icon",
  calloutTitle: "callout-title",
  calloutBody: "callout-body",
  home: "docs-home",
  homeHero: "docs-home-hero",
  homeSearch: "docs-home-search",
  homeCards: "docs-home-cards",
  homeCard: "docs-home-card",
} as const;

/** classNames 的 slot 元组 (公开 API, 改名为破坏性变更). */
export const DOCS_SHELL_SLOTS = ["root", "topbar", "sidebar", "main", "article", "aside", "pager"] as const;
export const DOCS_TOC_SLOTS = ["root", "title", "list", "item", "link"] as const;
export const DOCS_PAGER_SLOTS = ["root", "link", "direction", "label"] as const;
export const API_TABLE_SLOTS = ["root", "table", "row", "name", "type", "default", "description"] as const;
export const CALLOUT_SLOTS = ["root", "icon", "title", "body"] as const;
export const DOCS_HOME_SLOTS = ["root", "hero", "search", "cards", "card"] as const;

/** data-* 状态值. */
export const DOCS_FLAG = { on: "true" } as const;

/** 视觉类名. 尺寸与色彩全部走 token / Tailwind 语义刻度. */
export const DOCS_CLASS = {
  srOnly: "sr-only",
  focus: "focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring",
  /* DocsShell: 三栏 = 侧栏 / 正文 / 目录; 容器查询而非视口断点 */
  shellRoot:
    "@container/docs relative w-full bg-background text-foreground [--docs-sidebar-width:calc(var(--spacing)*64)] [--docs-main-width:calc(var(--spacing)*192)] [--docs-toc-width:calc(var(--spacing)*56)] [--docs-header-height:calc(var(--spacing)*14)]",
  skip: "sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-(--radius-md) focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-(--shadow-md)",
  topbar:
    "sticky top-0 z-30 flex h-(--docs-header-height) items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 @5xl/docs:px-6",
  topbarMain: "flex min-w-0 flex-1 items-center gap-3",
  menuButton: "@5xl/docs:hidden",
  grid:
    "mx-auto grid w-full max-w-[calc(var(--docs-sidebar-width)+var(--docs-main-width)+var(--docs-toc-width)+calc(var(--spacing)*24))] grid-cols-1 gap-8 px-4 @5xl/docs:grid-cols-[var(--docs-sidebar-width)_minmax(0,1fr)] @5xl/docs:px-6 @7xl/docs:grid-cols-[var(--docs-sidebar-width)_minmax(0,1fr)_var(--docs-toc-width)]",
  gridNoToc: "@7xl/docs:grid-cols-[var(--docs-sidebar-width)_minmax(0,1fr)]",
  sidebarCol:
    "hidden @5xl/docs:sticky @5xl/docs:top-(--docs-header-height) @5xl/docs:block @5xl/docs:h-[calc(100dvh-var(--docs-header-height))] @5xl/docs:overflow-y-auto @5xl/docs:overscroll-contain @5xl/docs:py-8",
  sidebarSheet: "w-(--docs-sidebar-width) max-w-[85vw] p-4 pt-12",
  main: "min-w-0 py-8 @5xl/docs:py-10",
  article: "mx-auto flex w-full max-w-(--docs-main-width) min-w-0 flex-col gap-6",
  asideCol:
    "hidden @7xl/docs:sticky @7xl/docs:top-(--docs-header-height) @7xl/docs:block @7xl/docs:h-[calc(100dvh-var(--docs-header-height))] @7xl/docs:overflow-y-auto @7xl/docs:py-10",
  tocMobile: "rounded-(--radius-md) border border-border @7xl/docs:hidden",
  tocMobileSummary:
    "flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden",
  tocMobileChevron: "size-4 transition-transform duration-(--duration-fast,150ms) group-open:rotate-180 motion-reduce:transition-none",
  tocMobileBody: "border-t border-border px-4 py-3",
  /* 侧栏 */
  sidebarNav: "flex flex-col gap-6 text-sm",
  sidebarGroup: "flex flex-col gap-1",
  sidebarGroupTitle: "px-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase",
  sidebarList: "flex flex-col gap-0.5",
  sidebarLink:
    "flex items-center gap-2 rounded-(--radius-md) px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-[var(--primary-subtle,var(--muted))] aria-[current=page]:font-medium aria-[current=page]:text-primary",
  sidebarBadge: "ms-auto inline-flex items-center rounded-full border border-border px-1.5 text-xs text-muted-foreground",
  /* DocsToc */
  tocRoot: "flex flex-col gap-3 text-sm",
  tocTitle: "text-xs font-semibold tracking-wide text-muted-foreground uppercase",
  tocList: "flex flex-col gap-1 border-s border-border",
  tocLink:
    "-ms-px block border-s border-transparent py-1 ps-3 text-muted-foreground hover:text-foreground aria-[current=location]:border-primary aria-[current=location]:font-medium aria-[current=location]:text-foreground",
  tocDepth: { 2: "", 3: "ps-6", 4: "ps-9" } as Record<number, string>,
  /* DocsPager */
  pager: "grid gap-4 border-t border-border pt-6 @xl:grid-cols-2",
  pagerLink:
    "group flex flex-col gap-1 rounded-(--radius-lg) border border-border p-4 hover:border-foreground/30 hover:bg-muted/50",
  pagerNext: "@xl:col-start-2 items-end text-end",
  pagerDirection: "inline-flex items-center gap-1 text-xs text-muted-foreground",
  pagerLabel: "font-medium text-heading group-hover:text-link",
  pagerArrow: "size-3.5 rtl:-scale-x-100",
  /* ApiTable */
  apiWrap: "w-full overflow-x-auto rounded-(--radius-lg) border border-border",
  apiTable: "w-full text-sm",
  apiName: "font-mono text-sm font-medium whitespace-nowrap text-heading",
  apiRequired: "ms-1 text-destructive",
  apiType: "font-mono text-xs break-words text-[var(--code-foreground,var(--foreground))]",
  apiTypeBox: "inline-flex max-w-full flex-wrap items-start gap-1",
  apiTypeToggle: "inline-flex items-center gap-1 rounded-sm text-xs text-link hover:underline",
  apiDefault: "font-mono text-xs text-muted-foreground whitespace-nowrap",
  apiCode: "rounded-sm bg-muted px-1 py-0.5",
  apiDescription: "min-w-48 text-muted-foreground",
  apiEmpty: "text-muted-foreground",
  /* Callout */
  callout: "flex gap-3 rounded-(--radius-lg) border p-4 text-sm",
  calloutIcon: "mt-0.5 size-4 shrink-0 text-(--callout-accent)",
  calloutText: "flex min-w-0 flex-col gap-1",
  calloutTitle: "font-medium text-heading",
  calloutBody: "text-foreground/90 [&_a]:text-link [&_a]:underline [&>p+p]:mt-2",
  /* DocsHome */
  homeHero: "flex flex-col gap-6",
  homeSearch:
    "inline-flex w-full max-w-md items-center gap-3 rounded-(--radius-lg) border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground shadow-(--shadow-xs,none) hover:border-foreground/30",
  homeSearchIcon: "size-4",
  homeSearchText: "flex-1 text-start",
  homeKbd: "rounded-sm border border-border bg-muted px-1.5 font-mono text-xs",
  homeCards: "grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3",
  homeCard:
    "group relative flex flex-col gap-2 rounded-(--radius-lg) border border-border bg-card p-5 hover:border-foreground/30",
  homeCardIcon: "inline-flex size-9 items-center justify-center rounded-(--radius-md) bg-[var(--primary-subtle,var(--muted))] text-primary",
  homeCardTitle: "font-medium text-heading",
  homeCardLink: "rounded-sm after:absolute after:inset-0 after:content-[''] group-hover:text-link",
  homeCardBody: "text-sm text-muted-foreground",
  homeCardBadge: "inline-flex w-fit items-center rounded-full border border-border px-2 text-xs text-muted-foreground",
} as const;

/** 文档页 (docs/src/pages/blocks/docs-v109) 的演示取值与类名. */
export const DOCS_DOC = {
  skins: ["default", "mono", "retail"],
  stage: "w-full overflow-hidden rounded-(--radius-lg) border border-border bg-background",
  stageTall: "h-[calc(var(--spacing)*160)] overflow-y-auto",
  grid: "grid w-full gap-6",
  skinFrame: "overflow-hidden rounded-(--radius-lg) border border-border bg-background text-foreground",
  skinTag: "border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground",
  brand: "font-semibold text-heading",
  muted: "text-muted-foreground",
} as const;
