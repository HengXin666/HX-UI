"use client"

/**
 * 上传进度列表: 每个文件一行, 文件名 (中间截断, 扩展名总在), 大小, 类型图标或图片缩略图, 进度条, 状态, 暂停 / 继续 / 取消 / 重试 / 移除.
 *
 *   <UploadList items={uploads} onCancel={(f) => abort(f.id)} onRetry={(f) => start(f.id)} onRemove={(f) => drop(f.id)} />
 *
 * 只出 UI 和事件: 进度与状态由调用方 (真正发请求的地方) 更新进 items, 列表不自己计时.
 * 进度条复用 Progress (只动 transform), 颜色随状态: 上传中主色, 暂停 warning, 出错 destructive.
 * 增删有过渡: 由 useUnfold 驱动 (与 Tree 的展开收起同一套), 新行淡入并带动下方行平滑让位, 移除的行淡出后下方行收上来;
 * 移除中的行 inert + aria-hidden. 减弱动效时直接到位.
 * 缩略图: item.preview 给 URL 就用它; 只给了 item.file 且是图片时, 内部建对象 URL 并在卸载 / 换文件时释放.
 * 密度 (density): compact 单行 40px (会话附件栏), default 两行 (网盘), comfortable 更大的缩略图.
 * UploadItem 单独导出, 可以不用列表自己排 (例如横排的附件卡片).
 */

import * as React from "react"
import { cva } from "class-variance-authority"
import {
  CircleAlertIcon,
  CircleCheckIcon,
  FileArchiveIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoIcon,
  PauseIcon,
  PlayIcon,
  RotateCwIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useUnfold } from "@/motion/use-unfold"
import type { UnfoldOptions, UnfoldType } from "@/motion/unfold"
import { fileKind, formatBytes, isPreviewableImage, splitFileName, type FileKind } from "@/components/ui/dropzone-model"

export type UploadStatus = "queued" | "uploading" | "paused" | "done" | "error"
export type UploadDensity = "compact" | "default" | "comfortable"

export interface UploadFile {
  id: string
  name: string
  /** 字节 */
  size: number
  /** MIME, 决定图标 (与扩展名一起) */
  type?: string
  status: UploadStatus
  /** 0..100; null 表示进度未知 (显示来回滑动的条) */
  progress?: number | null
  /** 出错说明, 默认 "上传失败" */
  error?: React.ReactNode
  /** 缩略图 URL */
  preview?: string
  /** 原始文件: 是图片且没给 preview 时自动生成缩略图 */
  file?: Blob
  /** 附加信息, 显示在状态后面, 如 "1.2 MB/s · 剩余 8 秒" */
  meta?: React.ReactNode
}

export interface UploadItemActions {
  onCancel?: (item: UploadFile) => void
  onRetry?: (item: UploadFile) => void
  onRemove?: (item: UploadFile) => void
  onPause?: (item: UploadFile) => void
  onResume?: (item: UploadFile) => void
}

export interface UploadItemProps extends UploadItemActions, Omit<React.ComponentProps<"div">, "children" | "onPause"> {
  item: UploadFile
  density?: UploadDensity
  /** 图片显示缩略图, 默认 true; false 时一律显示类型图标 */
  thumbnail?: boolean
  /** 换掉类型图标 */
  icon?: React.ReactNode
  /** 额外的操作按钮, 放在内置按钮前面 */
  actions?: React.ReactNode
  /** 文件名尾部保留的字符数 (不含扩展名), 默认 6 */
  keepTail?: number
}

const KIND_ICON: Record<FileKind, { icon: React.ComponentType; tint: string }> = {
  image: { icon: FileImageIcon, tint: "bg-chart-2/15 text-chart-2" },
  video: { icon: FileVideoIcon, tint: "bg-chart-4/15 text-chart-4" },
  audio: { icon: FileAudioIcon, tint: "bg-chart-3/15 text-chart-3" },
  pdf: { icon: FileTextIcon, tint: "bg-destructive/15 text-destructive" },
  archive: { icon: FileArchiveIcon, tint: "bg-warning/15 text-warning" },
  sheet: { icon: FileSpreadsheetIcon, tint: "bg-success/15 text-success" },
  code: { icon: FileCodeIcon, tint: "bg-info/15 text-info" },
  text: { icon: FileTextIcon, tint: "bg-brand-soft text-brand" },
  file: { icon: FileIcon, tint: "bg-muted text-muted-foreground" },
}

const TONE: Record<UploadStatus, "default" | "warning" | "destructive" | "success"> = {
  queued: "default",
  uploading: "default",
  paused: "warning",
  done: "success",
  error: "destructive",
}

const row = cva(
  [
    "group/upload relative flex min-w-0 items-center rounded-lg transition-colors duration-150 hover:bg-accent/40",
    "data-[status=error]:bg-destructive/5 data-[status=error]:hover:bg-destructive/10",
  ],
  {
    variants: {
      density: {
        compact: "h-10 gap-2 px-2 pointer-coarse:h-12",
        default: "gap-3 px-2.5 py-2",
        comfortable: "gap-3.5 px-3 py-3",
      },
    },
    defaultVariants: { density: "default" },
  }
)

const THUMB: Record<UploadDensity, string> = {
  compact: "size-6 rounded-md [&_svg]:size-3.5",
  default: "size-10 rounded-lg [&_svg]:size-5",
  comfortable: "size-12 rounded-lg [&_svg]:size-6",
}

/** 给 Blob 建对象 URL, 换文件 / 卸载时释放 */
function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = React.useState<string>()
  React.useEffect(() => {
    if (!blob) return
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => {
      URL.revokeObjectURL(u)
      setUrl(undefined)
    }
  }, [blob])
  return url
}

/** 文件名: 头部可截断, 尾部 (扩展名前几个字符 + 扩展名) 总显示 */
function FileName({ name, keep, className }: { name: string; keep: number; className?: string }) {
  const [head, tail] = splitFileName(name, keep)
  return (
    <span data-slot="upload-item-name" title={name} className={cn("flex min-w-0", className)}>
      <span className="truncate">{head}</span>
      {tail && <span className="shrink-0 whitespace-pre">{tail}</span>}
    </span>
  )
}

function ActionButton({ label, onClick, children, className }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <Button
      type="button"
      size="icon-xs"
      variant="ghost"
      aria-label={label}
      title={label}
      className={cn("text-muted-foreground hover:text-foreground pointer-coarse:size-8", className)}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {children}
    </Button>
  )
}

function UploadItem({
  item,
  density = "default",
  thumbnail = true,
  icon,
  actions,
  keepTail = 6,
  onCancel,
  onRetry,
  onRemove,
  onPause,
  onResume,
  className,
  ...props
}: UploadItemProps) {
  const { status } = item
  const kind = fileKind(item.name, item.type)
  const wantsThumb = thumbnail && !icon && (item.preview != null || (item.file != null && isPreviewableImage(item.name, item.type ?? item.file.type)))
  const objectUrl = useObjectUrl(wantsThumb && !item.preview ? item.file : undefined)
  const [broken, setBroken] = React.useState<string>()
  const url = wantsThumb ? item.preview ?? objectUrl : undefined
  // 图片解不出来 (损坏 / 格式不支持) 时退回类型图标
  const src = url && url !== broken ? url : undefined
  const { icon: KindIcon, tint } = KIND_ICON[kind]
  const pct = item.progress == null ? null : Math.round(Math.min(100, Math.max(0, item.progress)))
  const loaded = pct == null ? 0 : (item.size * pct) / 100
  const busy = status === "uploading" || status === "paused" || status === "queued"
  const compact = density === "compact"

  const statusText: React.ReactNode =
    status === "queued" ? "等待上传"
    : status === "paused" ? (pct != null ? `暂停 ${pct}%` : "已暂停")
    : status === "done" ? "上传完成"
    : status === "error" ? item.error ?? "上传失败"
    : pct == null ? "上传中…"
    : `${formatBytes(loaded)} / ${formatBytes(item.size)}`

  const statusIcon =
    status === "done" ? <CircleCheckIcon aria-hidden className="size-3.5 shrink-0 text-success" />
    : status === "error" ? <CircleAlertIcon aria-hidden className="size-3.5 shrink-0 text-destructive" />
    : null

  const buttons = (
    <div data-slot="upload-item-actions" className="flex shrink-0 items-center gap-0.5">
      {actions}
      {status === "uploading" && onPause && <ActionButton label="暂停" onClick={() => onPause(item)}><PauseIcon /></ActionButton>}
      {status === "paused" && onResume && <ActionButton label="继续" onClick={() => onResume(item)}><PlayIcon /></ActionButton>}
      {status === "error" && onRetry && <ActionButton label="重试" onClick={() => onRetry(item)}><RotateCwIcon /></ActionButton>}
      {busy && onCancel && <ActionButton label="取消上传" onClick={() => onCancel(item)}><XIcon /></ActionButton>}
      {!busy && onRemove && <ActionButton label="移除" onClick={() => onRemove(item)}><XIcon /></ActionButton>}
    </div>
  )

  const thumb = (
    <span
      aria-hidden
      data-slot="upload-item-thumb"
      className={cn("relative grid shrink-0 place-items-center overflow-hidden", THUMB[density], src ? "border bg-muted" : tint)}
    >
      {src ? <img src={src} alt="" decoding="async" loading="lazy" draggable={false} onError={() => setBroken(src)} className="size-full object-cover" /> : icon ?? <KindIcon />}
    </span>
  )

  const progress = busy && (
    <Progress
      size="sm"
      value={status === "queued" ? 0 : pct}
      tone={TONE[status] === "success" ? "default" : TONE[status]}
      aria-label={`上传 ${item.name}`}
      className={compact ? "absolute inset-x-2 bottom-0 h-0.5 w-auto rounded-none bg-transparent" : "min-w-0 flex-1"}
    />
  )

  return (
    <div
      data-slot="upload-item"
      data-status={status}
      data-density={density}
      aria-busy={status === "uploading" || undefined}
      className={cn(row({ density }), className)}
      {...props}
    >
      {thumb}
      {compact ? (
        <>
          <FileName name={item.name} keep={keepTail} className="flex-1 text-[13px]" />
          <span className={cn("flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular", status === "error" && "text-destructive")}>
            {statusIcon}
            {status === "uploading" && pct != null ? `${pct}%` : status === "done" ? formatBytes(item.size) : statusText}
          </span>
          {progress}
        </>
      ) : (
        <div className="grid min-w-0 flex-1 gap-1.5">
          <div className="flex min-w-0 items-baseline gap-2 text-sm">
            <FileName name={item.name} keep={keepTail} className="flex-1 font-medium" />
            <span className="shrink-0 text-xs text-muted-foreground tabular">
              {item.meta != null && status === "uploading" && <span className="hidden sm:inline">{item.meta} · </span>}
              {formatBytes(item.size)}
            </span>
          </div>
          <div className="flex h-4 min-w-0 items-center gap-2 text-xs text-muted-foreground">
            {progress}
            {statusIcon}
            <span
              className={cn(
                "min-w-0 truncate tabular",
                // 进度条后的状态字固定最小宽度, 多行的进度条右端对齐
                busy && "min-w-14 shrink-0 text-right",
                status === "error" && "text-destructive",
                status === "paused" && "text-warning"
              )}
            >
              {status === "uploading" && pct != null ? `${pct}%` : statusText}
            </span>
            {status === "uploading" && pct != null && <span className="sr-only">{statusText}</span>}
          </div>
        </div>
      )}
      {buttons}
    </div>
  )
}

export interface UploadListProps extends UploadItemActions, Omit<React.ComponentProps<"div">, "children" | "onPause"> {
  items: readonly UploadFile[]
  density?: UploadDensity
  thumbnail?: boolean
  /**
   * 增删动画, 默认 "slide": 新行淡入并带动下方让位, 移除的行淡出后收拢; "fade" 原地淡入; "none" 关闭.
   * 对象形式 { type, duration, stagger, maxDuration, easing } 同 Tree. 减弱动效时直接到位.
   */
  animation?: UnfoldType | UnfoldOptions
  /** 没有文件时显示; 默认什么都不渲染 */
  empty?: React.ReactNode
  /** 换掉某一行; 第二个参数是默认渲染的行, 可以包一层 */
  renderItem?: (item: UploadFile, node: React.ReactElement) => React.ReactNode
  /** 行之间的间距 px, 默认 compact 2 / 其他 4 */
  gap?: number
}

const itemKey = (f: UploadFile) => f.id

function UploadList({
  items,
  density = "default",
  thumbnail = true,
  animation = "slide",
  empty,
  renderItem,
  gap,
  onCancel,
  onRetry,
  onRemove,
  onPause,
  onResume,
  className,
  style,
  ...props
}: UploadListProps) {
  const unfold = useUnfold(items, itemKey, animation)
  if (!items.length && !unfold.entries.length) {
    return empty != null ? <div data-slot="upload-list" data-empty="" className={cn("text-sm text-muted-foreground", className)} style={style}>{empty}</div> : null
  }
  return (
    <div
      data-slot="upload-list"
      role="list"
      className={cn("grid min-w-0 content-start", className)}
      style={{ rowGap: gap ?? (density === "compact" ? 2 : 4), ...style }}
      {...props}
    >
      {unfold.entries.map(({ key, item, exiting }) => {
        const node = (
          <UploadItem
            item={item}
            density={density}
            thumbnail={thumbnail}
            onCancel={onCancel}
            onRetry={onRetry}
            onRemove={onRemove}
            onPause={onPause}
            onResume={onResume}
          />
        )
        return (
          <div key={key} ref={unfold.ref(key)} role="listitem" inert={exiting || undefined} aria-hidden={exiting || undefined} data-exiting={exiting ? "" : undefined}>
            {renderItem ? renderItem(item, node) : node}
          </div>
        )
      })}
    </div>
  )
}

export { UploadItem, UploadList }
