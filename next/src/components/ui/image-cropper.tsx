"use client"

/**
 * 图片裁剪: 换头像 / 群头像 / 封面. 载入 File / Blob / URL, 固定比例 (或自由) 的裁剪框, 拖动平移, 滚轮 / 双指缩放,
 * 90° 旋转 + 任意角度拉直, 圆形遮罩, 输出裁剪后的 canvas / Blob (边长, 格式, 质量可指定). 常放在 Dialog 里用.
 *
 *   const cropper = React.useRef<ImageCropperHandle>(null)
 *   <ImageCropper ref={cropper} src={file} aspect={1} cropShape="round" zoom={zoom} onZoomChange={setZoom} />
 *   <ImageCropperStraighten value={fine} onValueChange={setFine} />      // -45° ~ 45° 拉直刻度
 *   const blob = await cropper.current?.getBlob({ size: 256, type: "image/webp", quality: 0.9 })   // 圆形裁剪默认输出圆形 (透明角)
 *
 * 模型 (几何见 image-cropper-model.ts): 图片 (中心, 显示缩放, 角度) 与裁剪框 (中心, 宽高) 都是可动的, 原点在容器中心.
 *   - 拖图片平移, 滚轮以指针为中心缩放, 双指以两指中点为中心缩放并跟随平移.
 *   - 裁剪框: 固定比例拖四角等比缩放 (对角固定); 自由比例拖四边 / 四角, 对边固定, 互不牵连.
 *     拖框内部移动裁剪框 (dragMode="auto" 时: 框还有地方可挪才移动框, 否则平移图片 —— 头像这种框占满的场景仍是熟悉的 "拖图片";
 *     "frame" 总是移动框 (框外拖图片), "image" 总是拖图片).
 *   - 角度任意: zoom 定义为 "显示缩放 / 恰好盖满裁剪框的缩放", 所以拉直时图片自动放大到仍盖满裁剪框 (外接约束按旋转后的
 *     图片坐标计算, 不是轴对齐近似); 默认 restrict 下任何操作后裁剪框的四个角都在图片里, 输出不会有空角.
 * 性能: 交互状态放在 ref 里, 指针 / 滚轮 / 键盘只记账, 每帧 (rAF) 合并成一次 DOM 写入, 不触发 React 渲染.
 *   图片只写 transform. 裁剪框要改宽高 (1px 边框, 角标, 三分线, 圆形遮罩都必须保持不变形, 用 scale 做不到),
 *   所以框的尺寸由同一个 rAF 写入 width / height —— 框是独立的绝对定位元素, 只有它自己重排, 不牵动页面布局.
 *   键盘, 按钮, 受控 zoom / rotation / aspect 的变化由 rAF 补间 (默认 200ms, 可调), 图片与裁剪框同一条时间线, 不会错位;
 *   补间中途再改从当前看到的状态接着走; 拖动 / 滚轮跟手无补间; 减弱动效时一律直接到位.
 * 输出: 按裁剪区域从原图重新取样 (不是截屏), 缩小时分步减半防锯齿; cropShape="round" 时默认按圆 (椭圆) 抠出,
 *   PNG / WebP 角上透明, JPEG 没有透明通道, 角上填 background (默认读当前主题 --background 的计算值, 深色主题就是深色).
 * URL 图片: 默认 crossOrigin="anonymous" 加载; 失败时自动改用 fetch -> Blob -> 对象 URL 再试 (绕开 "先被无 CORS 请求缓存" 这类问题);
 *   仍不行就不带 CORS 只做预览, 并通过 onError 给出 code="cors" 的明确原因 (此时 getBlob 拒绝并带同样的原因).
 * 网格线 (三分线) 默认只在交互时淡入 (grid="active"). 遮罩用裁剪框的大范围 box-shadow, 颜色走 --cropper-mask.
 * 键盘: 图片 —— 方向键平移 (Shift 大步), + / - 缩放, R 旋转 90°, [ / ] 拉直 ±1° (Shift ±5°), 0 复位;
 *   裁剪框 (Tab 聚焦到框) —— 方向键移动, Alt + 方向键调整宽高 (固定比例时等比).
 */

import * as React from "react"
import { ImageIcon, ImageOffIcon, LoaderCircleIcon, ShieldAlertIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/motion/use-reduced-motion"
import {
  clamp,
  clampOffset,
  coverScale,
  cropArea,
  downscalePlan,
  fitFrame,
  fitFrameInto,
  frameMovable,
  moveFrame,
  normalizeRotation,
  outputSize,
  resizeFrame,
  rotatedSize,
  zoomAround,
  type CropArea,
  type CropState,
  type FrameHandle,
  type FrameLimits,
  type FrameRect,
  type Point,
  type Size,
} from "@/components/ui/image-cropper-model"

export type { CropArea, CropState, FrameRect, Size } from "@/components/ui/image-cropper-model"
export { cropArea, outputSize, splitRotation } from "@/components/ui/image-cropper-model"

export type CropOutputType = "image/webp" | "image/jpeg" | "image/png"

export interface CropOutputOptions {
  /** 输出长边 px (头像常用 256); 不给就用裁剪区域的原始像素尺寸 (长边上限 4096) */
  size?: number
  /** 显式宽 / 高, 优先于 size */
  width?: number
  height?: number
  /** getBlob 的格式, 默认 image/webp (浏览器不支持时会退回 png) */
  type?: CropOutputType
  /** 0..1, 只对 webp / jpeg 有效, 默认 0.9 */
  quality?: number
  /** 按裁剪形状 (圆 / 椭圆) 抠出; 默认跟随 cropShape (round 时 true). PNG / WebP 外面透明, JPEG 外面填 background */
  round?: boolean
  /**
   * 底色 (任意 CSS 颜色, 可写 var(--card)): 图片没盖住的地方 (restrict=false) 与 JPEG 的透明处.
   * 默认: JPEG 取当前主题 --background 的计算值; PNG / WebP 透明.
   */
  background?: string
}

export type ImageCropperErrorCode = "network" | "http" | "decode" | "cors"

/** 加载 / 导出失败的原因: code 便于分支处理, message 是可直接显示的中文 */
export class ImageCropperError extends Error {
  code: ImageCropperErrorCode
  /** code = "http" 时的状态码 */
  status?: number
  constructor(code: ImageCropperErrorCode, message: string, status?: number) {
    super(message)
    this.name = "ImageCropperError"
    this.code = code
    this.status = status
  }
}

const ERROR_TEXT: Record<ImageCropperErrorCode, string> = {
  network: "图片无法加载：地址无效、网络错误或被拦截。",
  http: "图片请求失败",
  decode: "图片已下载但无法解码，可能不是图片或格式不受支持（如 HEIC）。",
  cors: "图片服务器未开放跨域访问（缺少 Access-Control-Allow-Origin），可以预览但无法导出。请为图片域名配置 CORS，或先在服务端转存 / 转成 Blob 再传入。",
}
const makeError = (code: ImageCropperErrorCode, status?: number) =>
  new ImageCropperError(code, code === "http" ? `${ERROR_TEXT.http}（HTTP ${status}）。` : ERROR_TEXT[code], status)

export interface ImageCropperHandle {
  /** 按当前裁剪画出画布; 图片没加载好或不能导出 (跨域) 时返回 null */
  getCanvas: (options?: CropOutputOptions) => HTMLCanvasElement | null
  /** 裁剪并压缩成 Blob; 没加载好时为 null; 跨域图片不能导出时以 ImageCropperError (code="cors") 拒绝 */
  getBlob: (options?: CropOutputOptions) => Promise<Blob | null>
  /** 当前裁剪区域 (旋转后图片外接框的像素坐标) */
  getArea: () => CropArea | null
  /** 当前状态 (图片相对裁剪框的偏移, zoom, rotation) */
  getState: () => CropState
  /** 当前裁剪框 (中心相对容器中心 + 宽高, 显示 px) */
  getFrame: () => FrameRect | null
  /** 复位: 裁剪框回到默认, 图片居中, zoom 回 defaultZoom, 角度回 defaultRotation (走最近的方向) */
  reset: () => void
  /** 旋转 delta 度, 默认顺时针 90° */
  rotate: (delta?: number) => void
  /** 转到指定角度 (度, 任意值) */
  setRotation: (deg: number) => void
  /** 以裁剪框中心缩放到 zoom */
  zoomTo: (zoom: number) => void
  /** 图片原始尺寸 */
  naturalSize: () => Size | null
}

export type ImageCropperDragMode = "auto" | "frame" | "image"

export interface ImageCropperProps extends Omit<React.ComponentProps<"div">, "children" | "ref" | "onLoad" | "onError"> {
  ref?: React.Ref<ImageCropperHandle>
  /** 图片: File / Blob (内部建对象 URL 并负责释放) 或 URL */
  src?: File | Blob | string | null
  /** URL 图片的跨域设置, 默认 "anonymous" (否则画布被污染, 导不出); "" 表示不带 CORS */
  crossOrigin?: "anonymous" | "use-credentials" | ""
  /** 宽高比, 默认 1; "free" 自由比例 (拖四边 / 四角, 对边固定) */
  aspect?: number | "free"
  /** 遮罩形状, 默认 rect; round 为圆 (非 1:1 时为椭圆), 输出默认也按圆抠出 */
  cropShape?: "rect" | "round"
  /** 三分网格线: "active" (默认) 交互时显示; true 常显; false 不显示 */
  grid?: boolean | "active"
  /** 在裁剪框内部拖动: auto (默认) 框能挪就挪框, 否则拖图片; frame 总是挪框 (框外拖图片); image 总是拖图片 */
  dragMode?: ImageCropperDragMode
  /** 可以拖边 / 角调整裁剪框, 默认 true */
  resizable?: boolean
  /** 裁剪框最小边长 px, 默认 48 */
  minFrameSize?: number
  /** 受控缩放 (1 = 恰好盖满裁剪框) */
  zoom?: number
  defaultZoom?: number
  onZoomChange?: (zoom: number) => void
  /** 默认 1 */
  minZoom?: number
  /** 默认 4 */
  maxZoom?: number
  /** 键盘 + / - 每次缩放的量, 默认 0.1 */
  zoomStep?: number
  /** 滚轮灵敏度倍数, 默认 1 */
  wheelSpeed?: number
  /** 受控旋转 (度, 任意值: 90° 倍数 + 拉直角度) */
  rotation?: number
  defaultRotation?: number
  onRotationChange?: (rotation: number) => void
  /** 允许键盘 R / [ / ] 旋转, 默认 true (ref.rotate 不受限) */
  rotatable?: boolean
  /** 图片始终盖住裁剪框, 默认 true */
  restrict?: boolean
  /** 裁剪框离容器边缘的距离 px, 默认 24 */
  padding?: number
  /** 方向键每次平移 px (Shift 时 ×4), 默认 10 */
  keyStep?: number
  /** 键盘 / 按钮 / 受控变化的补间时长 ms, 默认 200; 0 关闭 */
  duration?: number
  /** 裁剪变化 (每帧最多一次) */
  onCropChange?: (area: CropArea, state: CropState) => void
  /** 一次交互结束 (松手, 滚轮停 150ms, 按键, 载入) 时的裁剪 */
  onCropComplete?: (area: CropArea, state: CropState) => void
  onLoad?: (size: Size) => void
  /** 加载失败, 或只能预览不能导出 (code="cors") */
  onError?: (error: ImageCropperError) => void
  /** 没有图片时显示 */
  placeholder?: React.ReactNode
  disabled?: boolean
}

const DEFAULT_PADDING = 24
const DEFAULT_DURATION = 200
const DEFAULT_MIN_FRAME = 48
const WHEEL_IDLE_MS = 150
const WHEEL_FACTOR = 0.0015
const LINE_PX = 16
const SHIFT_MULTIPLIER = 4
const STRAIGHTEN_STEP = 1
const STRAIGHTEN_SHIFT = 5
const EPS = 1e-6
const FULL_TURN = 360
const HALF_TURN = 180
const MASK = "0 0 0 9999px var(--cropper-mask, color-mix(in oklch, var(--background) 62%, transparent))"

/** 补间缓动: easeOutQuart, 与 --ease-out 观感一致 */
const ease = (t: number) => 1 - (1 - t) ** 4

/** 角标 (四角) 与边条 (四边); hit 是触控区域, 比看到的大 */
const CORNERS: { h: FrameHandle; cls: string; cursor: string }[] = [
  { h: { x: -1, y: -1 }, cls: "-top-px -left-px border-t-2 border-l-2 rounded-tl-sm", cursor: "nwse-resize" },
  { h: { x: 1, y: -1 }, cls: "-top-px -right-px border-t-2 border-r-2 rounded-tr-sm", cursor: "nesw-resize" },
  { h: { x: -1, y: 1 }, cls: "-bottom-px -left-px border-b-2 border-l-2 rounded-bl-sm", cursor: "nesw-resize" },
  { h: { x: 1, y: 1 }, cls: "-right-px -bottom-px border-r-2 border-b-2 rounded-br-sm", cursor: "nwse-resize" },
]
const EDGES: { h: FrameHandle; hit: string; bar: string; cursor: string }[] = [
  { h: { x: 0, y: -1 }, hit: "inset-x-5 -top-2 h-4", bar: "h-0.5 w-5", cursor: "ns-resize" },
  { h: { x: 0, y: 1 }, hit: "inset-x-5 -bottom-2 h-4", bar: "h-0.5 w-5", cursor: "ns-resize" },
  { h: { x: -1, y: 0 }, hit: "inset-y-5 -left-2 w-4", bar: "h-5 w-0.5", cursor: "ew-resize" },
  { h: { x: 1, y: 0 }, hit: "inset-y-5 -right-2 w-4", bar: "h-5 w-0.5", cursor: "ew-resize" },
]
const HANDLE_CURSOR = new Map([...CORNERS, ...EDGES].map((c) => [`${c.h.x},${c.h.y}`, c.cursor]))

/** 图片上的快捷键 (方向键之外); 其他键不打断进行中的补间 */
const KEYS = new Set(["+", "=", "-", "_", "r", "R", "[", "]", "{", "}", "0"])

const isEditable = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

/** 显示状态: 图片中心 / 缩放 / 角度 + 裁剪框, 原点在容器中心. 补间就在这几个数上插值 */
interface View {
  ix: number
  iy: number
  s: number
  rot: number
  frame: FrameRect
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpView = (a: View, b: View, t: number): View => ({
  ix: lerp(a.ix, b.ix, t),
  iy: lerp(a.iy, b.iy, t),
  s: lerp(a.s, b.s, t),
  rot: lerp(a.rot, b.rot, t),
  frame: { x: lerp(a.frame.x, b.frame.x, t), y: lerp(a.frame.y, b.frame.y, t), width: lerp(a.frame.width, b.frame.width, t), height: lerp(a.frame.height, b.frame.height, t) },
})

/** CSS 颜色 (含 var(--token)) -> 画布可用的 rgb(); 在 el 下解析, 所以局部主题 (.dark 子树) 也对 */
function resolveColor(el: HTMLElement | null, value: string): string {
  if (!el || typeof document === "undefined") return value
  const probe = document.createElement("span")
  probe.style.color = value
  if (!probe.style.color) return value
  probe.style.display = "none"
  el.appendChild(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()
  // 计算值可能是 oklch(...) / color(...): 画到 1px 画布上读回 sRGB, 各浏览器的画布都认
  const c = document.createElement("canvas")
  c.width = 1
  c.height = 1
  const ctx = c.getContext("2d", { willReadFrequently: true })
  if (!ctx) return computed
  ctx.fillStyle = computed
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return `rgb(${r}, ${g}, ${b})`
}

/** 把旋转后图片外接框里的 area 画到 w×h 的画布 (倍数 k = 画布 px / 图片 px) */
function drawArea(img: HTMLImageElement, area: CropArea, rotation: number, w: number, h: number, k: number, background?: string) {
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(w))
  canvas.height = Math.max(1, Math.round(h))
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  const r = rotatedSize({ width: img.naturalWidth, height: img.naturalHeight }, rotation)
  ctx.translate(-area.x * k, -area.y * k)
  ctx.translate((r.width / 2) * k, (r.height / 2) * k)
  ctx.rotate((rotation * Math.PI) / HALF_TURN)
  ctx.scale(k, k)
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
  return canvas
}

function resizeCanvas(src: HTMLCanvasElement, w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  const ctx = c.getContext("2d")
  if (ctx) {
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(src, 0, 0, c.width, c.height)
  }
  return c
}

/** 裁剪 + 高质量缩放 (先以 ≤1 的倍数画出, 每步减半, 最后精确缩到目标) + 可选圆形抠图 + 底色 */
function renderCrop(img: HTMLImageElement, area: CropArea, rotation: number, opts: CropOutputOptions, round: boolean, background: string | undefined): HTMLCanvasElement {
  const out = outputSize(area, opts)
  const k = out.width / Math.max(1, area.width)
  const [first, steps] = downscalePlan(k)
  // 底色在最后统一铺 (destination-over), 中间步骤保持透明, 圆形抠图才不会把底色也抠掉
  let canvas = drawArea(img, area, rotation, area.width * first, area.height * first, first)
  for (let i = 0; i < steps; i++) canvas = resizeCanvas(canvas, canvas.width / 2, canvas.height / 2)
  if (canvas.width !== out.width || canvas.height !== out.height) canvas = resizeCanvas(canvas, out.width, out.height)
  const ctx = canvas.getContext("2d")
  if (ctx && (round || background)) {
    if (round) {
      ctx.globalCompositeOperation = "destination-in"
      ctx.beginPath()
      ctx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    if (background) {
      ctx.globalCompositeOperation = "destination-over"
      ctx.fillStyle = background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.globalCompositeOperation = "source-over"
  }
  return canvas
}

interface Source {
  status: "empty" | "loading" | "ready" | "error"
  /** 显示用的地址与跨域设置 */
  url?: string
  crossOrigin?: "anonymous" | "use-credentials"
  /** 已解码的图片 (导出时从它取样) */
  image?: HTMLImageElement
  natural?: Size
  /** 只能预览: 跨域且服务器不允许, 画布会被污染 */
  tainted?: boolean
  error?: ImageCropperError
}

const loadImg = (url: string, crossOrigin?: "anonymous" | "use-credentials") =>
  new Promise<HTMLImageElement>((ok, fail) => {
    const im = new Image()
    if (crossOrigin) im.crossOrigin = crossOrigin
    im.decoding = "async"
    im.onload = () => ok(im)
    im.onerror = () => fail(new Error("load"))
    im.src = url
  })

/**
 * 载入图片 (带回退): File / Blob -> 对象 URL; URL -> 带 CORS 加载 -> 失败则 fetch 成 Blob 再载 -> 再失败则不带 CORS 只做预览.
 * 对象 URL 在换图 / 卸载时释放.
 */
function useSource(src: ImageCropperProps["src"], crossOrigin: ImageCropperProps["crossOrigin"]): Source {
  const [source, setSource] = React.useState<Source>({ status: "empty" })
  React.useEffect(() => {
    if (!src) {
      setSource({ status: "empty" })
      return
    }
    let alive = true
    const owned: string[] = []
    const own = (blob: Blob) => {
      const u = URL.createObjectURL(blob)
      owned.push(u)
      return u
    }
    const ready = (image: HTMLImageElement, url: string, co?: "anonymous" | "use-credentials", tainted = false) =>
      alive && setSource({ status: "ready", url, crossOrigin: co, image, natural: { width: image.naturalWidth, height: image.naturalHeight }, tainted })
    const fail = (code: ImageCropperErrorCode, status?: number) => alive && setSource({ status: "error", error: makeError(code, status) })
    setSource({ status: "loading" })

    void (async () => {
      if (typeof src !== "string") {
        const u = own(src)
        return loadImg(u).then((im) => ready(im, u), () => fail("decode"))
      }
      const local = /^(blob:|data:)/i.test(src)
      const co = local || !crossOrigin ? undefined : crossOrigin
      try {
        return ready(await loadImg(src, co), src, co)
      } catch {
        if (local) return fail("decode")
      }
      if (!co) {
        // 调用方明确不要 CORS: 能显示就显示, 导出时再判断是否被污染
        return fail("network")
      }
      // 回退 1: fetch 成 Blob (cache: reload 绕开 "同一地址先被不带 CORS 的请求缓存" 导致的失败)
      let res: Response | null = null
      try {
        res = await fetch(src, { mode: "cors", credentials: co === "use-credentials" ? "include" : "same-origin", cache: "reload" })
      } catch {
        res = null
      }
      if (!alive) return
      if (res && !res.ok) return fail("http", res.status)
      if (res) {
        try {
          const u = own(await res.blob())
          return ready(await loadImg(u), u)
        } catch {
          return fail("decode")
        }
      }
      // 回退 2: 不带 CORS 只做预览 (画布会被污染, 导出时报 cors)
      try {
        return ready(await loadImg(src), src, undefined, true)
      } catch {
        return fail("network")
      }
    })()

    return () => {
      alive = false
      owned.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [src, crossOrigin])
  return source
}

type Gesture =
  | { kind: "pan" }
  | { kind: "pinch"; dist: number; mid: Point }
  | { kind: "frame" }
  | { kind: "resize"; handle: FrameHandle; start: FrameRect; from: Point }

function ImageCropper({
  ref,
  src,
  crossOrigin = "anonymous",
  aspect = 1,
  cropShape = "rect",
  grid = "active",
  dragMode = "auto",
  resizable = true,
  minFrameSize = DEFAULT_MIN_FRAME,
  zoom: zoomProp,
  defaultZoom = 1,
  onZoomChange,
  minZoom = 1,
  maxZoom = 4,
  zoomStep = 0.1,
  wheelSpeed = 1,
  rotation: rotationProp,
  defaultRotation = 0,
  onRotationChange,
  rotatable = true,
  restrict = true,
  padding = DEFAULT_PADDING,
  keyStep = 10,
  duration = DEFAULT_DURATION,
  onCropChange,
  onCropComplete,
  onLoad,
  onError,
  placeholder,
  disabled = false,
  className,
  style,
  onKeyDown,
  ...props
}: ImageCropperProps) {
  const source = useSource(src, crossOrigin)
  const natural = source.natural ?? null
  const reduce = useReducedMotion()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const imgRef = React.useRef<HTMLImageElement>(null)
  const frameElRef = React.useRef<HTMLDivElement>(null)
  const [box, setBox] = React.useState<Size>({ width: 0, height: 0 })
  const free = aspect === "free"
  const ratio = free ? undefined : aspect > 0 && Number.isFinite(aspect) ? aspect : 1
  const limits = { min: Math.min(minZoom, maxZoom), max: Math.max(minZoom, maxZoom) }
  const ready = source.status === "ready" && !!natural && box.width > 0 && box.height > 0

  // 目标状态 (逻辑上的 "现在") 与正在显示的状态 (补间中两者不同)
  const view = React.useRef<View | null>(null)
  const shown = React.useRef<View | null>(null)
  const tween = React.useRef<{ from: View; to: View; t0: number; dur: number } | null>(null)
  const raf = React.useRef(0)
  const dirty = React.useRef({ crop: false, zoom: false, complete: false })
  /** 用户动过裁剪框 (否则裁剪框跟随默认: 容器 / 比例变化时重新适配) */
  const customFrame = React.useRef(false)
  const pointers = React.useRef(new Map<number, Point>())
  const gesture = React.useRef<Gesture | null>(null)
  const wheelTimer = React.useRef(0)
  const prevGeo = React.useRef<{ url?: string; half: Size; ratio?: number } | null>(null)
  const lastZoom = React.useRef<number | null>(null)

  const latest = React.useRef({ onCropChange, onCropComplete, onZoomChange, onRotationChange, limits, restrict, duration, reduce, box, natural, padding, ratio, free, dragMode, minFrameSize, defaultZoom, defaultRotation })
  latest.current = { onCropChange, onCropComplete, onZoomChange, onRotationChange, limits, restrict, duration, reduce, box, natural, padding, ratio, free, dragMode, minFrameSize, defaultZoom, defaultRotation }

  // ---------- 几何换算 ----------

  const halfOf = (b: Size, pad: number): Size => ({ width: Math.max(1, b.width / 2 - pad), height: Math.max(1, b.height / 2 - pad) })

  /** 默认裁剪框: 固定比例按容器放到最大; 自由比例按 (旋转后的) 图片比例放到最大 */
  const defaultFrame = React.useCallback((rot: number): FrameRect => {
    const { box: b, padding: pad, ratio: r, natural: n } = latest.current
    const a = r ?? (n ? rotatedSize(n, normalizeRotation(rot)).width / Math.max(1, rotatedSize(n, normalizeRotation(rot)).height) : 1)
    const f = fitFrame(b, a, pad)
    return { x: 0, y: 0, width: f.width, height: f.height }
  }, [])

  const stateOf = React.useCallback((v: View): CropState => {
    const n = latest.current.natural
    const cover = n ? coverScale({ frame: v.frame, image: n }, v.rot) : 1
    return { x: v.ix - v.frame.x, y: v.iy - v.frame.y, zoom: v.s / cover, rotation: v.rot }
  }, [])

  /** 状态 + 裁剪框 -> 显示状态, 顺带夹住 zoom 与偏移 */
  const viewOf = React.useCallback((state: CropState, frame: FrameRect): View => {
    const { natural: n, limits: lim, restrict: rs } = latest.current
    if (!n) return { ix: frame.x + state.x, iy: frame.y + state.y, s: 1, rot: state.rotation, frame }
    const geom = { frame, image: n }
    const st = clampOffset({ ...state, zoom: clamp(state.zoom, lim.min, lim.max) }, geom, rs)
    return { ix: frame.x + st.x, iy: frame.y + st.y, s: coverScale(geom, st.rotation) * st.zoom, rot: st.rotation, frame }
  }, [])

  const frameLimits = React.useCallback((v: View): FrameLimits => {
    const { box: b, padding: pad, natural: n, restrict: rs, limits: lim, minFrameSize: min } = latest.current
    return {
      half: halfOf(b, pad),
      min,
      image: n ? { x: v.ix, y: v.iy, scale: v.s, rotation: v.rot, image: n } : undefined,
      contain: rs,
      zoom: lim,
    }
  }, [])

  const areaOf = (v: View, round = true) => {
    const n = latest.current.natural
    return n ? cropArea(stateOf(v), { frame: v.frame, image: n }, round) : null
  }

  // ---------- 绘制 ----------

  const setAttr = (name: string, on: boolean) => {
    const el = rootRef.current
    if (!el) return
    if (on) el.setAttribute(name, "")
    else el.removeAttribute(name)
  }

  /** 把显示状态写进 DOM: 图片只写 transform; 裁剪框写 transform + 宽高 (见文件顶部注释) */
  const paintDom = React.useCallback((v: View) => {
    const { box: b, natural: n } = latest.current
    const img = imgRef.current
    const fr = frameElRef.current
    if (img && n) img.style.transform = `translate3d(${b.width / 2 + v.ix - n.width / 2}px, ${b.height / 2 + v.iy - n.height / 2}px, 0) rotate(${v.rot}deg) scale(${v.s})`
    if (fr) {
      fr.style.width = `${v.frame.width}px`
      fr.style.height = `${v.frame.height}px`
      fr.style.transform = `translate3d(${b.width / 2 + v.frame.x - v.frame.width / 2}px, ${b.height / 2 + v.frame.y - v.frame.height / 2}px, 0)`
    }
  }, [])

  /** 框内拖动时该挪框还是拖图片 */
  const frameDraggable = React.useCallback((v: View) => {
    const mode = latest.current.dragMode
    return mode === "frame" || (mode === "auto" && frameMovable(v.frame, frameLimits(v)))
  }, [frameLimits])

  const tick = React.useCallback((now: number) => {
    raf.current = 0
    const tw = tween.current
    if (tw) {
      const p = Math.min(1, (now - tw.t0) / tw.dur)
      shown.current = p >= 1 ? tw.to : lerpView(tw.from, tw.to, ease(p))
      if (p >= 1) tween.current = null
      else raf.current = requestAnimationFrame(tick)
    } else if (view.current) {
      shown.current = view.current
    }
    if (shown.current) paintDom(shown.current)
    const v = view.current
    const d = dirty.current
    if (!v) return
    if (d.crop || d.complete) {
      const area = areaOf(v)
      const st = stateOf(v)
      if (area) {
        latest.current.onCropChange?.(area, st)
        if (d.complete) latest.current.onCropComplete?.(area, st)
      }
      if (d.zoom && (lastZoom.current == null || Math.abs(lastZoom.current - st.zoom) > EPS)) {
        lastZoom.current = st.zoom
        latest.current.onZoomChange?.(st.zoom)
      }
      // 光标提示: 框内是 "移动框" 还是 "拖图片" (交互中不算, 省掉每帧的约束求解)
      if (!gesture.current) setAttr("data-frame-movable", frameDraggable(v))
    }
    dirty.current = { crop: false, zoom: false, complete: false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paintDom, stateOf, frameDraggable])

  const requestPaint = React.useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(tick)
  }, [tick])

  React.useEffect(() => () => cancelAnimationFrame(raf.current), [])

  /** 提交新的目标状态; animate 时从当前看到的状态补间过去 */
  const commit = React.useCallback((next: View, animate: boolean, complete = false) => {
    const { duration: dur, reduce: rd } = latest.current
    view.current = next
    if (animate && dur > 0 && !rd && shown.current) tween.current = { from: shown.current, to: next, t0: performance.now(), dur }
    else {
      tween.current = null
      shown.current = next
    }
    dirty.current.crop = true
    dirty.current.zoom = true
    if (complete) dirty.current.complete = true
    requestPaint()
  }, [requestPaint])

  /** 交互开始: 正在补间就停在当前看到的位置, 从这里接着拖 */
  const freeze = () => {
    if (tween.current && shown.current) {
      view.current = shown.current
      tween.current = null
    }
  }

  const setInteracting = (on: boolean) => setAttr("data-interacting", on)

  // ---------- 容器 / 图片 / 比例变化 ----------

  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setBox((b) => (b.width === width && b.height === height ? b : { width, height }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 几何变化: 新图片 -> 初始化; 容器 / padding 变 -> 整体等比缩放 (裁剪结果不变); 比例变 -> 裁剪框回默认 (补间); 其余 -> 重新夹取
  React.useLayoutEffect(() => {
    if (!ready || !natural) {
      if (source.status !== "ready") {
        view.current = null
        shown.current = null
        prevGeo.current = null
        customFrame.current = false
      }
      return
    }
    const half = halfOf(box, padding)
    const prev = prevGeo.current
    prevGeo.current = { url: source.url, half, ratio }
    const cur = view.current
    if (!cur || !prev || prev.url !== source.url) {
      customFrame.current = false
      lastZoom.current = null
      const rot = rotationProp ?? defaultRotation
      commit(viewOf({ x: 0, y: 0, zoom: zoomProp ?? defaultZoom, rotation: rot }, defaultFrame(rot)), false, true)
      paintDom(view.current!)
      return
    }
    const st = stateOf(cur)
    if (prev.ratio !== ratio) {
      customFrame.current = false
      commit(viewOf(st, defaultFrame(st.rotation)), true, true)
      return
    }
    if (prev.half.width !== half.width || prev.half.height !== half.height) {
      const k = Math.min(half.width / prev.half.width, half.height / prev.half.height)
      const scaled = { ...st, x: st.x * k, y: st.y * k }
      const f = cur.frame
      const frame = customFrame.current ? fitFrameInto({ x: f.x * k, y: f.y * k, width: f.width * k, height: f.height * k }, half) : defaultFrame(st.rotation)
      commit(viewOf(scaled, frame), false, true)
      paintDom(view.current!)
      return
    }
    commit(viewOf(st, cur.frame), false, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, natural, source.url, box.width, box.height, padding, ratio, restrict, limits.min, limits.max, minFrameSize])

  // 加载结果回调
  React.useEffect(() => {
    if (source.status === "ready" && source.natural) {
      onLoad?.(source.natural)
      if (source.tainted) onError?.(makeError("cors"))
    } else if (source.status === "error" && source.error) onError?.(source.error)
    // 只在载入结果变化时调用
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  // ---------- 操作 ----------

  const zoomTo = React.useCallback((z: number, point: Point = { x: 0, y: 0 }, animate = true) => {
    const v = view.current
    const n = latest.current.natural
    if (!v || !n) return
    const st = zoomAround(stateOf(v), { frame: v.frame, image: n }, z, point, latest.current.limits, latest.current.restrict)
    commit(viewOf(st, v.frame), animate, animate)
  }, [commit, stateOf, viewOf])

  /** 转到 deg: zoom (相对盖满) 不变, 所以拉直时自动放大到仍盖满; 自由比例跨过四分之一圈时裁剪框跟着转 */
  const applyRotation = React.useCallback((deg: number, animate = true) => {
    const v = view.current
    if (!v) return
    const st = stateOf(v)
    let frame = v.frame
    const turned = (normalizeRotation(deg) - normalizeRotation(v.rot) + FULL_TURN) % HALF_TURN !== 0
    if (latest.current.free && turned) {
      const { box: b, padding: pad } = latest.current
      frame = customFrame.current ? fitFrameInto({ ...frame, width: frame.height, height: frame.width }, halfOf(b, pad)) : defaultFrame(deg)
    }
    commit(viewOf({ ...st, rotation: deg }, frame), animate, true)
  }, [commit, defaultFrame, stateOf, viewOf])

  // 受控 zoom: 外部改了 (Slider / 按钮) 以裁剪框中心缩放, 带补间
  React.useEffect(() => {
    const v = view.current
    if (zoomProp == null || !v) return
    // 是自己刚通过 onZoomChange 报出去的值 (父组件回传): 不动, 否则连续滚轮 / 双指时会被旧值拽回去
    if (Math.abs(zoomProp - stateOf(v).zoom) < EPS || (lastZoom.current != null && Math.abs(zoomProp - lastZoom.current) < EPS)) return
    // 记成未夹取的值: 超出范围时 tick 会把夹取后的实际值报回去
    lastZoom.current = zoomProp
    zoomTo(zoomProp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomProp, zoomTo, stateOf])

  // 受控 rotation
  React.useEffect(() => {
    const v = view.current
    if (rotationProp == null || !v || Math.abs(rotationProp - v.rot) < EPS) return
    applyRotation(rotationProp)
  }, [rotationProp, applyRotation])

  const requestRotation = React.useCallback((deg: number) => {
    if (rotationProp == null) applyRotation(deg)
    latest.current.onRotationChange?.(deg)
  }, [rotationProp, applyRotation])

  const rotate = React.useCallback((delta = 90) => {
    if (view.current) requestRotation(view.current.rot + delta)
  }, [requestRotation])

  const reset = React.useCallback(() => {
    const v = view.current
    if (!v) return
    const { defaultZoom: dz, defaultRotation: dr, limits: lim } = latest.current
    // 走最近的方向回到 defaultRotation (不会为了回到 0 倒转好几圈)
    const diff = ((((dr - v.rot) % FULL_TURN) + FULL_TURN + HALF_TURN) % FULL_TURN) - HALF_TURN
    const rot = v.rot + diff
    customFrame.current = false
    commit(viewOf({ x: 0, y: 0, zoom: clamp(dz, lim.min, lim.max), rotation: rot }, defaultFrame(rot)), true, true)
    if (Math.abs(diff) > EPS) latest.current.onRotationChange?.(rot)
  }, [commit, defaultFrame, viewOf])

  const exportCanvas = (opts: CropOutputOptions = {}) => {
    const v = view.current
    const img = source.image
    if (!v || !img || source.status !== "ready") return null
    const area = areaOf(v, false)
    if (!area) return null
    const jpeg = opts.type === "image/jpeg"
    const bg = opts.background ?? (jpeg ? "var(--background)" : undefined)
    return renderCrop(img, area, v.rot, opts, opts.round ?? cropShape === "round", bg ? resolveColor(rootRef.current, bg) : undefined)
  }

  React.useImperativeHandle(
    ref,
    () => ({
      getCanvas: (opts) => (source.tainted ? null : exportCanvas(opts)),
      getBlob: (opts = {}) => {
        if (source.tainted) return Promise.reject(makeError("cors"))
        const canvas = exportCanvas(opts)
        if (!canvas) return Promise.resolve(null)
        return new Promise<Blob | null>((done, fail) => {
          try {
            canvas.toBlob(done, opts.type ?? "image/webp", opts.quality ?? 0.9)
          } catch {
            // crossOrigin="" 且图片跨域时画布被污染, toBlob 抛 SecurityError
            fail(makeError("cors"))
          }
        })
      },
      getArea: () => (view.current ? areaOf(view.current) : null),
      getState: () => (view.current ? stateOf(view.current) : { x: 0, y: 0, zoom: zoomProp ?? defaultZoom, rotation: rotationProp ?? defaultRotation }),
      getFrame: () => (view.current ? { ...view.current.frame } : null),
      reset,
      rotate,
      setRotation: (deg) => requestRotation(deg),
      zoomTo: (z) => zoomTo(z),
      naturalSize: () => natural,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source, reset, rotate, requestRotation, zoomTo, natural, cropShape]
  )

  // ---------- 指针 ----------

  /** 事件坐标 -> 以容器中心为原点 */
  const local = (e: { clientX: number; clientY: number }): Point => {
    const rect = rootRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2 }
  }
  /** 以裁剪框中心为原点 (缩放中心用) */
  const toFrame = (p: Point): Point => {
    const f = view.current?.frame
    return f ? { x: p.x - f.x, y: p.y - f.y } : p
  }
  const pinchOf = () => {
    const [a, b] = [...pointers.current.values()]
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
  }
  const setCursor = (cursor: string | null) => {
    const el = rootRef.current
    if (el) el.style.cursor = cursor ?? ""
  }

  // 滚轮缩放 (非被动监听才能阻止页面滚动)
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || disabled || !ready) return
    const onWheel = (e: WheelEvent) => {
      if (!view.current) return
      e.preventDefault()
      freeze()
      const dy = e.deltaMode === 1 ? e.deltaY * LINE_PX : e.deltaY
      setInteracting(true)
      const st = stateOf(view.current)
      zoomTo(st.zoom * Math.exp(-dy * WHEEL_FACTOR * wheelSpeed), toFrame(local(e)), false)
      window.clearTimeout(wheelTimer.current)
      wheelTimer.current = window.setTimeout(() => {
        setInteracting(false)
        dirty.current.complete = true
        requestPaint()
      }, WHEEL_IDLE_MS)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      el.removeEventListener("wheel", onWheel)
      window.clearTimeout(wheelTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, ready, wheelSpeed, zoomTo, stateOf, requestPaint])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const v = view.current
    if (disabled || !ready || !v || (e.pointerType === "mouse" && e.button !== 0)) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // 合成事件 / 已失效的指针不能捕获, 不影响拖动
    }
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    freeze()
    const cur = view.current!
    if (pointers.current.size === 1) {
      const handle = (e.target as HTMLElement).closest<HTMLElement>("[data-handle]")?.dataset.handle
      const f = cur.frame
      const inside = Math.abs(p.x - f.x) <= f.width / 2 && Math.abs(p.y - f.y) <= f.height / 2
      if (handle && resizable) {
        const [hx, hy] = handle.split(",").map(Number) as [-1 | 0 | 1, -1 | 0 | 1]
        gesture.current = { kind: "resize", handle: { x: hx, y: hy }, start: { ...f }, from: p }
        setCursor(HANDLE_CURSOR.get(handle) ?? null)
      } else if (inside && frameDraggable(cur)) {
        gesture.current = { kind: "frame" }
        setCursor("move")
      } else {
        gesture.current = { kind: "pan" }
      }
    } else if (pointers.current.size === 2) {
      gesture.current = { kind: "pinch", ...pinchOf() }
      setCursor(null)
    }
    rootRef.current?.setAttribute("data-gesture", gesture.current?.kind ?? "")
    setInteracting(true)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId)
    const v = view.current
    const n = latest.current.natural
    const g = gesture.current
    if (!prev || !v || !n || !g) return
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    const dx = p.x - prev.x
    const dy = p.y - prev.y
    if (g.kind === "pan") {
      const st = stateOf(v)
      commit(viewOf({ ...st, x: st.x + dx, y: st.y + dy }, v.frame), false)
    } else if (g.kind === "frame") {
      // 挪框: 图片不动
      const frame = moveFrame(v.frame, { x: dx, y: dy }, frameLimits(v))
      customFrame.current = true
      commit({ ...v, frame }, false)
    } else if (g.kind === "resize") {
      const frame = resizeFrame(g.start, g.handle, { x: p.x - g.from.x, y: p.y - g.from.y }, frameLimits(v), latest.current.ratio)
      customFrame.current = true
      commit({ ...v, frame }, false)
    } else if (g.kind === "pinch" && pointers.current.size === 2) {
      const now = pinchOf()
      const geom = { frame: v.frame, image: n }
      const st = stateOf(v)
      const zoomed = zoomAround(st, geom, st.zoom * (now.dist / Math.max(1, g.dist)), toFrame(now.mid), latest.current.limits, latest.current.restrict)
      gesture.current = { kind: "pinch", ...now }
      commit(viewOf({ ...zoomed, x: zoomed.x + now.mid.x - g.mid.x, y: zoomed.y + now.mid.y - g.mid.y }, v.frame), false)
    }
  }

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(e.pointerId)) return
    if (pointers.current.size === 1) {
      // 双指松开一指: 剩下那根手指接着拖图片
      gesture.current = { kind: "pan" }
      return
    }
    if (pointers.current.size === 0) {
      gesture.current = null
      rootRef.current?.removeAttribute("data-gesture")
      setCursor(null)
      setInteracting(false)
      dirty.current.complete = true
      dirty.current.crop = true
      requestPaint()
    }
  }

  // ---------- 键盘 ----------

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    const v = view.current
    if (e.defaultPrevented || disabled || !ready || !v || isEditable(e.target) || e.metaKey || e.ctrlKey) return
    const step = keyStep * (e.shiftKey ? SHIFT_MULTIPLIER : 1)
    const arrows: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }
    const dir = arrows[e.key]
    if (!dir && !KEYS.has(e.key)) return
    // 键盘在 "目标状态" 上累加 (不停在半路): 按住方向键连发时每一下都算数, 补间从当前看到的位置追过去
    const cur = v

    // 焦点在裁剪框上: 方向键挪框, Alt + 方向键调宽高 (右 / 下边; 固定比例时等比)
    if (dir && e.target === frameElRef.current) {
      e.preventDefault()
      customFrame.current = true
      if (e.altKey) {
        if (!resizable) return
        const handle: FrameHandle = dir.x ? { x: 1, y: 0 } : { x: 0, y: 1 }
        commit({ ...cur, frame: resizeFrame(cur.frame, handle, { x: dir.x * step, y: dir.y * step }, frameLimits(cur), latest.current.ratio) }, true, true)
      } else {
        commit({ ...cur, frame: moveFrame(cur.frame, { x: dir.x * step, y: dir.y * step }, frameLimits(cur)) }, true, true)
      }
      return
    }
    if (e.altKey) return
    const st = stateOf(cur)
    if (dir) {
      e.preventDefault()
      commit(viewOf({ ...st, x: st.x + dir.x * step, y: st.y + dir.y * step }, cur.frame), true, true)
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault()
      zoomTo(st.zoom + zoomStep)
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault()
      zoomTo(st.zoom - zoomStep)
    } else if ((e.key === "r" || e.key === "R") && rotatable) {
      e.preventDefault()
      rotate(e.shiftKey ? -90 : 90)
    } else if ((e.key === "[" || e.key === "]" || e.key === "{" || e.key === "}") && rotatable) {
      e.preventDefault()
      const sign = e.key === "[" || e.key === "{" ? -1 : 1
      rotate(sign * (e.shiftKey ? STRAIGHTEN_SHIFT : STRAIGHTEN_STEP))
    } else if (e.key === "0") {
      e.preventDefault()
      reset()
    }
  }

  const round = cropShape === "round"
  const canResize = resizable && !disabled

  return (
    <div
      ref={rootRef}
      data-slot="image-cropper"
      data-state={source.status}
      data-shape={cropShape}
      data-aspect={free ? "free" : "fixed"}
      data-tainted={source.tainted ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      role="group"
      aria-roledescription="图片裁剪"
      aria-label={props["aria-label"] ?? "裁剪图片"}
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown + - R [ ] 0"
      tabIndex={disabled || !ready ? -1 : 0}
      className={cn(
        "group/cropper relative isolate min-h-48 touch-none overflow-hidden rounded-xl border bg-muted/40 outline-none select-none",
        "focus-visible:ring-1 focus-visible:ring-ring",
        ready && !disabled && "cursor-grab data-[gesture=pan]:cursor-grabbing data-[gesture=pinch]:cursor-grabbing",
        disabled && "opacity-60",
        className
      )}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {source.url && (
        <img
          key={source.url}
          ref={imgRef}
          src={source.url}
          alt=""
          crossOrigin={source.crossOrigin}
          draggable={false}
          decoding="async"
          data-slot="image-cropper-image"
          className={cn(
            "pointer-events-none absolute top-0 left-0 max-w-none origin-center will-change-transform",
            "opacity-0 transition-opacity duration-200 motion-reduce:transition-none",
            ready && "opacity-100"
          )}
          style={natural ? { width: natural.width, height: natural.height } : undefined}
        />
      )}

      {ready && (
        <div
          ref={frameElRef}
          data-slot="image-cropper-frame"
          role="group"
          aria-label="裁剪框"
          aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown"
          tabIndex={disabled ? -1 : 0}
          className={cn(
            "pointer-events-none absolute top-0 left-0 border border-foreground/80 outline-none will-change-transform",
            "focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring",
            // 框能挪时框内显示 "移动" 光标
            !disabled && "group-data-frame-movable/cropper:pointer-events-auto group-data-frame-movable/cropper:cursor-move",
            round ? "rounded-full" : "rounded-[2px]"
          )}
          style={{ boxShadow: MASK }}
        >
          {grid !== false && (
            <span
              aria-hidden
              className={cn(
                "absolute inset-0 overflow-hidden rounded-[inherit] transition-opacity duration-200 motion-reduce:transition-none",
                grid === "active" ? "opacity-0 group-data-interacting/cropper:opacity-100" : "opacity-100"
              )}
            >
              <span className="absolute inset-y-0 left-1/3 w-px bg-foreground/35" />
              <span className="absolute inset-y-0 left-2/3 w-px bg-foreground/35" />
              <span className="absolute inset-x-0 top-1/3 h-px bg-foreground/35" />
              <span className="absolute inset-x-0 top-2/3 h-px bg-foreground/35" />
            </span>
          )}
          {canResize &&
            CORNERS.map((c) => (
              <span
                key={`${c.h.x},${c.h.y}`}
                aria-hidden
                data-slot="image-cropper-handle"
                data-handle={`${c.h.x},${c.h.y}`}
                className={cn("pointer-events-auto absolute size-4 touch-none border-foreground pointer-coarse:size-6", c.cls)}
                style={{ cursor: c.cursor }}
              />
            ))}
          {canResize &&
            free &&
            EDGES.map((c) => (
              <span
                key={`${c.h.x},${c.h.y}`}
                aria-hidden
                data-slot="image-cropper-handle"
                data-handle={`${c.h.x},${c.h.y}`}
                className={cn("pointer-events-auto absolute grid touch-none place-items-center pointer-coarse:scale-125", c.hit)}
                style={{ cursor: c.cursor }}
              >
                <span className={cn("rounded-full bg-foreground", c.bar)} />
              </span>
            ))}
        </div>
      )}

      {source.tainted && ready && (
        <span
          data-slot="image-cropper-notice"
          title={ERROR_TEXT.cors}
          className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-md border bg-popover/90 px-1.5 py-0.5 text-[11px] text-warning"
        >
          <ShieldAlertIcon aria-hidden className="size-3" />
          仅可预览：图片未开放跨域
        </span>
      )}

      {source.status !== "ready" && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
          {source.status === "loading" ? (
            <LoaderCircleIcon aria-label="加载中" className="size-5 animate-spin motion-reduce:animate-none" />
          ) : source.status === "error" ? (
            <span role="alert" className="grid max-w-xs justify-items-center gap-2">
              <ImageOffIcon aria-hidden className="size-6" />
              <span className="text-foreground">图片加载失败</span>
              {source.error && <span className="text-xs">{source.error.message}</span>}
            </span>
          ) : (
            placeholder ?? (
              <span className="grid justify-items-center gap-2">
                <ImageIcon aria-hidden className="size-6" />
                选择一张图片开始裁剪
              </span>
            )
          )}
        </div>
      )}
      <span className="sr-only">
        拖动平移图片，滚轮或双指缩放；方向键平移，加号减号缩放{rotatable ? "，R 旋转 90 度，方括号拉直" : ""}，0 复位。
        {resizable ? "拖裁剪框的边角调整大小；Tab 到裁剪框后方向键移动，Alt 加方向键调整大小。" : ""}
      </span>
    </div>
  )
}

// ---------- 拉直刻度 ----------

export interface ImageCropperStraightenProps extends Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> {
  /** 角度 (度) */
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** 松手 / 按键结束时 */
  onValueCommit?: (value: number) => void
  /** 默认 -45 */
  min?: number
  /** 默认 45 */
  max?: number
  /** 拖动的取值精度, 默认 0.1 */
  step?: number
  /** 每度的刻度间距 px, 默认 8 */
  spacing?: number
  /** 靠近 0 时吸附的范围 (度), 默认 0.75; 0 关闭 */
  snap?: number
  disabled?: boolean
}

const STRAIGHTEN_MAJOR = 5
const STRAIGHTEN_LABEL = 15
const STRAIGHTEN_PAGE = 5

/**
 * 拉直刻度尺: 左右拖动刻度带调整 -45° ~ 45° (照片 App 的拉直). 中间竖线是当前值, 刻度带只动 transform;
 * 靠近 0 时吸附, 双击归零. 键盘: ← / → ±1° (Shift ±0.1°), PageUp / PageDown ±5°, Home / End 到两端, 0 归零.
 * 通常与 ImageCropper 的 rotation 组合: rotation = 90° 的倍数 + 拉直角度.
 */
function ImageCropperStraighten({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  onValueCommit,
  min = -45,
  max = 45,
  step = 0.1,
  spacing = 8,
  snap = 0.75,
  disabled = false,
  className,
  onKeyDown,
  ...props
}: ImageCropperStraightenProps) {
  const [inner, setInner] = React.useState(defaultValue)
  const value = clamp(valueProp ?? inner, min, max)
  const drag = React.useRef<{ x: number; v: number; id: number } | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const quant = (v: number) => {
    const q = Math.round(v / step) * step
    const c = clamp(+q.toFixed(4), min, max)
    return snap > 0 && Math.abs(c) < snap ? 0 : c
  }
  const set = (v: number, commit = false) => {
    const next = quant(v)
    if (next !== value) {
      if (valueProp == null) setInner(next)
      onValueChange?.(next)
    }
    if (commit) onValueCommit?.(next)
  }

  const ticks = React.useMemo(() => {
    const out: { deg: number; major: boolean; label: boolean }[] = []
    for (let d = Math.ceil(min); d <= Math.floor(max); d++) out.push({ deg: d, major: d % STRAIGHTEN_MAJOR === 0, label: d % STRAIGHTEN_LABEL === 0 })
    return out
  }, [min, max])

  return (
    <div
      data-slot="image-cropper-straighten"
      data-dragging={dragging ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={props["aria-label"] ?? "拉直"}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value.toFixed(1)} 度`}
      aria-disabled={disabled || undefined}
      className={cn(
        "group/straighten relative h-11 min-w-0 cursor-ew-resize touch-none overflow-hidden rounded-lg outline-none select-none",
        "focus-visible:ring-1 focus-visible:ring-ring data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "[mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]",
        className
      )}
      onPointerDown={(e) => {
        if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // 同 ImageCropper
        }
        drag.current = { x: e.clientX, v: value, id: e.pointerId }
        setDragging(true)
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d || d.id !== e.pointerId) return
        // 刻度带跟手: 往左拖, 带子左移, 中线对到更大的角度
        set(d.v - (e.clientX - d.x) / spacing)
      }}
      onPointerUp={() => {
        if (!drag.current) return
        drag.current = null
        setDragging(false)
        onValueCommit?.(value)
      }}
      onPointerCancel={() => {
        drag.current = null
        setDragging(false)
      }}
      onDoubleClick={() => !disabled && set(0, true)}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented || disabled) return
        const map: Record<string, number> = {
          ArrowLeft: value - (e.shiftKey ? step : 1),
          ArrowDown: value - (e.shiftKey ? step : 1),
          ArrowRight: value + (e.shiftKey ? step : 1),
          ArrowUp: value + (e.shiftKey ? step : 1),
          PageDown: value - STRAIGHTEN_PAGE,
          PageUp: value + STRAIGHTEN_PAGE,
          Home: min,
          End: max,
          "0": 0,
        }
        if (!(e.key in map)) return
        e.preventDefault()
        const next = clamp(+map[e.key].toFixed(4), min, max)
        if (valueProp == null) setInner(next)
        onValueChange?.(next)
        onValueCommit?.(next)
      }}
      {...props}
    >
      {/* 刻度带: 只动 transform; 拖动时跟手, 外部改值 (复位) 时补间 */}
      <div
        aria-hidden
        className={cn(
          "absolute top-0 bottom-0 left-1/2 will-change-transform",
          "transition-transform duration-200 ease-[var(--ease-out)] group-data-dragging/straighten:transition-none motion-reduce:transition-none"
        )}
        style={{ transform: `translate3d(${-(value - min) * spacing}px, 0, 0)` }}
      >
        {ticks.map((t) => (
          <span key={t.deg} className="absolute bottom-1.5 flex -translate-x-1/2 flex-col items-center gap-1" style={{ left: (t.deg - min) * spacing }}>
            {t.label && <span className={cn("text-[10px] leading-none text-muted-foreground tabular", t.deg === 0 && "text-foreground")}>{t.deg}°</span>}
            <span className={cn("w-px rounded-full", t.major ? "h-3 bg-muted-foreground/70" : "h-2 bg-muted-foreground/35", t.deg === 0 && "h-3.5 bg-foreground")} />
          </span>
        ))}
      </div>
      {/* 中线 + 当前值 */}
      <span aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 rounded-md bg-background/90 px-1 text-[11px] leading-4 font-medium tabular">
        {value > 0 ? "+" : ""}
        {value.toFixed(1)}°
      </span>
      <span aria-hidden className="absolute bottom-1 left-1/2 h-5 w-px -translate-x-1/2 rounded-full bg-brand" />
    </div>
  )
}

export { ImageCropper, ImageCropperStraighten }
