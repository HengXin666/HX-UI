"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "./utils";

/**
 * 标签页。
 *
 * Radix 的 Tabs 只给了**行为** (roving focus / 方向键 / aria 关联), 样式全归使用方。
 * 这里给两种形态:
 *   underline —— 默认。用在"同一个对象的几个视图"上 (概览 / 日志 / 配置),
 *                下划线是这类切换最轻的指示, 不额外占一层底色。
 *   pill      —— 装在边框容器里的小开关, 用在工具条上。它与 SegmentedControl
 *                长得像但**职责不同**: SegmentedControl 只切视图不切面板内容,
 *                Tabs 负责把 TabsContent 与触发器做 aria 关联, 别用错。
 *
 * variant 由 TabsList 通过 context 下发给 trigger, 免得调用方两处都写、写岔了。
 */
type TabsVariant = "underline" | "pill";

const TabsVariantContext = React.createContext<TabsVariant>("underline");

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

function Tabs(props: React.ComponentProps<typeof TabsPrimitive.Root>): React.JSX.Element {
	return <TabsPrimitive.Root data-slot="tabs" {...props} />;
}

function TabsList({
	className,
	variant = "underline",
	...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
	VariantProps<typeof tabsListVariants>): React.JSX.Element {
	return (
		<TabsVariantContext.Provider value={variant ?? "underline"}>
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
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
	variant?: TabsVariant;
}): React.JSX.Element {
	const inherited = React.useContext(TabsVariantContext);
	const resolved = variant ?? inherited;
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			data-variant={resolved}
			className={cn(tabsTriggerVariants({ variant: resolved }), className)}
			{...props}
		/>
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