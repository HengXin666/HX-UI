import type { ComponentPropsWithoutRef, JSX } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../primitives/utils";

/**
 * 标签。
 *
 * 颜色白名单只有三种语义原色 (来自上游视觉规范 §1.3):
 *   成功/运行 emerald、警告/可更新 amber、错误走 destructive token。
 * 业务标签 (自定义 / 实验 / Beta) 一律降级为 token 叠色, 不引入第四种。
 */
const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-[11px] font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-accent/60 text-muted-foreground",
        outline: "border-border text-muted-foreground",
        success: "bg-emerald-500/15 text-emerald-400",
        warning: "bg-amber-500/15 text-amber-400",
        destructive: "bg-destructive/15 text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends ComponentPropsWithoutRef<"span">,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): JSX.Element {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { badgeVariants };
