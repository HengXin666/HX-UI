"use client";

import type { ComponentPropsWithoutRef, CSSProperties, JSX } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../primitives/utils";
import { ALIGN } from "../constants/ui";
import {
  BOX_DEFAULT,
  BOX_GAP,
  BOX_ITEMS,
  BOX_MIN_COL,
  BOX_SLOT,
  GRID_BREAKPOINTS,
  GRID_COLUMNS,
  GRID_ITEM_CLASS,
  GRID_VAR,
  isNumber,
  type BoxMinCol,
  type GridBreakpoint,
  type GridResponsive,
} from "../constants/box";

/** 每个断点的列数. 只传数字等于所有断点同列数. */
export type GridColumns = GridResponsive;

/**
 * 二维排布原语: 固定列数的 Grid 与按最小列宽自适应的 AutoGrid.
 *
 * 列数不写成 grid-cols-1..12 四十多个类, 而是写进 CSS 变量 --grid-cols(-sm/-md/-lg),
 * 由一条 repeat(var(), minmax(0, 1fr)) 消费: 类名是固定字面量, 任意列数都不用改 Tailwind 源.
 * gap 与 Stack 共用 BOX_GAP 档.
 *
 * 12 列栅格: `<Grid cols={12}>` 配 GridItem 的 span / start / offset (都可按 base/sm/md/lg/xl 给),
 * 7/5, 8/4 这类不对称双栏写成 `<GridItem span={{ base: 12, lg: 7 }}>` + `<GridItem span={{ base: 12, lg: 5 }}>`.
 */
const gridVariants = cva("grid min-w-0", {
  variants: {
    gap: BOX_GAP,
    dense: { true: "grid-flow-row-dense", false: "" },
    alignItems: BOX_ITEMS,
  },
  defaultVariants: { gap: BOX_DEFAULT.gap, dense: false, alignItems: ALIGN.stretch },
});

/** 每个断点对应的列模板类. 只有调用方给了该断点的列数才加上. */
const COLS_CLASS = {
  base: "grid-cols-[repeat(var(--grid-cols),minmax(0,1fr))]",
  sm: "sm:grid-cols-[repeat(var(--grid-cols-sm),minmax(0,1fr))]",
  md: "md:grid-cols-[repeat(var(--grid-cols-md),minmax(0,1fr))]",
  lg: "lg:grid-cols-[repeat(var(--grid-cols-lg),minmax(0,1fr))]",
  xl: "xl:grid-cols-[repeat(var(--grid-cols-xl),minmax(0,1fr))]",
} as const satisfies Record<GridBreakpoint, string>;

/**
 * 把按断点给的数值拆成 CSS 变量与对应的类名. 只有调用方给了该断点的值才写变量与类.
 * clamp 把数值收进 [1, max]; 对 span / start 而言 max 是 12 (start 可到 13 = 末线).
 */
function resolveResponsive(
  value: GridResponsive | undefined,
  prefix: string,
  classMap: Record<GridBreakpoint, string>,
  max: number,
): { style: Record<string, number>; classes: string[] } {
  const style: Record<string, number> = {};
  const classes: string[] = [];
  if (value === undefined) return { style, classes };
  const spec = isNumber(value) ? { base: value } : value;
  for (const key of GRID_BREAKPOINTS) {
    const raw = spec[key];
    if (raw === undefined) continue;
    style[key === "base" ? prefix : `${prefix}-${key}`] = Math.min(max, Math.max(1, Math.floor(raw)));
    classes.push(classMap[key]);
  }
  return { style, classes };
}

/** 列数不设上限 (任意列数都走同一条模板). */
function resolveColumns(cols: GridColumns): { style: Record<string, number>; classes: string[] } {
  return resolveResponsive(cols, GRID_VAR.cols, COLS_CLASS, Number.MAX_SAFE_INTEGER);
}

export interface GridProps extends ComponentPropsWithoutRef<"div">, VariantProps<typeof gridVariants> {
  /** 列数, 例如 3 或 { base: 1, md: 2, lg: 4 }. 默认 { base: 1, md: 2 }. */
  readonly cols?: GridColumns;
}

export function Grid({ cols = BOX_DEFAULT.gridCols, gap, dense, alignItems, className, style, ...props }: GridProps): JSX.Element {
  const resolved = resolveColumns(cols);
  return (
    <div
      data-slot={BOX_SLOT.grid}
      className={cn(gridVariants({ gap, dense, alignItems }), resolved.classes, className)}
      style={{ ...(resolved.style as CSSProperties), ...style }}
      {...props}
    />
  );
}

/** 数字或按断点对象统一成按断点对象 (数字即 base). */
function toBreakpoints(value: GridResponsive | undefined): Partial<Record<GridBreakpoint, number>> {
  if (value === undefined) return {};
  return isNumber(value) ? { base: value } : value;
}

/** offset 换算成 start 并与显式 start 合并: 行首偏移 n 列 = 从第 n+1 条列线开始, 同断点以 start 为准. */
function mergeStart(start: GridResponsive | undefined, offset: GridResponsive | undefined): GridResponsive {
  const out: Partial<Record<GridBreakpoint, number>> = {};
  for (const [key, n] of Object.entries(toBreakpoints(offset))) out[key as GridBreakpoint] = n + 1;
  return { ...out, ...toBreakpoints(start) };
}

export interface GridItemProps extends ComponentPropsWithoutRef<"div"> {
  /** 跨列数 (1..12), 例如 7 或 { base: 12, lg: 7 }. 不给则占 1 列 (浏览器默认). */
  readonly span?: GridResponsive;
  /** 起始列线 (1..13). 行中项用它对齐到确定的列. */
  readonly start?: GridResponsive;
  /**
   * 行首偏移列数, 等价于 start = offset + 1. 例: span 8 + offset 2 = 12 列里居中的 8 列.
   * 同一断点同时给 start 时以 start 为准.
   */
  readonly offset?: GridResponsive;
}

/**
 * 栅格子项: 放在 `<Grid cols={12}>` 里. 跨度与起点写进 CSS 变量 --gi-span(-bp) / --gi-start(-bp),
 * 由固定字面量类 col-span-(--gi-span) 等消费, 不枚举 col-span-1..12.
 */
export function GridItem({ span, start, offset, className, style, ...props }: GridItemProps): JSX.Element {
  const spanVars = resolveResponsive(span, GRID_VAR.span, GRID_ITEM_CLASS.span, GRID_COLUMNS);
  const startVars = resolveResponsive(mergeStart(start, offset), GRID_VAR.start, GRID_ITEM_CLASS.start, GRID_COLUMNS + 1);
  return (
    <div
      data-slot={BOX_SLOT.gridItem}
      className={cn("min-w-0", spanVars.classes, startVars.classes, className)}
      style={{ ...(spanVars.style as CSSProperties), ...(startVars.style as CSSProperties), ...style }}
      {...props}
    />
  );
}

export interface AutoGridProps extends ComponentPropsWithoutRef<"div">, VariantProps<typeof gridVariants> {
  /** 单列最小宽度: BOX_MIN_COL 的档名, 或任意 CSS 长度 ("14rem", "220px"). */
  readonly min?: BoxMinCol | (string & {});
  /**
   * auto-fit: 子项不足一行时拉伸撑满; auto-fill (默认): 保留空轨道, 卡片宽度稳定.
   * 卡片墙用 fill, 少量统计块用 fit.
   */
  readonly fit?: boolean;
}

/** auto-fill 与 auto-fit 两种模板. min(var, 100%) 保证容器比最小列还窄时不横向溢出. */
const AUTO_TEMPLATE = {
  fill: "grid-cols-[repeat(auto-fill,minmax(min(var(--box-min),100%),1fr))]",
  fit: "grid-cols-[repeat(auto-fit,minmax(min(var(--box-min),100%),1fr))]",
} as const;

/**
 * 自适应列网格: 不关心断点, 只声明 "每列至少多宽", 浏览器按容器宽度自动排出列数.
 * 放在侧栏或弹窗里也能正确换列 (断点只看视口, 不看容器).
 */
export function AutoGrid({ min = BOX_DEFAULT.minCol, fit = false, gap, dense, alignItems, className, style, ...props }: AutoGridProps): JSX.Element {
  const width = min in BOX_MIN_COL ? BOX_MIN_COL[min as BoxMinCol] : min;
  return (
    <div
      data-slot={BOX_SLOT.autoGrid}
      className={cn(gridVariants({ gap, dense, alignItems }), fit ? AUTO_TEMPLATE.fit : AUTO_TEMPLATE.fill, className)}
      style={{ ["--box-min" as string]: width, ...style } as CSSProperties}
      {...props}
    />
  );
}

export { gridVariants };
