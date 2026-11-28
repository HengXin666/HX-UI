/**
 * Dropzone / UploadList 的纯逻辑: accept 解析与匹配, 文件校验 (类型 / 大小 / 数量), 字节格式化, 文件名中间截断, 文件类别.
 * 不带 "use client": 组件 (dropzone.tsx, upload-list.tsx) 与自检脚本共用, 服务端也能 import.
 *
 * accept 与 <input accept> 同语法: 逗号分隔或数组, 每项是 MIME ("image/png"), 通配 MIME ("image/*") 或扩展名 (".pdf").
 * 拖动途中浏览器只给 MIME 不给文件名 (DataTransferItem.type). 为了放下前就能提示, 用常见扩展名 -> MIME 的映射表 (EXT_MIME)
 * 把扩展名规则翻成 MIME 再比 (dragVerdict): 能确定收 / 不收的直接给结论, 扩展名不在表里 / MIME 为空或是 octet-stream 时给 "unknown",
 * 由组件显示中性提示, 放下后再按文件名精确校验 (validateFiles). 表里一个扩展名可对应多个 MIME (各系统报的不一样, 如 Windows 的 .csv).
 */

/** 只需要文件的这几个字段, 方便测试时传普通对象 */
export interface FileLike {
  name: string
  size: number
  type: string
}

export type RejectCode = "type" | "too-large" | "too-small" | "too-many"

export interface RejectReason {
  code: RejectCode
  /** 中文说明, 可直接显示 */
  message: string
}

export interface FileRejection<F extends FileLike = File> {
  file: F
  reasons: RejectReason[]
}

export interface ValidateOptions {
  accept?: string | readonly string[]
  /** 允许多个文件; false 时只收第一个, 其余记 too-many */
  multiple?: boolean
  /** 单个文件上限 (字节) */
  maxSize?: number
  /** 单个文件下限 (字节), 常用 1 排除空文件 */
  minSize?: number
  /** 总数上限 (含 existing) */
  maxFiles?: number
  /** 已有的文件数 (例如列表里已经有 3 个), 计入 maxFiles */
  existing?: number
}

export interface ValidateResult<F extends FileLike = File> {
  accepted: F[]
  rejected: FileRejection<F>[]
}

/** 拆成小写的规则列表; 空 / 未给 = 什么都收 */
export function parseAccept(accept: string | readonly string[] | undefined): string[] {
  if (!accept) return []
  const list = typeof accept === "string" ? accept.split(",") : accept
  return list.map((s) => s.trim().toLowerCase()).filter(Boolean)
}

const extOf = (name: string) => {
  const dot = name.lastIndexOf(".")
  return dot > 0 ? name.slice(dot).toLowerCase() : ""
}

/** 单条规则是否匹配 */
function matchRule(rule: string, name: string, type: string): boolean {
  const mime = type.toLowerCase()
  if (rule.startsWith(".")) return name.toLowerCase().endsWith(rule)
  if (rule.endsWith("/*")) return mime.startsWith(rule.slice(0, -1))
  return mime === rule
}

/** 文件是否被 accept 接受 (同 <input accept>) */
export function matchAccept(file: Pick<FileLike, "name" | "type">, accept: string | readonly string[] | undefined): boolean {
  const rules = parseAccept(accept)
  if (!rules.length) return true
  return rules.some((r) => matchRule(r, file.name, file.type))
}

/**
 * 常见扩展名 -> 各系统 / 浏览器可能报出的 MIME. 拖动途中用它判断扩展名规则 (只用于提前提示, 最终以文件名为准).
 * 只收 "认得准" 的: 同一个 MIME 被多种扩展名共用时 (如 application/zip 之于 .docx 的旧报法) 仍能匹配, 因为判断的方向是
 * "这个 MIME 是否可能是规则里的某个扩展名", 宁可放过 (accept) 也不误拒.
 */
export const EXT_MIME: Readonly<Record<string, readonly string[]>> = {
  ".png": ["image/png"], ".jpg": ["image/jpeg"], ".jpeg": ["image/jpeg"], ".gif": ["image/gif"], ".webp": ["image/webp"],
  ".avif": ["image/avif"], ".svg": ["image/svg+xml"], ".bmp": ["image/bmp", "image/x-ms-bmp"], ".ico": ["image/x-icon", "image/vnd.microsoft.icon"],
  ".heic": ["image/heic", "image/heif"], ".heif": ["image/heif", "image/heic"], ".tif": ["image/tiff"], ".tiff": ["image/tiff"],
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"], ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xls": ["application/vnd.ms-excel"], ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".ppt": ["application/vnd.ms-powerpoint"], ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ".csv": ["text/csv", "application/vnd.ms-excel", "text/x-csv", "application/csv"],
  ".txt": ["text/plain"], ".md": ["text/markdown", "text/x-markdown", "text/plain"], ".rtf": ["application/rtf", "text/rtf"],
  ".json": ["application/json"], ".xml": ["application/xml", "text/xml"], ".html": ["text/html"], ".htm": ["text/html"],
  ".css": ["text/css"], ".js": ["text/javascript", "application/javascript"], ".mjs": ["text/javascript", "application/javascript"],
  ".zip": ["application/zip", "application/x-zip-compressed"], ".rar": ["application/vnd.rar", "application/x-rar-compressed"],
  ".7z": ["application/x-7z-compressed"], ".tar": ["application/x-tar"], ".gz": ["application/gzip", "application/x-gzip"],
  ".mp3": ["audio/mpeg"], ".wav": ["audio/wav", "audio/x-wav", "audio/wave"], ".flac": ["audio/flac", "audio/x-flac"],
  ".m4a": ["audio/mp4", "audio/x-m4a"], ".ogg": ["audio/ogg"], ".aac": ["audio/aac"],
  ".mp4": ["video/mp4"], ".mov": ["video/quicktime"], ".webm": ["video/webm"], ".mkv": ["video/x-matroska"], ".avi": ["video/x-msvideo"],
}

/** 拖动途中对一个 MIME 的判断: accept 一定收, reject 一定不收, unknown 看不出来 (放下后按文件名再判) */
export type DragVerdict = "accept" | "reject" | "unknown"

/** 系统认不出类型时报的 MIME: 空串或通用二进制, 看不出真实类型 */
const OPAQUE_MIME = new Set(["", "application/octet-stream"])

/**
 * 拖动途中只知道 MIME: 判断它会不会被 accept 接受.
 * MIME 规则 / 通配直接比; 扩展名规则经 EXT_MIME 翻成 MIME 比. 任一规则命中 -> accept;
 * 都没命中时, 只要有扩展名不在表里 (不认识, 不能断言), 或 MIME 本身看不出类型 -> unknown; 否则 reject.
 */
export function dragVerdict(type: string, accept: string | readonly string[] | undefined): DragVerdict {
  const rules = parseAccept(accept)
  if (!rules.length) return "accept"
  const mime = type.toLowerCase()
  if (OPAQUE_MIME.has(mime)) return "unknown"
  let unsure = false
  for (const r of rules) {
    if (!r.startsWith(".")) {
      if (matchRule(r, "", mime)) return "accept"
      continue
    }
    const known = EXT_MIME[r]
    if (!known) unsure = true
    else if (known.includes(mime)) return "accept"
  }
  return unsure ? "unknown" : "reject"
}

/** 兼容旧名: "可能被接受" (accept 或 unknown) */
export function acceptsType(type: string, accept: string | readonly string[] | undefined): boolean {
  return dragVerdict(type, accept) !== "reject"
}

/** 给人看的 accept 说明: "image/*, .pdf" -> "图片、PDF" */
export function describeAccept(accept: string | readonly string[] | undefined): string {
  const rules = parseAccept(accept)
  const KIND: Record<string, string> = { "image/*": "图片", "video/*": "视频", "audio/*": "音频", "text/*": "文本" }
  return rules.map((r) => KIND[r] ?? (r.startsWith(".") ? r.slice(1).toUpperCase() : r)).join("、")
}

const UNITS = ["B", "KB", "MB", "GB", "TB"] as const
const KILO = 1024

/** 字节 -> "12.4 MB"; 小于 10 的保留 digits 位小数, 其余取整 (列表里数字宽度稳定) */
export function formatBytes(bytes: number, digits = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const i = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(KILO)))
  const v = bytes / KILO ** i
  return `${i === 0 ? v : v < 10 ? v.toFixed(digits) : Math.round(v)} ${UNITS[i]}`
}

/** 按顺序校验: 类型 -> 大小 -> 数量 (数量只在前两项都通过的文件里算) */
export function validateFiles<F extends FileLike>(files: readonly F[], opts: ValidateOptions = {}): ValidateResult<F> {
  const { accept, multiple = true, maxSize, minSize, maxFiles, existing = 0 } = opts
  const limit = Math.min(multiple ? Infinity : 1, maxFiles ?? Infinity)
  const accepted: F[] = []
  const rejected: FileRejection<F>[] = []
  for (const file of files) {
    const reasons: RejectReason[] = []
    if (!matchAccept(file, accept)) reasons.push({ code: "type", message: describeAccept(accept) ? `只支持 ${describeAccept(accept)}` : "不支持的文件类型" })
    if (maxSize != null && file.size > maxSize) reasons.push({ code: "too-large", message: `超过 ${formatBytes(maxSize)}` })
    if (minSize != null && file.size < minSize) reasons.push({ code: "too-small", message: minSize <= 1 ? "空文件" : `小于 ${formatBytes(minSize)}` })
    if (!reasons.length && existing + accepted.length >= limit) {
      reasons.push({ code: "too-many", message: multiple ? `最多 ${limit} 个文件` : "只能选择 1 个文件" })
    }
    if (reasons.length) rejected.push({ file, reasons })
    else accepted.push(file)
  }
  return { accepted, rejected }
}

/**
 * 文件名中间截断用: 拆成 [可截断的头, 保留的尾]. 尾 = 扩展名 + 它前面 keep 个字符,
 * 头用 CSS truncate 收省略号, 尾不收, 于是 "季度报告-最终版-v3.pdf" 窄时显示成 "季度报告…终版-v3.pdf".
 */
export function splitFileName(name: string, keep = 6): [string, string] {
  const ext = extOf(name)
  // 扩展名太长 (不像扩展名) 就当没有
  const tailLen = (ext.length <= 8 ? ext.length : 0) + keep
  if (name.length <= tailLen + 2) return [name, ""]
  return [name.slice(0, name.length - tailLen), name.slice(name.length - tailLen)]
}

export type FileKind = "image" | "video" | "audio" | "pdf" | "archive" | "sheet" | "code" | "text" | "file"

const EXT_KIND: Record<string, FileKind> = {
  ".pdf": "pdf",
  ".zip": "archive", ".rar": "archive", ".7z": "archive", ".tar": "archive", ".gz": "archive",
  ".xls": "sheet", ".xlsx": "sheet", ".csv": "sheet", ".numbers": "sheet",
  ".ts": "code", ".tsx": "code", ".js": "code", ".jsx": "code", ".json": "code", ".py": "code", ".go": "code", ".rs": "code", ".cpp": "code", ".c": "code", ".h": "code", ".java": "code", ".html": "code", ".css": "code",
  ".md": "text", ".txt": "text", ".doc": "text", ".docx": "text", ".rtf": "text",
  ".png": "image", ".jpg": "image", ".jpeg": "image", ".gif": "image", ".webp": "image", ".svg": "image", ".avif": "image", ".heic": "image",
  ".mp4": "video", ".mov": "video", ".webm": "video", ".mkv": "video",
  ".mp3": "audio", ".wav": "audio", ".flac": "audio", ".m4a": "audio", ".ogg": "audio",
}

/** 文件类别 (决定图标): 先看扩展名, 再看 MIME 大类 */
export function fileKind(name: string, type = ""): FileKind {
  const byExt = EXT_KIND[extOf(name)]
  if (byExt) return byExt
  const major = type.split("/")[0]
  if (major === "image" || major === "video" || major === "audio") return major
  if (type === "application/pdf") return "pdf"
  if (major === "text") return "text"
  return "file"
}

/** 能做缩略图的图片 (浏览器能直接显示的) */
export function isPreviewableImage(name: string, type = ""): boolean {
  return /^image\/(png|jpe?g|gif|webp|avif|svg\+xml|bmp)$/.test(type) || /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i.test(name)
}
