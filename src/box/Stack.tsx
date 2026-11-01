"use client";

import type { ComponentPropsWithoutRef, ElementType, JSX } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../primitives/utils";
import { BOX_DEFAULT, BOX_GAP, BOX_ITEMS, BOX_JUSTIFY, BOX_NONE, BOX_SLOT, STACK_DIRECTION } from "../constants/box";
import { ALIGN, TAG } from "../constants/ui";

/** Stack 可以渲染成的语义标签. 列表用 ul / ol, 页面区块用 section / nav 等. */
export type StackTag = "div" | "section" | "nav" | "header" | "footer" | "main" | "article" | "aside" | "ul" | "ol" | "li" | "form";

/**
 * 一维排布原语: flex + 统一 gap 档.
 *
 * gap 只接受 BOX_GAP 的档名 (none / xs / sm / md / lg / xl / 2xl), 不接受任意值,
 * 这样整站的间距节奏只有一套. divided 用 1px 的 divide 线把子项隔开.
 * stackBelow 让横排在断点以下自动折成竖排 (移动端常用).
 *
 * .agents/notes/implemented/feature/2026-11-01-layout-box-primitives.md
 */
export const stackVariants = cva("flex min-w-0", {
  variants: {
    direction: {
      row: "flex-row",
      column: "flex-col",
      rowReverse: "flex-row-reverse",
      columnReverse: "flex-col-reverse",
    },
    gap: BOX_GAP,
    align: BOX_ITEMS,
    justify: BOX_JUSTIFY,
    wrap: { true: "flex-wrap", false: "flex-nowrap" },
    divided: { true: "divide-border", false: "" },
    stackBelow: {
      none: "",
      sm: "max-sm:flex-col",
      md: "max-md:flex-col",
      lg: "max-lg:flex-col",
    },
  },
  compoundVariants: [
    { divided: true, direction: STACK_DIRECTION.column, className: "divide-y" },
    { divided: true, direction: STACK_DIRECTION.columnReverse, className: "divide-y divide-y-reverse" },
    { divided: true, direction: STACK_DIRECTION.row, className: "divide-x" },
    { divided: true, direction: STACK_DIRECTION.rowReverse, className: "divide-x divide-x-reverse" },
  ],
  defaultVariants: {
    direction: STACK_DIRECTION.column,
    gap: BOX_DEFAULT.gap,
    align: ALIGN.stretch,
    justify: ALIGN.start,
    wrap: false,
    divided: false,
    stackBelow: BOX_NONE,
  },
});

export interface StackProps extends ComponentPropsWithoutRef<"div">, VariantProps<typeof stackVariants> {
  /** 渲染的标签, 默认 div. 传 ul / ol 时子项请用 li. */
  readonly as?: StackTag;
}

export function Stack({
  as = TAG.div,
  className,
  direction,
  gap,
  align,
  justify,
  wrap,
  divided,
  stackBelow,
  ...props
}: StackProps): JSX.Element {
  const Tag = as as ElementType;
  return (
    <Tag
      data-slot={BOX_SLOT.stack}
      data-direction={direction ?? STACK_DIRECTION.column}
      className={cn(stackVariants({ direction, gap, align, justify, wrap, divided, stackBelow }), className)}
      {...props}
    />
  );
}

/** 横排: 默认纵向居中对齐, gap 用同一套档. */
export type HStackProps = Omit<StackProps, "direction"> & { readonly reverse?: boolean };

export function HStack({ reverse = false, align = ALIGN.center, ...props }: HStackProps): JSX.Element {
  return <Stack direction={reverse ? STACK_DIRECTION.rowReverse : STACK_DIRECTION.row} align={align} {...props} />;
}

/** 竖排: 默认撑满宽度, gap 用同一套档. */
export type VStackProps = Omit<StackProps, "direction" | "stackBelow"> & { readonly reverse?: boolean };

export function VStack({ reverse = false, ...props }: VStackProps): JSX.Element {
  return <Stack direction={reverse ? STACK_DIRECTION.columnReverse : STACK_DIRECTION.column} {...props} />;
}

export interface SpacerProps extends ComponentPropsWithoutRef<"div"> {
  /** 占位方向上的最小尺寸 (gap 档名); 不传时只伸展. */
  readonly min?: keyof typeof SPACER_MIN;
}

/** Spacer 的最小占位, 与 gap 档同名. */
const SPACER_MIN = {
  xs: "min-h-1 min-w-1",
  sm: "min-h-2 min-w-2",
  md: "min-h-4 min-w-4",
  lg: "min-h-6 min-w-6",
  xl: "min-h-8 min-w-8",
} as const;

/** 弹性空白: 在 HStack / VStack 里把后面的子项推到另一端. 纯装饰, 对读屏隐藏. */
export function Spacer({ className, min, ...props }: SpacerProps): JSX.Element {
  return (
    <div
      aria-hidden
      data-slot={BOX_SLOT.spacer}
      className={cn("flex-1 self-stretch", min && SPACER_MIN[min], className)}
      {...props}
    />
  );
}
