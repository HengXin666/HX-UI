"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Toggle as TogglePrimitive } from "radix-ui";
import { SPACE, UI_CLASSES, VARIANT } from "../constants";
import { useRipple } from "./ripple";
import { cn } from "./utils";

const toggleVariants = cva(
	[
		"inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent text-[13px] font-medium whitespace-nowrap text-muted-foreground outline-none select-none",
		"transition-[color,background-color,border-color,transform] duration-(--duration-fast) ease-out active:translate-y-px",
		"hover:bg-accent/50 hover:text-foreground focus-visible:border-ring",
		"data-[state=on]:bg-accent data-[state=on]:text-foreground",
		"disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive",
		UI_CLASSES.svgSlot,
	].join(SPACE),
	{
		variants: {
			variant: {
				default: UI_CLASSES.transparent,
				outline: "border-border bg-transparent data-[state=on]:border-border",
			},
			size: {
				default: "h-8 min-w-8 px-2",
				sm: "h-7 min-w-7 px-1.5",
				lg: "h-9 min-w-9 px-2.5",
			},
		},
		defaultVariants: { variant: VARIANT.default, size: VARIANT.default },
	},
);

/**
 * 两态按钮 (按下 / 弹起), 例如工具条上的加粗 / 斜体.
 *
 * 按下态用 accent 底 + 前景色文字, 不用 primary 实底: 工具条里一排按下的蓝块太抢眼.
 * 与 Button 一样默认带点按水波纹, 传 ripple={false} 关闭.
 */
function Toggle({
	className,
	variant = VARIANT.default,
	size = VARIANT.default,
	ripple = true,
	onPointerDown,
	onKeyDown,
	...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
	VariantProps<typeof toggleVariants> & {
		/** 点按水波纹. 默认 true. */
		ripple?: boolean;
	}): React.JSX.Element {
	const rippleProps = useRipple<HTMLButtonElement>({ enabled: ripple, size: VARIANT.icon, onPointerDown, onKeyDown });
	return (
		<TogglePrimitive.Root
			data-slot="toggle"
			className={cn(toggleVariants({ variant, size, className }))}
			{...props}
			{...rippleProps}
		/>
	);
}

export { Toggle, toggleVariants };
