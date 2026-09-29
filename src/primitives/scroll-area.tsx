"use client";

import * as React from "react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { cn } from "./utils";

/**
 * 自定义滚动容器。
 *
 * 什么时候需要它: 容器里要放**带圆角或浮层的窄条内容**时。原生 overflow 的滚动条
 * 在 Linux / Windows 上是一条几十像素宽的实心条, 压在圆角卡片边上会露出直角。
 * 什么时候不需要: 整页滚动, 或者内容区本来就宽 —— 多一层 viewport 只是多一层开销。
 *
 * type 默认改成 "hover" (radix 默认 "hover" 也是), 因为库用在设置页与面板里,
 * 常驻滚动条在空内容时是一条孤零零的灰线。需要常驻就传 type="always"。
 */
function ScrollArea({
	className,
	children,
	type = "hover",
	scrollHideDelay = 600,
	...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>): React.JSX.Element {
	return (
		<ScrollAreaPrimitive.Root
			data-slot="scroll-area"
			type={type}
			scrollHideDelay={scrollHideDelay}
			className={cn("relative overflow-hidden", className)}
			{...props}
		>
			<ScrollAreaPrimitive.Viewport
				data-slot="scroll-area-viewport"
				className="size-full rounded-[inherit] outline-none focus-visible:ring-1 focus-visible:ring-ring/60"
			>
				{children}
			</ScrollAreaPrimitive.Viewport>
			<ScrollBar />
			<ScrollBar orientation="horizontal" />
			<ScrollAreaPrimitive.Corner />
		</ScrollAreaPrimitive.Root>
	);
}

function ScrollBar({
	className,
	orientation = "vertical",
	...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>): React.JSX.Element {
	return (
		<ScrollAreaPrimitive.Scrollbar
			data-slot="scroll-area-scrollbar"
			orientation={orientation}
			className={cn(
				"flex touch-none select-none p-px transition-colors duration-150",
				orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent",
				orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent",
				className,
			)}
			{...props}
		>
			<ScrollAreaPrimitive.Thumb
				data-slot="scroll-area-thumb"
				className="relative flex-1 rounded-full bg-border transition-colors hover:bg-muted-foreground/40"
			/>
		</ScrollAreaPrimitive.Scrollbar>
	);
}

export { ScrollArea, ScrollBar };