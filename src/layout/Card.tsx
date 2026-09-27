import type { ComponentPropsWithoutRef, JSX, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../primitives/utils";

/**
 * 卡片。
 *
 * 上游**没有** Card 组件 —— 它用的是一条约定: 所有卡片都是
 * `rounded-xl border border-border bg-card` 这一族类串, 在上百个文件里手写。
 * 复刻时把那族类串收成一个组件, 免得每个使用方各自记一遍边界的写法。
 *
 * 三条硬约定 (来自上游的视觉规范):
 *   1. 普通卡片**零阴影**。层级靠 1px 边框 + 半透明底色叠出来。
 *   2. hover 只换边框色与背景透明度, 不加阴影、不放大、不平移超过 2px。
 *   3. 线条全局 1px。
 */
const cardVariants = cva("rounded-xl border transition-colors", {
  variants: {
    variant: {
      /** 默认: 半透明底 + 模糊, 用于页面里的普通卡片 */
      default: "border-border/50 bg-card/40 backdrop-blur-sm",
      /** 实底: 不透明卡片面, 浮层或需要压住背景时用 */
      solid: "border-border bg-card",
      /** 低对比: 次级容器, 例如代码块外壳、内嵌面板 */
      muted: "border-border/40 bg-muted/40",
      /** 描边: 只要一圈边, 不填底 */
      outline: "border-border/60 bg-transparent",
    },
    interactive: {
      true: "hover:border-primary/40 hover:bg-card/60",
      false: "",
    },
  },
  defaultVariants: { variant: "default", interactive: false },
});

export interface CardProps
  extends ComponentPropsWithoutRef<"div">,
    VariantProps<typeof cardVariants> {
  readonly children?: ReactNode;
}

export function Card({ className, variant, interactive, ...props }: CardProps): JSX.Element {
  return <div className={cn(cardVariants({ variant, interactive, className }))} {...props} />;
}

/** 卡片头部。padding 按上游"标准卡片"档: px-3.5 pt-3。 */
export function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">): JSX.Element {
  return <div className={cn("flex flex-col gap-1 px-3.5 pt-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithoutRef<"div">): JSX.Element {
  return <div className={cn("text-[13px] font-medium text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentPropsWithoutRef<"div">): JSX.Element {
  return <div className={cn("text-[12px] text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentPropsWithoutRef<"div">): JSX.Element {
  return <div className={cn("px-3.5 pb-3 pt-2.5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithoutRef<"div">): JSX.Element {
  return <div className={cn("flex items-center gap-2 border-t border-border px-3.5 py-2.5", className)} {...props} />;
}

export { cardVariants };
