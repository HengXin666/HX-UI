"use client"

/**
 * 筛选标签: 一排可横向滚动的 "文字 + 计数" 标签, 单选或多选. 邮件厂商筛选, 信息流类别, 待办筛选.
 *
 *   <ChipGroup aria-label="邮箱" value={box} onValueChange={setBox} all allCount={15}>
 *     <Chip value="gmail" count={12}>Gmail</Chip>
 *     <Chip value="outlook" count={3}>Outlook</Chip>
 *   </ChipGroup>
 *
 * 为什么不直接用 ToggleGroup: 筛选条要的是 "一排 pill + 计数位 + 横向滚动", 而且选中态要滑动跟随,
 * ToggleGroup 是工具栏按钮 (连成一组的方块), 没有计数, 也不管溢出.
 * 结构: 外层 (可选左右滚动按钮) > 视口 (overflow-x 滚动, 隐藏滚动条) > 轨道 (role=radiogroup / group, 标签横排).
 * 溢出: 视口按滚动位置给 data-fade="start|end|both" (scroll-fade-x 工具类, mask-image), 只有被裁掉的那一侧渐隐;
 * 滚动用 rAF 合并, 只在侧别真的变化时才重渲染. 竖向滚轮在能横滚时转成横滚 (到头了就还给页面).
 * 选中项变化 / 键盘移动时自动滚进视野, 两侧留出渐隐宽度, 不会停在半透明的边上.
 * 选中态 (animation, 默认 "slide"): 单选时一个共享的底色层从旧标签滑到新标签. 底色层铺满整条轨道, 用
 * clip-path: inset(... round 半高) 裁出选中标签的胶囊形, 动画只插值 clip-path (Web Animations, 不触发 React 重渲染,
 * 不改布局): 位置与宽度一起过渡, 圆角始终是正圆 (以前用 scaleX 拉伸, 两端半圆会被压扁 / 拉长).
 * 描边 / 阴影画不进 clip-path (会被裁掉), 所以放在每个标签自己的一层上, 只做 opacity 淡入淡出.
 * 动画中途再切换: 从当前插值到的 clip-path 接着过渡, 不跳回起点. 多选 / "fade" 时每个标签自己的底块淡入并轻微放大
 * (等比缩放, 圆角不变形). 减弱动效时不位移, 直接到终态.
 * "全部" 标签用一个内部 Symbol 作标识, 不占用任何字符串值 (value="" 的标签也能正常用); 单选时 null 表示没有选中,
 * 旧写法 "" 仍兼容 (没有 value="" 的标签时等同 null); onValueChange 的第二个参数 { all } 区分 "全部" 与真实值.
 * 键盘: roving tabindex (整组只占一个 Tab 位), 左右 / 上下 移动, Home / End 首尾; 单选时焦点即选中 (radio 语义),
 * 多选时 空格 / 回车 切换 (aria-pressed). 外观: 圆角 pill, 行高 28 / 32px (触屏 36 / 40px), 变体 soft / outline / solid.
 */

import * as React from "react"
import { cva } from "class-variance-authority"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/motion/use-reduced-motion"
import { CHIP_KEYS, fadeSide, moveChip, scrollToReveal, toggleChip, type ChipFade } from "@/components/ui/chip-group-model"

export { fadeSide, moveChip, scrollToReveal, toggleChip, type ChipFade } from "@/components/ui/chip-group-model"

export type ChipGroupVariant = "soft" | "outline" | "solid"
export type ChipGroupSize = "sm" | "default"
/** 选中态过渡: slide 单选时指示块滑动跟随 (多选时同 fade); fade 底块原地淡入; none 直接切换 */
export type ChipGroupAnimation = "slide" | "fade" | "none"
/** 计数为 0 时: show 照常显示; dim 整个标签变淡 (仍可点); hide 不显示计数 */
export type ChipZeroCount = "show" | "dim" | "hide"

/** "全部" 标签的内部标识: 选中它 = 清空. Symbol 不会与任何字符串值冲突 */
const ALL = Symbol("chip-all")
/** 标签的内部键: 真实值或 "全部" */
type ChipKey = string | typeof ALL
const DEFAULT_DURATION = 220
const DEFAULT_FADE = 28
const DEFAULT_COUNT_MAX = 999
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)"
const CHIP_SELECTOR = '[data-slot="chip"]'
const NO_VALUES: readonly string[] = []
/** 滚动按钮一次滚过可视宽度的比例 */
const PAGE_RATIO = 0.7
/** 有滚动按钮时渐隐的最小宽度 (按钮 28px + 留白) */
const SCROLL_BUTTON_FADE = 44
/** 滚轮 deltaMode=1 (按行) 时一行的像素 */
const LINE_PX = 16

const chipVariants = cva(
  [
    "group/chip relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-medium whitespace-nowrap outline-none select-none",
    "transition-[color,background-color,border-color,opacity] duration-150",
    "focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-40",
    "data-zero:not-data-[state=on]:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      size: {
        sm: "h-7 px-2.5 text-xs pointer-coarse:h-9 [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-8 px-3 text-[13px] pointer-coarse:h-10 [&_svg:not([class*='size-'])]:size-4",
      },
      variant: {
        soft: "bg-muted/70 text-muted-foreground not-data-[state=on]:hover:bg-accent not-data-[state=on]:hover:text-foreground data-[state=on]:bg-transparent data-[state=on]:text-foreground",
        outline:
          "border border-border bg-transparent text-muted-foreground not-data-[state=on]:hover:bg-accent/60 not-data-[state=on]:hover:text-foreground data-[state=on]:border-transparent data-[state=on]:text-accent-foreground",
        solid: "bg-secondary text-secondary-foreground/75 not-data-[state=on]:hover:bg-accent not-data-[state=on]:hover:text-foreground data-[state=on]:bg-transparent data-[state=on]:text-primary-foreground",
      },
    },
    defaultVariants: { size: "default", variant: "soft" },
  }
)

/** 选中底色 (共享底色层与每个标签自己的底块共用) */
const FILL: Record<ChipGroupVariant, string> = {
  soft: "bg-brand-soft",
  outline: "bg-accent",
  solid: "bg-primary",
}

/** 选中描边 / 阴影: 画不进 clip-path, 共享模式下由每个标签自己淡入 */
const RING: Record<ChipGroupVariant, string> = {
  soft: "ring-1 ring-inset ring-brand/30",
  outline: "ring-1 ring-inset ring-border",
  solid: "shadow-soft",
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** 轨道大小 W×H 里, 把 rect 裁成胶囊形的 clip-path */
const insetOf = (r: Rect, W: number, H: number) => `inset(${r.y}px ${W - r.x - r.w}px ${H - r.y - r.h}px ${r.x}px round ${r.h / 2}px)`

/** 计数徽标 */
const COUNT: Record<ChipGroupVariant, string> = {
  soft: "bg-foreground/[0.07] group-data-[state=on]/chip:bg-brand/20 group-data-[state=on]/chip:text-foreground",
  outline: "bg-foreground/[0.07] group-data-[state=on]/chip:bg-foreground/10",
  solid: "bg-foreground/[0.08] group-data-[state=on]/chip:bg-primary-foreground/15",
}

interface ChipGroupContext {
  multiple: boolean
  size: ChipGroupSize
  variant: ChipGroupVariant
  zero: ChipZeroCount
  countMax: number
  /** 是否用共享指示块 (单选 + slide + 未减弱动效); 否则每个标签画自己的底块 */
  shared: boolean
  animation: ChipGroupAnimation
  disabled: boolean
  tabValue: ChipKey | null
  isOn: (key: ChipKey) => boolean
  press: (key: ChipKey) => void
  setFocusValue: (key: ChipKey) => void
}

const Ctx = React.createContext<ChipGroupContext | null>(null)

interface ChipGroupBase {
  size?: ChipGroupSize
  variant?: ChipGroupVariant
  /** 选中态过渡, 默认 "slide" */
  animation?: ChipGroupAnimation
  /** 过渡时长 ms, 默认 220 */
  duration?: number
  /** 溢出时两端渐隐 (只在有被裁内容的那一侧), 默认 true */
  fade?: boolean
  /** 渐隐宽度 px, 默认 28 */
  fadeWidth?: number
  /** 溢出时两端显示左右滚动按钮, 默认 false */
  scrollButtons?: boolean
  /** 竖向滚轮转横向滚动, 默认 true */
  wheel?: boolean
  /** 最前面加一个 "全部" 标签, 选中它 = 清空; true 用默认文字 "全部", 也可传 ReactNode */
  all?: boolean | React.ReactNode
  /** "全部" 标签的计数 */
  allCount?: number
  /** 计数为 0 时的表现, 默认 "dim" */
  zeroCount?: ChipZeroCount
  /** 计数超过它显示 "N+", 默认 999 */
  countMax?: number
  disabled?: boolean
  children?: React.ReactNode
}

export interface ChipGroupSingleProps extends ChipGroupBase {
  type?: "single"
  /** 受控值; null 表示没有选中 (有 "全部" 时即选中 "全部"). 兼容旧写法: 没有 value="" 的标签时 "" 也表示没有选中 */
  value?: string | null
  defaultValue?: string | null
  /** 选中变化; 没有选中 (或选了 "全部") 时 value 为 "" 且 all 为 true */
  onValueChange?: (value: string, detail: { all: boolean }) => void
  /** 再点一次已选中的标签取消选中, 默认 false */
  deselectable?: boolean
}

export interface ChipGroupMultipleProps extends ChipGroupBase {
  type: "multiple"
  value?: readonly string[]
  defaultValue?: readonly string[]
  onValueChange?: (value: string[]) => void
  deselectable?: never
}

type DivProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "children" | "dir">

export type ChipGroupProps = (ChipGroupSingleProps | ChipGroupMultipleProps) & DivProps

/** 外部值 → 内部选中列表; hasEmpty: 有 value="" 的标签 (此时 "" 是真实值而不是 "没有选中") */
const toList = (v: string | null | readonly string[] | undefined, hasEmpty: boolean): readonly string[] | undefined =>
  v === undefined ? undefined : v === null ? NO_VALUES : typeof v === "string" ? (v === "" && !hasEmpty ? NO_VALUES : [v]) : v

const keyOfChip = (c: HTMLElement): ChipKey => (c.hasAttribute("data-all") ? ALL : (c.dataset.value ?? ""))

function ChipGroup(props: ChipGroupProps) {
  const {
    type = "single",
    value,
    defaultValue,
    onValueChange,
    deselectable = false,
    size = "default",
    variant = "soft",
    animation = "slide",
    duration = DEFAULT_DURATION,
    fade = true,
    fadeWidth = DEFAULT_FADE,
    scrollButtons = false,
    wheel = true,
    all = false,
    allCount,
    zeroCount = "dim",
    countMax = DEFAULT_COUNT_MAX,
    disabled = false,
    children,
    className,
    style,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    ...rest
  } = props
  const multiple = type === "multiple"
  const reduced = useReducedMotion()
  const [order, setOrder] = React.useState<readonly ChipKey[]>(NO_VALUES)
  const hasEmpty = order.includes("")
  const [inner, setInner] = React.useState<readonly string[]>(() => toList(defaultValue, false) ?? NO_VALUES)
  const selected = toList(value, hasEmpty) ?? inner
  const selectedRef = React.useRef(selected)
  selectedRef.current = selected
  const [focusValue, setFocusValue] = React.useState<ChipKey | null>(null)
  const [side, setSide] = React.useState<ChipFade>("none")
  const viewport = React.useRef<HTMLDivElement>(null)
  const track = React.useRef<HTMLDivElement>(null)
  const indicator = React.useRef<HTMLSpanElement>(null)
  const lastRect = React.useRef<Rect | null>(null)
  const revealTarget = React.useRef<ChipKey | null>(null)
  const shared = !multiple && animation === "slide" && !reduced
  // 有滚动按钮时渐隐至少盖过按钮, 按钮下面的标签是淡的, 不和按钮抢
  const fadePx = scrollButtons ? Math.max(fadeWidth, SCROLL_BUTTON_FADE) : fadeWidth

  const commit = React.useCallback(
    (next: readonly string[]) => {
      setInner(next)
      if (multiple) (onValueChange as ChipGroupMultipleProps["onValueChange"])?.([...next])
      else (onValueChange as ChipGroupSingleProps["onValueChange"])?.(next[0] ?? "", { all: !next.length })
    },
    [multiple, onValueChange]
  )

  const press = React.useCallback(
    (v: ChipKey) => {
      const cur = selectedRef.current
      revealTarget.current = v
      if (v === ALL) {
        if (cur.length) commit(NO_VALUES)
        return
      }
      if (multiple) commit(toggleChip(cur, v))
      else if (cur[0] === v) {
        if (deselectable) commit(NO_VALUES)
      } else commit([v])
    },
    [commit, deselectable, multiple]
  )

  const selectedSet = React.useMemo(() => new Set(selected), [selected])
  const isOn = React.useCallback((v: ChipKey) => (v === ALL ? selectedSet.size === 0 : selectedSet.has(v)), [selectedSet])

  // Tab 停靠: 上次聚焦的 > 第一个选中的 (按 DOM 顺序) > 第一个
  const tabValue = React.useMemo(() => {
    if (focusValue != null && order.includes(focusValue)) return focusValue
    return order.find(isOn) ?? order[0] ?? null
  }, [focusValue, order, isOn])

  const chips = () => Array.from(track.current?.querySelectorAll<HTMLButtonElement>(CHIP_SELECTOR) ?? [])
  const chipOf = (k: ChipKey) => chips().find((c) => keyOfChip(c) === k) ?? null

  // 标签的顺序从 DOM 读 (支持包了一层的 Chip); 只在真的变化时更新
  React.useLayoutEffect(() => {
    const next = chips()
      .filter((c) => !c.disabled)
      .map(keyOfChip)
    setOrder((prev) => (prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next))
  })

  /** 按滚动位置更新渐隐侧, rAF 合并 */
  const frame = React.useRef(0)
  const measureSide = React.useCallback(() => {
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const el = viewport.current
      if (!el) return
      const next = fadeSide(Math.abs(el.scrollLeft), el.scrollWidth, el.clientWidth)
      setSide((prev) => (prev === next ? prev : next))
    })
  }, [])

  const reveal = React.useCallback(
    (el: HTMLElement | null, smooth: boolean) => {
      const vp = viewport.current
      if (!el || !vp) return
      const target = scrollToReveal(el.offsetLeft, el.offsetWidth, vp.scrollLeft, vp.clientWidth, vp.scrollWidth, fade || scrollButtons ? fadePx : 0)
      if (target != null) vp.scrollTo({ left: target, behavior: smooth && !reduced ? "smooth" : "auto" })
    },
    [fade, scrollButtons, fadePx, reduced]
  )

  /** 共享底色层裁到选中的标签上; 由上一个位置过渡 clip-path 滑过去 (圆角始终正确) */
  const placeIndicator = React.useCallback(
    (animate: boolean) => {
      const ind = indicator.current
      const tr = track.current
      if (!ind || !tr) return
      const cur = selectedRef.current
      const el = chipOf(cur.length ? cur[0] : ALL)
      if (!el) {
        ind.style.opacity = "0"
        lastRect.current = null
        return
      }
      const W = tr.offsetWidth
      const H = tr.offsetHeight
      const rect = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }
      const prev = lastRect.current
      lastRect.current = rect
      const target = insetOf(rect, W, H)
      const wasHidden = ind.style.opacity === "0" || !prev
      // 上一段还在滑: 先读出此刻插值到的形状, 从那里接着滑, 不跳回起点
      const running = ind.getAnimations?.() ?? []
      const live = running.length ? getComputedStyle(ind).clipPath : null
      for (const a of running) a.cancel()
      ind.style.clipPath = target
      ind.style.opacity = "1"
      if (!animate || !ind.animate) return
      if (wasHidden) {
        ind.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: EASE_OUT })
        return
      }
      const from = live && live !== "none" ? live : insetOf(prev, W, H)
      if (from === target) return
      ind.animate([{ clipPath: from }, { clipPath: target }], { duration, easing: EASE_OUT })
    },
    // chipOf 只读 ref, 不进依赖
    [duration]
  )

  const selKey = selected.join("\u0000")
  const mounted = React.useRef(false)
  React.useLayoutEffect(() => {
    if (shared) placeIndicator(mounted.current)
    // 选中变化后滚进视野: 优先刚点 / 刚按到的那个, 否则 (外部改了受控值) 第一个选中的
    const target = revealTarget.current ?? (selectedRef.current[0] ?? (all !== false ? ALL : null))
    revealTarget.current = null
    if (target != null) reveal(chipOf(target), mounted.current)
    mounted.current = true
  }, [selKey, shared, placeIndicator, reveal])

  // 尺寸 / 变体 / 内容变化: 指示块直接到位 (不滑), 渐隐侧重算
  React.useLayoutEffect(() => {
    if (shared) placeIndicator(false)
    measureSide()
  }, [shared, size, variant, order, placeIndicator, measureSide])

  React.useEffect(() => {
    const vp = viewport.current
    const tr = track.current
    if (!vp || !tr) return
    const ro = new ResizeObserver(() => {
      measureSide()
      if (shared) placeIndicator(false)
    })
    ro.observe(vp)
    ro.observe(tr)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [measureSide, placeIndicator, shared])

  // 竖向滚轮 → 横向; 已经滚到头就不拦, 交还给页面. 要 preventDefault 所以用原生非 passive 监听
  React.useEffect(() => {
    const vp = viewport.current
    if (!vp || !wheel) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      const max = vp.scrollWidth - vp.clientWidth
      if (max <= 0) return
      const delta = e.deltaY * (e.deltaMode === 1 ? LINE_PX : 1)
      if ((delta < 0 && vp.scrollLeft <= 0) || (delta > 0 && vp.scrollLeft >= max - 1)) return
      e.preventDefault()
      vp.scrollLeft += delta
    }
    vp.addEventListener("wheel", onWheel, { passive: false })
    return () => vp.removeEventListener("wheel", onWheel)
  }, [wheel])

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!(CHIP_KEYS as readonly string[]).includes(e.key) || e.altKey || e.ctrlKey || e.metaKey) return
    const list = chips().filter((c) => !c.disabled)
    const cur = list.indexOf(document.activeElement as HTMLButtonElement)
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl"
    const next = moveChip(list.length, cur, e.key, rtl)
    const el = list[next]
    if (!el) return
    e.preventDefault()
    const v = keyOfChip(el)
    el.focus({ preventScroll: true })
    setFocusValue(v)
    // 单选: 焦点即选中 (radio 语义); 多选只移动焦点
    if (!multiple) press(v)
    else reveal(el, true)
  }

  const scrollPage = (dir: -1 | 1) => {
    const vp = viewport.current
    if (!vp) return
    vp.scrollBy({ left: dir * vp.clientWidth * PAGE_RATIO, behavior: reduced ? "auto" : "smooth" })
  }

  const ctx = React.useMemo<ChipGroupContext>(
    () => ({ multiple, size, variant, zero: zeroCount, countMax, shared, animation: reduced && animation === "slide" ? "fade" : animation, disabled, tabValue, isOn, press, setFocusValue }),
    [multiple, size, variant, zeroCount, countMax, shared, animation, reduced, disabled, tabValue, isOn, press]
  )

  const showStart = side === "start" || side === "both"
  const showEnd = side === "end" || side === "both"
  const btn = size === "sm" ? "size-6" : "size-7"

  return (
    <div
      data-slot="chip-group"
      data-type={type}
      data-variant={variant}
      data-size={size}
      data-overflow={side !== "none" ? side : undefined}
      className={cn("group/chip-group relative flex min-w-0 items-center", className)}
      style={{ "--chip-duration": `${duration}ms`, ...style } as React.CSSProperties}
      {...rest}
    >
      <div
        ref={viewport}
        data-slot="chip-group-viewport"
        data-fade={fade && side !== "none" ? side : undefined}
        onScroll={measureSide}
        className="scroll-fade-x min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-none"
        style={{ "--fade": `${fadePx}px` } as React.CSSProperties}
      >
        <div
          ref={track}
          role={multiple ? "group" : "radiogroup"}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-orientation={multiple ? undefined : "horizontal"}
          aria-disabled={disabled || undefined}
          onKeyDown={onKeyDown}
          className="relative isolate flex w-max items-center gap-1.5 p-[3px]"
        >
          {shared && (
            <span
              ref={indicator}
              aria-hidden
              data-slot="chip-indicator"
              className={cn("pointer-events-none absolute inset-0 z-[1] opacity-0", FILL[variant])}
            />
          )}
          <Ctx.Provider value={ctx}>
            {all !== false && (
              <ChipButton chipKey={ALL} count={allCount}>
                {all === true ? "全部" : all}
              </ChipButton>
            )}
            {children}
          </Ctx.Provider>
        </div>
      </div>
      {scrollButtons && (
        <>
          <ScrollButton side="start" visible={showStart} className={btn} onClick={() => scrollPage(-1)} />
          <ScrollButton side="end" visible={showEnd} className={btn} onClick={() => scrollPage(1)} />
        </>
      )}
    </div>
  )
}

function ScrollButton({ side, visible, className, onClick }: { side: "start" | "end"; visible: boolean; className: string; onClick: () => void }) {
  const Icon = side === "start" ? ChevronLeftIcon : ChevronRightIcon
  return (
    <button
      type="button"
      data-slot="chip-group-scroll"
      data-side={side}
      // 只是辅助鼠标用户; 键盘靠方向键, 不进 Tab 序
      tabIndex={-1}
      aria-label={side === "start" ? "向左滚动" : "向右滚动"}
      aria-hidden={!visible || undefined}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 z-10 grid -translate-y-1/2 place-items-center rounded-full border bg-popover text-muted-foreground shadow-soft",
        "transition-[opacity,transform] duration-150 hover:text-foreground motion-reduce:transition-none [&_svg]:size-3.5",
        side === "start" ? "left-0" : "right-0",
        visible ? "opacity-100" : "pointer-events-none scale-90 opacity-0 motion-reduce:scale-100",
        className
      )}
    >
      <Icon />
    </button>
  )
}

export interface ChipProps extends Omit<React.ComponentProps<"button">, "value" | "type"> {
  value: string
  /** 计数徽标; 不给就不显示 */
  count?: number
  /** 前置图标 */
  icon?: React.ReactNode
}

function Chip({ value, ...props }: ChipProps) {
  return <ChipButton chipKey={value} {...props} />
}

/** 标签本体: 真实值的 Chip 与 "全部" 共用 */
function ChipButton({ chipKey, count, icon, disabled: disabledProp, children, className, onClick, onFocus, ...props }: Omit<ChipProps, "value"> & { chipKey: ChipKey }) {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("<Chip> 要放在 <ChipGroup> 里")
  const on = ctx.isOn(chipKey)
  const isAll = chipKey === ALL
  const disabled = ctx.disabled || disabledProp
  const zero = count === 0
  const countText = count == null || (zero && ctx.zero === "hide") ? null : count > ctx.countMax ? `${ctx.countMax}+` : String(count)
  const transition = ctx.animation === "none" ? "transition-none" : "duration-(--chip-duration) ease-out"
  return (
    <button
      type="button"
      data-slot="chip"
      data-value={isAll ? undefined : chipKey}
      data-all={isAll ? "" : undefined}
      data-state={on ? "on" : "off"}
      data-zero={zero && ctx.zero === "dim" ? "" : undefined}
      role={ctx.multiple ? undefined : "radio"}
      aria-checked={ctx.multiple ? undefined : on}
      aria-pressed={ctx.multiple ? on : undefined}
      disabled={disabled}
      tabIndex={chipKey === ctx.tabValue ? 0 : -1}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) ctx.press(chipKey)
      }}
      onFocus={(e) => {
        onFocus?.(e)
        ctx.setFocusValue(chipKey)
      }}
      className={cn(chipVariants({ size: ctx.size, variant: ctx.variant }), className)}
      {...props}
    >
      {ctx.shared ? (
        // 共享底色层负责滑动; 这里只淡入描边 / 阴影
        <span
          aria-hidden
          data-slot="chip-ring"
          className={cn("pointer-events-none absolute inset-0 z-[1] rounded-[inherit] transition-opacity", transition, RING[ctx.variant], on ? "opacity-100" : "opacity-0")}
        />
      ) : (
        <span
          aria-hidden
          data-slot="chip-indicator"
          className={cn(
            "pointer-events-none absolute inset-0 z-[1] rounded-[inherit]",
            FILL[ctx.variant],
            RING[ctx.variant],
            ctx.animation === "none" ? "transition-none" : "transition-[opacity,transform] duration-(--chip-duration) ease-out motion-reduce:transition-[opacity]",
            on ? "scale-100 opacity-100" : "scale-90 opacity-0 motion-reduce:scale-100"
          )}
        />
      )}
      <span className="relative z-[2] inline-flex items-center gap-1.5">
        {icon != null && (
          <span data-slot="chip-icon" aria-hidden className="inline-flex shrink-0">
            {icon}
          </span>
        )}
        {children}
        {countText != null && (
          <span
            data-slot="chip-count"
            className={cn(
              "-mr-1 inline-flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full px-1.5 text-[11px] leading-none font-medium tabular transition-colors duration-150",
              COUNT[ctx.variant]
            )}
          >
            {countText}
          </span>
        )}
      </span>
    </button>
  )
}

export { ChipGroup, Chip, chipVariants }
