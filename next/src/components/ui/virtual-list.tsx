"use client"

/**
 * 虚拟列表: 上千条的群消息, 邮件, 信息流只渲染视口附近的几十行, CPU / GPU 占用与总条数无关.
 *
 *   <VirtualList items={mails} getKey={(m) => m.id} estimateSize={72} renderItem={(m) => <MailRow mail={m} />} />
 *   <VirtualList reverse items={messages} getKey={(m) => m.id} onStartReached={loadOlder} renderItem={...} />
 *
 * 零依赖, 结构是 滚动容器 > 撑高的 sizer (高 = 总高) > 绝对定位的行 (translateY 摆位, 不参与文档流).
 * 不定高: 每行先按 estimateSize 估, 挂上后由一个共享的 ResizeObserver 量真实高度, 按 key 缓存
 * (数据重排 / 前插不丢测量). 前缀和 + 二分查区间见 virtual-list-model.ts.
 * 测量回调本身就是浏览器每帧一次的批处理, 并且发生在布局之后, 绘制之前: 这里只改 DOM
 * (行的 transform, sizer 高度, 必要时修正 scrollTop), 当帧就画对, 不会先叠在一起再跳开;
 * 区间变化引起的 React 渲染统一排到下一个 rAF, 同一帧量到多少行都只渲染一次.
 * 滚动时只在可见区间真的变了才 setState, 行组件 memo, 已挂载的行不重渲染.
 *
 * 位置稳定靠 key 锚点: 每次用户滚动都记下 "视口顶落在哪一行 + 偏了多少", 之后不管是前插了更早的消息,
 * 上方的行量出了真实高度, 还是 header 的加载提示消失, 都把那一行放回原处, 不跳.
 * 浏览器自带的 overflow-anchor 会和它打架 (Safari 也没有), 所以在滚动容器上关掉, 全部自己做.
 *
 * 触屏惯性 (iOS / 安卓 fling): 惯性滚动中写 scrollTop 会把惯性掐断. 所以手指在屏上或惯性还没停时,
 * 修正量先记成 "偏差", 用内容层的一个 translateY 抵消 (视觉上不跳, 也不碰 scrollTop),
 * 等滚动停下 (scrollend, 或 120ms 没有新的滚动事件) 再在同一帧里把偏差并回 scrollTop 并撤掉 transform.
 * 桌面滚轮 / 触控板不受影响, 照常当帧修正. 区间计算, 锚点, 是否在底部都按 "scrollTop + 偏差" 算.
 * 同一个机制也消掉了取整误差: 浏览器把 scrollTop 取整到设备像素, 前插后锚点行会差零点几 px,
 * 剩下的零头 (< 1px) 留在这个 transform 里, 锚点行位置精确不变.
 *
 * 反向 (reverse, 聊天): 内容不满一屏时贴底, 初次挂载滚到底; 在底部 (距底 <= followThreshold) 时
 * 末尾追加的新消息自动跟随 (followOutput), 不在底部时不动, 通过 onUnseenChange 报告 "有 N 条新消息".
 * 用外部滚动容器 (ScrollArea / ref) 时也贴底: 列表自己量出 "视口高 - 上方内容 - 下方内容", 设成最小高度并把行压到底部.
 *
 * 加载更多: 视口顶在 startThreshold 内触发 onStartReached (加载更早), 距底 endThreshold 内触发 onEndReached.
 * 不只响应滚动: 挂载后, 条数变化后, 测量后都会检查, 首页不满一屏或加载完仍在阈值内就自动继续加载, 调用方不用补.
 * 去重: 每次触发后要等条目真的在那一头变多 (或离开区域再回来) 才会再触发; 回调返回 Promise 时,
 * 它没结束前不会再触发, 结束后立刻再检查一次. 加载到头 (没有新条目) 就自然停下, 不会死循环.
 *
 * 定位: ref 句柄 scrollToIndex / scrollToKey (align start / center / end / auto, 可平滑) 先按估算位置滚过去,
 * 目标附近的行挂上并量完后再按真实高度二次校正, 直到不再变化才 resolve; 用户中途滚轮 / 触摸就放弃.
 * 系统开了减弱动效时, 平滑滚动一律改为直接跳.
 *
 * 与 ScrollArea 兼容: scrollParent="scroll-area" 时不自带滚动容器, 用外层 ScrollArea 的 viewport 滚动
 * (也可传任意滚动元素的 ref); 列表上方可以有别的内容, 偏移会自动量出来.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  EMPTY_RANGE,
  alignTarget,
  anchorAt,
  buildOffsets,
  clamp,
  computeRange,
  diffEdges,
  distanceToEnd,
  sameRange,
  type Anchor,
  type ScrollAlign,
  type VirtualKey,
  type VirtualRange,
} from "@/components/ui/virtual-list-model"

export type { ScrollAlign, VirtualKey, VirtualRange } from "@/components/ui/virtual-list-model"

export type VirtualScrollBehavior = "auto" | "smooth"

export interface VirtualScrollOptions {
  /** 对齐方式, 默认 scrollToIndex / scrollToKey 为 "auto" (已完整可见就不动) */
  align?: ScrollAlign
  /** 不写时用列表的 scrollBehavior */
  behavior?: VirtualScrollBehavior
}

/** ref 句柄. 定位类方法返回的 Promise 在校正完成 (位置不再变化) 时 resolve(true), 被打断或目标不存在时 resolve(false) */
export interface VirtualListHandle {
  scrollToIndex: (index: number, options?: VirtualScrollOptions) => Promise<boolean>
  scrollToKey: (key: VirtualKey, options?: VirtualScrollOptions) => Promise<boolean>
  scrollToBottom: (options?: Pick<VirtualScrollOptions, "behavior">) => Promise<boolean>
  scrollToTop: (options?: Pick<VirtualScrollOptions, "behavior">) => Promise<boolean>
  /** 实际滚动的元素 (自带的容器或外部的 ScrollArea viewport) */
  getScrollElement: () => HTMLElement | null
  isAtBottom: () => boolean
  /** 不在底部时末尾新增的条数 */
  getUnseen: () => number
  getRange: () => VirtualRange
  /** 清掉测量缓存并重量已挂载的行 (换字体 / 密度后调用) */
  measure: () => void
}

export interface VirtualListProps<T> extends Omit<React.ComponentProps<"div">, "children" | "ref"> {
  items: readonly T[]
  /** 每条的稳定 key: 测量缓存, 锚点, 定位都靠它 */
  getKey: (item: T, index: number) => VirtualKey
  renderItem: (item: T, index: number) => React.ReactNode
  /** 未测量行的估算高度 (px), 或按条估算的函数; 越接近真实值滚动条越稳. 默认 48 */
  estimateSize?: number | ((item: T, index: number) => number)
  /** 视口上下各多渲染几行, 默认 6 */
  overscan?: number
  /** 行间距 px, 默认 0 */
  gap?: number
  /** 反向 (聊天): 内容不满一屏时贴底, 初次滚到底, 默认跟随新消息 */
  reverse?: boolean
  /** 在底部时末尾追加的条目自动滚到底, 默认等于 reverse */
  followOutput?: boolean
  /** 距底多少 px 以内算 "在底部" (决定是否跟随, 以及何时清零未读), 默认 64 */
  followThreshold?: number
  /** 跟随与定位的默认滚动方式, 默认 "auto" (直接跳) */
  scrollBehavior?: VirtualScrollBehavior
  /** 滚到距顶多少 px 以内触发 onStartReached, 默认 240 */
  startThreshold?: number
  /** 滚到距底多少 px 以内触发 onEndReached, 默认 240 */
  endThreshold?: number
  /**
   * 视口在顶部附近 (含挂载后 / 加载后内容不满一屏): 反向列表在这里加载更早的消息, 前插后滚动位置保持不跳.
   * 返回 Promise 时等它结束才可能再次触发
   */
  onStartReached?: () => void | Promise<unknown>
  /** 视口在底部附近: 普通列表在这里加载下一页; 规则同 onStartReached */
  onEndReached?: () => void | Promise<unknown>
  onAtBottomChange?: (atBottom: boolean) => void
  /** 不在底部时末尾新增的条数变化 (回到底部清零), 用来显示 "有 N 条新消息" */
  onUnseenChange?: (count: number) => void
  /** 渲染区间变化 (含 overscan 的 start / end 与真正可见的 visibleStart / visibleEnd) */
  onRangeChange?: (range: VirtualRange) => void
  /** 滚动容器: "self" 自带 (默认); "scroll-area" 用外层 ScrollArea 的 viewport; 或任意滚动元素的 ref */
  scrollParent?: "self" | "scroll-area" | React.RefObject<HTMLElement | null>
  /** 列表上方 / 下方随内容滚动的插槽 (加载更早的提示, "没有更多了") */
  header?: React.ReactNode
  footer?: React.ReactNode
  /** 没有条目时显示 */
  empty?: React.ReactNode
  /** 每行外层 (定位层) 的 className */
  itemClassName?: string
  /** 每行外层的 role, 列表 role="list" 时传 "listitem" */
  itemRole?: React.AriaRole
  ref?: React.Ref<VirtualListHandle>
}

const DEFAULT_ESTIMATE = 48
const DEFAULT_OVERSCAN = 6
const DEFAULT_FOLLOW = 64
const DEFAULT_REACH = 240
/** 平滑滚动 / 校正期间, 连续这么久没有滚动也没有新测量就算稳定 */
const SETTLE_MS = 140
/** 小于这个差 (px) 不再校正, 避免亚像素来回抖 */
const EPSILON = 1
/** 小于这个 (px) 的偏差视为 0 */
const SUBPIXEL = 0.01
/** 触屏滚动: 这么久没有新的滚动事件就算惯性停了 (不支持 scrollend 时的兜底) */
const TOUCH_IDLE_MS = 120
/** 自己写 scrollTop 引起的 scroll 事件在这个时间窗内到达, 用来与用户滚动区分 */
const SELF_SCROLL_MS = 100
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"
const SCROLL_AREA_VIEWPORT = '[data-slot="scroll-area-viewport"]'
/** 平滑滚动时长: 按距离 (以视口高为单位) 线性, 夹在上下限之间 */
const SMOOTH_MIN_MS = 220
const SMOOTH_MAX_MS = 480
const SMOOTH_MS_PER_VIEWPORT = 120
/** 超过这么多个视口的距离先瞬移到目标附近再平滑滚完, 不把沿途上千行都渲染一遍 */
const SMOOTH_FAR_VIEWPORTS = 3
const SMOOTH_LEAD_VIEWPORTS = 1.5
const easeOutCubic = (k: number) => 1 - (1 - k) ** 3
/** 用户主动滚动的输入: 出现时放弃进行中的定位 */
const USER_INPUTS = ["wheel", "touchstart", "pointerdown", "keydown"] as const

type Target = { kind: "key"; key: VirtualKey; align: ScrollAlign } | { kind: "bottom" } | { kind: "top" }
/** 一头的 "加载更多" 状态: armed 可触发, busy 回调的 Promise 还没结束 */
interface Reach {
  armed: boolean
  busy: boolean
}
const isThenable = (v: unknown): v is PromiseLike<unknown> => typeof (v as PromiseLike<unknown> | null)?.then === "function"
interface Pending {
  target: Target
  behavior: VirtualScrollBehavior
  resolve: (ok: boolean) => void
  /** 自己驱动的平滑动画的 rAF; 0 表示没在动 */
  raf: number
}

const translate = (y: number) => `translateY(${y}px)`

/**
 * sizer 顶部在滚动内容里的位置 (px, 不随滚动变). 用 offsetTop 链而不是 getBoundingClientRect:
 * 不受祖先 transform (弹窗缩放, 入场动画) 影响, 也不会把几十万 px 的 scrollTop 掺进浮点误差.
 */
function offsetWithin(node: HTMLElement, scroller: HTMLElement): number {
  const chain = (from: HTMLElement, stop: HTMLElement | null) => {
    let y = 0
    let n: HTMLElement | null = from
    while (n && n !== stop) {
      y += n.offsetTop
      const parent = n.offsetParent as HTMLElement | null
      if (parent && parent !== stop) y += parent.clientTop
      n = parent
    }
    return { y, reached: n === stop }
  }
  const direct = chain(node, scroller)
  if (direct.reached) return direct.y
  // 滚动容器自己不是定位元素: 两者都量到共同的根, 相减
  return chain(node, null).y - chain(scroller, null).y - scroller.clientTop
}

interface RowProps<T> {
  item: T
  index: number
  rowKey: VirtualKey
  y: number
  renderItem: (item: T, index: number) => React.ReactNode
  register: (key: VirtualKey, el: HTMLDivElement | null) => void
  className?: string
  role?: React.AriaRole
}

function RowImpl<T>({ item, index, rowKey, y, renderItem, register, className, role }: RowProps<T>) {
  const ref = React.useCallback((el: HTMLDivElement | null) => register(rowKey, el), [register, rowKey])
  return (
    <div
      ref={ref}
      role={role}
      data-slot="virtual-list-item"
      data-index={index}
      className={cn("absolute top-0 left-0 w-full", className)}
      style={{ transform: translate(y) }}
    >
      {renderItem(item, index)}
    </div>
  )
}
const Row = React.memo(RowImpl) as typeof RowImpl

function VirtualList<T>({
  items,
  getKey,
  renderItem,
  estimateSize = DEFAULT_ESTIMATE,
  overscan = DEFAULT_OVERSCAN,
  gap = 0,
  reverse = false,
  followOutput = reverse,
  followThreshold = DEFAULT_FOLLOW,
  scrollBehavior = "auto",
  startThreshold = DEFAULT_REACH,
  endThreshold = DEFAULT_REACH,
  onStartReached,
  onEndReached,
  onAtBottomChange,
  onUnseenChange,
  onRangeChange,
  scrollParent = "self",
  header,
  footer,
  empty,
  itemClassName,
  itemRole,
  className,
  style,
  ref,
  ...props
}: VirtualListProps<T>) {
  const self = scrollParent === "self"
  const rootRef = React.useRef<HTMLDivElement>(null)
  const sizerRef = React.useRef<HTMLDivElement>(null)
  const headerRef = React.useRef<HTMLDivElement>(null)
  const footerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [range, setRange] = React.useState<VirtualRange>(EMPTY_RANGE)

  // 最新的 props, 给监听器和测量回调读 (它们只建一次)
  const latest = React.useRef({ getKey, estimateSize, overscan, gap, followOutput, followThreshold, scrollBehavior, startThreshold, endThreshold, onStartReached, onEndReached, onAtBottomChange, onUnseenChange, onRangeChange, reverse })
  latest.current = { getKey, estimateSize, overscan, gap, followOutput, followThreshold, scrollBehavior, startThreshold, endThreshold, onStartReached, onEndReached, onAtBottomChange, onUnseenChange, onRangeChange, reverse }

  // 可变的布局状态: 全放 ref, 滚动和测量不经过 React
  const st = React.useRef({
    el: null as HTMLElement | null,
    items: null as readonly T[] | null,
    keys: [] as VirtualKey[],
    index: new Map<VirtualKey, number>(),
    prevKeys: [] as VirtualKey[],
    sizes: new Map<VirtualKey, number>(),
    offsets: new Float64Array(1) as Float64Array,
    estKey: "" as string | number,
    gap: 0,
    margin: 0,
    range: EMPTY_RANGE,
    anchor: null as Anchor | null,
    stick: reverse,
    atBottom: reverse,
    unseen: 0,
    reachStart: { armed: true, busy: false } as Reach,
    reachEnd: { armed: true, busy: false } as Reach,
    /** 视觉偏差 (px): 内容层 translateY(-dev). 有效滚动位置 = scrollTop + dev */
    dev: 0,
    /** 手指在屏上 */
    touching: false,
    /** 触屏滚动 (含松手后的惯性) 还没停 */
    touchScroll: false,
    idleTimer: 0,
    writeTop: -1,
    writeAt: 0,
    pending: null as Pending | null,
    settleTimer: 0,
    raf: 0,
    rows: new Map<VirtualKey, HTMLDivElement>(),
    elKey: new WeakMap<Element, VirtualKey>(),
    ro: null as ResizeObserver | null,
  }).current

  // ---- 布局 ----
  // 条目 / 间距 / 估算值变了: 渲染期只算一份草稿 (新数组, 不改 st), 提交后在 layout effect 里换上.
  // 并发渲染可能在渲染与提交之间让出主线程, 这期间的滚动事件读到的仍是与 DOM 一致的旧布局, 锚点不会记错.
  const count = items.length
  const estKey = typeof estimateSize === "number" ? estimateSize : "fn"
  const draft = React.useMemo(() => {
    const keys = items.map((it, i) => getKey(it, i))
    const sizeOf = (i: number) => st.sizes.get(keys[i]) ?? (typeof estimateSize === "number" ? estimateSize : estimateSize(items[i], i))
    return { items, keys, index: new Map(keys.map((k, i) => [k, i])), offsets: buildOffsets(keys.length, sizeOf, gap) }
    // getKey / estimateSize 函数每次渲染都可能是新的, 只在条目或数值参数变化时重算
  }, [items, estKey, gap])
  const committed = st.items === items && st.estKey === estKey && st.gap === gap
  const keys = committed ? st.keys : draft.keys
  const offsets = committed ? st.offsets : draft.offsets
  const total = offsets[count] ?? 0

  /** 用当前测量重算前缀和 (复用缓冲区) */
  const rebuild = () => {
    const { estimateSize: est, gap: g } = latest.current
    const list = st.items ?? []
    st.offsets = buildOffsets(
      st.keys.length,
      (i) => st.sizes.get(st.keys[i]) ?? (typeof est === "number" ? est : est(list[i], i)),
      g,
      st.offsets
    )
    st.gap = g
  }

  // ---- DOM 工具 ----
  const maxScroll = (el: HTMLElement) => Math.max(0, el.scrollHeight - el.clientHeight)
  /** 有效滚动位置: 浏览器的 scrollTop 加上还没并回去的视觉偏差 */
  const viewTop = (el: HTMLElement) => el.scrollTop + st.dev
  /** 偏差层: 自带容器时是内容层, 外部容器时是列表根 (header + 行 + footer 一起移) */
  const setShift = (value: number) => {
    // 对齐到设备像素: 不会把整块内容放到半像素上 (DPR 1 时文字发虚), 误差 < 半个设备像素, 肉眼不可见
    const dpr = window.devicePixelRatio || 1
    const snapped = Math.round(value * dpr) / dpr
    const v = Math.abs(snapped) < SUBPIXEL ? 0 : snapped
    if (v === st.dev) return
    st.dev = v
    const node = self ? contentRef.current : rootRef.current
    if (node) node.style.transform = v ? translate(-v) : ""
  }
  /** 触屏滚动进行中 (含惯性): 不写 scrollTop, 修正量记成偏差 */
  const deferring = () => (st.touching || st.touchScroll) && !st.pending
  /** 把有效滚动位置设成 value. 写 scrollTop 后读回, 取整剩下的零头 (< 1px) 留在偏差里, 锚点精确不跳 */
  const setTop = (value: number) => {
    const el = st.el
    if (!el) return
    if (deferring()) return setShift(value - el.scrollTop)
    const v = clamp(value, 0, maxScroll(el))
    if (Math.abs(el.scrollTop - v) > SUBPIXEL) {
      st.writeTop = v
      st.writeAt = performance.now()
      el.scrollTop = v
    }
    const residual = v - el.scrollTop
    setShift(Math.abs(residual) < 1 ? residual : 0)
  }
  /** 触屏滚动停了: 把偏差并回 scrollTop (同一帧写 scrollTop 与撤 transform, 画面不动) */
  const flushShift = () => {
    window.clearTimeout(st.idleTimer)
    st.touchScroll = false
    const el = st.el
    if (!el || st.touching) return
    if (Math.abs(st.dev) >= 1) setTop(viewTop(el))
    captureState()
    scheduleRefresh()
  }
  const armIdle = () => {
    window.clearTimeout(st.idleTimer)
    st.idleTimer = window.setTimeout(flushShift, TOUCH_IDLE_MS)
  }
  /**
   * 反向列表在外部滚动容器里贴底: 最小高度 = 视口高 - 列表上方的内容 - 列表下方的内容.
   * 下方内容的高度不随列表的最小高度变 (它们一起被往下推), 所以一次就能算准, 不会和 ResizeObserver 来回振荡.
   */
  const syncFill = () => {
    const el = st.el
    const root = rootRef.current
    if (!el || !root || self) return
    let fill = 0
    if (latest.current.reverse) {
      const top = offsetWithin(root, el)
      let bottom = 0
      for (const child of Array.from(el.children)) {
        if (child instanceof HTMLElement) bottom = Math.max(bottom, offsetWithin(child, el) + child.offsetHeight)
      }
      const trailing = Math.max(0, bottom - top - root.offsetHeight)
      const padBottom = Number.parseFloat(getComputedStyle(el).paddingBottom) || 0
      fill = Math.max(0, el.clientHeight - padBottom - top - trailing)
    }
    const next = fill ? `${fill}px` : ""
    if (root.style.minHeight !== next) root.style.minHeight = next
  }
  const syncMargin = () => {
    const el = st.el
    const sizer = sizerRef.current
    if (!el || !sizer) return
    syncFill()
    st.margin = offsetWithin(sizer, el)
  }
  const targetOf = (t: Target): number | null => {
    const el = st.el
    if (!el) return null
    if (t.kind === "bottom") return maxScroll(el)
    if (t.kind === "top") return 0
    const i = st.index.get(t.key)
    if (i == null) return null
    const y = alignTarget(st.offsets, st.keys.length, i, el.clientHeight, t.align, viewTop(el) - st.margin, st.gap)
    return clamp(st.margin + y, 0, maxScroll(el))
  }

  const refresh = () => {
    const el = st.el
    if (!el) return
    const r = computeRange(st.offsets, st.keys.length, viewTop(el) - st.margin, el.clientHeight, latest.current.overscan)
    if (sameRange(r, st.range)) return
    st.range = r
    setRange(r)
    latest.current.onRangeChange?.(r)
  }
  const scheduleRefresh = () => {
    if (st.raf) return
    st.raf = requestAnimationFrame(() => {
      st.raf = 0
      refresh()
      checkReach()
    })
  }

  /**
   * 加载更多: 在区域里且已就绪 (armed) 且上一次的 Promise 已结束才触发. 不在区域就重新就绪;
   * 在区域里触发过以后, 要等那一头真的多了条目 (条目 effect 里重新就绪) 才再触发, 加载到头自然停.
   */
  const fireReach = (r: Reach, inZone: boolean, cb: (() => void | Promise<unknown>) | undefined) => {
    if (!inZone) {
      r.armed = true
      return
    }
    if (!r.armed || r.busy || !cb) return
    r.armed = false
    const out = cb()
    if (!isThenable(out)) return
    r.busy = true
    const done = () => {
      r.busy = false
      scheduleRefresh()
    }
    out.then(done, done)
  }
  function checkReach() {
    const el = st.el
    if (!el || st.pending || !st.keys.length) return
    const L = latest.current
    const top = viewTop(el)
    fireReach(st.reachStart, top - st.margin <= L.startThreshold, L.onStartReached)
    fireReach(st.reachEnd, distanceToEnd(top, el.clientHeight, el.scrollHeight) <= L.endThreshold, L.onEndReached)
  }

  const finishPending = (ok: boolean) => {
    const p = st.pending
    if (!p) return
    st.pending = null
    if (p.raf) cancelAnimationFrame(p.raf)
    window.clearTimeout(st.settleTimer)
    captureState()
    p.resolve(ok)
  }
  const armSettle = () => {
    window.clearTimeout(st.settleTimer)
    st.settleTimer = window.setTimeout(() => {
      const p = st.pending
      if (!p) return
      const t = targetOf(p.target)
      if (t == null) return finishPending(false)
      if (p.raf) return armSettle()
      // 最后一次按真实高度校正; 若还要动, 等这次跳转带来的新测量再判一次
      if (st.el && Math.abs(viewTop(st.el) - t) > EPSILON) {
        setTop(t)
        armSettle()
        return
      }
      finishPending(true)
    }, SETTLE_MS)
  }

  /** 布局变了 (测量 / 条目 / 外框) 之后把视口放回该在的位置 */
  const correct = () => {
    const el = st.el
    if (!el) return
    const p = st.pending
    if (p) {
      const t = targetOf(p.target)
      if (t == null) return finishPending(false)
      // 平滑动画每帧都重新取目标, 这里不用管; 直接跳的立刻按新测量校正
      if (!p.raf && Math.abs(viewTop(el) - t) > EPSILON) setTop(t)
      armSettle()
      return
    }
    if (st.stick && latest.current.followOutput) return setTop(maxScroll(el))
    const a = st.anchor
    const i = a ? st.index.get(a.key) : undefined
    if (a && i != null) setTop(st.margin + st.offsets[i] + a.delta)
  }

  /** 把已挂载行的位置与 sizer 高度直接写进 DOM (不走 React), 再校正滚动 */
  const relayout = () => {
    rebuild()
    const n = st.keys.length
    if (sizerRef.current) sizerRef.current.style.height = `${st.offsets[n]}px`
    for (const [key, el] of st.rows) {
      const i = st.index.get(key)
      if (i != null) el.style.transform = translate(st.offsets[i])
    }
    syncMargin()
    correct()
    scheduleRefresh()
  }

  /** 用户滚动后记下锚点和是否在底部 */
  function captureState() {
    const el = st.el
    if (!el) return
    const L = latest.current
    const atBottom = distanceToEnd(viewTop(el), el.clientHeight, el.scrollHeight) <= L.followThreshold
    if (!st.pending) {
      st.anchor = anchorAt(st.offsets, st.keys, viewTop(el) - st.margin)
      st.stick = atBottom
    }
    if (atBottom !== st.atBottom) {
      st.atBottom = atBottom
      L.onAtBottomChange?.(atBottom)
    }
    if (atBottom && st.unseen) {
      st.unseen = 0
      L.onUnseenChange?.(0)
    }
  }

  const onScroll = () => {
    const el = st.el
    if (!el) return
    // 自己写 scrollTop 引起的事件不算用户滚动
    const mine = performance.now() - st.writeAt < SELF_SCROLL_MS && Math.abs(el.scrollTop - st.writeTop) < 1.5
    if (!mine && st.touching) st.touchScroll = true
    if (st.touchScroll) armIdle()
    captureState()
    refresh()
    if (st.pending) {
      armSettle()
      return
    }
    checkReach()
  }
  const onTouchStart = () => {
    st.touching = true
    window.clearTimeout(st.idleTimer)
  }
  const onTouchEnd = () => {
    st.touching = false
    // 没有惯性就不会再有滚动事件, 由空闲计时并回偏差; 有惯性则每个滚动事件都会推迟它
    armIdle()
  }
  const onScrollEnd = () => {
    if (!st.touching) flushShift()
  }

  const startScroll = (target: Target, behavior?: VirtualScrollBehavior): Promise<boolean> => {
    finishPending(false)
    const el = st.el
    if (!el) return Promise.resolve(false)
    // 主动定位: 先把还没并回的偏差落到 scrollTop 上, 之后都在真实位置上算
    st.touchScroll = false
    window.clearTimeout(st.idleTimer)
    if (Math.abs(st.dev) >= 1) setTop(viewTop(el))
    // auto 先定成 start / end: 动画途中视口在变, 不能每帧重新判断 "是否已可见"
    if (target.kind === "key" && target.align === "auto") {
      const i = st.index.get(target.key) ?? 0
      const args = [st.offsets, st.keys.length, i, el.clientHeight] as const
      const cur = viewTop(el) - st.margin
      const auto = alignTarget(...args, "auto", cur, st.gap)
      if (Math.abs(auto - cur) <= EPSILON) return Promise.resolve(true)
      target = { ...target, align: auto === alignTarget(...args, "start", cur, st.gap) ? "start" : "end" }
    }
    const t = targetOf(target)
    if (t == null) return Promise.resolve(false)
    let how = behavior ?? latest.current.scrollBehavior
    if (how === "smooth" && window.matchMedia(REDUCED_MOTION).matches) how = "auto"
    return new Promise<boolean>((resolve) => {
      const p: Pending = { target, behavior: how, resolve, raf: 0 }
      st.pending = p
      if (how === "smooth") animate(p, t)
      else setTop(t)
      refresh()
      armSettle()
    })
  }

  /**
   * 平滑滚动自己用 rAF 驱动 (不用原生 smooth): 每帧重新取目标位置, 沿途量出的真实高度随时并进来,
   * 不必反复重启原生动画 (重启会一直停在缓动的起步段, 越滚越慢). 距离很远时先瞬移到目标前 1.5 屏.
   */
  const animate = (p: Pending, first: number) => {
    const el = st.el
    if (!el) return
    const vh = Math.max(1, el.clientHeight)
    const dist = first - viewTop(el)
    if (Math.abs(dist) > vh * SMOOTH_FAR_VIEWPORTS) setTop(first - Math.sign(dist) * vh * SMOOTH_LEAD_VIEWPORTS)
    const from = viewTop(el)
    const duration = clamp((Math.abs(first - from) / vh) * SMOOTH_MS_PER_VIEWPORT, SMOOTH_MIN_MS, SMOOTH_MAX_MS)
    const t0 = performance.now()
    const step = (now: number) => {
      if (st.pending !== p) return
      const k = Math.min(1, (now - t0) / duration)
      const to = targetOf(p.target)
      if (to == null) return finishPending(false)
      setTop(from + (to - from) * easeOutCubic(k))
      p.raf = k < 1 ? requestAnimationFrame(step) : 0
      if (!p.raf) armSettle()
    }
    p.raf = requestAnimationFrame(step)
  }

  // 行登记: 观察尺寸, 记住元素以便直接改位置
  const register = React.useCallback(
    (key: VirtualKey, el: HTMLDivElement | null) => {
      const prev = st.rows.get(key)
      if (prev && prev !== el) {
        st.ro?.unobserve(prev)
        st.rows.delete(key)
      }
      if (el) {
        st.rows.set(key, el)
        st.elKey.set(el, key)
        st.ro?.observe(el)
      }
    },
    [st]
  )

  // ---- 挂载: 找滚动容器, 建观察器, 挂监听 ----
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const el: HTMLElement | null = self
      ? root
      : scrollParent === "scroll-area"
        ? root.closest<HTMLElement>(SCROLL_AREA_VIEWPORT)
        : typeof scrollParent === "object"
          ? scrollParent.current
          : null
    if (!el) {
      console.warn("[VirtualList] 没找到滚动容器, scrollParent =", scrollParent)
      return
    }
    st.el = el
    const prevAnchor = el.style.overflowAnchor
    el.style.overflowAnchor = "none"

    const rowsRo = new ResizeObserver((entries) => {
      let changed = false
      for (const e of entries) {
        const key = st.elKey.get(e.target)
        if (key == null || st.rows.get(key) !== e.target) continue
        const h = e.borderBoxSize?.[0]?.blockSize ?? (e.target as HTMLElement).offsetHeight
        if (Math.abs((st.sizes.get(key) ?? -1) - h) > 0.5) {
          st.sizes.set(key, h)
          changed = true
        }
      }
      if (changed) relayout()
    })
    st.ro = rowsRo
    for (const row of st.rows.values()) rowsRo.observe(row)

    let first = true
    const frameRo = new ResizeObserver(() => {
      // 首次回调只是登记, 挂载时已经处理过
      if (first) {
        first = false
        return
      }
      relayout()
    })
    frameRo.observe(el)
    if (headerRef.current) frameRo.observe(headerRef.current)
    if (footerRef.current) frameRo.observe(footerRef.current)

    // 外部容器: 容器里列表上下的其它内容变高变矮时, 贴底的最小高度与偏移要跟着重算
    if (!self) for (const child of Array.from(el.children)) frameRo.observe(child)

    const cancel = () => finishPending(false)
    el.addEventListener("scroll", onScroll, { passive: true })
    el.addEventListener("scrollend", onScrollEnd, { passive: true })
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchend", onTouchEnd, { passive: true })
    el.addEventListener("touchcancel", onTouchEnd, { passive: true })
    for (const type of USER_INPUTS) el.addEventListener(type, cancel, { passive: true })

    syncMargin()
    refresh()
    scheduleRefresh()
    return () => {
      el.removeEventListener("scroll", onScroll)
      el.removeEventListener("scrollend", onScrollEnd)
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchend", onTouchEnd)
      el.removeEventListener("touchcancel", onTouchEnd)
      for (const type of USER_INPUTS) el.removeEventListener(type, cancel)
      window.clearTimeout(st.idleTimer)
      st.touching = st.touchScroll = false
      setShift(0)
      const root = rootRef.current
      if (root) root.style.minHeight = ""
      rowsRo.disconnect()
      frameRo.disconnect()
      st.ro = null
      el.style.overflowAnchor = prevAnchor
      cancelAnimationFrame(st.raf)
      st.raf = 0
      finishPending(false)
      st.el = null
    }
    // 监听器只读 st / latest 这两个 ref, 只在滚动容器换了时重挂
  }, [self, scrollParent])

  // ---- 条目 / 间距 / 估算变化: 判断追加与前插, 跟随或保持锚点 ----
  React.useLayoutEffect(() => {
    st.items = draft.items
    st.keys = draft.keys
    st.index = draft.index
    st.offsets = draft.offsets
    st.estKey = estKey
    // 渲染到提交之间可能又量到了新高度, 按最新测量重算并把已挂载的行摆好
    rebuild()
    for (const [key, el] of st.rows) {
      const i = st.index.get(key)
      if (i != null) el.style.transform = translate(st.offsets[i])
    }
    const prev = st.prevKeys
    const next = st.keys
    st.prevKeys = next
    const change = prev === next ? null : diffEdges(prev, next)
    if (change?.replaced) {
      st.anchor = null
      st.unseen = 0
      st.reachStart.armed = st.reachEnd.armed = true
      if (latest.current.reverse) st.stick = true
      else {
        st.stick = false
        st.anchor = next.length ? { key: next[0], delta: -st.margin } : null
      }
    } else if (change) {
      if (change.prepended) st.reachStart.armed = true
      if (change.appended) {
        st.reachEnd.armed = true
        if (!(st.stick && latest.current.followOutput)) {
          st.unseen += change.appended
          latest.current.onUnseenChange?.(st.unseen)
        }
      }
    }
    const sizer = sizerRef.current
    if (sizer) sizer.style.height = `${st.offsets[next.length]}px`
    syncMargin()
    // 新消息跟随可以平滑; 首次挂载 / 整体替换总是直接到位
    if (change && !change.replaced && change.appended && st.stick && latest.current.followOutput && !st.pending && latest.current.scrollBehavior === "smooth") {
      void startScroll({ kind: "bottom" })
    } else correct()
    refresh()
    // 等这批新行量完再看要不要接着加载 (首页不满一屏, 或加载完仍在阈值内)
    scheduleRefresh()
  }, [draft, estKey])

  React.useLayoutEffect(() => {
    refresh()
  }, [overscan])

  // reverse 切换: 外部容器的贴底最小高度跟着加 / 撤
  React.useLayoutEffect(() => {
    if (st.el) relayout()
  }, [reverse])

  React.useImperativeHandle(
    ref,
    (): VirtualListHandle => ({
      scrollToIndex: (index, o) => {
        const key = st.keys[clamp(Math.round(index), 0, st.keys.length - 1)]
        return key == null ? Promise.resolve(false) : startScroll({ kind: "key", key, align: o?.align ?? "auto" }, o?.behavior)
      },
      scrollToKey: (key, o) => (st.index.has(key) ? startScroll({ kind: "key", key, align: o?.align ?? "auto" }, o?.behavior) : Promise.resolve(false)),
      scrollToBottom: (o) => {
        st.stick = true
        return startScroll({ kind: "bottom" }, o?.behavior)
      },
      scrollToTop: (o) => startScroll({ kind: "top" }, o?.behavior),
      getScrollElement: () => st.el,
      isAtBottom: () => st.atBottom,
      getUnseen: () => st.unseen,
      getRange: () => st.range,
      measure: () => {
        st.sizes.clear()
        for (const [key, el] of st.rows) st.sizes.set(key, el.offsetHeight)
        relayout()
      },
    }),
    [st]
  )

  // ---- 渲染 ----
  const rows: React.ReactNode[] = []
  const end = Math.min(range.end, count)
  for (let i = Math.min(range.start, end); i < end; i++) {
    const key = keys[i]
    rows.push(
      <Row
        key={key}
        item={items[i]}
        index={i}
        rowKey={key}
        y={offsets[i]}
        renderItem={renderItem}
        register={register}
        className={itemClassName}
        role={itemRole}
      />
    )
  }

  const body = (
    <>
      {header != null && (
        <div ref={headerRef} data-slot="virtual-list-header" className="shrink-0">
          {header}
        </div>
      )}
      {count === 0 && empty != null ? (
        <div data-slot="virtual-list-empty" className="grid flex-1 place-items-center py-8 text-sm text-muted-foreground">
          {empty}
        </div>
      ) : null}
      <div ref={sizerRef} data-slot="virtual-list-sizer" className="relative w-full shrink-0" style={{ height: total }}>
        {rows}
      </div>
      {footer != null && (
        <div ref={footerRef} data-slot="virtual-list-footer" className="shrink-0">
          {footer}
        </div>
      )}
    </>
  )

  return (
    <div
      ref={rootRef}
      data-slot="virtual-list"
      data-reverse={reverse ? "" : undefined}
      data-scroll-parent={self ? undefined : "external"}
      className={cn(
        // scrollbar-gutter: 内容从不满一屏变成可滚动时, 宽度不跳 (自定义细滚动条也预留位置)
        self && "relative overflow-y-auto overscroll-contain [scrollbar-gutter:stable]",
        !self && reverse && "flex flex-col justify-end",
        className
      )}
      style={style}
      {...props}
    >
      {self ? (
        <div ref={contentRef} data-slot="virtual-list-content" className={cn("flex min-h-full flex-col", reverse && "justify-end")}>
          {body}
        </div>
      ) : (
        body
      )}
    </div>
  )
}

export { VirtualList }
