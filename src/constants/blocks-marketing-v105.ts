/**
 * 营销区块 D (转化): Pricing / ComparisonMatrix / Faq 的取值, 类名与默认文案.
 * 区块内不写颜色/字号/间距字面量, 一律从这里取; 类名写全字面量, Tailwind 才扫得到.
 * 金额与数字的格式化不在这里拼, 全部走 commerce Price 与 BlocksProvider 的 Intl 能力.
 *
 * .agents/notes/implemented/feature/2026-11-02-marketing-conversion-blocks.md
 */

/** 计费周期 (与 MONEY_PERIOD 的 month / year 同值). */
export const PRICING_BILLING = { month: "month", year: "year" } as const;

/** 档位种类: 标准 / 免费 / 联系销售. */
export const PRICING_PLAN_KIND = { standard: "standard", free: "free", contact: "contact" } as const;

/** 年付折算月价时的月数, 以及百分比格式的 Intl 选项. */
export const PRICING_NUMBERS = { monthsPerYear: 12, minPlans: 2, maxPlans: 4 } as const;
export const V105_INTL = { percent: "percent" } as const;

/** FAQ 版式列数. 2 = 标题左, 问答右. */
export const FAQ_COLUMNS = { single: 1, split: 2 } as const;

/** 对比矩阵单元格的值种类 (渲染分派用). */
export const MATRIX_CELL = { yes: "yes", no: "no", text: "text", icon: "icon" } as const;

/** data-slot 取值. */
export const V105_SLOT = {
  pricing: "pricing",
  pricingToggle: "pricing-toggle",
  pricingPlan: "pricing-plan",
  pricingBadge: "pricing-badge",
  pricingPrice: "pricing-price",
  pricingNote: "pricing-note",
  pricingFeatures: "pricing-features",
  pricingIncludes: "pricing-includes",
  matrix: "comparison-matrix",
  matrixTable: "comparison-matrix-table",
  matrixCards: "comparison-matrix-cards",
  matrixDiff: "comparison-matrix-diff",
  faq: "faq",
  faqSearch: "faq-search",
  faqGroup: "faq-group",
  faqItem: "faq-item",
  faqContact: "faq-contact",
} as const;

/** 共享的小部件类名 (被三个区块反复使用). */
export const V105_CLASS = {
  srOnly: "sr-only",
  check: "size-4 shrink-0 text-primary in-data-[block-tone=brand]:text-primary-foreground",
  cross: "size-4 shrink-0 text-muted-foreground",
  muted: "text-sm text-muted-foreground",
  stack: "flex flex-col gap-4",
  row: "flex items-start gap-2 text-sm",
  groupTitle: "text-sm font-semibold text-foreground",
  toggleWrap: "mb-8 flex flex-wrap items-center gap-3",
  toggle: "inline-flex rounded-full border border-border bg-muted p-1",
  toggleItem: "rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors aria-checked:bg-background aria-checked:text-foreground aria-checked:shadow-sm",
  save: "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
} as const;

/** 档位数 -> 网格列 (移动端单列, md 两列, lg 按档数). */
export const PRICING_GRID_CLASS = {
  2: "grid gap-6 md:grid-cols-2",
  3: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
  4: "grid gap-6 md:grid-cols-2 lg:grid-cols-4",
} as const;

export const PRICING_CLASS = {
  plan: "relative flex flex-col gap-6 rounded-(--radius-lg) border border-border bg-card p-6 text-card-foreground text-start",
  planHighlight: "order-first border-primary shadow-lg ring-1 ring-primary md:order-none",
  header: "flex flex-col gap-2",
  nameRow: "flex items-center justify-between gap-2",
  name: "text-lg font-semibold",
  badge: "rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground",
  priceBox: "flex min-h-16 flex-col justify-end gap-1",
  priceLabel: "text-3xl font-semibold tracking-tight",
  features: "flex flex-1 flex-col gap-3",
  cta: "w-full",
  includes: "mt-10 rounded-(--radius-lg) border border-border p-6 text-start",
  includesGrid: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
} as const;

export const MATRIX_CLASS = {
  toolbar: "mb-4 flex items-center justify-end gap-2 text-sm",
  scroller: "hidden max-h-[var(--matrix-max-h,80vh)] overflow-auto rounded-(--radius-lg) border border-border md:block",
  table: "w-full border-separate border-spacing-0 text-sm text-start",
  headCell: "sticky top-0 z-10 border-b border-border bg-background px-4 py-3 text-start font-semibold",
  corner: "sticky start-0 top-0 z-20 border-b border-border bg-background px-4 py-3 text-start",
  groupCell: "sticky start-0 bg-muted px-4 py-2 text-start font-semibold",
  rowHead: "sticky start-0 z-[1] border-b border-border bg-background px-4 py-3 text-start font-normal",
  cell: "border-b border-border px-4 py-3 text-start",
  cards: "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:hidden",
  card: "flex w-[85%] shrink-0 snap-start flex-col gap-4 rounded-(--radius-lg) border border-border bg-card p-4 text-card-foreground",
  cardRow: "flex items-start justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0",
  cellValue: "inline-flex items-center gap-1",
  block: "block font-normal",
} as const;

export const FAQ_CLASS = {
  split: "grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]",
  single: "flex flex-col",
  aside: "md:sticky md:top-[var(--header-h,calc(var(--spacing)*16))] md:self-start",
  search: "mb-6 max-w-md",
  list: "flex flex-col divide-y divide-border border-y border-border",
  item: "group py-4 text-start",
  summary: "flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden",
  chevron: "size-4 shrink-0 transition-transform group-open:rotate-180",
  answer: "pt-3 text-muted-foreground",
  groupGap: "flex flex-col gap-8",
  groupTitle: "mb-2",
  contact: "mt-10 flex flex-col items-start gap-3 rounded-(--radius-lg) bg-muted p-6 text-start sm:flex-row sm:items-center sm:justify-between",
} as const;

/** 区块自有文案 (BlockLabels 之外). 按语言子标签取包, 未命中回到 zh. */
export const V105_TEXT_ZH = {
  billingLabel: "计费周期",
  monthly: "月付",
  yearly: "年付",
  billedYearly: "按年计费",
  save: "省",
  free: "免费",
  contactSales: "联系销售",
  included: "包含",
  notIncluded: "不包含",
  allPlansInclude: "所有档位都包含",
  feature: "功能",
  onlyDifferences: "仅显示差异",
  searchFaq: "搜索问题",
  noResults: "没有匹配的问题",
} as const;

export const V105_TEXT_EN = {
  billingLabel: "Billing period",
  monthly: "Monthly",
  yearly: "Yearly",
  billedYearly: "billed yearly",
  save: "Save",
  free: "Free",
  contactSales: "Contact sales",
  included: "Included",
  notIncluded: "Not included",
  allPlansInclude: "Included in all plans",
  feature: "Feature",
  onlyDifferences: "Only show differences",
  searchFaq: "Search questions",
  noResults: "No matching questions",
} as const satisfies Record<keyof typeof V105_TEXT_ZH, string>;

export type V105Text = { -readonly [K in keyof typeof V105_TEXT_ZH]: string };
export const V105_TEXT_PACKS = { zh: V105_TEXT_ZH, en: V105_TEXT_EN } as const;
export const V105_LANG_SEPARATOR = "-";

/** 文档页 (docs/src/pages/blocks/marketing-v105) 的类名与三皮肤清单. */
export const V105_DOC = {
  skins: ["linear", "fintech", "retail"],
  skinFrame: "overflow-hidden rounded-(--radius-lg) border border-border",
  skinLabel: "border-b border-border bg-muted px-4 py-2 text-xs font-medium text-muted-foreground",
  stack: "flex flex-col gap-6",
} as const;

/** 按 locale 取文案包并叠加覆盖 (显式 undefined 不覆盖). */
export function pickV105Text(locale: string, override?: Partial<V105Text>): V105Text {
  const lang = locale.split(V105_LANG_SEPARATOR)[0].toLowerCase() as keyof typeof V105_TEXT_PACKS;
  const base: V105Text = { ...(V105_TEXT_PACKS[lang] ?? V105_TEXT_ZH) };
  for (const [key, value] of Object.entries(override ?? {})) if (value !== undefined) base[key as keyof V105Text] = value;
  return base;
}
