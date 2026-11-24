"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useFieldControl } from "@/components/ui/field"
import { CircleIcon } from "lucide-react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...rest
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  const props = useFieldControl(rest)
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "aspect-square size-4 shrink-0 rounded-full border border-input text-primary shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 fill-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

/**
 * 卡片式单选: 整张卡可点, 选中时描边变主色. 适合套餐, 配送方式这类要多写几句的选项.
 */
function RadioGroupCard({
  value,
  title,
  description,
  aside,
  disabled,
  className,
}: {
  value: string
  title: React.ReactNode
  description?: React.ReactNode
  /** 右侧: 价格, 标签 */
  aside?: React.ReactNode
  disabled?: boolean
  className?: string
}) {
  const id = React.useId()
  return (
    <label
      htmlFor={id}
      data-slot="radio-group-card"
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors hover:bg-accent/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
        className
      )}
    >
      <RadioGroupItem id={id} value={value} disabled={disabled} className="mt-0.5 focus-visible:ring-0" aria-describedby={description ? `${id}-d` : undefined} />
      <span className="grid flex-1 gap-1">
        <span className="text-sm leading-none font-medium">{title}</span>
        {description && <span id={`${id}-d`} className="text-[13px] text-muted-foreground">{description}</span>}
      </span>
      {aside && <span className="text-sm font-medium tabular-nums">{aside}</span>}
    </label>
  )
}

export { RadioGroup, RadioGroupItem, RadioGroupCard }
