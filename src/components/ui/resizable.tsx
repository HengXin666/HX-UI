"use client"

/**
 * 可拖宽分栏: 三栏布局 (列表 / 会话 / 检查栏) 拖动改宽, 可折叠, 记住宽度. 水平与竖直, 可嵌套.
 *
 *   <ResizablePanelGroup direction="horizontal" autoSaveId="aioa-main">
 *     <ResizablePanel defaultSize={24} minSize="220px" collapsible>列表</ResizablePanel>
 *     <ResizableHandle />
 *     <ResizablePanel minSize="360px">会话</ResizablePanel>
 *     <ResizableHandle withHandle />
 *     <ResizablePanel defaultSize={26} minSize="240px" maxSize="40%" collapsible>检查栏</ResizablePanel>
 *   </ResizablePanelGroup>
 *
 * 零依赖. 布局是一组百分比 (和为 100), 每个面板 flex: <百分比> 1 0px; 约束可写百分比或 "240px"
 * (按组的像素长度换算, 组随窗口变化时重新换算并夹回约束). 计算都在 resizable-model.ts.
 * 拖动: 把手 pointer capture (指针移出把手 / 进 iframe 也不丢), 指针移动只记坐标, 每帧 rAF 算一次,
 * 直接写面板的 style.flexGrow 与把手的 aria-valuenow, 不触发 React 渲染, 面板里的子树完全不重渲染;
 * 松手才提交 (onLayout, 持久化). 级联推挤 (像 VS Code): 被压的一侧由近到远依次压到最小值, 再由近到远
 * 吸附折叠可折叠的面板; 变大的一侧由近到远加到最大值. 每帧都从按下时的快照算, 拖回去原样恢复.
 * 折叠: collapsible 的面板被压到最小值以下过半就吸附到 collapsedSize (默认 0), 不到一半弹回最小值;
 * 双击把手把两侧复位到 defaultSize. 面板的 panelRef 句柄可 collapse / expand (回到折叠前的大小) / resize.
 * 键盘 (WAI-ARIA window splitter): 把手是 role="separator", 可 Tab 聚焦, aria-valuenow 是前一个面板的百分比;
 * 方向键按 keyboardStep 调整 (Shift 加大, 不会因此折叠), Home / End 到最小 (可折叠则折叠) / 最大, Enter 折叠 / 展开.
 *
 * 折叠 / 展开 / 复位的过渡动画 (animation, 默认 200ms): 这里是本库里少数允许 "布局动画" 的地方, 原因是
 * 面板尺寸只能用布局表达 —— 内容要在新宽度下重新换行排版, transform: scale 会把文字压扁, 用 clip / translate
 * 假装也会让两侧内容在动画结束时跳一下. 为把代价压到最低: 由一个 rAF 驱动, 每帧只给每个面板写 style.flexGrow
 * 这一个属性 (不经过 React, 面板子树不重渲染, 不读布局, 没有读写交错); 拖动时不加动画 (跟手优先);
 * 系统开了减弱动效或 animation={false} 时直接到位. 动画中组上有 data-animating, 可用来暂停重内容.
 * onCollapse / onExpand 与 data-collapsed 在动画开始时就按目标状态切换 (按钮图标不必等动画结束).
 *
 * 持久化: autoSaveId 存 localStorage (挂载时在绘制前恢复, 不闪; autoSaveId 换了会重新读取, 没存过就回到默认;
 * 其它标签页改了同一个键也会同步过来); 或受控 layout + onLayout 自己存. 受控时严格受控: 提交后父组件没有
 * 把新布局写回 layout (拒绝了这次修改), 就回弹到 layout.
 * 外观: 1px 分隔线 (border 色), 热区比线宽 (默认 8px, 触屏 16px), 悬停稍等 150ms 后变品牌色并淡入一圈柔光,
 * 拖动中保持高亮; withHandle 显示小握把. 只做颜色与透明度过渡, 减弱动效时直接切换.
 */

import * as React from "react"
import { GripHorizontalIcon, GripVerticalIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fitSize,
  initialLayout,
  isCollapsed,
  normalizeLayout,
  resizeAt,
  resolveConstraints,
  sameLayout,
  setPanelSize,
  type PanelConstraint,
  type PanelSize,
  type PanelSpec,
} from "@/components/ui/resizable-model"

export type { PanelSize, PanelSpec, PanelConstraint, ResizeOptions } from "@/components/ui/resizable-model"
export { initialLayout, normalizeLayout, resizeAt, resizePair, resolveConstraints } from "@/components/ui/resizable-model"

export type ResizableDirection = "horizontal" | "vertical"

/** 持久化存储, 默认 localStorage; 可换 sessionStorage 或自己的实现 */
export interface ResizableStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export interface ResizablePanelGroupHandle {
  /** 当前布局 (百分比) */
  getLayout: () => number[]
  /** 设置布局 (会规范化到约束内) 并提交; 默认带过渡动画, animate=false 直接到位 */
  setLayout: (sizes: readonly number[], animate?: boolean) => void
  /** 全部复位到 defaultSize (带过渡动画) */
  reset: () => void
}

export interface ResizablePanelHandle {
  collapse: () => void
  /** 展开到折叠前的大小 (没有就用 defaultSize, 再没有就最小值) */
  expand: () => void
  /** 折叠与展开切换 */
  toggle: () => void
  resize: (size: PanelSize) => void
  /** 当前大小 (%) */
  getSize: () => number
  isCollapsed: () => boolean
}

export interface ResizablePanelGroupProps extends React.ComponentProps<"div"> {
  /** 排列方向, 默认 horizontal (左右分栏) */
  direction?: ResizableDirection
  /** 设了就把布局存进 storage (键 hx-resizable:<id>), 挂载时恢复; 换了 id 会重新读取 */
  autoSaveId?: string
  storage?: ResizableStorage
  /** 受控布局 (百分比数组); 变化时应用到面板. 严格受控: 提交后没被写回就回弹 */
  layout?: readonly number[]
  /** 折叠 / 展开 / 复位 / 回弹的过渡: true (默认 200ms), 毫秒数, 或 false 关闭. 拖动与方向键不加动画 */
  animation?: boolean | number
  /** 布局提交 (拖动松手, 键盘, 折叠 / 展开, 双击复位) 时调用 */
  onLayout?: (sizes: number[]) => void
  /** 方向键每次调整的百分比, 默认 2; 按住 Shift 为 5 倍 */
  keyboardStep?: number
  groupRef?: React.Ref<ResizablePanelGroupHandle>
}

export interface ResizablePanelProps extends React.ComponentProps<"div"> {
  /** 初始大小; 数字为百分比, 也可写 "320px". 不写则平分剩余 */
  defaultSize?: PanelSize
  minSize?: PanelSize
  maxSize?: PanelSize
  /** 可折叠: 拖到最小值以下过半吸附到 collapsedSize */
  collapsible?: boolean
  /** 折叠后的大小, 默认 0 */
  collapsedSize?: PanelSize
  onCollapse?: () => void
  onExpand?: () => void
  /** 大小变化 (拖动中每帧, 有变化才调) */
  onResize?: (size: number) => void
  panelRef?: React.Ref<ResizablePanelHandle>
}

export interface ResizableHandleProps extends React.ComponentProps<"div"> {
  /** 显示小握把 */
  withHandle?: boolean
  disabled?: boolean
  /** 指针热区宽度 px (线始终 1px), 默认 8; 触屏至少 16 */
  hitArea?: number
}

const STORAGE_PREFIX = "hx-resizable:"
const DEFAULT_STEP = 2
const SHIFT_FACTOR = 5
const DEFAULT_HIT = 8
const ATTR_COLLAPSED = "data-collapsed"
const ATTR_DRAGGING = "data-dragging"
const ATTR_RESIZING = "data-resizing"
const ATTR_ANIMATING = "data-animating"
const DEFAULT_ANIMATION_MS = 200
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"
/** 减速曲线 (与 ease-out 相近): 起步快, 收尾柔 */
const easeOutCubic = (k: number) => 1 - (1 - k) ** 3
const animationMs = (a: boolean | number | undefined) => (a === false ? 0 : a === true || a == null ? DEFAULT_ANIMATION_MS : Math.max(0, a))

interface PanelEntry {
  id: string
  el: HTMLDivElement
  spec: React.RefObject<ResizablePanelProps>
}

interface GroupApi {
  direction: ResizableDirection
  registerPanel: (entry: PanelEntry) => () => void
  registerHandle: (el: HTMLDivElement) => () => void
  sizeOf: (id: string) => number | undefined
  panelApi: (id: string) => ResizablePanelHandle
  beginDrag: (handle: HTMLDivElement, e: React.PointerEvent<HTMLDivElement>) => void
  keyDown: (handle: HTMLDivElement, e: React.KeyboardEvent<HTMLDivElement>) => void
  resetPair: (handle: HTMLDivElement) => void
  ariaFor: (handle: HTMLDivElement) => { now?: number; min?: number; max?: number; controls?: string }
}

const GroupContext = React.createContext<GroupApi | null>(null)

function useGroup(part: string): GroupApi {
  const ctx = React.useContext(GroupContext)
  if (!ctx) throw new Error(`${part} 必须放在 ResizablePanelGroup 里`)
  return ctx
}

const precedes = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
const round1 = (v: number) => Math.round(v * 10) / 10

function readStorage(storage: ResizableStorage | undefined, id: string): number[] | null {
  try {
    const raw = (storage ?? window.localStorage).getItem(STORAGE_PREFIX + id)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) && parsed.every((v) => typeof v === "number" && Number.isFinite(v)) ? (parsed as number[]) : null
  } catch {
    return null
  }
}

function writeStorage(storage: ResizableStorage | undefined, id: string, sizes: readonly number[]) {
  try {
    ;(storage ?? window.localStorage).setItem(STORAGE_PREFIX + id, JSON.stringify(sizes.map(round1)))
  } catch {
    // 隐私模式 / 配额满: 不持久化, 不影响使用
  }
}

function ResizablePanelGroup({
  direction = "horizontal",
  autoSaveId,
  storage,
  layout,
  onLayout,
  keyboardStep = DEFAULT_STEP,
  animation = true,
  groupRef,
  className,
  children,
  ...props
}: ResizablePanelGroupProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const latest = React.useRef({ direction, autoSaveId, storage, onLayout, keyboardStep, layout, animation })
  latest.current = { direction, autoSaveId, storage, onLayout, keyboardStep, layout, animation }

  const st = React.useRef({
    ready: false,
    panels: [] as PanelEntry[],
    handles: new Set<HTMLDivElement>(),
    sizes: [] as number[],
    cons: [] as PanelConstraint[],
    px: 0,
    collapsed: new Map<string, boolean>(),
    reported: new Map<string, number>(),
    lastOpen: new Map<string, number>(),
    drag: null as null | { handle: HTMLDivElement; a: number; start: number[]; origin: number; pos: number; raf: number; pointer: number },
    /** 进行中的过渡动画: 从 from 到 to; raf 为 0 表示没在动 */
    anim: null as null | { from: number[]; to: number[]; t0: number; ms: number; raf: number; commit: boolean },
    /** 受控回弹检查的 rAF */
    bounce: 0,
  }).current

  // ---- 布局计算与应用 ----
  const measure = () => {
    const el = rootRef.current
    if (!el) return 0
    const r = el.getBoundingClientRect()
    return latest.current.direction === "horizontal" ? r.width : r.height
  }
  const specs = (): PanelSpec[] => st.panels.map((p) => p.spec.current)
  const resolve = () => {
    st.cons = resolveConstraints(specs(), st.px)
    return st.cons
  }

  const pairOf = (handle: HTMLDivElement): number => {
    let a = -1
    st.panels.forEach((p, i) => {
      if (precedes(p.el, handle)) a = i
    })
    return a >= 0 && a + 1 < st.panels.length ? a : -1
  }

  const updateHandle = (h: HTMLDivElement) => {
    const aria = api.current?.ariaFor(h) ?? {}
    if (aria.now == null) return
    h.setAttribute("aria-valuenow", String(aria.now))
    h.setAttribute("aria-valuemin", String(aria.min))
    h.setAttribute("aria-valuemax", String(aria.max))
  }

  /**
   * 把布局写进 DOM; commit 时通知 onLayout 并持久化.
   * goal 是动画的终点: 折叠状态 (data-collapsed, onCollapse / onExpand) 按终点判断, 动画一开始就切换.
   */
  const apply = (sizes: number[], commit: boolean, goal: readonly number[] = sizes) => {
    st.sizes = sizes
    st.panels.forEach((p, i) => {
      const size = sizes[i] ?? 0
      p.el.style.flexGrow = String(size)
      const c = st.cons[i]
      const collapsed = c ? isCollapsed(goal[i] ?? size, c) : false
      if (collapsed) p.el.setAttribute(ATTR_COLLAPSED, "")
      else p.el.removeAttribute(ATTR_COLLAPSED)
      // 只记 "真正展开" 的大小 (动画途中小于最小值的过渡帧不算), expand() 回到它
      if (!collapsed && c && size >= c.min - 0.01) st.lastOpen.set(p.id, size)
      const was = st.collapsed.get(p.id)
      st.collapsed.set(p.id, collapsed)
      if (was !== undefined && was !== collapsed) (collapsed ? p.spec.current.onCollapse : p.spec.current.onExpand)?.()
      if (st.reported.get(p.id) !== size) {
        st.reported.set(p.id, size)
        p.spec.current.onResize?.(size)
      }
    })
    for (const h of st.handles) updateHandle(h)
    if (commit) {
      const out = sizes.slice()
      latest.current.onLayout?.(out)
      if (latest.current.autoSaveId) writeStorage(latest.current.storage, latest.current.autoSaveId, out)
      if (latest.current.layout) scheduleBounce()
    }
  }

  /**
   * 严格受控: 提交后等父组件这一轮渲染 (onLayout 里的 setState 会在下一帧前提交) 结束,
   * layout 仍不是刚提交的布局, 说明父组件拒绝了这次修改, 回弹到 layout.
   */
  const scheduleBounce = () => {
    cancelAnimationFrame(st.bounce)
    st.bounce = requestAnimationFrame(() => {
      st.bounce = 0
      const want = latest.current.layout
      if (!want || st.drag || !st.ready) return
      const target = normalizeLayout(want, resolve())
      if (!sameLayout(target, goal())) animateTo(target, false)
    })
  }

  /** 布局的去向: 动画中是终点, 否则是当前布局. 折叠 / 展开等决策都基于它, 连点按钮不会算错 */
  const goal = () => st.anim?.to ?? st.sizes

  const stopAnim = () => {
    const a = st.anim
    if (!a) return
    cancelAnimationFrame(a.raf)
    st.anim = null
    rootRef.current?.removeAttribute(ATTR_ANIMATING)
  }

  /**
   * 过渡到 next. 布局动画 (只能如此: 面板尺寸只能用布局表达), 但只由 rAF 每帧写各面板的 flexGrow 一个属性,
   * 不经过 React, 不读布局; 减弱动效 / animation 关闭 / 组不可见时直接到位. commit 在终点提交一次.
   */
  const animateTo = (next: number[], commit: boolean) => {
    const from = st.sizes.slice()
    stopAnim()
    if (sameLayout(next, from)) {
      if (commit && !sameLayout(next, st.sizes)) apply(next, true)
      return
    }
    const ms = animationMs(latest.current.animation)
    const reduced = typeof window !== "undefined" && window.matchMedia?.(REDUCED_MOTION).matches
    if (!ms || reduced || from.length !== next.length || st.px <= 0) {
      apply(next, commit)
      return
    }
    const anim = { from, to: next, t0: performance.now(), ms, raf: 0, commit }
    st.anim = anim
    rootRef.current?.setAttribute(ATTR_ANIMATING, "")
    const step = (now: number) => {
      if (st.anim !== anim) return
      const k = Math.min(1, (now - anim.t0) / anim.ms)
      if (k >= 1) {
        stopAnim()
        apply(anim.to, anim.commit)
        return
      }
      const e = easeOutCubic(k)
      apply(
        anim.from.map((v, i) => v + (anim.to[i] - v) * e),
        false,
        anim.to
      )
      anim.raf = requestAnimationFrame(step)
    }
    // 第一帧立刻按终点切换折叠状态 (回调 / data-collapsed), 尺寸从下一帧开始动
    apply(from, false, next)
    anim.raf = requestAnimationFrame(step)
  }

  /** 面板增减 / 首次挂载 / 组尺寸变化时重算 */
  const relayout = (source: readonly number[] | null) => {
    // 组尺寸 / 面板增减打断动画: 直接落到动画终点
    const current = goal()
    stopAnim()
    st.px = measure()
    const cons = resolve()
    let base: number[]
    if (source && source.length === cons.length) base = normalizeLayout(source, cons)
    else {
      // 按 id 保留已有面板的大小, 新面板用 defaultSize
      const fresh = initialLayout(cons)
      const prevIds = new Map(st.panels.map((p, i) => [p.id, i]))
      base = normalizeLayout(
        st.panels.map((p, i) => {
          const at = prevIds.get(p.id)
          const prior = current.length === cons.length && at != null ? current[at] : undefined
          return prior ?? fresh[i]
        }),
        cons
      )
    }
    apply(base, false)
  }

  /** 提交一个新布局: animate 时过渡过去 (终点提交), 否则立刻 */
  const commitIfChanged = (next: number[], animate = false) => {
    if (sameLayout(next, goal())) return
    if (animate) animateTo(next, true)
    else {
      stopAnim()
      apply(next, true)
    }
  }

  const panelIndex = (id: string) => st.panels.findIndex((p) => p.id === id)

  const api = React.useRef<GroupApi | null>(null)
  if (!api.current) api.current = {
    direction,
    registerPanel(entry) {
      st.panels = [...st.panels.filter((p) => p.id !== entry.id), entry].sort((x, y) => (precedes(x.el, y.el) ? -1 : 1))
      if (st.ready) relayout(null)
      return () => {
        const at = panelIndex(entry.id)
        if (at < 0) return
        const sizes = st.sizes.filter((_, i) => i !== at)
        st.panels = st.panels.filter((p) => p.id !== entry.id)
        st.collapsed.delete(entry.id)
        st.reported.delete(entry.id)
        if (st.ready && st.panels.length) {
          const cons = resolve()
          apply(normalizeLayout(sizes, cons), false)
        } else st.sizes = sizes
      }
    },
    registerHandle(el) {
      st.handles.add(el)
      if (st.ready) updateHandle(el)
      return () => {
        st.handles.delete(el)
      }
    },
    sizeOf(id) {
      const i = panelIndex(id)
      return i >= 0 ? st.sizes[i] : undefined
    },
    panelApi(id) {
      const target = (size: number) => {
        const i = panelIndex(id)
        if (i < 0) return
        commitIfChanged(setPanelSize(goal(), st.cons, i, size), true)
      }
      const self: ResizablePanelHandle = {
        collapse() {
          const c = st.cons[panelIndex(id)]
          if (c?.collapsible) target(c.collapsedSize)
        },
        expand() {
          const i = panelIndex(id)
          const c = st.cons[i]
          if (!c || !isCollapsed(goal()[i], c)) return
          const size = Math.max(c.min, st.lastOpen.get(id) ?? c.defaultSize ?? c.min)
          const next = setPanelSize(goal(), st.cons, i, size)
          if (!isCollapsed(next[i], c)) return commitIfChanged(next, true)
          // 约束放不下 (组比各栏最小值之和还窄): 交给规范化按最小值比例分, 保证能展开
          const base = goal().slice()
          base[i] = size
          commitIfChanged(normalizeLayout(base, st.cons), true)
        },
        toggle() {
          if (self.isCollapsed()) self.expand()
          else self.collapse()
        },
        resize(size) {
          const i = panelIndex(id)
          const pct = resolveConstraints([{ defaultSize: size }], st.px)[0].defaultSize
          if (i >= 0 && pct != null) target(pct)
        },
        getSize: () => st.sizes[panelIndex(id)] ?? 0,
        isCollapsed() {
          const i = panelIndex(id)
          return i >= 0 && Boolean(st.cons[i]) && isCollapsed(goal()[i], st.cons[i])
        },
      }
      return self
    },
    beginDrag(handle, e) {
      const a = pairOf(handle)
      if (a < 0 || e.button !== 0) return
      e.preventDefault()
      handle.setPointerCapture(e.pointerId)
      handle.focus({ preventScroll: true })
      // 拖动跟手优先: 打断进行中的动画, 从当前帧的尺寸接着拖
      stopAnim()
      st.px = measure()
      resolve()
      const pos = latest.current.direction === "horizontal" ? e.clientX : e.clientY
      st.drag = { handle, a, start: st.sizes.slice(), origin: pos, pos, raf: 0, pointer: e.pointerId }
      handle.setAttribute(ATTR_DRAGGING, "")
      rootRef.current?.setAttribute(ATTR_RESIZING, "")

      const frame = () => {
        const d = st.drag
        if (!d) return
        d.raf = 0
        const delta = st.px > 0 ? ((d.pos - d.origin) / st.px) * 100 : 0
        const next = resizeAt(d.start, st.cons, d.a, delta)
        if (!sameLayout(next, st.sizes)) apply(next, false)
      }
      const move = (ev: PointerEvent) => {
        const d = st.drag
        if (!d || ev.pointerId !== d.pointer) return
        d.pos = latest.current.direction === "horizontal" ? ev.clientX : ev.clientY
        if (!d.raf) d.raf = requestAnimationFrame(frame)
      }
      const end = () => {
        const d = st.drag
        if (!d) return
        if (d.raf) {
          cancelAnimationFrame(d.raf)
          frame()
        }
        st.drag = null
        handle.removeEventListener("pointermove", move)
        handle.removeEventListener("pointerup", end)
        handle.removeEventListener("pointercancel", end)
        handle.removeEventListener("lostpointercapture", end)
        handle.removeAttribute(ATTR_DRAGGING)
        rootRef.current?.removeAttribute(ATTR_RESIZING)
        if (!sameLayout(d.start, st.sizes)) apply(st.sizes, true)
      }
      handle.addEventListener("pointermove", move)
      handle.addEventListener("pointerup", end)
      handle.addEventListener("pointercancel", end)
      handle.addEventListener("lostpointercapture", end)
    },
    keyDown(handle, e) {
      const a = pairOf(handle)
      if (a < 0) return
      st.px = measure()
      const cons = resolve()
      const sizes = goal()
      const horizontal = latest.current.direction === "horizontal"
      const step = latest.current.keyboardStep * (e.shiftKey ? SHIFT_FACTOR : 1)
      const less = horizontal ? "ArrowLeft" : "ArrowUp"
      const more = horizontal ? "ArrowRight" : "ArrowDown"
      let next: number[] | null = null
      if (e.key === less || e.key === more) {
        const delta = e.key === more ? step : -step
        const ca = cons[a]
        const cur = sizes[a]
        // 方向键不越过最小值去折叠 (那是 Enter / Home 的事); 已折叠时按 "变大" 直接展开到最小值
        if (isCollapsed(cur, ca) && delta > 0) next = setPanelSize(sizes, cons, a, ca.min)
        else {
          const target = ca.collapsible ? Math.max(ca.min, cur + delta) : cur + delta
          next = resizeAt(sizes, cons, a, target - cur, { collapse: false })
        }
        e.preventDefault()
        if (next) commitIfChanged(next)
        return
      } else if (e.key === "Home") {
        const ca = cons[a]
        next = resizeAt(sizes, cons, a, (ca.collapsible ? ca.collapsedSize : ca.min) - sizes[a])
      } else if (e.key === "End") next = resizeAt(sizes, cons, a, cons[a].max - sizes[a])
      else if (e.key === "Enter") {
        const ids = [st.panels[a].id, st.panels[a + 1].id]
        const id = cons[a].collapsible ? ids[0] : cons[a + 1].collapsible ? ids[1] : null
        if (id) {
          e.preventDefault()
          api.current?.panelApi(id).toggle()
        }
        return
      } else return
      e.preventDefault()
      if (next) commitIfChanged(next, true)
    },
    resetPair(handle) {
      const a = pairOf(handle)
      if (a < 0) return
      st.px = measure()
      const cons = resolve()
      const sizes = goal()
      const total = sizes[a] + sizes[a + 1]
      const da = cons[a].defaultSize
      const db = cons[a + 1].defaultSize
      const target = da != null ? da : db != null ? total - db : total / 2
      commitIfChanged(resizeAt(sizes, cons, a, fitSize(target, cons[a]) - sizes[a]), true)
    },
    ariaFor(handle) {
      const a = pairOf(handle)
      if (a < 0 || !st.cons[a]) return {}
      const c = st.cons[a]
      return {
        now: Math.round(st.sizes[a] ?? 0),
        min: Math.round(c.collapsible ? c.collapsedSize : c.min),
        max: Math.round(c.max),
        controls: st.panels[a].el.id || undefined,
      }
    },
  }
  const base = api.current
  // 方向变了要让把手重渲染 (换 aria-orientation 与光标), 所以 context 值随方向换; 方法本身不变
  const ctx = React.useMemo<GroupApi>(() => ({ ...base, direction }), [base, direction])

  // 首次: 子面板已在各自的 layout effect 里登记, 这里在绘制前算出布局 (受控 > 存储 > 默认)
  React.useLayoutEffect(() => {
    st.ready = true
    const saved = layout ?? (autoSaveId ? readStorage(storage, autoSaveId) : null)
    relayout(saved)
    const el = rootRef.current
    if (!el) return
    let first = true
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false
        return
      }
      const px = measure()
      if (Math.abs(px - st.px) < 0.5) return
      relayout(goal())
    })
    ro.observe(el)
    // 其它标签页改了同一个键: 同步过来 (只在非受控, 且没在拖动时)
    const onStorage = (e: StorageEvent) => {
      const L = latest.current
      if (!L.autoSaveId || L.layout || st.drag || e.key !== STORAGE_PREFIX + L.autoSaveId) return
      const saved = readStorage(L.storage, L.autoSaveId)
      if (saved && saved.length === st.panels.length) animateTo(normalizeLayout(saved, resolve()), false)
    }
    window.addEventListener("storage", onStorage)
    return () => {
      ro.disconnect()
      window.removeEventListener("storage", onStorage)
      stopAnim()
      cancelAnimationFrame(st.bounce)
      if (st.drag?.raf) cancelAnimationFrame(st.drag.raf)
      st.ready = false
    }
    // 挂载时读一次; autoSaveId 变化与受控 layout 由下面的 effect 处理
  }, [])

  // autoSaveId 换了: 读新键 (受控时以 layout 为准); 没存过就回到默认布局. storage 走 latest, 不因内联对象每次渲染重读
  const savedId = React.useRef(autoSaveId)
  React.useLayoutEffect(() => {
    if (savedId.current === autoSaveId) return
    savedId.current = autoSaveId
    if (!st.ready || layout) return
    stopAnim()
    st.px = measure()
    const cons = resolve()
    const saved = autoSaveId ? readStorage(storage, autoSaveId) : null
    apply(saved && saved.length === cons.length ? normalizeLayout(saved, cons) : initialLayout(cons), false)
  }, [autoSaveId])

  // 受控布局: 父组件给了新值就应用 (父组件主动改的, 例如 "恢复默认" 按钮, 带过渡)
  React.useLayoutEffect(() => {
    if (!layout || !st.ready) return
    const next = normalizeLayout(layout, resolve())
    if (sameLayout(next, goal())) return
    if (st.drag) return
    animateTo(next, false)
  }, [layout])

  // 方向变化: 重新换算像素约束
  React.useLayoutEffect(() => {
    if (st.ready) relayout(goal())
  }, [direction])

  React.useImperativeHandle(
    groupRef,
    (): ResizablePanelGroupHandle => ({
      getLayout: () => st.sizes.slice(),
      setLayout: (sizes, animate = true) => {
        resolve()
        commitIfChanged(normalizeLayout(sizes, st.cons), animate)
      },
      reset: () => {
        st.px = measure()
        commitIfChanged(initialLayout(resolve()), true)
      },
    }),
    [st]
  )

  return (
    <GroupContext.Provider value={ctx}>
      <div
        ref={rootRef}
        data-slot="resizable-panel-group"
        data-direction={direction}
        className={cn(
          "flex size-full min-h-0 min-w-0 overflow-hidden data-[direction=vertical]:flex-col",
          "data-resizing:select-none data-[direction=horizontal]:data-resizing:cursor-col-resize data-[direction=vertical]:data-resizing:cursor-row-resize",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </GroupContext.Provider>
  )
}

function ResizablePanel({
  id: idProp,
  defaultSize,
  minSize,
  maxSize,
  collapsible,
  collapsedSize,
  onCollapse,
  onExpand,
  onResize,
  panelRef,
  className,
  style,
  ref,
  ...props
}: ResizablePanelProps) {
  const group = useGroup("ResizablePanel")
  const autoId = React.useId()
  const id = idProp ?? autoId
  const elRef = React.useRef<HTMLDivElement>(null)
  const spec = React.useRef<ResizablePanelProps>({})
  spec.current = { defaultSize, minSize, maxSize, collapsible, collapsedSize, onCollapse, onExpand, onResize }
  const { registerPanel } = group

  React.useLayoutEffect(() => {
    const el = elRef.current
    if (!el) return
    return registerPanel({ id, el, spec })
  }, [registerPanel, id])

  React.useImperativeHandle(panelRef, () => group.panelApi(id), [group, id])

  const setRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      elRef.current = el
      if (typeof ref === "function") return ref(el)
      if (ref) ref.current = el
    },
    [ref]
  )

  // 渲染时读组里的当前大小 (拖动中由组直接写 style, 这里只保证重渲染时值一致)
  const size = group.sizeOf(id) ?? (typeof defaultSize === "number" ? defaultSize : 1)
  return (
    <div
      ref={setRef}
      id={id}
      data-slot="resizable-panel"
      className={cn("relative min-h-0 min-w-0 overflow-hidden", className)}
      style={{ flexGrow: size, flexShrink: 1, flexBasis: 0, ...style }}
      {...props}
    />
  )
}

function ResizableHandle({ withHandle = false, disabled = false, hitArea = DEFAULT_HIT, className, style, onPointerDown, onKeyDown, onDoubleClick, ref, ...props }: ResizableHandleProps) {
  const group = useGroup("ResizableHandle")
  const elRef = React.useRef<HTMLDivElement>(null)
  const { registerHandle } = group
  // 分栏左右排时把手是竖线
  const orientation = group.direction === "horizontal" ? "vertical" : "horizontal"

  React.useLayoutEffect(() => {
    const el = elRef.current
    if (!el) return
    return registerHandle(el)
  }, [registerHandle])

  const setRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      elRef.current = el
      if (typeof ref === "function") return ref(el)
      if (ref) ref.current = el
    },
    [ref]
  )

  const aria = elRef.current ? group.ariaFor(elRef.current) : {}
  return (
    <div
      ref={setRef}
      role="separator"
      aria-orientation={orientation}
      aria-valuenow={aria.now}
      aria-valuemin={aria.min}
      aria-valuemax={aria.max}
      aria-controls={aria.controls}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      data-slot="resizable-handle"
      data-orientation={orientation}
      data-disabled={disabled ? "" : undefined}
      onPointerDown={(e) => {
        onPointerDown?.(e)
        if (!disabled && !e.defaultPrevented) group.beginDrag(e.currentTarget, e)
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (!disabled && !e.defaultPrevented) group.keyDown(e.currentTarget, e)
      }}
      onDoubleClick={(e) => {
        onDoubleClick?.(e)
        if (!disabled && !e.defaultPrevented) group.resetPair(e.currentTarget)
      }}
      className={cn(
        "group/handle relative z-10 flex shrink-0 touch-none items-center justify-center bg-border outline-none select-none",
        "transition-colors duration-150 motion-reduce:transition-none",
        // 1px 线; 热区与柔光用伪元素, 不占布局
        "data-[orientation=vertical]:w-px data-[orientation=vertical]:cursor-col-resize",
        "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=horizontal]:cursor-row-resize",
        "after:absolute after:content-['']",
        "data-[orientation=vertical]:after:inset-y-0 data-[orientation=vertical]:after:left-1/2 data-[orientation=vertical]:after:w-(--resizable-hit) data-[orientation=vertical]:after:-translate-x-1/2",
        "data-[orientation=horizontal]:after:inset-x-0 data-[orientation=horizontal]:after:top-1/2 data-[orientation=horizontal]:after:h-(--resizable-hit) data-[orientation=horizontal]:after:-translate-y-1/2",
        "pointer-coarse:data-[orientation=vertical]:after:w-[max(16px,var(--resizable-hit))] pointer-coarse:data-[orientation=horizontal]:after:h-[max(16px,var(--resizable-hit))]",
        "before:pointer-events-none before:absolute before:bg-brand/20 before:opacity-0 before:content-[''] before:transition-opacity before:duration-150 motion-reduce:before:transition-none",
        "data-[orientation=vertical]:before:inset-y-0 data-[orientation=vertical]:before:left-1/2 data-[orientation=vertical]:before:w-[5px] data-[orientation=vertical]:before:-translate-x-1/2",
        "data-[orientation=horizontal]:before:inset-x-0 data-[orientation=horizontal]:before:top-1/2 data-[orientation=horizontal]:before:h-[5px] data-[orientation=horizontal]:before:-translate-y-1/2",
        // 悬停稍等再亮 (划过不闪), 拖动 / 键盘聚焦立即亮
        "not-data-disabled:hover:bg-brand not-data-disabled:hover:delay-150 not-data-disabled:hover:before:opacity-100 not-data-disabled:hover:before:delay-150",
        "data-dragging:bg-brand data-dragging:before:opacity-100 focus-visible:bg-brand focus-visible:before:opacity-100",
        "data-disabled:cursor-default",
        className
      )}
      style={{ "--resizable-hit": `${hitArea}px`, ...style } as React.CSSProperties}
      {...props}
    >
      {withHandle && (
        <div
          aria-hidden
          data-slot="resizable-handle-grip"
          className={cn(
            "pointer-events-none z-10 flex items-center justify-center rounded-sm border bg-background text-muted-foreground shadow-soft",
            "transition-colors duration-150 motion-reduce:transition-none",
            "group-data-dragging/handle:border-brand group-data-dragging/handle:text-brand group-focus-visible/handle:border-brand group-focus-visible/handle:text-brand",
            orientation === "vertical" ? "h-6 w-3.5" : "h-3.5 w-6"
          )}
        >
          {orientation === "vertical" ? <GripVerticalIcon className="size-3" /> : <GripHorizontalIcon className="size-3" />}
        </div>
      )}
    </div>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
