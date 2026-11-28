/**
 * 空状态: 空列表, 未选中详情, 搜索无结果, 加载失败. 图标 + 一句标题 + 说明 + 可选的操作按钮.
 *
 *   <Empty size="compact">
 *     <EmptyMedia variant="icon"><InboxIcon /></EmptyMedia>
 *     <EmptyTitle>还没有邮件</EmptyTitle>
 *     <EmptyDescription>绑定邮箱后, 新邮件会出现在这里.</EmptyDescription>
 *     <EmptyContent><Button size="sm">绑定邮箱</Button></EmptyContent>
 *   </Empty>
 *
 * 为什么拆成插槽: 各页要的组合不同 (只有一句话 / 带按钮 / 带链接 / 错误态), 结构和间距由 Empty 统一, 内容随意拼.
 * 两种尺寸: page 整页 (详情区 "未选中", 整页空列表) 在父容器里上下左右居中; compact 卡片 / 列表内, 间距与图标都收小.
 * 插槽的尺寸跟随 Empty 的 data-size (group 变体), 不用每个插槽再传 size.
 * 入场 (animate, 默认 fade): 直接子元素依次淡入 (rise 再加轻微上移, pop 让图标从 90% 弹到 100%), 纯 CSS 动画,
 * 只动 opacity / transform, 时长与交错用 CSS 变量调; 系统开了减弱动效时直接显示.
 * 交错不限个数: Empty 给每个直接子元素注入 --i (第几个, 从 0 起; 会展开 Fragment, 跳过 null / false),
 * 延迟 = --i × --empty-stagger. 子组件不转发 style 时退回 CSS sibling-index() (支持的浏览器), 再不行就不交错, 一起淡入.
 * 标题默认是 <h3> (as 换级别, asChild 交给自己的元素), 读屏能按标题跳到空状态.
 * 与 Skeleton 搭配: 加载中用骨架, 加载完没数据用 Empty, 失败用 Empty + 重试按钮 (EmptyMedia tone="destructive").
 * 没有 hooks, 服务端组件里也能直接用.
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

export type EmptyAnimation = "none" | "fade" | "rise" | "pop"

/** 每个插槽的入场时长 / 相邻插槽的错开 (ms) */
const ENTER_MS = 300
const STAGGER_MS = 50
/**
 * 直接子元素依次错开, 个数不限: 延迟 = --i × 交错. --i 由 Empty 注入;
 * 没注入到 (子组件不转发 style) 时, 支持 sibling-index() 的浏览器按它在兄弟里的位置算, 其余为 0.
 */
const STAGGER =
  "[&>*]:[--tw-animation-delay:calc(var(--empty-stagger)*var(--i,0))] supports-[order:sibling-index()]:[&>*]:[--tw-animation-delay:calc(var(--empty-stagger)*var(--i,(sibling-index()_-_1)))]"
const ENTER = "[&>*]:animate-in [&>*]:fade-in-0 [&>*]:fill-mode-both [&>*]:ease-out [&>*]:[--tw-animation-duration:var(--empty-duration)] motion-reduce:[&>*]:animate-none"

const emptyVariants = cva("group/empty flex w-full min-w-0 flex-col items-center justify-center text-center text-balance", {
  variants: {
    size: {
      // 整页: 撑满父容器并居中 (父容器要有高度, 如 flex 列里的 flex-1 或固定高的详情区)
      page: "min-h-full flex-1 gap-4 px-6 py-16",
      // 卡片 / 列表内
      compact: "gap-2.5 px-4 py-8",
    },
    variant: {
      default: "",
      // 虚线框: 上传区, 拖放目标, "还没有 X, 点这里新建"
      outline: "rounded-xl border border-dashed",
      // 浅底: 放在白底卡片里时与周围区分
      muted: "rounded-xl bg-muted/40",
    },
    animate: {
      none: "",
      fade: [ENTER, STAGGER],
      rise: [ENTER, STAGGER, "[&>*]:slide-in-from-bottom-2"],
      pop: [ENTER, STAGGER, "[&>*]:slide-in-from-bottom-1 [&>[data-slot=empty-media]]:zoom-in-90 [&>[data-slot=empty-media]]:ease-[cubic-bezier(0.34,1.56,0.64,1)]"],
    },
  },
  defaultVariants: { size: "page", variant: "default", animate: "fade" },
})

export interface EmptyProps extends React.ComponentProps<"div">, VariantProps<typeof emptyVariants> {
  /** 每个插槽的入场时长 ms, 默认 300 */
  duration?: number
  /** 相邻插槽的错开 ms, 默认 50 */
  stagger?: number
}

/** 摊平 Fragment, 去掉 null / false / 空串, 得到会渲染成直接子元素的那一串 */
function flatten(children: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(children).flatMap((c) =>
    React.isValidElement<{ children?: React.ReactNode }>(c) && c.type === React.Fragment ? flatten(c.props.children) : [c]
  )
}

/** 给每个直接子元素注入 --i (交错序号). 子元素自己的 style 优先; 纯文本不处理 */
function indexChildren(children: React.ReactNode): React.ReactNode {
  return flatten(children).map((c, i) => {
    if (!React.isValidElement<{ style?: React.CSSProperties }>(c)) return c
    return React.cloneElement(c, { style: { "--i": i, ...c.props.style } as React.CSSProperties })
  })
}

/** 空状态容器. 插槽: EmptyMedia / EmptyTitle / EmptyDescription / EmptyContent, 按顺序放 (个数不限, 依次入场) */
function Empty({ className, size = "page", variant = "default", animate = "fade", duration = ENTER_MS, stagger = STAGGER_MS, style, children, ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      data-size={size}
      data-variant={variant}
      data-animate={animate}
      className={cn(emptyVariants({ size, variant, animate }), className)}
      style={{ "--empty-duration": `${duration}ms`, "--empty-stagger": `${stagger}ms`, ...style } as React.CSSProperties}
      {...props}
    >
      {animate === "none" ? children : indexChildren(children)}
    </div>
  )
}

const mediaVariants = cva("relative flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0", {
  variants: {
    variant: {
      // 裸图标 / 插画 / 头像: 不加底
      default: "text-muted-foreground group-data-[size=page]/empty:[&_svg:not([class*='size-'])]:size-10 group-data-[size=compact]/empty:[&_svg:not([class*='size-'])]:size-7",
      // 圆底图标
      icon: "rounded-full border group-data-[size=page]/empty:size-14 group-data-[size=page]/empty:[&_svg:not([class*='size-'])]:size-6 group-data-[size=compact]/empty:size-10 group-data-[size=compact]/empty:[&_svg:not([class*='size-'])]:size-5",
    },
    tone: {
      muted: "",
      brand: "",
      destructive: "",
      warning: "",
      success: "",
    },
  },
  compoundVariants: [
    { variant: "icon", tone: "muted", className: "bg-muted text-muted-foreground" },
    { variant: "icon", tone: "brand", className: "border-brand/25 bg-brand-soft text-brand" },
    { variant: "icon", tone: "destructive", className: "border-destructive/25 bg-destructive/10 text-destructive" },
    { variant: "icon", tone: "warning", className: "border-warning/25 bg-warning/10 text-warning" },
    { variant: "icon", tone: "success", className: "border-success/25 bg-success/10 text-success" },
    { variant: "default", tone: "brand", className: "text-brand" },
    { variant: "default", tone: "destructive", className: "text-destructive" },
    { variant: "default", tone: "warning", className: "text-warning" },
    { variant: "default", tone: "success", className: "text-success" },
  ],
  defaultVariants: { variant: "default", tone: "muted" },
})

/** 图标 / 插画. variant="icon" 时放进圆底; tone 给语义色 (失败用 destructive) */
function EmptyMedia({ className, variant = "default", tone = "muted", ...props }: React.ComponentProps<"div"> & VariantProps<typeof mediaVariants>) {
  return <div data-slot="empty-media" data-variant={variant} data-tone={tone} className={cn(mediaVariants({ variant, tone }), className)} {...props} />
}

export interface EmptyTitleProps extends React.ComponentProps<"h3"> {
  /** 标题级别 / 元素, 默认 h3; 放在已有 h2 的卡片里用 h3, 整页空状态可用 h2, 不想进标题大纲用 p / div */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div"
  /** 把样式交给唯一的子元素 (自己的标题组件) */
  asChild?: boolean
}

/** 一句话标题: 默认 <h3> */
function EmptyTitle({ className, as = "h3", asChild = false, ...props }: EmptyTitleProps) {
  const Comp = asChild ? Slot.Root : as
  return (
    <Comp
      data-slot="empty-title"
      className={cn("font-medium tracking-tight group-data-[size=compact]/empty:text-sm group-data-[size=page]/empty:text-lg", className)}
      {...props}
    />
  )
}

/** 说明: 为什么是空的, 下一步做什么. 里面的链接自动带下划线 */
function EmptyDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-balance text-muted-foreground group-data-[size=compact]/empty:-mt-1 group-data-[size=compact]/empty:max-w-xs group-data-[size=compact]/empty:text-[13px] group-data-[size=page]/empty:-mt-2 group-data-[size=page]/empty:max-w-sm group-data-[size=page]/empty:text-sm",
        "[&_a]:underline [&_a]:underline-offset-4 [&_a]:transition-colors [&_a:hover]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

/** 操作区: 按钮 / 链接 / 小提示, 居中换行排 */
function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn("flex w-full max-w-sm flex-wrap items-center justify-center gap-2 text-sm group-data-[size=page]/empty:mt-2 group-data-[size=compact]/empty:mt-1", className)}
      {...props}
    />
  )
}

export { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent, emptyVariants }
