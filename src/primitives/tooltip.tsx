"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "./utils";

/**
 * 悬浮提示。
 *
 * 两处与 radix 默认不同, 都是针对"工具型界面"改的:
 *   1. Provider 默认 delayDuration 700ms —— 想确认一个图标按钮是什么要等将近一秒。
 *      这里压到 0; 需要滞后的场景由使用方显式传。
 *   2. 面板用前景色反相 (bg-foreground / text-background)。提示是"附在指针旁的
 *      临时标签", 不该和 popover 那种常驻面板抢同一层视觉重量 —— 靠反相拉开层级,
 *      而不是靠阴影。
 */
function TooltipProvider({
	delayDuration = 0,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>): React.JSX.Element {
	return (
		<TooltipPrimitive.Provider
			data-slot="tooltip-provider"
			delayDuration={delayDuration}
			{...props}
		/>
	);
}

function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>): React.JSX.Element {
	return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger(
	props: React.ComponentProps<typeof TooltipPrimitive.Trigger>,
): React.JSX.Element {
	return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
	className,
	sideOffset = 6,
	showArrow = true,
	children,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
	showArrow?: boolean;
}): React.JSX.Element {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				data-slot="tooltip-content"
				sideOffset={sideOffset}
				className={cn(
					"no-drag z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-[length:var(--fs-xs-half)] font-medium text-background",
					"data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
					"data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-100",
					className,
				)}
				{...props}
			>
				{children}
				{showArrow ? (
					<TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
				) : null}
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	);
}

/**
 * 最常见的那个场景: 一个图标按钮, 只差一句说明。
 * 少了它, 每个使用方都要手拼 Root / Trigger asChild / Portal 三层。
 *
 * 它**自带 Provider**。这一点是实测逼出来的: radix 的 Tooltip.Root 在 Provider 之外
 * 会直接抛 \`Tooltip must be used within TooltipProvider\` 并把整棵子树打白 ——
 * 一个"只差一句说明"的便利组件不该让使用方去背这条约束。需要共享延迟策略时
 * 仍然可以自己在外面套 Provider (内层会读到外层的那一个)。
 */
function TooltipHint({
	label,
	side = "top",
	delayDuration = 0,
	contentClassName,
	children,
}: {
	label: React.ReactNode;
	side?: React.ComponentProps<typeof TooltipPrimitive.Content>["side"];
	delayDuration?: number;
	contentClassName?: string;
	children: React.ReactNode;
}): React.JSX.Element {
	return (
		<TooltipProvider delayDuration={delayDuration}>
			<Tooltip>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent side={side} className={contentClassName}>
					{label}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export { Tooltip, TooltipContent, TooltipHint, TooltipProvider, TooltipTrigger };