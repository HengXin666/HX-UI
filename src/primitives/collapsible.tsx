"use client";

import * as React from "react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { cn } from "./utils";

/**
 * 单个可折叠区域。
 *
 * 与 Accordion 的分工: Accordion 管"一组互斥的条目", Collapsible 管"一个能收起的块"。
 * 只有一个可折叠块时套 Accordion 会多出一层 item 语义与一套 roving 焦点, 没必要。
 *
 * 高度动画的取舍同 Accordion —— 关键帧而非 transition, 见 src/motion.css。
 */
function Collapsible(
	props: React.ComponentProps<typeof CollapsiblePrimitive.Root>,
): React.JSX.Element {
	return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger(
	props: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>,
): React.JSX.Element {
	return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />;
}

function CollapsibleContent({
	className,
	...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content>): React.JSX.Element {
	return (
		<CollapsiblePrimitive.Content
			data-slot="collapsible-content"
			className={cn(
				"overflow-hidden",
				"data-[state=open]:animate-[hx-collapse-down_200ms_ease-out] data-[state=closed]:animate-[hx-collapse-up_200ms_ease-out]",
				className,
			)}
			{...props}
		/>
	);
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };