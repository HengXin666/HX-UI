"use client"

/**
 * 可复制字段: Webhook 地址, API key, webhookSecret, Agent 接入语, 验证码, 邀请码这类 "只显示一次, 要复制" 的值.
 *
 *   <CopyField label="Webhook 地址" value={url} />
 *   <CopyField label="webhookSecret" value={secret} masked maskPeek={4} onCopy={() => toast.success("已复制")} />
 *   <CopyField label="接入语" value={prompt} multiline maxHeight={180} />
 *
 * 为什么值放在只读 <input> / <textarea> 里而不是 <span>: 能被 Field 的 <label> 关联, 能 Tab 聚焦,
 * 聚焦即全选 (复制按钮失灵时用户还能 Ctrl+C), 读屏念出 "只读编辑框 + 值".
 * 遮罩 (masked) 时 DOM 里只有遮罩字符, 真值只在内存里, 复制按钮照样复制真值; 显示 / 隐藏用眼睛按钮切换, 可受控.
 * 复制: 优先 navigator.clipboard (需要安全上下文), 失败回退到隐藏 textarea + execCommand("copy");
 * 都失败就选中值并显示 "复制失败", 让用户手动复制. 成功后图标短暂变对勾 (copiedDuration, 默认 1600ms),
 * 外框描边同时转成功色; 读屏经 aria-live 播报 "已复制".
 * 动效 (feedback): pop 新图标从 50% 带一点回弹转入, fade 只淡入淡出, none 直接换; 只动 transform / opacity, 200ms;
 * 显示 / 隐藏切换时值轻微淡入去模糊 (Web Animations 播在原元素上, 不重挂载, 多行的滚动位置不丢). 减弱动效时全部直接到位.
 * 单行遮罩带末尾明文 (maskPeek) 时圆点数随宽度收缩 (至少 4 个), 窄屏上末尾那几位也始终看得见, 不被省略号截掉.
 * 原生复制 (Ctrl+C / 右键复制) 也拿到真值: 遮罩时值照样能选中, 复制出去的是 copyValue ?? value 而不是圆点;
 * 显示时选中部分就复制那部分, 全选时复制 copyValue (若有). 都会触发 "已复制" 反馈与 onCopy.
 * 多行 (multiline): 高度随内容增长到 maxHeight 为止, 再多就框内滚动; 按钮固定在右上角, 不压住文字.
 * 滚动条用 theme.css 的全局 ::-webkit-scrollbar 细条; 这里刻意不加 scrollbar-thin 类: Tailwind 4.3 自带同名工具类会设
 * scrollbar-width: thin, Chrome 121+ 见到它就退回原生滚动条 (带箭头).
 * 自动高度优先用 CSS field-sizing: content (浏览器自己跟着内容 / 字体 / 宽度变, 零 JS);
 * 不支持的浏览器才用 JS 量 scrollHeight: 值, 宽度, 字号相关参数变化, 以及网页字体加载完成 (document.fonts) 时重量.
 * 能放进 Field: 自己传 label / description 会自动包一层 Field; 外面已经有 Field 时读它给的 id / aria-describedby / disabled.
 */

import * as React from "react"
import { cva } from "class-variance-authority"
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Field, useFieldControl } from "@/components/ui/field"
import { maskValue } from "@/components/ui/copy-field-model"
import { useReducedMotion } from "@/motion/use-reduced-motion"

export { maskValue, MASK_CHAR, type MaskOptions } from "@/components/ui/copy-field-model"

export type CopyFieldSize = "sm" | "default" | "lg"
export type CopyFieldVariant = "default" | "muted" | "ghost"
/** 复制成功 / 失败时图标的切换方式 */
export type CopyFeedback = "pop" | "fade" | "none"
type CopyStatus = "idle" | "copied" | "error"

/** 复制后保持 "已复制" 的默认时长 (ms) */
export const COPIED_MS = 1600
const DEFAULT_MAX_HEIGHT = 160
/** 显示 / 隐藏切换时值的淡入去模糊 */
const REVEAL_MS = 200

let fieldSizing: boolean | null = null
/** 浏览器是否支持 field-sizing: content (支持就交给 CSS 自动高度) */
function supportsFieldSizing() {
  fieldSizing ??= typeof CSS !== "undefined" && CSS.supports("field-sizing", "content")
  return fieldSizing
}

/**
 * 写剪贴板: navigator.clipboard 优先, 不可用 (非安全上下文, 权限被拒) 时回退到隐藏 textarea + execCommand.
 * 都失败时 reject. 焦点会还给原来的元素.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // 继续走回退
    }
  }
  const ta = document.createElement("textarea")
  ta.value = text
  ta.setAttribute("readonly", "")
  ta.setAttribute("aria-hidden", "true")
  Object.assign(ta.style, { position: "fixed", top: "0", left: "0", opacity: "0", pointerEvents: "none" })
  const back = document.activeElement instanceof HTMLElement ? document.activeElement : null
  document.body.appendChild(ta)
  ta.select()
  let ok = false
  try {
    ok = document.execCommand("copy")
  } finally {
    ta.remove()
    back?.focus({ preventScroll: true })
  }
  if (!ok) throw new Error("copy failed")
}

const fieldVariants = cva(
  [
    "group/copy-field relative flex w-full min-w-0 rounded-md border transition-[color,border-color,box-shadow] duration-200",
    "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/40",
    // 外部 Field 有 error 时描边标红; 复制成功 / 失败的闪色优先
    "data-invalid:border-destructive/70 data-invalid:focus-within:ring-destructive/30",
    "data-[status=copied]:border-success/60 data-[status=error]:border-destructive/60",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        default: "border-input bg-transparent shadow-xs dark:bg-input/30",
        muted: "border-transparent bg-muted",
        ghost: "border-transparent bg-transparent",
      },
      size: {
        sm: "text-xs",
        default: "text-[13px]",
        lg: "text-sm",
      },
      multiline: {
        true: "items-start",
        false: "items-center",
      },
    },
    compoundVariants: [
      { multiline: false, size: "sm", className: "h-8" },
      { multiline: false, size: "default", className: "h-9" },
      { multiline: false, size: "lg", className: "h-11" },
    ],
    defaultVariants: { variant: "default", size: "default", multiline: false },
  }
)

const PAD_X: Record<CopyFieldSize, string> = { sm: "px-2.5", default: "px-3", lg: "px-3.5" }
const BTN: Record<CopyFieldSize, string> = { sm: "size-6 [&_svg]:size-3", default: "size-7 [&_svg]:size-3.5", lg: "size-8 [&_svg]:size-4" }
const TRAIL: Record<CopyFieldSize, string> = { sm: "pr-1", default: "pr-1", lg: "pr-1.5" }

/** 两个图标叠在一起, 按 on 切换; pop 带缩放与旋转回弹, fade 只淡 */
function SwapIcon({ on, from, to, feedback }: { on: boolean; from: React.ReactNode; to: React.ReactNode; feedback: CopyFeedback }) {
  const base = cn(
    "col-start-1 row-start-1 grid place-items-center motion-reduce:transition-none",
    feedback === "pop" && "transition-[opacity,transform] duration-200 ease-[var(--ease-spring)]",
    feedback === "fade" && "transition-opacity duration-200 ease-out"
  )
  const away = feedback === "pop" ? "scale-50 opacity-0" : "opacity-0"
  return (
    <span className="grid place-items-center" aria-hidden>
      <span className={cn(base, on ? away : "scale-100 opacity-100")}>{from}</span>
      <span className={cn(base, on ? "scale-100 rotate-0 opacity-100" : cn(away, feedback === "pop" && "-rotate-45"))}>{to}</span>
    </span>
  )
}

function IconBtn({ size, label, className, ...props }: React.ComponentProps<"button"> & { size: CopyFieldSize; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1 rounded-[5px] text-muted-foreground outline-none transition-[color,background-color,transform] duration-150",
        "hover:bg-accent hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring active:scale-95 disabled:pointer-events-none disabled:opacity-50 motion-reduce:active:scale-100",
        BTN[size],
        className
      )}
      {...props}
    />
  )
}

export interface CopyFieldProps extends Omit<React.ComponentProps<"div">, "onCopy" | "children" | "defaultValue"> {
  /** 要显示 / 复制的值 */
  value: string
  /** 复制的内容与显示的不同时传 (如显示短地址, 复制完整命令) */
  copyValue?: string
  /** 标签; 传了 label / description 会自动包一层 Field */
  label?: React.ReactNode
  description?: React.ReactNode
  /** 标签右侧的附加内容 (Field 的 aside), 如 "只显示一次" */
  aside?: React.ReactNode
  size?: CopyFieldSize
  /** default: 与 Input 同款描边; muted: 浅底无描边; ghost: 无底无描边 (放在行内 / 表格里) */
  variant?: CopyFieldVariant
  /** 敏感值: 默认遮罩, 带显示 / 隐藏按钮 */
  masked?: boolean
  /** 受控的 "已显示" 状态 */
  revealed?: boolean
  defaultRevealed?: boolean
  onRevealedChange?: (revealed: boolean) => void
  /** 遮罩时末尾保留几位明文, 默认 0 */
  maskPeek?: number
  /** 遮罩字符, 默认 "•" */
  maskChar?: string
  /** 多行 (接入语, 证书, 长命令): 高度随内容增长到 maxHeight, 再多就框内滚动 */
  multiline?: boolean
  /** 多行时的最大高度, 数字为 px, 默认 160 */
  maxHeight?: number | string
  /** 多行时的换行方式: word 在词间换行 (默认, 适合自然语言), anywhere 任意字符处换行 (适合长 token / base64) */
  wrap?: "word" | "anywhere"
  /** 等宽字体, 默认 true */
  mono?: boolean
  /** "已复制" 状态保持多久 ms, 默认 1600 */
  copiedDuration?: number
  /** 复制反馈动画, 默认 pop */
  feedback?: CopyFeedback
  /** 复制按钮旁显示文字 ("复制" / "已复制") */
  showLabel?: boolean
  copyLabel?: string
  copiedLabel?: string
  errorLabel?: string
  /** 点整个值区域就复制 (验证码, 邀请码) */
  clickToCopy?: boolean
  /** 值左侧的图标 / 前缀 (如 KeyIcon, "POST") */
  leading?: React.ReactNode
  /** 复制按钮前的额外操作 (如 "重新生成") */
  actions?: React.ReactNode
  /** 给值本身加的类 (如验证码的大字号与字距) */
  valueClassName?: string
  disabled?: boolean
  /** 复制成功; 参数是复制出去的文本 */
  onCopy?: (text: string) => void
  /** 复制失败 (此时值已被选中, 用户可手动复制) */
  onCopyError?: (error: unknown) => void
  /** 值的 id (默认读 Field 的) */
  id?: string
}

function CopyFieldControl({
  value,
  copyValue,
  size = "default",
  variant = "default",
  masked = false,
  revealed: revealedProp,
  defaultRevealed = false,
  onRevealedChange,
  maskPeek = 0,
  maskChar,
  multiline = false,
  maxHeight = DEFAULT_MAX_HEIGHT,
  wrap = "word",
  mono = true,
  copiedDuration = COPIED_MS,
  feedback = "pop",
  showLabel = false,
  copyLabel = "复制",
  copiedLabel = "已复制",
  errorLabel = "复制失败, 请手动复制",
  clickToCopy = false,
  leading,
  actions,
  valueClassName,
  disabled: disabledProp,
  onCopy,
  onCopyError,
  id: idProp,
  className,
  "aria-label": ariaLabel,
  "aria-describedby": describedByProp,
  "aria-invalid": invalidProp,
  ...props
}: Omit<CopyFieldProps, "label" | "description" | "aside">) {
  const control = useFieldControl({ id: idProp, "aria-describedby": describedByProp, "aria-invalid": invalidProp, disabled: disabledProp })
  const invalid = control["aria-invalid"] === true || control["aria-invalid"] === "true"
  const disabled = !!control.disabled
  const [revealedInner, setRevealedInner] = React.useState(defaultRevealed)
  const revealed = !masked || (revealedProp ?? revealedInner)
  const [status, setStatus] = React.useState<CopyStatus>("idle")
  const timer = React.useRef<number | null>(null)
  const valueRef = React.useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const reduced = useReducedMotion()

  React.useEffect(() => () => {
    if (timer.current != null) window.clearTimeout(timer.current)
  }, [])

  /** 单行遮罩且有末尾明文时, 按宽度收少圆点, 保证末尾明文不被省略号吃掉 (undefined = 不限, 用默认上限) */
  const [fitDots, setFitDots] = React.useState<number | undefined>(undefined)
  const display = React.useMemo(
    () => (revealed ? value : maskValue(value, { peek: maskPeek, char: maskChar, max: fitDots })),
    [revealed, value, maskPeek, maskChar, fitDots]
  )

  // 窄容器里 "••••••••••••••••a9F" 会被截成 "•••••…", 末尾明文 (最有用的部分) 反而看不到.
  // 量满档遮罩需要的宽度, 放不下就按每字符宽度算出能放几个点. 只在宽度 / 值 / 字号相关参数变化时重算.
  React.useLayoutEffect(() => {
    const el = valueRef.current
    if (!el || multiline || revealed || !maskPeek) return
    let raf = 0
    const fit = () => {
      const full = maskValue(value, { peek: maskPeek, char: maskChar })
      const len = Array.from(full).length
      const cs = getComputedStyle(el)
      const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
      const shown = el.value
      el.value = full
      const need = el.scrollWidth - pad
      el.value = shown
      const have = el.clientWidth - pad
      if (!len || need <= have + 0.5) return setFitDots(undefined)
      const keep = Math.min(Math.floor(maskPeek), Math.floor(Array.from(value).length / 2))
      setFitDots(Math.max(0, Math.floor(have / (need / len)) - keep - 1))
    }
    fit()
    let width = el.clientWidth
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === width) return
      width = el.clientWidth
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(fit)
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [multiline, revealed, value, maskPeek, maskChar, size, mono, valueClassName])

  // 多行: 高度跟内容走 (到 maxHeight 为止). 支持 field-sizing 时 CSS 全包; 否则 JS 量,
  // 值 / 宽度 / 影响行高的参数 / 网页字体加载完成 都会重量 (都在下一帧, 合并多次触发)
  React.useLayoutEffect(() => {
    const el = valueRef.current
    if (!multiline || !el || supportsFieldSizing()) return
    const fit = () => {
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight}px`
    }
    fit()
    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(fit)
    }
    let width = el.clientWidth
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === width) return
      width = el.clientWidth
      schedule()
    })
    ro.observe(el)
    const fonts = typeof document !== "undefined" ? document.fonts : undefined
    fonts?.addEventListener("loadingdone", schedule)
    return () => {
      ro.disconnect()
      fonts?.removeEventListener("loadingdone", schedule)
      cancelAnimationFrame(raf)
    }
  }, [multiline, display, maxHeight, size, mono, wrap, valueClassName])

  // 显示 / 隐藏切换: 在原元素上播淡入去模糊 (不重挂载: 焦点, 选区, 多行滚动位置都保留)
  const seenReveal = React.useRef(revealed)
  React.useLayoutEffect(() => {
    if (seenReveal.current === revealed) return
    seenReveal.current = revealed
    const el = valueRef.current
    if (!masked || reduced || !el || typeof el.animate !== "function") return
    el.animate([{ opacity: 0.2, filter: "blur(2px)" }, { opacity: 1, filter: "blur(0)" }], { duration: REVEAL_MS, easing: "ease-out" })
  }, [revealed, masked, reduced])

  const flash = (next: CopyStatus) => {
    setStatus(next)
    if (timer.current != null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setStatus("idle"), copiedDuration)
  }

  const setReveal = (next: boolean) => {
    if (revealedProp === undefined) setRevealedInner(next)
    onRevealedChange?.(next)
  }

  const copy = () => {
    if (disabled) return
    const text = copyValue ?? value
    copyToClipboard(text).then(
      () => {
        flash("copied")
        onCopy?.(text)
      },
      (err: unknown) => {
        flash("error")
        // 回退也失败: 遮罩时先显示出来, 再选中值, 让用户自己复制
        if (masked && !revealed) setReveal(true)
        requestAnimationFrame(() => valueRef.current?.select())
        onCopyError?.(err)
      }
    )
  }

  const copyText = status === "copied" ? copiedLabel : status === "error" ? errorLabel : copyLabel
  const valueClass = cn(
    "min-w-0 flex-1 bg-transparent text-foreground outline-none selection:bg-brand-soft",
    mono && "font-mono tracking-tight",
    PAD_X[size],
    !revealed && "text-foreground/70",
    clickToCopy && "cursor-pointer",
    valueClassName
  )
  const common = {
    ref: valueRef,
    id: control.id,
    readOnly: true,
    disabled,
    value: display,
    spellCheck: false,
    autoComplete: "off",
    "aria-label": ariaLabel,
    "aria-describedby": control["aria-describedby"],
    "aria-invalid": invalid || undefined,
    "data-slot": "copy-field-value",
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!multiline) e.currentTarget.select()
    },
    onClick: clickToCopy ? copy : undefined,
    onKeyDown: clickToCopy
      ? (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault()
            copy()
          }
        }
      : undefined,
    // 原生复制: 遮罩时 (或全选且有 copyValue 时) 换成真值; 显示时的部分选区照常复制
    onCopy: (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const el = e.currentTarget
      const all = el.selectionStart === 0 && el.selectionEnd === el.value.length
      if (revealed && !(all && copyValue != null)) {
        flash("copied")
        onCopy?.(el.value.slice(el.selectionStart ?? 0, el.selectionEnd ?? el.value.length))
        return
      }
      const text = copyValue ?? value
      e.preventDefault()
      e.clipboardData.setData("text/plain", text)
      flash("copied")
      onCopy?.(text)
    },
  }

  return (
    <div
      data-slot="copy-field"
      data-size={size}
      data-variant={variant}
      data-status={status}
      data-revealed={revealed ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      data-multiline={multiline ? "" : undefined}
      className={cn(fieldVariants({ variant, size, multiline }), className)}
      {...props}
    >
      {leading != null && (
        <span data-slot="copy-field-leading" className={cn("flex shrink-0 items-center pl-3 text-muted-foreground [&_svg:not([class*='size-'])]:size-4", multiline && "pt-2.5", size === "sm" && "pl-2.5")}>
          {leading}
        </span>
      )}
      {multiline ? (
        <textarea
          {...common}
          rows={1}
          style={{ maxHeight }}
          className={cn(
            valueClass,
            "resize-none overflow-y-auto py-2 leading-5 [field-sizing:content]",
            wrap === "anywhere" ? "[overflow-wrap:anywhere]" : "break-words"
          )}
        />
      ) : (
        <input {...common} type="text" className={cn(valueClass, "h-full truncate", leading != null && "pl-2")} />
      )}
      <div data-slot="copy-field-actions" className={cn("flex shrink-0 items-center gap-0.5", TRAIL[size], multiline && "pt-1")}>
        {actions}
        {masked && (
          <IconBtn size={size} label={revealed ? "隐藏" : "显示"} aria-pressed={revealed} disabled={disabled} onClick={() => setReveal(!revealed)}>
            <SwapIcon on={revealed} from={<EyeIcon />} to={<EyeOffIcon />} feedback={feedback === "pop" ? "fade" : feedback} />
          </IconBtn>
        )}
        <IconBtn
          size={size}
          label={copyText}
          disabled={disabled}
          onClick={copy}
          data-slot="copy-field-copy"
          className={cn(
            status === "copied" && "text-success hover:text-success",
            status === "error" && "text-destructive hover:text-destructive",
            showLabel && "w-auto px-2"
          )}
        >
          <SwapIcon
            on={status !== "idle"}
            from={<CopyIcon />}
            to={status === "error" ? <XIcon /> : <CheckIcon />}
            feedback={feedback}
          />
          {showLabel && <span className="text-xs font-medium whitespace-nowrap">{status === "copied" ? copiedLabel : status === "error" ? "失败" : copyLabel}</span>}
        </IconBtn>
      </div>
      <span aria-live="polite" className="sr-only">
        {status === "copied" ? copiedLabel : status === "error" ? errorLabel : ""}
      </span>
    </div>
  )
}

/** 可复制字段. 传 label / description / aside 时自带 Field; 放进外部 Field 时读它的 id 与说明 */
function CopyField({ label, description, aside, ...props }: CopyFieldProps) {
  if (label == null && description == null) return <CopyFieldControl {...props} />
  return (
    <Field label={label} description={description} aside={aside} disabled={props.disabled} htmlFor={props.id}>
      <CopyFieldControl {...props} />
    </Field>
  )
}

export { CopyField }
