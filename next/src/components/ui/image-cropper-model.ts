/**
 * ImageCropper 的纯几何: 任意角度旋转后的外接尺寸与覆盖缩放, 平移限制, 以某点为中心缩放, 裁剪框的移动 / 缩放约束,
 * 裁剪区域 (像素), 输出尺寸. 不带 "use client": 组件 (image-cropper.tsx) 与自检脚本共用, 服务端也能 import.
 *
 * 坐标约定 (显示坐标, 单位 CSS px, 原点在容器中心, y 向下):
 *   裁剪框 FrameRect = { x, y } 中心 + { width, height }; 可以不在容器中央 (自由比例 / 拖动过裁剪框).
 *   图片按 rotation (度, 任意值, 可累加) 旋转, 显示缩放 s = coverScale * zoom (zoom = 1 恰好盖满裁剪框).
 *   CropState.x / y = 图片中心相对 "裁剪框中心" 的偏移.
 * 限制 (restrict): 裁剪框的四个角都落在 (旋转后的) 图片里. 把裁剪框转进图片自身坐标 (逆旋转) 后它的外接框是
 *   bw = w|cos| + h|sin|, bh = w|sin| + h|cos|, 于是 "盖住" 等价于在图片坐标里 |u| <= (sW - bw) / 2, |v| <= (sH - bh) / 2,
 *   是一个与图片同向的矩形; 在这个矩形里夹取再转回来就是最近的合法偏移 (旋转是等距变换, 投影仍是最近点).
 * 裁剪区域 CropArea 用 "旋转后图片外接框" 的像素坐标 (左上角为原点), 与 rotation 一起就能还原出裁剪结果.
 */

export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export interface CropState {
  /** 图片中心相对裁剪框中心的偏移 (显示 px) */
  x: number
  y: number
  /** 1 = 恰好盖满裁剪框 */
  zoom: number
  /** 角度, 任意值 (90° 旋转 + 拉直微调); 可以累加 (360, 450 ...), 动画一直朝一个方向转 */
  rotation: number
}

/** 裁剪框: 中心相对容器中心 + 尺寸 (显示 px) */
export interface FrameRect {
  x: number
  y: number
  width: number
  height: number
}

export interface CropGeometry {
  /** 裁剪框尺寸 (显示 px) */
  frame: Size
  /** 图片原始尺寸 (像素) */
  image: Size
}

/** 旋转后图片外接框坐标里的裁剪矩形 (像素) */
export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface ZoomLimits {
  min: number
  max: number
}

const EPS = 1e-9
const RAD = Math.PI / 180

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** 角度的 cos / sin, 90° 的倍数时精确为 0 / ±1 (避免 6e-17 这类误差让外接框多出亚像素) */
function trig(deg: number): [number, number] {
  const r = ((deg % 360) + 360) % 360
  if (r === 0) return [1, 0]
  if (r === 90) return [0, 1]
  if (r === 180) return [-1, 0]
  if (r === 270) return [0, -1]
  return [Math.cos(r * RAD), Math.sin(r * RAD)]
}

/** 角度归一到 0 / 90 / 180 / 270 (取最近的四分之一圈) */
export function normalizeRotation(deg: number): 0 | 90 | 180 | 270 {
  const r = ((Math.round(deg / 90) * 90) % 360 + 360) % 360
  return r as 0 | 90 | 180 | 270
}

/** 拆成 90° 的倍数 + 拉直角度 (-45..45]: 120 -> { quarter: 90, fine: 30 } */
export function splitRotation(deg: number): { quarter: number; fine: number } {
  const quarter = Math.round(deg / 90) * 90
  return { quarter: quarter || 0, fine: +(deg - quarter).toFixed(6) || 0 }
}

/** 旋转后的外接尺寸 (任意角度) */
export function rotatedSize(image: Size, rotation: number): Size {
  const [c, s] = trig(rotation)
  const ac = Math.abs(c)
  const as = Math.abs(s)
  return { width: image.width * ac + image.height * as, height: image.width * as + image.height * ac }
}

/** 容器里按比例放得下的最大裁剪框尺寸 (四周留 padding) */
export function fitFrame(container: Size, aspect: number, padding: number): Size {
  const w = Math.max(1, container.width - padding * 2)
  const h = Math.max(1, container.height - padding * 2)
  const a = aspect > 0 && Number.isFinite(aspect) ? aspect : 1
  return w / h > a ? { width: h * a, height: h } : { width: w, height: w / a }
}

/** 恰好盖满裁剪框的缩放: 裁剪框逆旋转进图片坐标后的外接框要被图片盖住 */
export function coverScale(geom: CropGeometry, rotation: number): number {
  const { width: W, height: H } = geom.image
  if (!W || !H) return 1
  const b = rotatedSize(geom.frame, rotation)
  return Math.max(b.width / W, b.height / H)
}

/** 把偏移限制在 "图片盖住裁剪框" 的范围里 (任意角度) */
export function clampOffset(state: CropState, geom: CropGeometry, restrict = true): CropState {
  if (!restrict) return state
  const s = coverScale(geom, state.rotation) * state.zoom
  const b = rotatedSize(geom.frame, state.rotation)
  const [c, sn] = trig(state.rotation)
  // 偏移转进图片坐标: q = R(-θ) · o
  const u = c * state.x + sn * state.y
  const v = -sn * state.x + c * state.y
  const mu = Math.max(0, (geom.image.width * s - b.width) / 2)
  const mv = Math.max(0, (geom.image.height * s - b.height) / 2)
  const cu = clamp(u, -mu, mu)
  const cv = clamp(v, -mv, mv)
  if (Math.abs(cu - u) < EPS && Math.abs(cv - v) < EPS) return state
  // 转回来: o = R(θ) · q
  return { ...state, x: c * cu - sn * cv, y: sn * cu + c * cv }
}

/**
 * 以 point (相对裁剪框中心的显示坐标) 为中心缩放到 nextZoom: 指针下的那一点缩放前后不动.
 * 结果已限制 zoom 范围与偏移.
 */
export function zoomAround(state: CropState, geom: CropGeometry, nextZoom: number, point: Point, limits: ZoomLimits, restrict = true): CropState {
  const zoom = clamp(nextZoom, limits.min, limits.max)
  const k = zoom / state.zoom
  // 图片中心 c, 指针 p: 缩放后 p - c' = (p - c) * k
  const x = point.x - (point.x - state.x) * k
  const y = point.y - (point.y - state.y) * k
  return clampOffset({ ...state, zoom, x, y }, geom, restrict)
}

/** 当前状态对应的裁剪区域 (旋转后图片外接框的像素坐标); round = false 时不取整 (画图用, 比例与裁剪框完全一致) */
export function cropArea(state: CropState, geom: CropGeometry, round = true): CropArea {
  const s = coverScale(geom, state.rotation) * state.zoom
  const r = rotatedSize(geom.image, state.rotation)
  const width = geom.frame.width / s
  const height = geom.frame.height / s
  const cx = r.width / 2 - state.x / s
  const cy = r.height / 2 - state.y / s
  const area = { x: cx - width / 2, y: cy - height / 2, width, height }
  return round ? { x: Math.round(area.x), y: Math.round(area.y), width: Math.round(area.width), height: Math.round(area.height) } : area
}

// ---------- 裁剪框的移动 / 缩放 ----------

/** 显示中的图片: 中心 (相对容器中心), 显示缩放, 角度, 原始尺寸 */
export interface ImageBox {
  x: number
  y: number
  scale: number
  rotation: number
  image: Size
}

/** 裁剪框的约束: 容器内的可用范围 (半宽 / 半高, 以容器中心为原点), 最小边长, 图片 (restrict 时裁剪框不能超出图片), 缩放上下限 */
export interface FrameLimits {
  /** 可用范围的半宽 / 半高: 容器尺寸 / 2 - padding */
  half: Size
  /** 最小边长 px */
  min: number
  /** 显示中的图片: contain 时要求裁剪框完全落在图片里; zoom 限制也要用它 */
  image?: ImageBox
  /** 裁剪框必须落在图片里 (restrict), 默认 true */
  contain?: boolean
  /** 给了就要求 zoom (显示缩放 / 覆盖缩放) 保持在范围内 */
  zoom?: ZoomLimits
}

/** 拖的是哪条边 / 哪个角: x, y 各取 -1 (左 / 上), 0 (不动), 1 (右 / 下) */
export interface FrameHandle {
  x: -1 | 0 | 1
  y: -1 | 0 | 1
}

/** 裁剪框是否满足所有约束 (容差 0.01px, 避免浮点抖动把合法状态判成越界) */
export function frameFits(f: FrameRect, lim: FrameLimits): boolean {
  const tol = 0.01
  if (f.width < lim.min - tol || f.height < lim.min - tol) return false
  if (Math.abs(f.x) + f.width / 2 > lim.half.width + tol || Math.abs(f.y) + f.height / 2 > lim.half.height + tol) return false
  const img = lim.image
  if (!img) return true
  if (lim.contain !== false && !frameInside(f, img, tol)) return false
  if (lim.zoom) {
    const zoom = img.scale / coverScale({ frame: f, image: img.image }, img.rotation)
    if (zoom > lim.zoom.max + 1e-6 || zoom < lim.zoom.min - 1e-6) return false
  }
  return true
}

/** 裁剪框的四个角都在 (旋转后的) 图片里 */
function frameInside(f: FrameRect, img: ImageBox, tol: number): boolean {
  const [c, s] = trig(img.rotation)
  const hw = (img.image.width * img.scale) / 2 + tol
  const hh = (img.image.height * img.scale) / 2 + tol
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    const px = f.x + (sx * f.width) / 2 - img.x
    const py = f.y + (sy * f.height) / 2 - img.y
    const u = c * px + s * py
    const v = -s * px + c * py
    if (Math.abs(u) > hw || Math.abs(v) > hh) return false
  }
  return true
}

/** 在 [0, 1] 上二分: from (合法) 到 to 之间最远的合法点; fits(t) 对 t 单调 */
function farthest(fits: (t: number) => boolean, steps = 22): number {
  if (fits(1)) return 1
  let lo = 0
  let hi = 1
  for (let i = 0; i < steps; i++) {
    const mid = (lo + hi) / 2
    if (fits(mid)) lo = mid
    else hi = mid
  }
  return lo
}

/**
 * 平移裁剪框 delta (图片不动). 容器范围是与屏幕同向的矩形, 图片范围是旋转的矩形, 合法的中心是两者的交集 (凸集);
 * 沿 delta 方向二分出最远的合法位置, 再分别沿 x / y 补走剩下的量 (贴着边滑动, 而不是一碰边就整个停住).
 */
export function moveFrame(f: FrameRect, delta: Point, lim: FrameLimits): FrameRect {
  const at = (dx: number, dy: number): FrameRect => ({ ...f, x: f.x + dx, y: f.y + dy })
  if (!frameFits(f, lim)) return at(delta.x, delta.y)
  const t = farthest((k) => frameFits(at(delta.x * k, delta.y * k), lim))
  let dx = delta.x * t
  let dy = delta.y * t
  const tx = farthest((k) => frameFits(at(dx + (delta.x - dx) * k, dy), lim))
  dx += (delta.x - dx) * tx
  const ty = farthest((k) => frameFits(at(dx, dy + (delta.y - dy) * k), lim))
  dy += (delta.y - dy) * ty
  return at(dx, dy)
}

/** 裁剪框能不能移动 (任一方向还有 >= 1px 的余地) */
export function frameMovable(f: FrameRect, lim: FrameLimits): boolean {
  const far = (lim.half.width + lim.half.height) * 2
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const m = moveFrame(f, { x: dx * far, y: dy * far }, lim)
    if (Math.abs(m.x - f.x) >= 1 || Math.abs(m.y - f.y) >= 1) return true
  }
  return false
}

/** FrameRect <-> 四条边 */
const edgesOf = (f: FrameRect) => ({ l: f.x - f.width / 2, r: f.x + f.width / 2, t: f.y - f.height / 2, b: f.y + f.height / 2 })
const rectOf = (e: { l: number; r: number; t: number; b: number }): FrameRect => ({ x: (e.l + e.r) / 2, y: (e.t + e.b) / 2, width: e.r - e.l, height: e.b - e.t })

/**
 * 拖边 / 角缩放裁剪框: 对边 (对角) 固定, 只动被拖的边.
 * aspect 给了 (固定比例) 时保持比例: 拖角以对角为锚; 拖边以对边中点为锚, 另一方向居中伸缩.
 * 自由比例时两条边分别二分到各自最远的合法位置 (一条碰到边界另一条仍能动); 固定比例时整体按比例二分.
 * 不满足最小边长时停在最小值; 起始状态本身不合法 (例如容器刚缩小) 时不加约束, 交给调用方之后再夹.
 */
export function resizeFrame(start: FrameRect, handle: FrameHandle, delta: Point, lim: FrameLimits, aspect?: number): FrameRect {
  const e0 = edgesOf(start)
  const ok = frameFits(start, lim)
  const fits = (f: FrameRect) => !ok || frameFits(f, lim)

  if (aspect && aspect > 0) {
    // 固定比例: 由拖动量算目标宽度 (拖角时取两个方向里改变更多的那个, 跟手), 以锚点缩放
    const dw = handle.x * delta.x
    const dh = handle.y * delta.y
    const corner = Math.abs(dw) >= Math.abs(dh * aspect) ? dw : dh * aspect
    const wantW = start.width + (handle.x && handle.y ? corner : handle.x ? dw : dh * aspect)
    const minW = Math.max(lim.min, lim.min * aspect)
    const build = (w: number): FrameRect => {
      const h = w / aspect
      const ax = handle.x === 1 ? e0.l : handle.x === -1 ? e0.r : start.x
      const ay = handle.y === 1 ? e0.t : handle.y === -1 ? e0.b : start.y
      const l = handle.x === 1 ? ax : handle.x === -1 ? ax - w : ax - w / 2
      const t = handle.y === 1 ? ay : handle.y === -1 ? ay - h : ay - h / 2
      return { x: l + w / 2, y: t + h / 2, width: w, height: h }
    }
    const target = Math.max(minW, wantW)
    const k = farthest((t) => fits(build(start.width + (target - start.width) * t)))
    return build(start.width + (target - start.width) * k)
  }

  // 自由比例: 每条被拖的边单独走, 先 x 后 y
  const e = { ...e0 }
  if (handle.x) {
    const key = handle.x === 1 ? "r" : "l"
    const limitEdge = handle.x === 1 ? e.l + lim.min : e.r - lim.min
    const want = handle.x === 1 ? Math.max(limitEdge, e0.r + delta.x) : Math.min(limitEdge, e0.l + delta.x)
    const from = e[key]
    const k = farthest((t) => fits(rectOf({ ...e, [key]: from + (want - from) * t })))
    e[key] = from + (want - from) * k
  }
  if (handle.y) {
    const key = handle.y === 1 ? "b" : "t"
    const limitEdge = handle.y === 1 ? e.t + lim.min : e.b - lim.min
    const want = handle.y === 1 ? Math.max(limitEdge, e0.b + delta.y) : Math.min(limitEdge, e0.t + delta.y)
    const from = e[key]
    const k = farthest((t) => fits(rectOf({ ...e, [key]: from + (want - from) * t })))
    e[key] = from + (want - from) * k
  }
  return rectOf(e)
}

/** 把裁剪框收进容器范围 (容器缩小 / padding 变大后): 先等比缩到放得下, 再平移进来 */
export function fitFrameInto(f: FrameRect, half: Size): FrameRect {
  const k = Math.min(1, (half.width * 2) / Math.max(EPS, f.width), (half.height * 2) / Math.max(EPS, f.height))
  const width = f.width * k
  const height = f.height * k
  const mx = Math.max(0, half.width - width / 2)
  const my = Math.max(0, half.height - height / 2)
  return { x: clamp(f.x, -mx, mx), y: clamp(f.y, -my, my), width, height }
}

// ---------- 输出 ----------

export interface OutputSizeOptions {
  /** 长边 px; 不给就用裁剪区域本身的像素尺寸 */
  size?: number
  /** 显式宽 / 高 (优先于 size); 只给一个时按裁剪区域比例算另一个 */
  width?: number
  height?: number
  /** 不给 size 时的长边上限, 默认 4096 */
  maxSize?: number
}

/** 输出画布的尺寸 */
export function outputSize(area: Size, opts: OutputSizeOptions = {}): Size {
  const ratio = area.width / Math.max(1, area.height)
  const round = (n: number) => Math.max(1, Math.round(n))
  if (opts.width && opts.height) return { width: round(opts.width), height: round(opts.height) }
  if (opts.width) return { width: round(opts.width), height: round(opts.width / ratio) }
  if (opts.height) return { width: round(opts.height * ratio), height: round(opts.height) }
  const long = opts.size ?? Math.min(Math.max(area.width, area.height), opts.maxSize ?? 4096)
  return ratio >= 1 ? { width: round(long), height: round(long / ratio) } : { width: round(long * ratio), height: round(long) }
}

/**
 * 高质量缩小的分步计划: 一次缩到很小会有锯齿 / 摩尔纹, 先以不超过 1 的倍数画出, 再每步减半.
 * 返回 [首次绘制倍数, 减半次数]; 最后一步再精确缩到目标尺寸.
 */
export function downscalePlan(scale: number, maxSteps = 4): [number, number] {
  let first = scale
  let steps = 0
  while (first * 2 <= 1 && steps < maxSteps) {
    first *= 2
    steps += 1
  }
  return [first, steps]
}
