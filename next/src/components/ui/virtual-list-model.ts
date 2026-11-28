/**
 * VirtualList 的纯逻辑: 前缀和布局, 二分找区间, 定位目标, 锚点, 追加 / 前插判断.
 * 不碰 DOM, 不写 "use client", 可在服务端和 scripts/ui-check.ts 里直接测.
 *
 * 坐标约定: 列表内容坐标, 0 = 第一行顶部. offsets[i] 是第 i 行的顶, offsets[n] 是总高 (最后一行后面不加间距).
 */

export type VirtualKey = string | number

export type ScrollAlign = "auto" | "start" | "center" | "end"

/** 可见区间: [start, end) 是要渲染的行 (含 overscan), [visibleStart, visibleEnd) 是真正落在视口里的行 */
export interface VirtualRange {
  start: number
  end: number
  visibleStart: number
  visibleEnd: number
}

export const EMPTY_RANGE: VirtualRange = { start: 0, end: 0, visibleStart: 0, visibleEnd: 0 }

/**
 * 按每行高度建前缀和. sizeOf(i) 返回第 i 行高度 (已测量的用测量值, 否则估算值).
 * 复用传入的 buffer (长度够就不重新分配), 1 万行重建一次约 0.05ms.
 */
export function buildOffsets(count: number, sizeOf: (index: number) => number, gap = 0, buffer?: Float64Array): Float64Array {
  const out = buffer && buffer.length >= count + 1 ? buffer : new Float64Array(count + 1)
  let y = 0
  for (let i = 0; i < count; i++) {
    out[i] = y
    y += Math.max(0, sizeOf(i)) + (i < count - 1 ? gap : 0)
  }
  out[count] = y
  return out
}

/** 最大的 i (0 <= i < count) 使 offsets[i] <= y; count 为 0 时返回 0 */
export function findIndex(offsets: ArrayLike<number>, count: number, y: number): number {
  if (count <= 0) return 0
  let lo = 0
  let hi = count - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (offsets[mid] <= y) lo = mid
    else hi = mid - 1
  }
  return lo
}

/**
 * 视口 [top, top + height) (内容坐标) 覆盖的行, 前后各多渲染 overscan 行.
 * 视口完全在列表之外时 visible 为空区间, 但仍渲染边缘的 overscan 行, 滚回来不白屏.
 */
export function computeRange(offsets: ArrayLike<number>, count: number, top: number, height: number, overscan: number): VirtualRange {
  if (count <= 0) return EMPTY_RANGE
  const os = Math.max(0, Math.floor(overscan))
  const total = offsets[count]
  const bottom = top + Math.max(0, height)
  if (bottom <= 0) return { start: 0, end: Math.min(count, os), visibleStart: 0, visibleEnd: 0 }
  if (top >= total) return { start: Math.max(0, count - os), end: count, visibleStart: count, visibleEnd: count }
  const visibleStart = findIndex(offsets, count, Math.max(0, top))
  const visibleEnd = findIndex(offsets, count, bottom - 0.5) + 1
  return { start: Math.max(0, visibleStart - os), end: Math.min(count, visibleEnd + os), visibleStart, visibleEnd }
}

export function sameRange(a: VirtualRange, b: VirtualRange): boolean {
  return a.start === b.start && a.end === b.end && a.visibleStart === b.visibleStart && a.visibleEnd === b.visibleEnd
}

/**
 * 让第 index 行按 align 对齐时, 视口顶部应在的内容坐标 (未夹到可滚范围, 由调用方夹).
 * auto: 已完整可见就不动 (返回 current), 在上方就贴顶, 在下方就贴底. gap 是建表时的行间距 (行底 = 下一行顶 - gap).
 */
export function alignTarget(
  offsets: ArrayLike<number>,
  count: number,
  index: number,
  viewport: number,
  align: ScrollAlign,
  current: number,
  gap = 0
): number {
  if (count <= 0) return 0
  const i = Math.max(0, Math.min(count - 1, index))
  const top = offsets[i]
  const bottom = i === count - 1 ? offsets[count] : offsets[i + 1] - gap
  const size = bottom - top
  switch (align) {
    case "start":
      return top
    case "end":
      return bottom - viewport
    case "center":
      return top + size / 2 - viewport / 2
    default:
      if (top >= current && bottom <= current + viewport) return current
      return top < current || size > viewport ? top : bottom - viewport
  }
}

/** 锚点: 一行的 key, 以及视口顶部比那一行的顶多出多少 px (可为负). 布局变了以后用它把那一行放回原处 */
export interface Anchor {
  key: VirtualKey
  delta: number
}

/**
 * 视口顶切在某一行中间时, 锚到它的下一行 (第一个顶部落在视口里的行): 被切的那行若还没量过,
 * 量完变高会把它下面的内容往下推, 锚在下一行上看到的内容就不会动.
 */
export function anchorAt(offsets: ArrayLike<number>, keys: readonly VirtualKey[], top: number): Anchor | null {
  const count = keys.length
  if (!count) return null
  let i = findIndex(offsets, count, Math.max(0, top))
  if (top > offsets[i] && i + 1 < count) i++
  return { key: keys[i], delta: top - offsets[i] }
}

/** 数组变化的类型: 末尾追加了几条, 开头前插了几条 (都按 key 判断; 两头都没对上就是整体替换) */
export interface ItemsChange {
  appended: number
  prepended: number
  replaced: boolean
}

export function diffEdges(prev: readonly VirtualKey[], next: readonly VirtualKey[]): ItemsChange {
  if (!prev.length) return { appended: next.length, prepended: 0, replaced: next.length > 0 }
  if (!next.length) return { appended: 0, prepended: 0, replaced: true }
  const firstAt = next.indexOf(prev[0])
  const lastAt = next.lastIndexOf(prev[prev.length - 1])
  if (firstAt < 0 && lastAt < 0) return { appended: 0, prepended: 0, replaced: true }
  return {
    prepended: firstAt > 0 ? firstAt : 0,
    appended: lastAt >= 0 ? next.length - 1 - lastAt : 0,
    replaced: false,
  }
}

/** 距底部的距离 (px); scrollHeight 小于视口时为 0 */
export function distanceToEnd(scrollTop: number, viewport: number, scrollHeight: number): number {
  return Math.max(0, scrollHeight - viewport - scrollTop)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
