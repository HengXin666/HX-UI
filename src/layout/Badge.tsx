import type { ComponentPropsWithoutRef, JSX } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../primitives/utils";

/**
 * 标签。
 *
 * 状态色只有三种语义 token (来自上游视觉规范 §1.3): 成功/运行 success、
 * 警告/可更新 warning、错误 danger, 均为 "/15 浅底 + -fg 可读文字色", 不写调色盘色.
 * default 是 primary 浅底配 link 文字: 暗色 primary 是实底蓝, 做文字对比不够.
 * 业务标签 (自定义 / 实验 / Beta) 一律降级为 token 叠色, 不引入第四种.
 */
const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-[11px] font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-link",
        secondary: "bg-accent/60 text-muted-foreground",
        outline: "border-border text-muted-foreground",
        success: "bg-success/15 text-success-fg",
        warning: "bg-warning/15 text-warning-fg",
        destructive: "bg-danger/15 text-danger-fg",
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
