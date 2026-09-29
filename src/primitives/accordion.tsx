"use client";

import * as React from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { cn } from "./utils";

/**
 * 折叠面板组。
 *
 * 高度动画走**关键帧 + radix 的实测高度变量**, 不走 CSS transition。
 * 原因是硬约束而不是偏好: radix 的 Presence 靠 getComputedStyle 判定"还能不能卸",
 * CSS transition 在部分路径上不被识别, 收起时会直接卸载 —— 表现是展开有动画、
 * 收起瞬间消失。关键帧每次都能被认定, 于是两端都有动画。
 * 关键帧定义在 src/motion.css。
 *
 * 变体用 ease-out / 200ms: 与 CollapsePanel 同一档节奏, 一组页面里展开手感要一致。
 */
function Accordion(props: React.ComponentProps<typeof AccordionPrimitive.Root>): React.JSX.Element {
	return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
	className,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>): React.JSX.Element {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn("border-b border-border/60 last:border-b-0", className)}
			{...props}
		/>
	);
}

function AccordionTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>): React.JSX.Element {
	return (
		<AccordionPrimitive.Header data-slot="accordion-header" className="flex">
			<AccordionPrimitive.Trigger
				data-slot="accordion-trigger"
				className={cn(
					"group/accordion flex flex-1 items-center justify-between gap-2 py-2.5 text-left text-[length:var(--fs-sm-half)] font-medium text-foreground outline-none transition-colors hover:text-foreground/80 focus-visible:ring-1 focus-visible:ring-ring/60",
					className,
				)}
				{...props}
			>
				{children}
				<span
					aria-hidden
					className="icon-[solar--alt-arrow-down-linear] size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/accordion:rotate-180"
				/>
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

function AccordionContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>): React.JSX.Element {
	return (
		<AccordionPrimitive.Content
			data-slot="accordion-content"
			className={cn(
				"overflow-hidden text-[length:var(--fs-sm)] text-muted-foreground",
				"data-[state=open]:animate-[hx-collapse-down_200ms_ease-out] data-[state=closed]:animate-[hx-collapse-up_200ms_ease-out]",
				className,
			)}
			{...props}
		>
			<div className="pb-2.5">{children}</div>
		</AccordionPrimitive.Content>
	);
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };