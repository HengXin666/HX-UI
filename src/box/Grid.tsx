"use client";

import type { ComponentPropsWithoutRef, CSSProperties, JSX } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../primitives/utils";
import { ALIGN } from "../constants/ui";
import { BOX_DEFAULT, BOX_GAP, BOX_ITEMS, BOX_MIN_COL, BOX_SLOT, isNumber, type BoxMinCol } from "../constants/box";

/** 每个断点的列数. 只传数字等于所有断点同列数. */
export type GridColumns = number | { readonly base?: number; readonly sm?: number; readonly md?: number; readonly lg?: number };

/**
 * 二维排布原语: 固定列数的 Grid 与按最小列宽自适应的 AutoGrid.
 *
 * 列数不写成 grid-cols-1..12 四十多个类, 而是写进 CSS 变量 --grid-cols(-sm/-md/-lg),
 * 由一条 repeat(var(), minmax(0, 1fr)) 消费: 类名是固定字面量, 任意列数都不用改 Tailwind 源.
 * gap 与 Stack 共用 BOX_GAP 档.
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
} as const;

type Breakpoint = keyof typeof COLS_CLASS;

/** 把列数配置拆成 CSS 变量与对应的类名. */
function resolveColumns(cols: GridColumns): { style: Record<string, number>; classes: string[] } {
  const spec = isNumber(cols) ? { base: cols } : cols;
  const style: Record<string, number> = {};
  const classes: string[] = [];
  for (const key of Object.keys(COLS_CLASS) as Breakpoint[]) {
    const count = spec[key];
    if (count === undefined) continue;
    style[key === "base" ? "--grid-cols" : `--grid-cols-${key}`] = Math.max(1, Math.floor(count));
    classes.push(COLS_CLASS[key]);
  }
  return { style, classes };
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
