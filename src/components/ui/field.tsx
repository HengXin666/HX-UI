"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

type FieldState = { id: string; describedBy?: string; invalid: boolean; required: boolean; disabled: boolean }
const FieldContext = React.createContext<FieldState | null>(null)

/**
 * 控件读 Field 给的 id / aria; 自己传的属性优先.
 * Input, Textarea, SelectTrigger, Checkbox, Switch, Slider 都调用它.
 */
export function useFieldControl<P extends { id?: string; "aria-describedby"?: string; "aria-invalid"?: React.AriaAttributes["aria-invalid"]; "aria-required"?: React.AriaAttributes["aria-required"]; disabled?: boolean }>(props: P): P {
  const f = React.useContext(FieldContext)
  if (!f) return props
  return {
    ...props,
    id: props.id ?? f.id,
    "aria-describedby": [f.describedBy, props["aria-describedby"]].filter(Boolean).join(" ") || undefined,
    "aria-invalid": props["aria-invalid"] ?? (f.invalid || undefined),
    "aria-required": props["aria-required"] ?? (f.required || undefined),
    disabled: props.disabled ?? (f.disabled || undefined),
  }
}

export interface FieldProps extends Omit<React.ComponentProps<"div">, "children"> {
  label?: React.ReactNode
  /** 说明文字, 一直显示 */
  description?: React.ReactNode
  /** 错误信息; 有值时控件标红 aria-invalid, 读屏会播报 */
  error?: React.ReactNode
  required?: boolean
  disabled?: boolean
  /** vertical: 标签在上 (输入框, 选择器); horizontal: 控件在前标签在后 (复选框, 单个开关) */
  orientation?: "vertical" | "horizontal"
  /** 标签右侧的附加内容, 如字数 "12/200" 或 "忘记密码" 链接 */
  aside?: React.ReactNode
  /** 指定控件 id, 不传自动生成 */
  htmlFor?: string
  children: React.ReactNode
}

/** 表单项: 标签 + 控件 + 说明 + 错误, 自动连好 id 与 aria. */
function Field({ label, description, error, required = false, disabled = false, orientation = "vertical", aside, htmlFor, className, children, ...props }: FieldProps) {
  const auto = React.useId()
  const id = htmlFor ?? auto
  const descId = description ? `${id}-desc` : undefined
  const errId = error ? `${id}-err` : undefined
  const state = React.useMemo<FieldState>(
    () => ({ id, describedBy: [descId, errId].filter(Boolean).join(" ") || undefined, invalid: !!error, required, disabled }),
    [id, descId, errId, error, required, disabled]
  )
  const labelEl = label ? (
    <Label htmlFor={id} className={cn(orientation === "horizontal" && "font-normal")}>
      {label}
      {required && <span aria-hidden className="-ml-1 text-destructive">*</span>}
    </Label>
  ) : null
  const desc = description ? <p id={descId} className="text-[13px] text-muted-foreground">{description}</p> : null
  const err = <p id={errId} aria-live="polite" className="text-[13px] text-destructive empty:hidden">{error}</p>

  return (
    <FieldContext.Provider value={state}>
      <div
        data-slot="field"
        data-invalid={error ? true : undefined}
        data-disabled={disabled || undefined}
        className={cn(
          "group",
          orientation === "vertical" ? "grid gap-2" : "grid grid-cols-[auto_1fr] items-start gap-x-2.5 gap-y-1",
          className
        )}
        {...props}
      >
        {orientation === "vertical" ? (
          <>
            {(labelEl || aside) && <div className="flex items-center justify-between gap-3">{labelEl}{aside && <span className="text-[13px] text-muted-foreground">{aside}</span>}</div>}
            {children}
            {desc}
            {err}
          </>
        ) : (
          <>
            <div className="flex h-5 items-center">{children}</div>
            <div className="grid gap-1 pt-0.5">{labelEl}{desc}{err}</div>
          </>
        )}
      </div>
    </FieldContext.Provider>
  )
}

export { Field }
