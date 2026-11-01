"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { SPRING_TYPE } from "../constants/motion";
import { TABS_INDICATOR_DAMPING, TABS_INDICATOR_MASS, TABS_INDICATOR_STIFFNESS } from "../constants/polish";
import { rippleAttribute, useRipple } from "./ripple";
import { cn } from "./utils";

/**
 * 标签页。
 *
 * Radix 的 Tabs 只给了**行为** (roving focus / 方向键 / aria 关联), 样式全归使用方。
 * 这里给两种形态:
 * underline  默认。用在"同一个对象的几个视图"上 (概览 / 日志 / 配置),
 * 下划线是这类切换最轻的指示, 不额外占一层底色。
 * pill       装在边框容器里的小开关, 用在工具条上。它与 SegmentedControl
 * 长得像但**职责不同**: SegmentedControl 只切视图不切面板内容,
 * Tabs 负责把 TabsContent 与触发器做 aria 关联, 别用错。
 *
 * variant 由 TabsList 通过 context 下发给 trigger, 免得调用方两处都写、写岔了。
 *
 * animated (可选, 默认关) 同样由 TabsList 下发: 选中指示改成一个 motion 共享布局元素,
 * 切换时从旧标签滑到新标签. 不传时 trigger 的类名, 子节点与波纹挂法都和原来一致.
 */
type TabsVariant = "underline" | "pill";

interface TabsListState {
	readonly variant: TabsVariant;
	/** 打开滑动指示器时是本组标签的共享布局 id, 关闭时为 undefined. */
	readonly indicatorId?: string;
}

const TabsVariantContext = React.createContext<TabsListState>({ variant: "underline" });

/** 当前选中值. 只为滑动指示器判断 "谁是选中项"; Radix 不对外暴露这个值. */
const TabsValueContext = React.createContext<string | undefined>(undefined);

/** 指示器的弹簧: 偏硬, 不回弹出标签边界; 与 SegmentedControl 的滑块同一手感. */
const INDICATOR_SPRING = {
	type: SPRING_TYPE,
	stiffness: TABS_INDICATOR_STIFFNESS,
	damping: TABS_INDICATOR_DAMPING,
	mass: TABS_INDICATOR_MASS,
} as const;
const INDICATOR_INSTANT = { duration: 0 } as const;

/** 波纹裁剪层的选择器: 宿主不挂 overflow: hidden, 滑动途中的指示器才不会被裁掉. */
const RIPPLE_LAYER_SELECTOR = ":scope > [data-ripple]";

/**
 * 指示器形态. underline 是贴在列表 1px 底线上的 1px 主色线 (线条只用 1px);
 * pill 是铺满标签的浮起底, 暗色下用抬升表面而不是白色叠加.
 * isolate 让 -z-10 的指示器落在文字之下, 又不掉到列表底色后面.
 */
const INDICATOR_CLASS: Record<TabsVariant, string> = {
	underline: "pointer-events-none absolute inset-x-0 -bottom-0.5 -z-10 h-px bg-primary",
	pill: "pointer-events-none absolute inset-0 -z-10 rounded-[6px] bg-background shadow-xs dark:bg-surface-raised",
};

/** 打开指示器后, 静态的选中底线 / 选中底色交给指示器画, 这里把它们清掉. */
const ANIMATED_TRIGGER_CLASS: Record<TabsVariant, string> = {
	underline: "isolate data-[state=active]:border-transparent",
	pill: "isolate data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent",
};

const tabsListVariants = cva("inline-flex shrink-0 items-center", {
	variants: {
		variant: {
			underline: "gap-0.5 border-b border-border",
			pill: "gap-0.5 rounded-lg border border-border/60 bg-muted/40 p-0.5",
		},
	},
	defaultVariants: { variant: "underline" },
});

const tabsTriggerVariants = cva(
	[
		"relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-medium outline-none select-none transition-colors",
		"focus-visible:ring-1 focus-visible:ring-ring/60",
		"disabled:pointer-events-none disabled:opacity-50",
		"data-disabled:pointer-events-none data-disabled:opacity-50",
		"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
	].join(" "),
	{
		variants: {
			variant: {
				underline:
					"-mb-px h-8 border-b-2 border-transparent px-2.5 text-[length:var(--fs-sm-half)] text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground",
				pill: "h-7 rounded-[6px] px-2.5 text-[length:var(--fs-sm)] text-muted-foreground hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:data-[state=active]:bg-white/[0.12]",
			},
		},
		defaultVariants: { variant: "underline" },
	},
);

function Tabs({
	value,
	defaultValue,
	onValueChange,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root>): React.JSX.Element {
	// 只旁听非受控时的选中值供指示器使用; value / defaultValue / onValueChange 原样交给 Radix
	const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
	const handleChange = React.useCallback(
		(next: string) => {
			setUncontrolled(next);
			onValueChange?.(next);
		},
		[onValueChange],
	);
	return (
		<TabsValueContext.Provider value={value ?? uncontrolled}>
			<TabsPrimitive.Root
				data-slot="tabs"
				value={value}
				defaultValue={defaultValue}
				onValueChange={handleChange}
				{...props}
			/>
		</TabsValueContext.Provider>
	);
}

function TabsList({
	className,
	variant = "underline",
	animated = false,
	...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
	VariantProps<typeof tabsListVariants> & {
		/** 选中指示从旧标签滑到新标签 (motion 共享布局). 默认 false. */
		animated?: boolean;
	}): React.JSX.Element {
	const indicatorId = React.useId();
	const resolved = variant ?? "underline";
	const state = React.useMemo<TabsListState>(
		() => ({ variant: resolved, indicatorId: animated ? indicatorId : undefined }),
		[resolved, animated, indicatorId],
	);
	return (
		<TabsVariantContext.Provider value={state}>
			<TabsPrimitive.List
				data-slot="tabs-list"
				data-variant={variant}
				className={cn(tabsListVariants({ variant }), className)}
				{...props}
			/>
		</TabsVariantContext.Provider>
	);
}

function TabsTrigger({
	className,
	variant,
	ripple = true,
	onPointerDown,
	onKeyDown,
	children,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
	variant?: TabsVariant;
	/** 点按水波纹. 默认 true. */
	ripple?: boolean;
}): React.JSX.Element {
	const inherited = React.useContext(TabsVariantContext);
	const selected = React.useContext(TabsValueContext);
	const reduceMotion = useReducedMotion();
	const resolved = variant ?? inherited.variant;
	const indicatorId = inherited.indicatorId;
	const rippleProps = useRipple<HTMLButtonElement>(
		indicatorId === undefined
			? { enabled: ripple, onPointerDown, onKeyDown }
			: {
					enabled: ripple,
					onPointerDown,
					onKeyDown,
					container: (host) => host.querySelector<HTMLElement>(RIPPLE_LAYER_SELECTOR),
				},
	);
	if (indicatorId === undefined) {
		return (
			<TabsPrimitive.Trigger
				data-slot="tabs-trigger"
				data-variant={resolved}
				className={cn(tabsTriggerVariants({ variant: resolved }), className)}
				{...props}
				{...rippleProps}
			>
				{children}
			</TabsPrimitive.Trigger>
		);
	}
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			data-variant={resolved}
			className={cn(tabsTriggerVariants({ variant: resolved }), ANIMATED_TRIGGER_CLASS[resolved], className)}
			{...props}
			{...rippleProps}
		>
			{selected === props.value ? (
				<motion.span
					aria-hidden
					layoutId={indicatorId}
					className={INDICATOR_CLASS[resolved]}
					transition={reduceMotion ? INDICATOR_INSTANT : INDICATOR_SPRING}
				/>
			) : null}
			{ripple ? (
				<span aria-hidden data-ripple={rippleAttribute()} className="pointer-events-none absolute inset-0 rounded-[inherit]" />
			) : null}
			{children}
		</TabsPrimitive.Trigger>
	);
}

function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>): React.JSX.Element {
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			className={cn("outline-none", className)}
			{...props}
		/>
	);
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants, tabsTriggerVariants };
export type { TabsVariant };