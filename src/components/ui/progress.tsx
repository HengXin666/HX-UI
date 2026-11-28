import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Progress as ProgressPrimitive } from "radix-ui"

const TONE = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
} as const

const track = cva("relative w-full overflow-hidden rounded-full bg-primary/15", {
  variants: { size: { sm: "h-1", default: "h-2", lg: "h-3" } },
  defaultVariants: { size: "default" },
})

export interface ProgressProps extends Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, "value"> {
  /** 0 到 max; 传 null 表示不确定进度, 显示来回滑动的条 */
  value?: number | null
  size?: "sm" | "default" | "lg"
  tone?: keyof typeof TONE
}

function Progress({ className, value = 0, max = 100, size = "default", tone = "default", ...props }: ProgressProps) {
  const indeterminate = value == null
  const pct = indeterminate ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-tone={tone}
      value={indeterminate ? null : value}
      max={max}
      className={cn(track({ size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 rounded-full",
          TONE[tone],
          indeterminate
            ? "origin-left animate-indeterminate motion-reduce:animate-none motion-reduce:opacity-60"
            : "transition-transform duration-500 ease-out motion-reduce:transition-none"
        )}
        style={indeterminate ? undefined : { transform: `translateX(-${100 - pct}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
