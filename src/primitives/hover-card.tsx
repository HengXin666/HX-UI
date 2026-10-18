"use client";

import * as React from "react";
import { HoverCard as HoverCardPrimitive } from "radix-ui";
import { POPUP_MOTION, POPUP_SURFACE } from "./styles";
import { cn } from "./utils";
import { ALIGN, POPUP_OFFSET, UI_NUMBERS } from "../constants";

/**
 * 悬停卡片: 鼠标停在链接 / 头像上时预览详情.
 *
 * 只是 "看一眼" 的补充信息, 内容里不放必须操作的控件: 触屏与键盘用户拿不到悬停.
 * 默认 openDelay 400ms, 扫过不会误弹; closeDelay 150ms, 鼠标能从触发器移进卡片.
 */
function HoverCard({
	openDelay = UI_NUMBERS.hoverOpenDelay,
	closeDelay = UI_NUMBERS.hoverCloseDelay,
	...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>): React.JSX.Element {
	return <HoverCardPrimitive.Root data-slot="hover-card" openDelay={openDelay} closeDelay={closeDelay} {...props} />;
}

function HoverCardTrigger(props: React.ComponentProps<typeof HoverCardPrimitive.Trigger>): React.JSX.Element {
	return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
}

function HoverCardContent({
	className,
	align = ALIGN.center,
	sideOffset = POPUP_OFFSET,
	...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>): React.JSX.Element {
	return (
		<HoverCardPrimitive.Portal data-slot="hover-card-portal">
			<HoverCardPrimitive.Content
				data-slot="hover-card-content"
				align={align}
				sideOffset={sideOffset}
				className={cn(
					POPUP_SURFACE,
					POPUP_MOTION,
					"w-64 origin-(--radix-hover-card-content-transform-origin) p-3 text-sm",
					className,
				)}
				{...props}
			/>
		</HoverCardPrimitive.Portal>
	);
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
