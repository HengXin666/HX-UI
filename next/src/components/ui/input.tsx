import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useFieldControl } from "@/components/ui/field"

const inputVariants = cva(
  "w-full min-w-0 rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 text-sm",
        default: "h-9 px-3 py-1 text-base md:text-sm",
        lg: "h-11 px-3.5 text-base",
      },
    },
    defaultVariants: { size: "default" },
  }
)

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  size?: "sm" | "default" | "lg"
  /** 框内左侧: 图标或 "https://" 这样的前缀 */
  leading?: React.ReactNode
  /** 框内右侧: 单位, 快捷键, 清除按钮 */
  trailing?: React.ReactNode
}

function Input({ className, type, size = "default", leading, trailing, ...rest }: InputProps) {
  const props = useFieldControl(rest)
  const input = (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(inputVariants({ size }), leading != null && "ps-9", trailing != null && "pe-10", !leading && !trailing && className)}
      {...props}
    />
  )
  if (leading == null && trailing == null) return input
  // 左右附件不抢焦点, 点它们等于点输入框 (按钮除外)
  const side = "absolute inset-y-0 flex items-center text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
  return (
    <div data-slot="input-group" className={cn("relative w-full", className)}>
      {leading != null && <span className={cn(side, "pointer-events-none start-3")}>{leading}</span>}
      {input}
      {trailing != null && <span className={cn(side, "end-2.5 has-[button]:end-1.5")}>{trailing}</span>}
    </div>
  )
}

export { Input, inputVariants }
