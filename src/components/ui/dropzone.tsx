"use client"

/**
 * 拖放上传区: 包住任意区域 (会话, 网盘列表), 拖文件进来时盖一层提示; 也能单独当一块 "拖放或点击选择" 的上传卡片.
 *
 *   <Dropzone accept="image/*,.pdf" maxSize={20 * MB} onFiles={(files) => upload(files)} onReject={(files, reasons) => toast(...)}>
 *     <Conversation />
 *   </Dropzone>
 *   <Dropzone variant="area" multiple maxFiles={10} onFiles={add} />
 *
 * 只出 UI 和事件, 不负责上传: 放下 / 选择 / 粘贴的文件先按 accept, maxSize, minSize, maxFiles 校验 (见 dropzone-model.ts),
 * 通过的交给 onFiles, 没通过的连同原因交给 onReject. 进度显示交给 UploadList (upload-list.tsx).
 * 拖动判定: 只认带文件的拖动 (dataTransfer.types 含 "Files"), 拖选文字 / 拖链接不触发.
 * 进出子元素时 dragenter / dragleave 成对乱发, 用计数器 (进 +1, 出 -1, 归零才算离开) 防止覆盖层闪烁;
 * 另在 window 上兜底 (drop / dragend / 拖出窗口) 把计数清零, 避免状态卡住.
 * 拖动途中浏览器只给 MIME 不给文件名: 扩展名规则经常见扩展名 -> MIME 映射表 (dropzone-model.ts 的 EXT_MIME) 翻成 MIME 判断,
 * 能确定 "全都不收" 或 "数量超了" 时覆盖层直接变成拒绝样式; 部分不收时照常高亮并注明会跳过几个;
 * 看不出来 (扩展名不在表里, 系统报不出 MIME, Safari 拖动中不给条目) 时显示中性样式 "松开后检查", 放下后再按文件名精确校验.
 * 覆盖层: 1px 虚线框 + 图标 + 说明, 淡入 + 由 0.98 放大到 1 (只动 opacity / transform, 时长可调, 默认 180ms), 减弱动效时直接出现.
 * 点击选文件走隐藏的 <input type="file">; 外部用 ref 拿 open() 打开选择框 (会话里的回形针按钮); paste 打开后可粘贴文件 (截图).
 * 拖动中只在进出边界时 setState 一次, dragover 不触发渲染.
 */

import * as React from "react"
import { cva } from "class-variance-authority"
import { CloudUploadIcon, FileWarningIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  describeAccept,
  dragVerdict,
  formatBytes,
  parseAccept,
  validateFiles,
  type RejectReason,
} from "@/components/ui/dropzone-model"

export type { FileLike, FileRejection, RejectCode, RejectReason, ValidateOptions, ValidateResult } from "@/components/ui/dropzone-model"
export { EXT_MIME, describeAccept, dragVerdict, formatBytes, matchAccept, validateFiles, type DragVerdict } from "@/components/ui/dropzone-model"

/** 文件从哪来 */
export type DropzoneSource = "drop" | "pick" | "paste"

/**
 * 拖动状态: idle 没在拖; accept 拖着能收的文件; reject 拖着明显收不了的文件 (类型全不对 / 数量超了);
 * unknown 拖动中看不出类型 (扩展名规则认不出 / 浏览器不给 MIME), 中性提示, 放下后再校验
 */
export type DropzoneDragState = "idle" | "accept" | "reject" | "unknown"

export interface DropzoneState {
  dragState: DropzoneDragState
  /** 正拖着文件悬停在区域上 (含 reject) */
  dragging: boolean
  /** reject 时的原因 (中文, 可直接显示) */
  rejectMessage?: string
  /** accept / unknown 时的补充说明, 如 "1 个文件类型不支持, 松开后会跳过" / "松开后按文件名检查 (只支持 PDF)" */
  dragMessage?: string
  disabled: boolean
  /** 打开选择文件框 */
  open: () => void
}

export interface DropzoneHandle {
  /** 打开选择文件框 */
  open: () => void
  /** 根元素 */
  root: HTMLDivElement | null
}

export type DropzoneTone = "brand" | "primary" | "neutral"

export interface DropzoneProps extends Omit<React.ComponentProps<"div">, "children" | "ref" | "onDrop"> {
  ref?: React.Ref<DropzoneHandle>
  /**
   * overlay (默认): 包住 children, 拖入时盖一层提示, 点击不选文件 (会话 / 列表这类本身可交互的区域);
   * area: 独立的上传卡片 (虚线框 + 图标 + 说明), 点击或回车 / 空格选文件.
   */
  variant?: "overlay" | "area"
  /** 被包住的区域; area 时换掉卡片的默认内容. 可以是函数, 拿到拖动状态 */
  children?: React.ReactNode | ((state: DropzoneState) => React.ReactNode)
  /** 接受的类型, 同 <input accept>: "image/*,.pdf" 或 ["image/*", ".pdf"]; 不给 = 全收 */
  accept?: string | readonly string[]
  /** 允许多选, 默认 true */
  multiple?: boolean
  /** 单个文件上限 (字节) */
  maxSize?: number
  /** 单个文件下限 (字节); 传 1 排除空文件 */
  minSize?: number
  /** 文件总数上限 (含 count) */
  maxFiles?: number
  /** 已有的文件数 (例如附件栏里已有 3 个), 计入 maxFiles */
  count?: number
  /** 通过校验的文件; source 说明来自拖放 / 选择 / 粘贴 */
  onFiles?: (files: File[], source: DropzoneSource) => void
  /** 没通过校验的文件, reasons[i] 是 files[i] 的原因列表 */
  onReject?: (files: File[], reasons: RejectReason[][]) => void
  /** 拖动状态变化 (进入 / 离开 / 放下) */
  onDragStateChange?: (state: DropzoneDragState) => void
  disabled?: boolean
  /** 点击选文件; area 默认 true, overlay 默认 false (用 ref.open() 或 render 函数里的 open) */
  clickable?: boolean
  /** 接受粘贴的文件: true 在区域内有焦点时; "window" 整页任意位置 (会话输入框常用) */
  paste?: boolean | "window"
  /** 覆盖层 / 拖入高亮的色调, 默认 brand */
  tone?: DropzoneTone
  /** 覆盖层: false 不显示; 节点或函数换掉默认内容 (外框与动画照旧) */
  overlay?: false | React.ReactNode | ((state: DropzoneState) => React.ReactNode)
  /** 覆盖层标题, 默认 "松开即可上传" */
  overlayTitle?: React.ReactNode
  /** 覆盖层 / 卡片的说明; 默认按 accept 与 maxSize 生成, 如 "图片、PDF · 单个不超过 20 MB" */
  hint?: React.ReactNode
  /** 图标, 默认上传云 */
  icon?: React.ReactNode
  /** 覆盖层背后磨砂, 默认 true */
  blur?: boolean
  /** 覆盖层离区域边缘的距离 px, 默认 6 */
  inset?: number
  /** 覆盖层淡入 / 缩放时长 ms, 默认 180 */
  duration?: number
  /** area 的尺寸: sm 横排一行, default 竖排, lg 更高 */
  size?: "sm" | "default" | "lg"
  /** 隐藏 input 的其他属性 (name, capture, id ...) */
  inputProps?: Omit<React.ComponentProps<"input">, "type" | "accept" | "multiple" | "onChange" | "ref">
}

const DEFAULT_DURATION = 180
const DEFAULT_INSET = 6
const FILES_TYPE = "Files"

/** 拖动里带的是文件 (而不是选中的文字 / 链接) */
const hasFiles = (e: { dataTransfer: DataTransfer | null }) => !!e.dataTransfer && Array.from(e.dataTransfer.types).includes(FILES_TYPE)

const TONE: Record<DropzoneTone, { overlay: string; area: string; icon: string }> = {
  brand: { overlay: "border-brand bg-brand-soft text-brand", area: "data-[drag=accept]:border-brand data-[drag=accept]:bg-brand-soft", icon: "group-data-[drag=accept]/dropzone:text-brand" },
  primary: { overlay: "border-primary bg-primary/10 text-primary", area: "data-[drag=accept]:border-primary data-[drag=accept]:bg-primary/5", icon: "group-data-[drag=accept]/dropzone:text-primary" },
  neutral: { overlay: "border-ring bg-accent/50 text-foreground", area: "data-[drag=accept]:border-ring data-[drag=accept]:bg-accent/50", icon: "group-data-[drag=accept]/dropzone:text-foreground" },
}
/** 看不出能不能收: 不管 tone, 一律中性 */
const UNKNOWN_OVERLAY = "border-ring bg-accent/50 text-foreground"

const area = cva(
  [
    "group/dropzone relative flex cursor-pointer rounded-xl border border-dashed border-border bg-background/40 text-center outline-none select-none",
    "transition-colors duration-150 hover:border-ring hover:bg-accent/30 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
    "data-[drag=reject]:border-destructive data-[drag=reject]:bg-destructive/5 data-[drag=unknown]:border-ring data-[drag=unknown]:bg-accent/40",
    "aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:border-border aria-disabled:hover:bg-background/40",
  ],
  {
    variants: {
      size: {
        sm: "min-h-16 flex-row items-center gap-3 px-4 py-3 text-left",
        default: "flex-col items-center justify-center gap-2 px-6 py-8",
        lg: "flex-col items-center justify-center gap-3 px-8 py-14",
      },
    },
    defaultVariants: { size: "default" },
  }
)

const AREA_ICON: Record<NonNullable<DropzoneProps["size"]>, string> = {
  sm: "size-10 [&>svg]:size-5",
  default: "size-11 [&>svg]:size-5",
  lg: "size-14 [&>svg]:size-6",
}

/**
 * 拖动途中的判断 (只有 MIME 与数量): 数量超了 / 全部类型不对 -> reject; 有看不出的 -> unknown; 部分不对 -> accept + 说明.
 * Chrome / Firefox 拖动中给每个条目的 MIME; Safari 常给空条目, 此时有 accept 规则就是 unknown.
 */
function dragCheck(
  dt: DataTransfer | null,
  opts: { accept?: string | readonly string[]; multiple: boolean; maxFiles?: number; count: number }
): { state: Exclude<DropzoneDragState, "idle">; message?: string } {
  const items = Array.from(dt?.items ?? []).filter((it) => it.kind === "file")
  const desc = describeAccept(opts.accept)
  const hasRules = parseAccept(opts.accept).length > 0
  const later = `松开后按文件名检查${desc ? `（只支持 ${desc}）` : ""}`
  if (!items.length) return hasRules ? { state: "unknown", message: later } : { state: "accept" }
  if (!opts.multiple && items.length > 1) return { state: "reject", message: "只能放 1 个文件" }
  if (opts.maxFiles != null && opts.count + items.length > opts.maxFiles) {
    const left = Math.max(0, opts.maxFiles - opts.count)
    return { state: "reject", message: left ? `最多还能放 ${left} 个文件` : `已达上限 ${opts.maxFiles} 个` }
  }
  const verdicts = items.map((it) => dragVerdict(it.type, opts.accept))
  const rejected = verdicts.filter((v) => v === "reject").length
  const unknown = verdicts.filter((v) => v === "unknown").length
  if (rejected === items.length) return { state: "reject", message: desc ? `只支持 ${desc}` : "不支持这类文件" }
  if (unknown) return { state: "unknown", message: later }
  if (rejected) return { state: "accept", message: `${rejected} 个文件类型不支持，松开后会跳过` }
  return { state: "accept" }
}

function defaultHint(accept: DropzoneProps["accept"], maxSize?: number, maxFiles?: number) {
  const parts = [describeAccept(accept), maxSize != null ? `单个不超过 ${formatBytes(maxSize)}` : "", maxFiles != null ? `最多 ${maxFiles} 个` : ""]
  return parts.filter(Boolean).join(" · ")
}

function Dropzone({
  ref,
  variant = "overlay",
  children,
  accept,
  multiple = true,
  maxSize,
  minSize,
  maxFiles,
  count = 0,
  onFiles,
  onReject,
  onDragStateChange,
  disabled = false,
  clickable,
  paste = false,
  tone = "brand",
  overlay,
  overlayTitle = "松开即可上传",
  hint,
  icon,
  blur = true,
  inset = DEFAULT_INSET,
  duration = DEFAULT_DURATION,
  size = "default",
  inputProps,
  className,
  style,
  onKeyDown,
  onClick,
  ...props
}: DropzoneProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const depth = React.useRef(0)
  const [drag, setDrag] = React.useState<{ state: DropzoneDragState; message?: string }>({ state: "idle" })
  const isArea = variant === "area"
  const canClick = (clickable ?? isArea) && !disabled

  // 回调与校验参数放进 ref: 事件处理里总拿最新值, window 监听不用跟着重挂
  const latest = React.useRef({ accept, multiple, maxSize, minSize, maxFiles, count, onFiles, onReject, onDragStateChange, disabled })
  latest.current = { accept, multiple, maxSize, minSize, maxFiles, count, onFiles, onReject, onDragStateChange, disabled }

  const setDragState = React.useCallback((state: DropzoneDragState, message?: string) => {
    setDrag((d) => (d.state === state && d.message === message ? d : { state, message }))
    latest.current.onDragStateChange?.(state)
  }, [])

  const reset = React.useCallback(() => {
    if (depth.current === 0) return
    depth.current = 0
    setDragState("idle")
  }, [setDragState])

  const handleFiles = React.useCallback((list: FileList | File[] | null | undefined, source: DropzoneSource) => {
    const o = latest.current
    const files = Array.from(list ?? [])
    if (!files.length || o.disabled) return
    const { accepted, rejected } = validateFiles(files, { accept: o.accept, multiple: o.multiple, maxSize: o.maxSize, minSize: o.minSize, maxFiles: o.maxFiles, existing: o.count })
    if (accepted.length) o.onFiles?.(accepted, source)
    if (rejected.length) o.onReject?.(rejected.map((r) => r.file), rejected.map((r) => r.reasons))
  }, [])

  const open = React.useCallback(() => {
    if (latest.current.disabled) return
    inputRef.current?.click()
  }, [])

  React.useImperativeHandle(ref, () => ({ open, get root() { return rootRef.current } }), [open])

  // 拖动中在 window 上兜底: 放到别处 / 取消拖动 / 拖出窗口时清零 (捕获阶段, 不怕内层 stopPropagation)
  const dragging = drag.state !== "idle"
  React.useEffect(() => {
    if (!dragging) return
    const onLeaveWindow = (e: DragEvent) => {
      if (e.relatedTarget == null && (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) reset()
    }
    window.addEventListener("drop", reset, true)
    window.addEventListener("dragend", reset, true)
    window.addEventListener("dragleave", onLeaveWindow, true)
    return () => {
      window.removeEventListener("drop", reset, true)
      window.removeEventListener("dragend", reset, true)
      window.removeEventListener("dragleave", onLeaveWindow, true)
    }
  }, [dragging, reset])

  // 粘贴文件
  React.useEffect(() => {
    if (!paste || disabled) return
    const target: Window | HTMLElement | null = paste === "window" ? window : rootRef.current
    if (!target) return
    const onPaste = (e: Event) => {
      const files = (e as ClipboardEvent).clipboardData?.files
      if (!files?.length) return
      e.preventDefault()
      handleFiles(files, "paste")
    }
    target.addEventListener("paste", onPaste)
    return () => target.removeEventListener("paste", onPaste)
  }, [paste, disabled, handleFiles])

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled || !hasFiles(e)) return
    e.preventDefault()
    depth.current += 1
    if (depth.current === 1) {
      const o = latest.current
      const verdict = dragCheck(e.dataTransfer, { accept: o.accept, multiple: o.multiple, maxFiles: o.maxFiles, count: o.count })
      setDragState(verdict.state, verdict.message)
    }
  }
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled || !hasFiles(e)) return
    // 必须 preventDefault 才能放下; 不触发渲染
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled || !hasFiles(e) || depth.current === 0) return
    depth.current -= 1
    if (depth.current === 0) setDragState("idle")
  }
  const onDropEvent = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled || !hasFiles(e)) return
    e.preventDefault()
    // 嵌套的拖放区: 内层收了外层就不再收
    e.stopPropagation()
    depth.current = 0
    setDragState("idle")
    handleFiles(e.dataTransfer.files, "drop")
  }

  const state: DropzoneState = {
    dragState: drag.state,
    dragging,
    rejectMessage: drag.state === "reject" ? drag.message : undefined,
    dragMessage: drag.state !== "reject" ? drag.message : undefined,
    disabled,
    open,
  }
  const autoHint = hint ?? defaultHint(accept, maxSize, maxFiles)
  const cssVars = { "--dropzone-duration": `${duration}ms`, "--dropzone-inset": `${inset}px`, ...style } as React.CSSProperties

  const input = (
    <input
      {...inputProps}
      ref={inputRef}
      type="file"
      tabIndex={-1}
      aria-hidden
      hidden
      disabled={disabled}
      accept={typeof accept === "string" ? accept : accept?.join(",")}
      multiple={multiple}
      onChange={(e) => {
        handleFiles(e.currentTarget.files, "pick")
        // 清空, 同一个文件可以再选一次
        e.currentTarget.value = ""
      }}
    />
  )

  const common = {
    ...props,
    ref: rootRef,
    "data-drag": drag.state,
    "data-disabled": disabled ? "" : undefined,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop: onDropEvent,
    onClick: (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e)
      if (!canClick || e.defaultPrevented) return
      // 区域里的按钮 / 链接 / 输入框自己处理点击
      const hit = (e.target as HTMLElement).closest("button, a, input, textarea, select, [role=button]")
      if (hit && hit !== e.currentTarget) return
      open()
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (!canClick || e.defaultPrevented || e.target !== e.currentTarget) return
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        open()
      }
    },
  }

  if (isArea) {
    const content = typeof children === "function" ? children(state) : children
    const rejecting = drag.state === "reject"
    return (
      <div
        data-slot="dropzone"
        data-variant="area"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label={props["aria-label"] ?? "上传文件"}
        className={cn(area({ size }), TONE[tone].area, className)}
        style={cssVars}
        {...common}
      >
        {input}
        {content ?? (
          <>
            <span
              aria-hidden
              data-slot="dropzone-icon"
              className={cn(
                "grid shrink-0 place-items-center rounded-full border bg-muted/60 text-muted-foreground",
                "transition-[transform,color] duration-[var(--dropzone-duration)] ease-out motion-reduce:transition-none",
                "group-data-[drag=accept]/dropzone:-translate-y-0.5 group-data-[drag=accept]/dropzone:scale-110 group-data-[drag=reject]/dropzone:text-destructive",
                TONE[tone].icon,
                AREA_ICON[size]
              )}
            >
              {rejecting ? <FileWarningIcon /> : icon ?? <CloudUploadIcon />}
            </span>
            <span className={cn("grid min-w-0 gap-0.5", size === "sm" && "flex-1")}>
              <span className="text-sm font-medium">
                {rejecting ? (
                  <span className="text-destructive">{drag.message}</span>
                ) : dragging ? (
                  overlayTitle
                ) : (
                  <>
                    拖放文件到这里，或<span className="text-brand">点击选择</span>
                  </>
                )}
              </span>
              {/* 拒绝时标题已经说明原因, 不再重复 accept 说明 */}
              {!rejecting && (state.dragMessage ?? autoHint) && <span className="truncate text-xs text-muted-foreground">{state.dragMessage ?? autoHint}</span>}
            </span>
          </>
        )}
      </div>
    )
  }

  const custom = typeof overlay === "function" ? overlay(state) : overlay
  return (
    <div
      data-slot="dropzone"
      data-variant="overlay"
      className={cn("group/dropzone relative", className)}
      style={cssVars}
      {...common}
    >
      {input}
      {typeof children === "function" ? children(state) : children}
      {overlay !== false && (
        <DropzoneOverlay state={state} tone={tone} blur={blur} title={overlayTitle} hint={autoHint} icon={icon}>
          {custom === true ? undefined : custom}
        </DropzoneOverlay>
      )}
    </div>
  )
}

/** 拖入时盖在区域上的提示层; 单独导出, 可以自己摆位置 (例如只盖住消息区不盖输入框) */
function DropzoneOverlay({
  state,
  tone = "brand",
  blur = true,
  title = "松开即可上传",
  hint,
  icon,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  state: Pick<DropzoneState, "dragState" | "rejectMessage" | "dragMessage">
  tone?: DropzoneTone
  blur?: boolean
  title?: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ReactNode
}) {
  const active = state.dragState !== "idle"
  const reject = state.dragState === "reject"
  const unknown = state.dragState === "unknown"
  const note = reject ? undefined : state.dragMessage ?? hint
  return (
    <div
      data-slot="dropzone-overlay"
      data-state={active ? "open" : "closed"}
      data-reject={reject ? "" : undefined}
      data-drag={state.dragState}
      aria-hidden={!active}
      className={cn(
        "pointer-events-none absolute inset-[var(--dropzone-inset,6px)] z-20 grid place-items-center rounded-[inherit] bg-background/70",
        blur && "backdrop-blur-[2px]",
        "scale-[0.98] opacity-0 transition-[opacity,transform] duration-[var(--dropzone-duration,180ms)] ease-out motion-reduce:scale-100 motion-reduce:transition-none",
        "data-[state=open]:scale-100 data-[state=open]:opacity-100",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute inset-0 grid place-items-center rounded-[inherit] border border-dashed",
          reject ? "border-destructive bg-destructive/10 text-destructive" : unknown ? UNKNOWN_OVERLAY : TONE[tone].overlay
        )}
      >
        {children ?? (
          <div className="grid justify-items-center gap-2 px-6 text-center">
            <span
              aria-hidden
              className={cn(
                "grid size-12 place-items-center rounded-full border border-current/30 bg-background/80 [&>svg]:size-6",
                "translate-y-1 transition-transform delay-[40ms] duration-[var(--dropzone-duration,180ms)] ease-out motion-reduce:translate-y-0 motion-reduce:transition-none",
                active && "translate-y-0"
              )}
            >
              {reject ? <FileWarningIcon /> : icon ?? <CloudUploadIcon />}
            </span>
            <span className="text-sm font-medium">{reject ? state.rejectMessage : title}</span>
            {note && <span className="text-xs text-muted-foreground">{note}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export { Dropzone, DropzoneOverlay }
