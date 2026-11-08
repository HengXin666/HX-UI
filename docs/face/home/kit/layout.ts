import { VARIANT } from "@hx/ui";

/**
 * 门面首页的版式刻度. 尺寸对着 reactbits.dev 1440 宽的实拍量出来:
 * 舞台 1364 宽 (两侧 38), 段落内容 1276 宽 (两侧 82), 卡与卡之间 16, 卡内图区内缩 6.
 */

/** 段落内容: 1440 宽时左右各 82. */
export const WRAP = "mx-auto w-full max-w-[1364px] scroll-mt-24 px-4 md:px-[44px]";
/** 首屏与舞台: 1440 宽时左右各 38 (加上外层 6 的边, 文字落在 44). */
export const WRAP_WIDE = "mx-auto w-full max-w-[1440px] px-4 md:pl-[44px] md:pr-[32px]";

export const TYPE = {
  h1: "text-[34px] font-medium leading-[1.06] tracking-[-0.035em] text-heading md:text-[44px]",
  h2: "text-[30px] font-medium leading-[1.15] tracking-[-0.03em] text-heading md:text-[40px]",
  lede: "text-base leading-[1.6] text-muted-foreground",
  title: "text-[15px] font-medium leading-6 text-heading",
  desc: "text-[13px] leading-[21px] text-muted-foreground",
  mono: "font-mono text-[13px]",
  meta: "font-mono text-[11px] text-muted-foreground",
} as const;

/** 卡: 外框一档卡面, 图区沉一档, 1px 边. */
export const TILE = {
  frame: "group/tile relative flex min-w-0 flex-col rounded-2xl border border-border bg-card p-1.5",
  art: "relative isolate overflow-hidden [contain:paint] rounded-[11px] border border-border-muted bg-muted",
  body: "flex flex-col gap-1.5 px-4 pb-4 pt-5",
} as const;

/**
 * 按钮: 实心浅色, 次级深色, 主色, 顶栏小号. 一律是库里的 Button (asChild 包原生 button / a), 这里只给变体和尺寸覆盖.
 * 库的基础串带透明边框与 bg-clip-padding, 门面的实心按钮不要那 1px 透明边, 所以统一 bg-clip-border; 悬停沿用门面原值.
 */
const BTN_BASE = "gap-2 bg-clip-border font-medium focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring";
export const BTN = {
  light: { variant: VARIANT.primary, className: `${BTN_BASE} h-[46px] rounded-[10px] border-0 bg-foreground px-5 text-[15px] text-background transition-[opacity] hover:bg-foreground hover:opacity-90` },
  dark: { variant: VARIANT.default, className: `${BTN_BASE} h-[46px] rounded-[10px] bg-secondary px-5 text-[15px] text-secondary-foreground transition-[background-color] hover:bg-control-hover` },
  primary: { variant: VARIANT.primary, className: `${BTN_BASE} h-9 rounded-lg border-0 px-[18px] text-[13px] text-primary-foreground transition-[opacity] hover:bg-primary hover:opacity-90` },
  chip: { variant: VARIANT.default, className: `${BTN_BASE} h-9 rounded-lg bg-secondary px-3 text-[13px] font-normal text-secondary-foreground transition-[background-color] hover:bg-control-hover` },
} as const;

/** 窗口 (代码窗, 终端, 预设): 标题栏 36 高, 内容区沉一档并内缩 6. */
export const WIN = {
  frame: "flex flex-col overflow-hidden rounded-2xl border border-border bg-card/90 backdrop-blur-md",
  bar: "relative flex h-9 shrink-0 items-center justify-center text-[13px] text-muted-foreground",
  body: "mx-1.5 mb-1.5 min-h-0 flex-1 overflow-hidden rounded-[11px] border border-border-muted bg-muted/85",
} as const;

export const ARROW = "\u2192";
export const OUT = "\u2197";
