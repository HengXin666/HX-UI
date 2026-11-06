import { NUMBER_CLASS } from "../constants/polish";

/** 工作室页面共用的语义类名. 颜色只走令牌, 边框保持 1px, 不写 transition-all. */
export const STUDIO_CLASS = {
  page: "bg-background text-foreground",
  wrap: "mx-auto w-full max-w-6xl px-5 md:px-8",
  muted: "text-sm leading-relaxed text-muted-foreground",
  row: "flex flex-wrap items-center gap-3",
  section: "border-t border-border py-16 md:py-20",
  card: "rounded-xl border border-border bg-card",
  sunken: "overflow-hidden rounded-xl border border-border bg-surface-sunken",
  grid3: "grid gap-4 md:grid-cols-3",
  split: "grid items-start gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]",
  label: "text-xs font-medium text-muted-foreground",
  figure: "text-3xl font-semibold tabular-nums tracking-tight text-foreground",
  plate: "relative min-h-72 w-full",
  shot: "will-change-transform",
  live: NUMBER_CLASS.srOnly,
  ink: "text-foreground text-pretty",
  quiet: "text-muted-foreground text-pretty",
  stack: "flex flex-col items-stretch",
  stackGap2: "flex flex-col gap-2 items-stretch",
  stackGap3: "flex flex-col gap-3 items-stretch",
  stackGap4: "flex flex-col gap-4 items-stretch",
  mt2: "mt-2 text-pretty",
  mt3: "mt-3 text-pretty",
  mt4: "mt-4 text-pretty",
  mt5: "mt-5 text-pretty",
  mt6: "mt-6 text-pretty",
  mt8: "mt-8 text-pretty",
  scrollX: "overflow-x-auto overscroll-x-contain",
  pad: "flex flex-col gap-4 p-5 text-pretty",
} as const;

/** 主推列 / 主推套餐的 data-state. 只在这里写一次. */
export const HX_LEAD = "hx-lead";
