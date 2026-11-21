/**
 * 软件产品页区块 (src/blocks/marketing/ProductTour.tsx, PricingCalculator.tsx) 的类名, 文案与镜头参数.
 */

/** ProductTour 的类名: 光标与标注只动 transform 与 opacity, 被讲解的真实界面原样渲染. */
export const TOUR_CLASS = {
  root: "flex flex-col gap-4",
  stage: "relative overflow-hidden rounded-(--radius-lg) border border-border bg-background",
  screen: "relative [&_[data-tour-active=true]]:outline-1 [&_[data-tour-active=true]]:outline-offset-4 [&_[data-tour-active=true]]:outline-foreground [&_[data-tour-active=true]]:rounded-(--radius-sm)",
  cursor: "pointer-events-none absolute start-0 top-0 z-10 size-5 text-foreground drop-shadow will-change-transform motion-reduce:transition-none",
  note: "pointer-events-none absolute start-0 top-0 z-10 max-w-64 rounded-(--radius-md) border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md transition-opacity duration-(--duration-normal) motion-reduce:transition-none data-[shown=false]:opacity-0",
  noteTitle: "block font-medium",
  noteBody: "mt-0.5 block text-muted-foreground",
  bar: "flex flex-wrap items-center gap-2",
  steps: "flex flex-1 flex-wrap gap-1",
  step: "rounded-full px-3 py-1 text-xs text-muted-foreground outline-none hover:text-foreground aria-selected:bg-muted aria-selected:text-foreground focus-visible:outline-1 focus-visible:outline-ring",
  control: "rounded-(--radius-md) border border-border px-3 py-1 text-xs text-foreground outline-none hover:bg-muted focus-visible:outline-1 focus-visible:outline-ring",
  live: "sr-only",
} as const;

/** 当前站目标上的标记; TOUR_CLASS.screen 按它描边, 不改目标自己的样式. */
export const TOUR_ACTIVE = { attr: "data-tour-active", on: "true" } as const;

/** ProductTour 的默认文案. */
export const TOUR_TEXT = {
  region: "产品导览",
  steps: "导览步骤",
  play: "播放",
  pause: "暂停",
  prev: "上一步",
  next: "下一步",
  step: "第",
  stepUnit: "步",
} as const;

/**
 * cursor-flyover 的网页版: 光标沿弧线飞到下一个目标, 弧高按飞行距离取比例并封顶, 到位后标注再出现.
 * 停留时长给读完一句标注留够时间; 自动播放只在可见且无悬停, 无焦点时走.
 */
export const TOUR_SHOT = {
  flyMs: 640,
  arcRatio: 0.18,
  arcMaxPx: 72,
  holdMs: 3200,
  noteGapPx: 14,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

/** 标注出现前, 光标在目标上的落点: 目标左上角向内的比例. */
export const TOUR_LAND = { x: 0.62, y: 0.58 } as const;

/** PricingCalculator 的类名. */
export const CALC_CLASS = {
  root: "flex flex-col gap-6 rounded-(--radius-lg) border border-border p-6",
  controls: "flex flex-wrap items-end gap-6",
  field: "flex min-w-56 flex-1 flex-col gap-2",
  label: "text-sm font-medium text-foreground",
  seats: "text-2xl font-semibold tabular-nums text-foreground",
  range: "w-full accent-foreground",
  billing: "flex gap-1 rounded-(--radius-md) border border-border p-1",
  billingOption: "cursor-pointer rounded-(--radius-sm) px-3 py-1.5 text-sm text-muted-foreground has-[:checked]:bg-muted has-[:checked]:text-foreground has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-ring",
  radio: "sr-only",
  plans: "grid gap-3 @md:grid-cols-3 sm:grid-cols-3",
  plan: "flex flex-col gap-1 rounded-(--radius-md) border border-border p-4 data-[fit=false]:opacity-50 data-[best=true]:border-foreground",
  planName: "text-sm font-medium text-foreground",
  amount: "flex items-baseline gap-1 text-3xl font-semibold tabular-nums text-foreground",
  unit: "text-sm font-normal text-muted-foreground",
  note: "text-xs text-muted-foreground",
  live: "sr-only",
} as const;

/** PricingCalculator 的默认文案. */
export const CALC_TEXT = {
  seats: "团队人数",
  seatsUnit: "人",
  billing: "计费周期",
  month: "按月",
  year: "按年",
  perMonth: "/ 月",
  perSeat: "每人每月",
  best: "最划算",
  overLimit: "超出人数上限",
  yearSaves: "按年付省",
  summary: "人, 最划算的是",
} as const;
