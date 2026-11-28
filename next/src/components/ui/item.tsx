"use client"

/**
 * 列表行: 会话列表, 邮件列表, 收藏, "我的" 页导航, Agent 列表. 左侧头像 / 图标, 中间主副标题, 右侧时间 / 角标 / 操作.
 *
 *   <ItemGroup highlight="slide" roving>
 *     <Item active={id === current}>
 *       <ItemMedia><Avatar>…</Avatar></ItemMedia>
 *       <ItemContent>
 *         <ItemTitle><ItemTrigger onClick={() => open(id)}>{name}</ItemTrigger></ItemTitle>
 *         <ItemDescription>{last}</ItemDescription>
 *       </ItemContent>
 *       <ItemMeta>{time}</ItemMeta>
 *       <ItemActions reveal="swap">…</ItemActions>
 *     </Item>
 *     <Item asChild active={path === "/me"}><a href="/me">…</a></Item>
 *   </ItemGroup>
 *
 * 为什么是一组小件而不是一个 props 很多的组件: 各页的行内容差异大 (头像 + 在线点, 未读数, 星标, 多个操作),
 * 用插槽拼最灵活; 间距 / 截断 / 选中色 / 悬停这些 "各页容易不一致" 的部分收进组件.
 * 外观与 Tree 行一致: 圆角行, 悬停 accent/60, 选中 accent 底 + accent-foreground + 1px 描边 (ring, 不占布局), 焦点 1px ring.
 * 尺寸 sm / default / lg 与 Avatar 的 24 / 32 / 40px 对齐: ItemMedia 跟着行的尺寸走, 放 Avatar 时给同档 size 即可.
 * 整行可点有两种写法: 行里没有别的按钮时, asChild 把样式交给 <a> (路由链接) 或 <button>;
 * 行里还有尾部操作按钮时 (按钮不能嵌套在按钮 / 链接里), 行保持 div, 主操作写成 ItemTrigger (放在标题里),
 * 它用 ::after 铺满整行接住点击, 尾部操作浮在它上面各自可点, 键盘 Tab 先到主操作再到尾部按钮.
 * 尾部操作 (ItemActions): reveal="hover" 时只在有悬停能力的指针设备上 "悬停 / 聚焦 / 选中 才出现", 触屏常显;
 * reveal="swap" 时悬停后盖在 ItemMeta (时间) 的位置上, 时间淡出 (Gmail 式). 只动 opacity, 不改布局.
 *
 * 滑动高亮 (ItemGroup highlight="slide") 是自带的 FLIP, 不依赖 motion 的 LazyMotion / MotionProvider:
 * 组里只有一块底色 (data-slot="item-highlight", 组的第一个子元素, 绝对定位在所有行下面).
 * 位置用 offsetTop / offsetLeft 沿 offsetParent 链量到 ItemGroup 为止 (不用 getBoundingClientRect),
 * 所以与滚动无关 (底色和行在同一个滚动内容里一起滚), 也不受祖先 transform (缩放预览, 弹层入场) 影响.
 * 换选中时: 先把底色直接放到新行 (宽高 + translate), 再用 Web Animations 从 "旧位置 / 旧尺寸" (translate + scale) 播回原样,
 * 只动 transform, 在合成线程上跑, 不触发 React 重渲染; 中途再换就从当前画面上的位置接着播, 不跳.
 * 行增删 / 重排 / 换行高 / 容器变宽: ResizeObserver + MutationObserver 在下一帧重量一次, 直接到位 (行本身也是直接到位的).
 * 服务端渲染与首帧: 底色量好之前, 选中行先自己铺底 (组上没有 data-highlight-ready 时), 不会闪.
 * 减弱动效时直接到位. spring 曲线由弹簧模拟生成 CSS linear() 缓动 (不支持 linear() 的浏览器退回 --ease-spring 贝塞尔).
 *
 * 键盘 (ItemGroup roving): ↑ ↓ Home End 在行之间移动焦点, 整组任何时候都只有一个 Tab 位 (上次聚焦, 否则选中, 否则第一行).
 * 不靠重渲染维护: MutationObserver 监听行的增删与 disabled / data-active 变化, 下一帧重排 tabindex;
 * 聚焦的行被删掉时焦点移到原位置的相邻行, 不会掉回 <body>.
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/motion/use-reduced-motion"

export type ItemSize = "sm" | "default" | "lg"
export type ItemVariant = "default" | "outline" | "muted"
/** 选中底色: static 每行自己铺; slide 一块底色在组内滑到新选中的行 */
export type ItemHighlight = "static" | "slide"
/** 滑动曲线: ease 缓出, spring 弹簧 (一点回弹), 或任意 CSS 缓动 ("linear", "cubic-bezier(…)") */
export type ItemHighlightEasing = "ease" | "spring" | (string & {})

/** 滑动高亮默认时长 (ms) */
const HIGHLIGHT_MS = 220
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)"
/** 不支持 linear() 时 spring 的退路 (= theme.css 的 --ease-spring) 与时长 */
const SPRING_FALLBACK = { easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", duration: 320 }
/** 选中样式: 行自己铺底 与 滑动高亮块 共用, 两处保持一模一样 */
const ACTIVE_SURFACE = "bg-accent ring-1 ring-border"
/** slide 模式下底色还没量好 (服务端渲染 / 首帧前) 时, 选中行先自己铺底 */
const ACTIVE_SURFACE_UNTIL_READY =
  "[[data-slot=item-group]:not([data-highlight-ready])_&]:bg-accent [[data-slot=item-group]:not([data-highlight-ready])_&]:ring-1 [[data-slot=item-group]:not([data-highlight-ready])_&]:ring-border"
/** 可聚焦的行 (roving 键盘导航只在这些之间走) */
const FOCUSABLE = ":is(a[href],button,[tabindex]):not(:disabled,[aria-disabled=true])"
// 注意: Tailwind 只扫描字面量, 下面的类名都写全, 不用模板字符串拼.
// "[@media(hover:hover)]:" = 有悬停能力的指针设备 (鼠标 / 触控板); 触屏不进这个分支, 尾部操作常显.
const NAV_KEYS = ["ArrowDown", "ArrowUp", "Home", "End"]
/** roving 要关心的属性变化: 行变禁用 / 选中变化 */
const WATCH_ATTRS = ["disabled", "aria-disabled", "data-active", "href"]

/* ---------- 纯计算 (无 DOM 状态) ---------- */

type Box = { x: number; y: number; w: number; h: number }
const sameBox = (a: Box, b: Box) => Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5

/**
 * 弹簧 (stiffness / damping / mass) 从 0 到 1 的位移曲线, 采样成 CSS linear() 缓动.
 * 返回缓动串与 "停稳" 所需时长 (ms). 半隐式欧拉, 120Hz 积分, 60Hz 取点.
 */
function springToLinear(stiffness = 520, damping = 30, mass = 0.8): { easing: string; duration: number } {
  const dt = 1 / 120
  let x = 0
  let v = 0
  let t = 0
  const pts: number[] = [0]
  for (let i = 1; t < 2; i++) {
    v += ((-stiffness * (x - 1) - damping * v) / mass) * dt
    x += v * dt
    t += dt
    if (i % 2 === 0) pts.push(Math.round(x * 1e4) / 1e4)
    if (Math.abs(x - 1) < 1e-3 && Math.abs(v) < 1e-2) break
  }
  pts[pts.length - 1] = 1
  return { easing: `linear(${pts.join(", ")})`, duration: Math.round(t * 1000) }
}

let springCache: { easing: string; duration: number } | null = null
function springEasing() {
  if (!springCache) {
    const ok = typeof CSS !== "undefined" && CSS.supports("animation-timing-function", "linear(0, 1)")
    springCache = ok ? springToLinear() : SPRING_FALLBACK
  }
  return springCache
}

/** el 相对 root 内边距盒左上角的位置与尺寸: 沿 offsetParent 链累加, 与滚动 / 祖先 transform 无关 */
function boxWithin(el: HTMLElement, root: HTMLElement): Box {
  let x = 0
  let y = 0
  let node: HTMLElement | null = el
  while (node && node !== root) {
    x += node.offsetLeft
    y += node.offsetTop
    const parent = node.offsetParent as HTMLElement | null
    if (parent && parent !== root) {
      x += parent.clientLeft
      y += parent.clientTop
    }
    node = parent
  }
  if (node !== root) {
    // root 不在 offsetParent 链上 (被改成了 position: static): 退回视口坐标差
    const a = el.getBoundingClientRect()
    const b = root.getBoundingClientRect()
    return { x: a.left - b.left - root.clientLeft, y: a.top - b.top - root.clientTop, w: el.offsetWidth, h: el.offsetHeight }
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value)
  else if (ref) (ref as React.RefObject<T | null>).current = value
}

/* ---------- 上下文 ---------- */

type GroupState = {
  size?: ItemSize
  variant?: ItemVariant
  highlight: ItemHighlight
  /** slide 时选中行登记自己, 返回注销函数 */
  register: (el: HTMLElement) => () => void
}
const ItemGroupContext = React.createContext<GroupState | null>(null)
/** 行的选中态, 给 ItemTrigger 补 aria-current 用 */
const ItemContext = React.createContext<{ active: boolean; disabled: boolean }>({ active: false, disabled: false })

const itemVariants = cva(
  [
    "group/item relative isolate flex min-w-0 items-center rounded-md text-left outline-none select-none",
    "transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset",
    // 用 ItemTrigger 时焦点在里面的按钮上, 焦点环画在整行
    "has-[[data-slot=item-trigger]:focus-visible]:ring-1 has-[[data-slot=item-trigger]:focus-visible]:ring-ring has-[[data-slot=item-trigger]:focus-visible]:ring-inset",
    "data-disabled:pointer-events-none data-disabled:opacity-50",
    // 可交互的行 (行本身可点, 或行里有 ItemTrigger) 才有悬停 / 指针; 选中的行不叠悬停色
    "data-interactive:cursor-pointer data-interactive:not-data-active:hover:bg-accent/60",
    "has-[[data-slot=item-trigger]]:cursor-pointer has-[[data-slot=item-trigger]]:not-data-active:hover:bg-accent/60",
    "data-active:text-accent-foreground",
    // swap: 悬停 / 聚焦时把 ItemMeta 淡出, 让位给盖在上面的操作
    "[@media(hover:hover)]:[&:has([data-reveal=swap]):is(:hover,:focus-within)_[data-slot=item-meta]]:opacity-0",
  ],
  {
    variants: {
      size: {
        sm: "min-h-7 gap-2 px-2 py-1 text-[13px] pointer-coarse:min-h-10",
        default: "min-h-8 gap-3 px-2.5 py-2 text-sm pointer-coarse:min-h-11",
        lg: "min-h-10 gap-3 px-3 py-2.5 text-sm",
      },
      variant: {
        default: "",
        outline: "border bg-card data-interactive:not-data-active:hover:bg-accent/40 has-[[data-slot=item-trigger]]:not-data-active:hover:bg-accent/40",
        muted: "bg-muted/50",
      },
    },
    defaultVariants: { size: "default", variant: "default" },
  }
)

export interface ItemProps extends React.ComponentProps<"div">, VariantProps<typeof itemVariants> {
  /** 把样式与行为交给唯一的子元素 (<a> 路由链接 / <button>) */
  asChild?: boolean
  /** 选中 (data-active); 读屏: 默认补 aria-current, role="option" 时补 aria-selected */
  active?: boolean
  disabled?: boolean
  /** 有悬停底色和指针; 默认 asChild 或传了 onClick 时为 true */
  interactive?: boolean
}

/** 一行. 不传 asChild 时是 div; 需要整行可点就 asChild + <a> / <button> */
function Item({ asChild = false, active = false, disabled = false, interactive, size, variant, className, ref, ...props }: ItemProps) {
  const group = React.useContext(ItemGroupContext)
  const sz = size ?? group?.size ?? "default"
  const vr = variant ?? group?.variant ?? "default"
  const slide = active && group?.highlight === "slide"
  const register = group?.register
  const live = interactive ?? (asChild || props.onClick != null)
  const row = React.useRef<HTMLElement | null>(null)
  const mergedRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      row.current = el
      setRef(ref, el)
    },
    [ref]
  )

  // slide: 选中行把自己登记给组, 组把那块底色挪过来
  React.useLayoutEffect(() => {
    const el = row.current
    if (!slide || !register || !el) return
    return register(el)
  }, [slide, register])

  const a11y: Record<string, unknown> = {}
  if (active) {
    if (props.role === "option") a11y["aria-selected"] = props["aria-selected"] ?? true
    else if (props["aria-current"] == null) a11y["aria-current"] = "true"
  }
  if (disabled) a11y["aria-disabled"] = true

  const shared = {
    ref: mergedRef,
    "data-slot": "item",
    "data-size": sz,
    "data-variant": vr,
    "data-active": active ? "" : undefined,
    "data-disabled": disabled ? "" : undefined,
    "data-interactive": live ? "" : undefined,
    className: cn(
      itemVariants({ size: sz, variant: vr }),
      active && !slide && ACTIVE_SURFACE,
      // slide: 底色由组里那一块画, 行自己透明 (outline / muted 的底也让出来); 量好之前先自己铺
      slide && cn("bg-transparent", ACTIVE_SURFACE_UNTIL_READY),
      className
    ),
    ...a11y,
    ...props,
  }

  const state = React.useMemo(() => ({ active, disabled }), [active, disabled])
  const Comp = asChild ? Slot.Root : "div"
  return (
    <ItemContext.Provider value={state}>
      <Comp {...shared} />
    </ItemContext.Provider>
  )
}

export interface ItemTriggerProps extends React.ComponentProps<"button"> {
  /** 渲染成唯一的子元素 (<a> / 路由 <Link>) */
  asChild?: boolean
}

/**
 * 行的主操作 (行里还有尾部按钮时用): 默认 <button type="button">, asChild 可换成链接.
 * 用 ::after 铺满整行, 点行的任何空白处都触发它; 焦点环画在整行; 行选中时自动补 aria-current.
 * 一般放在 ItemTitle 里包住标题文字, 读屏念出的就是标题.
 */
function ItemTrigger({ asChild = false, className, type, ...props }: ItemTriggerProps) {
  const row = React.useContext(ItemContext)
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="item-trigger"
      type={asChild ? type : (type ?? "button")}
      aria-current={props["aria-current"] ?? (row.active ? "true" : undefined)}
      disabled={asChild ? undefined : (props.disabled ?? (row.disabled || undefined))}
      className={cn(
        "block w-full min-w-0 truncate text-left outline-none",
        "after:absolute after:inset-0 after:rounded-[inherit] after:content-['']",
        className
      )}
      {...props}
    />
  )
}

const mediaVariants = cva(
  "relative flex shrink-0 items-center justify-center [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        // 放 Avatar / 自定义内容, 不加外框
        default: "bg-transparent",
        // 圆角方块里一个图标: 导航项, 文件类型, 系统消息
        icon: "rounded-md border bg-muted text-muted-foreground [&_svg:not([class*='size-'])]:size-4 group-data-[size=sm]/item:[&_svg:not([class*='size-'])]:size-3.5 group-data-[size=lg]/item:[&_svg:not([class*='size-'])]:size-5",
        // 缩略图: 图片铺满, 圆角
        image: "overflow-hidden rounded-md bg-muted [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

/** 方块尺寸跟随行: sm 24 / default 32 / lg 40 (= Avatar 的 sm / default / lg) */
const MEDIA_BOX = "group-data-[size=sm]/item:size-6 group-data-[size=default]/item:size-8 group-data-[size=lg]/item:size-10"

/** 左侧头像 / 图标 / 缩略图. variant="default" 时尺寸由里面的内容决定 (如 Avatar), 其余跟随行的尺寸 */
function ItemMedia({ className, variant = "default", ...props }: React.ComponentProps<"div"> & VariantProps<typeof mediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(mediaVariants({ variant }), variant !== "default" && MEDIA_BOX, className)}
      {...props}
    />
  )
}

/** 中间的主副标题列: 占满剩余宽度, 允许收缩 (否则截断不生效) */
function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-content" className={cn("grid min-w-0 flex-1 gap-0.5", className)} {...props} />
}

/** 主标题: 单行, 超出省略号 */
function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-title" className={cn("min-w-0 truncate leading-5 font-medium", className)} {...props} />
}

export interface ItemDescriptionProps extends React.ComponentProps<"p"> {
  /** 最多几行, 超出省略号; 默认 1 */
  lines?: 1 | 2 | 3
}

/** 副标题 (最后一条消息, 邮件摘要): 默认单行截断 */
function ItemDescription({ className, lines = 1, ...props }: ItemDescriptionProps) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        "min-w-0 text-[13px] leading-[18px] text-muted-foreground group-data-[size=sm]/item:text-xs group-data-[active]/item:text-accent-foreground/70",
        lines === 1 ? "truncate" : lines === 2 ? "line-clamp-2" : "line-clamp-3",
        className
      )}
      {...props}
    />
  )
}

/** 右侧的时间 / 未读数 / 角标; 多个时竖排右对齐. 一直显示 */
function ItemMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-meta"
      className={cn("flex shrink-0 flex-col items-end justify-center gap-1 self-stretch text-xs text-muted-foreground tabular transition-opacity duration-150", className)}
      {...props}
    />
  )
}

export interface ItemActionsProps extends React.ComponentProps<"div"> {
  /**
   * 什么时候显示. always: 一直; hover (默认): 有悬停能力的指针设备上 悬停 / 键盘聚焦到行内 / 选中 时淡入, 触屏常显 (占位不变, 不跳布局);
   * swap: 同 hover, 但不占位, 悬停时盖在 ItemMeta 上并把它淡出 (触屏时与 ItemMeta 并排常显).
   */
  reveal?: "always" | "hover" | "swap"
}

/** 尾部操作按钮. 里面放 Button size="icon-xs" 之类. 行有尾部按钮时主操作用 ItemTrigger, 不要把行 asChild 成按钮 / 链接 (不能嵌套) */
function ItemActions({ className, reveal = "hover", ...props }: ItemActionsProps) {
  return (
    <div
      data-slot="item-actions"
      data-reveal={reveal}
      className={cn(
        // 浮在 ItemTrigger 铺满整行的 ::after 之上, 各自可点
        "relative z-10 flex shrink-0 items-center gap-1",
        reveal !== "always" && "transition-opacity duration-150 [@media(hover:hover)]:opacity-0 group-hover/item:opacity-100 group-focus-within/item:opacity-100",
        // hover: 选中的行也常显; swap: 选中时仍显示时间, 悬停才换成操作
        reveal === "hover" && "group-data-[active]/item:opacity-100",
        reveal === "swap" && "[@media(hover:hover)]:absolute [@media(hover:hover)]:inset-y-0 [@media(hover:hover)]:right-2",
        className
      )}
      {...props}
    />
  )
}

/** 行间分隔线: 1px; inset 时从内容列开始 (按 ItemGroup 的尺寸跳过媒体列: sm 40 / default 54 / lg 64px) */
function ItemSeparator({ className, inset = false, ...props }: React.ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      data-slot="item-separator"
      role="separator"
      className={cn(
        "my-0.5 h-px shrink-0 bg-border",
        inset && "ml-[54px] group-data-[size=sm]/item-group:ml-10 group-data-[size=lg]/item-group:ml-16",
        className
      )}
      {...props}
    />
  )
}

export interface ItemGroupProps extends React.ComponentProps<"div"> {
  /** 组内行的默认尺寸 (行自己传的优先) */
  size?: ItemSize
  /** 组内行的默认外观 */
  variant?: ItemVariant
  /** 选中底色: static (默认) 每行自己铺; slide 一块底色滑到新选中的行 (自带 FLIP, 只动 transform, 减弱动效时直接到位) */
  highlight?: ItemHighlight
  /** 滑动曲线: ease (默认, 时长见 highlightDuration), spring (弹簧, 时长由弹簧决定), 或任意 CSS 缓动串 */
  highlightEasing?: ItemHighlightEasing
  /** 滑动时长 ms, 默认 220 (spring 时不用) */
  highlightDuration?: number
  /** 键盘 上 / 下 / Home / End 在行之间移动焦点, 整组始终只占一个 Tab 位 (roving tabindex). 默认 false */
  roving?: boolean
  /** roving 时到头后是否回到另一端, 默认 true */
  loop?: boolean
}

/** 一组行: 统一尺寸 / 外观, 可选滑动高亮与键盘导航. 想要滚动就放进 ScrollArea 或 overflow-auto 的容器 */
function ItemGroup({
  size,
  variant,
  highlight = "static",
  highlightEasing = "ease",
  highlightDuration = HIGHLIGHT_MS,
  roving = false,
  loop = true,
  className,
  children,
  onKeyDown,
  onFocus,
  ref,
  ...props
}: ItemGroupProps) {
  const reduced = useReducedMotion()
  const slide = highlight === "slide"
  const root = React.useRef<HTMLDivElement | null>(null)
  const indicator = React.useRef<HTMLSpanElement | null>(null)
  /** slide: 当前选中行 / 底色当前所在的位置 (目标) / 正在播的动画 */
  const target = React.useRef<HTMLElement | null>(null)
  const placed = React.useRef<Box | null>(null)
  const anim = React.useRef<Animation | null>(null)
  /** slide: 量组和选中行尺寸的 ResizeObserver (选中行自己变高时组未必变) */
  const resize = React.useRef<ResizeObserver | null>(null)
  /** roving: 上次聚焦的落点与它的序号, 焦点是否在组内 */
  const last = React.useRef<HTMLElement | null>(null)
  const lastIndex = React.useRef(0)
  const focusInside = React.useRef(false)
  /** 动画参数放 ref: 换参数不重建 register (否则每个选中行都会重新登记) */
  const motionOpts = React.useRef({ reduced, highlightEasing, highlightDuration })
  React.useLayoutEffect(() => {
    motionOpts.current = { reduced, highlightEasing, highlightDuration }
  }, [reduced, highlightEasing, highlightDuration])

  const mergedRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      root.current = el
      setRef(ref, el)
    },
    [ref]
  )

  /** 把底色放到选中行上; animate 时从当前画面位置 FLIP 过去, 否则直接到位 (位置没变就什么都不做) */
  const place = React.useCallback((animate: boolean) => {
    const box = root.current
    const ind = indicator.current
    if (!box || !ind) return
    const el = target.current
    if (!el || !el.isConnected || el.offsetParent == null) {
      anim.current?.cancel()
      anim.current = null
      placed.current = null
      ind.style.opacity = "0"
      box.removeAttribute("data-highlight-ready")
      return
    }
    const next = boxWithin(el, box)
    const prev = placed.current
    if (prev && sameBox(prev, next)) return
    // 起点: 正在播就取画面上的位置 (computed transform), 否则取上次放的位置
    let from = prev
    if (prev && animate && anim.current?.playState === "running") {
      const m = new DOMMatrixReadOnly(getComputedStyle(ind).transform)
      from = { x: m.e, y: m.f, w: m.a * prev.w, h: m.d * prev.h }
    }
    anim.current?.cancel()
    anim.current = null
    Object.assign(ind.style, {
      width: `${next.w}px`,
      height: `${next.h}px`,
      transform: `translate(${next.x}px, ${next.y}px)`,
      borderRadius: getComputedStyle(el).borderRadius,
      opacity: "1",
    })
    box.setAttribute("data-highlight-ready", "")
    placed.current = next
    const o = motionOpts.current
    if (!animate || !from || o.reduced || !next.w || !next.h || typeof ind.animate !== "function") return
    const { easing, duration } =
      o.highlightEasing === "spring"
        ? springEasing()
        : { easing: o.highlightEasing === "ease" ? EASE_OUT : o.highlightEasing, duration: o.highlightDuration }
    anim.current = ind.animate(
      [
        { transform: `translate(${from.x}px, ${from.y}px) scale(${from.w / next.w}, ${from.h / next.h})` },
        { transform: `translate(${next.x}px, ${next.y}px)` },
      ],
      { duration, easing }
    )
  }, [])

  const hideFrame = React.useRef(0)
  const register = React.useCallback(
    (el: HTMLElement) => {
      cancelAnimationFrame(hideFrame.current)
      target.current = el
      resize.current?.observe(el)
      place(true)
      return () => {
        resize.current?.unobserve(el)
        if (target.current !== el) return
        target.current = null
        // 同一次提交里通常紧跟着新行登记; 下一帧还没人登记才隐藏
        hideFrame.current = requestAnimationFrame(() => {
          if (!target.current) place(false)
        })
      }
    },
    [place]
  )

  /** 本组每行的焦点落点: 行本身 (asChild 的 a / button) 或行里的 ItemTrigger; 不含嵌套组里的 */
  const items = React.useCallback(() => {
    const box = root.current
    if (!box) return []
    return Array.from(box.querySelectorAll<HTMLElement>("[data-slot=item]"))
      .filter((row) => row.closest("[data-slot=item-group]") === box)
      .map((row) => (row.matches(FOCUSABLE) ? row : row.querySelector<HTMLElement>(`[data-slot=item-trigger]${FOCUSABLE}`)))
      .filter((el): el is HTMLElement => el != null)
  }, [])

  /** roving: 保证只有一个 Tab 位; 聚焦的行被删时把焦点交给相邻行 */
  const normalize = React.useCallback(() => {
    const list = items()
    if (!list.length) return
    const lost = last.current != null && !last.current.isConnected
    let keep = last.current && list.includes(last.current) ? last.current : null
    if (!keep && lost) keep = list[Math.min(lastIndex.current, list.length - 1)]
    keep ??= list.find((el) => el.closest("[data-slot=item]")?.hasAttribute("data-active")) ?? list[0]
    for (const el of list) {
      const t = el === keep ? 0 : -1
      if (el.tabIndex !== t) el.tabIndex = t
    }
    if (lost) {
      last.current = keep
      lastIndex.current = list.indexOf(keep)
      const a = document.activeElement
      if (focusInside.current && (a == null || a === document.body)) keep.focus()
    }
  }, [items])

  // 首帧: 子行的 layout effect 先于组的 ref 挂上, 这里补放一次底色 (直接到位), 并排好 tabindex
  React.useLayoutEffect(() => {
    if (slide) place(false)
    if (roving) normalize()
  }, [slide, roving, place, normalize])

  // 行增删 / 重排 / 尺寸变化: 下一帧重量底色 (直接到位), 重排 tabindex. 不经过 React 渲染.
  React.useEffect(() => {
    const box = root.current
    if (!box || (!slide && !roving)) return
    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (slide) place(false)
        if (roving) normalize()
      })
    }
    const mo = new MutationObserver(schedule)
    mo.observe(box, { childList: true, subtree: true, attributes: roving, attributeFilter: roving ? WATCH_ATTRS : undefined })
    let ro: ResizeObserver | null = null
    if (slide) {
      ro = new ResizeObserver(schedule)
      ro.observe(box)
      if (target.current) ro.observe(target.current)
      resize.current = ro
    }
    const onIn = () => (focusInside.current = true)
    const onOut = (e: FocusEvent) => {
      const to = e.relatedTarget as Node | null
      if (to) {
        if (!box.contains(to)) focusInside.current = false
        return
      }
      // 没有去处: 点了空白处, 或元素正被删除 (Chrome 删除时先同步派发 blur, 那时元素还连着).
      // 等这次删除做完再看: 元素还在才算真的离开
      const from = e.target as Node
      queueMicrotask(() => {
        if (from.isConnected) focusInside.current = false
      })
    }
    box.addEventListener("focusin", onIn)
    box.addEventListener("focusout", onOut)
    return () => {
      cancelAnimationFrame(frame)
      mo.disconnect()
      ro?.disconnect()
      if (resize.current === ro) resize.current = null
      box.removeEventListener("focusin", onIn)
      box.removeEventListener("focusout", onOut)
    }
  }, [slide, roving, place, normalize])

  // 关掉 roving 时把 tabindex 还给原生
  React.useEffect(() => {
    if (!roving) return
    return () => {
      for (const el of items()) el.removeAttribute("tabindex")
    }
  }, [roving, items])

  React.useEffect(() => () => cancelAnimationFrame(hideFrame.current), [])

  const ctx = React.useMemo<GroupState>(() => ({ size, variant, highlight, register }), [size, variant, highlight, register])

  return (
    <ItemGroupContext.Provider value={ctx}>
      <div
        ref={mergedRef}
        data-slot="item-group"
        data-size={size}
        data-variant={variant}
        data-highlight={highlight}
        className={cn("group/item-group relative grid min-w-0 content-start gap-0.5", variant === "outline" && "gap-1.5", className)}
        onFocus={(e) => {
          onFocus?.(e)
          if (!roving) return
          const list = items()
          const at = list.indexOf(e.target as HTMLElement)
          if (at < 0) return
          last.current = list[at]
          lastIndex.current = at
          for (const el of list) el.tabIndex = el === list[at] ? 0 : -1
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          if (!roving || e.defaultPrevented || !NAV_KEYS.includes(e.key) || e.altKey || e.metaKey || e.ctrlKey) return
          // 行内的输入框自己处理方向键
          if ((e.target as HTMLElement).closest("input,textarea,[contenteditable=true]")) return
          const list = items()
          if (!list.length) return
          // 焦点可能在行内的尾部按钮上: 按所在的行算
          const row = (e.target as HTMLElement).closest("[data-slot=item]")
          const at = list.findIndex((el) => el.closest("[data-slot=item]") === row)
          const n = list.length
          let to: number
          if (e.key === "Home") to = 0
          else if (e.key === "End") to = n - 1
          else {
            const step = e.key === "ArrowDown" ? 1 : -1
            to = at < 0 ? 0 : at + step
            if (to < 0 || to >= n) to = loop ? (to + n) % n : at
          }
          e.preventDefault()
          list[to]?.focus()
        }}
        {...props}
      >
        {slide && (
          <span
            ref={indicator}
            aria-hidden
            data-slot="item-highlight"
            className={cn("pointer-events-none absolute top-0 left-0 origin-top-left opacity-0", ACTIVE_SURFACE)}
          />
        )}
        {children}
      </div>
    </ItemGroupContext.Provider>
  )
}

export { Item, ItemGroup, ItemTrigger, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemMeta, ItemActions, ItemSeparator, itemVariants }
