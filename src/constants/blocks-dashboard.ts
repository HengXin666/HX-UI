/**
 * 仪表盘区块 (src/blocks/dashboard) 的取值, 默认档, 兜底文案, data-slot 与视觉类名.
 * 区块内不写颜色 / 字号 / 间距字面量, 一律引用这里的语义类名 (只用语义 token, 线宽 1px).
 * 契约见 docs/reference/2026-ui-library-blocks-design.md 第 4.5 节; 默认 compact 密度见第 3.4 节.
 */
import { BLOCK_LANG_SEPARATOR } from "./blocks";

/** 区块默认档. */
export const DASH_DEFAULT = {
  density: "compact",
  kpiColumns: 4,
  chartHeight: 260,
  /** ActivityFeed 默认最多显示条数; 超出给 "查看全部". */
  feedMax: 8,
  /** 时间超过这么多毫秒 (7 天) 后不再用相对时间, 改为绝对日期. */
  relativeLimitMs: 7 * 24 * 60 * 60 * 1000,
  pad: "sm",
  width: "full",
} as const;

/** KpiRow 列数档, 与 layout/StatGrid 同构. */
export const DASH_KPI_COLUMNS = [2, 3, 4, 5] as const;

/** 相对时间的分级: [阈值毫秒, Intl.RelativeTimeFormat 单位, 每单位毫秒]. */
export const DASH_TIME_STEPS = [
  [60 * 1000, "second", 1000],
  [60 * 60 * 1000, "minute", 60 * 1000],
  [24 * 60 * 60 * 1000, "hour", 60 * 60 * 1000],
  [Number.POSITIVE_INFINITY, "day", 24 * 60 * 60 * 1000],
] as const;

/** 绝对日期的 Intl 选项. */
export const DASH_DATE_FORMAT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
export const DASH_PERCENT_FORMAT: Intl.NumberFormatOptions = { style: "percent", maximumFractionDigits: 0 };

/** 图标 (Iconify 类串, 均可经 props 覆盖). */
export const DASH_ICON = {
  menu: "icon-[solar--hamburger-menu-linear]",
  collapse: "icon-[sidebar-minimalistic-linear]",
  check: "icon-[solar--check-circle-bold]",
  pending: "icon-[solar--record-linear]",
  arrow: "icon-[solar--arrow-right-linear]",
  activity: "icon-[solar--history-linear]",
} as const;

/** 可见兜底文案 (中文, 均可经 labels 覆盖). {done} {total} 为占位. */
export const DASH_TEXT_ZH = {
  sidebar: "主导航",
  openSidebar: "打开导航",
  collapseSidebar: "收起侧栏",
  expandSidebar: "展开侧栏",
  skipToContent: "跳到正文",
  kpi: "关键指标",
  range: "时间范围",
  chartEmpty: "暂无数据",
  activity: "最近动态",
  activityEmpty: "暂无动态",
  viewAll: "查看全部",
  checklist: "上手清单",
  progress: "已完成 {done} / {total}",
  done: "已完成",
  todo: "未完成",
  allDone: "全部完成",
} as const;

/** 可见兜底文案 (英文). */
export const DASH_TEXT_EN = {
  sidebar: "Main navigation",
  openSidebar: "Open navigation",
  collapseSidebar: "Collapse sidebar",
  expandSidebar: "Expand sidebar",
  skipToContent: "Skip to content",
  kpi: "Key metrics",
  range: "Time range",
  chartEmpty: "No data yet",
  activity: "Recent activity",
  activityEmpty: "No activity yet",
  viewAll: "View all",
  checklist: "Getting started",
  progress: "{done} of {total} done",
  done: "Done",
  todo: "To do",
  allDone: "All done",
} as const satisfies Record<keyof typeof DASH_TEXT_ZH, string>;

export const DASH_TEXT_PACKS = { zh: DASH_TEXT_ZH, en: DASH_TEXT_EN } as const;
export const DASH_TEXT_FALLBACK = "zh";
export type DashText = { [K in keyof typeof DASH_TEXT_ZH]: string };

/**
 * 按 locale 取中英文案包, 再叠加调用方的 labels (显式 undefined 不覆盖). 纯函数, 各区块共用而互不 import.
 */
export function dashText(locale: string, labels?: Partial<Record<string, string>>): DashText {
  const language = locale.split(BLOCK_LANG_SEPARATOR)[0].toLowerCase() as keyof typeof DASH_TEXT_PACKS;
  const pack: DashText = { ...(DASH_TEXT_PACKS[language] ?? DASH_TEXT_PACKS[DASH_TEXT_FALLBACK]) };
  for (const [key, value] of Object.entries(labels ?? {})) {
    if (value !== undefined && key in pack) (pack as Record<string, string>)[key] = value;
  }
  return pack;
}

/** 文案占位替换: fill("{done}/{total}", { done: 1, total: 3 }). */
export function dashFill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** data-slot 名. */
export const DASH_SLOT = {
  shell: "dashboard-shell",
  sidebar: "dashboard-sidebar",
  nav: "dashboard-nav",
  navGroup: "dashboard-nav-group",
  navLink: "dashboard-nav-link",
  topbar: "dashboard-topbar",
  main: "dashboard-main",
  kpi: "kpi-row",
  kpiItem: "kpi-row-item",
  chart: "chart-panel",
  chartHeader: "chart-panel-header",
  chartTitle: "chart-panel-title",
  chartRange: "chart-panel-range",
  chartBody: "chart-panel-body",
  chartFooter: "chart-panel-footer",
  feed: "activity-feed",
  feedItem: "activity-feed-item",
  feedTime: "activity-feed-time",
  checklist: "onboarding-checklist",
  checklistProgress: "onboarding-checklist-progress",
  checklistStep: "onboarding-checklist-step",
} as const;

/** classNames 的 slot 元组 (公开 API, 改名为破坏性变更). */
export const DASH_SHELL_SLOTS = ["root", "sidebar", "nav", "topbar", "main"] as const;
export const KPI_ROW_SLOTS = ["root", "grid", "item"] as const;
export const CHART_PANEL_SLOTS = ["root", "header", "title", "range", "body", "footer"] as const;
export const ACTIVITY_FEED_SLOTS = ["root", "list", "item", "avatar", "text", "time"] as const;
export const ONBOARDING_SLOTS = ["root", "progress", "list", "step", "cta"] as const;

/** 视觉类名. 尺寸与色彩全部走 token / Tailwind 语义刻度. */
export const DASH_CLASS = {
  srOnly: "sr-only",
  focus: "focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring",
  skip: "sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-(--radius-md) focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-(--shadow-md)",
  /* DashboardShell: 侧栏 + 主区; 容器查询而非视口断点 */
  shellRoot:
    "@container/dash relative flex min-h-full w-full bg-background text-foreground [--dash-sidebar-width:calc(var(--spacing)*60)] [--dash-sidebar-collapsed:calc(var(--spacing)*14)] [--dash-header-height:calc(var(--spacing)*12)]",
  sidebarCol:
    "hidden shrink-0 flex-col border-e border-border bg-[var(--sidebar,var(--muted))] @4xl/dash:sticky @4xl/dash:top-0 @4xl/dash:flex @4xl/dash:h-dvh w-(--dash-sidebar-width) transition-[width] duration-(--duration-fast,150ms) motion-reduce:transition-none data-[collapsed=true]:w-(--dash-sidebar-collapsed)",
  sidebarHead: "flex h-(--dash-header-height) shrink-0 items-center gap-2 border-b border-border px-3",
  sidebarBrand: "min-w-0 flex-1 truncate font-semibold text-heading",
  sidebarScroll: "flex-1 overflow-y-auto overscroll-contain p-2",
  sidebarFoot: "border-t border-border p-2",
  sheet: "w-(--dash-sidebar-width) max-w-[85vw] p-2 pt-12",
  nav: "flex flex-col gap-4 text-sm",
  navGroup: "flex flex-col gap-0.5",
  navGroupTitle: "px-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase",
  navLink:
    "flex h-(--control-h-md,calc(var(--spacing)*8)) items-center gap-2 rounded-(--radius-md) px-2 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground aria-[current=page]:bg-[var(--primary-subtle,var(--muted))] aria-[current=page]:font-medium aria-[current=page]:text-foreground",
  navIcon: "size-4 shrink-0",
  navLabel: "min-w-0 flex-1 truncate",
  navBadge: "ms-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-xs text-link",
  navCollapsed: "justify-center px-0",
  main: "flex min-w-0 flex-1 flex-col",
  topbar:
    "sticky top-0 z-20 flex h-(--dash-header-height) shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur @4xl/dash:px-4",
  topbarTitle: "min-w-0 flex-1 truncate text-sm font-semibold text-heading",
  topbarActions: "flex shrink-0 items-center gap-2",
  menuButton: "@4xl/dash:hidden",
  collapseButton: "hidden @4xl/dash:inline-flex",
  content: "flex min-w-0 flex-1 flex-col gap-4 p-3 @4xl/dash:p-4",
  /* 通用卡片外观 (ChartPanel / ActivityFeed / OnboardingChecklist) */
  panel: "flex min-w-0 flex-col rounded-(--radius-lg) border border-border bg-card text-card-foreground",
  panelHeader: "flex flex-wrap items-start gap-2 border-b border-border px-4 py-3",
  panelHeadText: "flex min-w-0 flex-1 flex-col gap-0.5",
  panelTitle: "text-sm font-semibold text-heading",
  panelDescription: "text-xs text-muted-foreground",
  panelActions: "flex shrink-0 flex-wrap items-center gap-2",
  panelBody: "min-w-0 p-4",
  panelValue: "mt-1 text-[length:var(--fs-2xl)] font-semibold leading-none tabular-nums text-heading",
  headerFlush: "border-0 pb-0",
  headerBare: "border-0 px-0",
  kpiLink: "block rounded-(--radius-lg)",
  flipRtl: "rtl:-scale-x-100",
  panelFooter: "border-t border-border px-4 py-2 text-xs text-muted-foreground",
  /* ChartPanel 时间范围 */
  range: "inline-flex items-center gap-0.5 rounded-(--radius-md) border border-border p-0.5",
  rangeItem:
    "h-(--control-h-xs,calc(var(--spacing)*6)) rounded-(--radius-sm) px-2 text-xs text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-secondary aria-pressed:font-medium aria-pressed:text-foreground",
  chartEmpty: "grid place-items-center text-sm text-muted-foreground",
  /* KpiRow */
  kpiItem: "min-w-0",
  kpiSkeleton: "h-(--control-h-xl,calc(var(--spacing)*24)) w-full rounded-(--radius-lg)",
  /* ActivityFeed */
  feedList: "flex flex-col",
  feedItem: "flex items-start gap-3 py-2.5 not-last:border-b not-last:border-border",
  feedAvatar: "size-8 shrink-0",
  feedText: "min-w-0 flex-1 text-sm leading-snug text-muted-foreground",
  feedActor: "font-medium text-foreground",
  feedTarget: "font-medium text-link hover:underline",
  feedTime: "shrink-0 text-xs text-muted-foreground tabular-nums",
  feedEmpty: "py-6 text-center text-sm text-muted-foreground",
  /* OnboardingChecklist */
  checkProgress: "flex flex-col gap-2 px-4 pt-3",
  checkProgressText: "text-xs text-muted-foreground tabular-nums",
  checkList: "flex flex-col p-2",
  checkStep: "flex items-start gap-3 rounded-(--radius-md) px-2 py-2.5",
  checkIcon: "mt-0.5 size-4 shrink-0",
  checkIconDone: "text-success-fg",
  checkIconTodo: "text-muted-foreground",
  checkText: "flex min-w-0 flex-1 flex-col gap-0.5",
  checkTitle: "text-sm font-medium text-foreground",
  checkTitleDone: "text-muted-foreground line-through",
  checkDescription: "text-xs text-muted-foreground",
} as const;

/** 文档页 (docs/src/pages/blocks/dashboard-v110) 的演示取值与类名. */
export const DASH_DOC = {
  skins: ["default", "mono", "retail"],
  stage: "w-full overflow-hidden rounded-(--radius-lg) border border-border bg-background",
  stageTall: "h-[calc(var(--spacing)*180)] overflow-y-auto",
  grid: "grid w-full gap-4 @4xl:grid-cols-2",
  stack: "grid w-full gap-4",
  skinFrame: "overflow-hidden rounded-(--radius-lg) border border-border bg-background text-foreground",
  skinTag: "border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground",
  brand: "font-semibold text-heading",
} as const;
