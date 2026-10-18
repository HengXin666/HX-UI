"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { VARIANT } from "../constants";
import { useRipple } from "./ripple";
import { cn } from "./utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,opacity,transform] duration-(--duration-fast) ease-out outline-none select-none focus-visible:border-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default: "border-border bg-secondary text-foreground hover:bg-control-hover aria-expanded:bg-control-hover",
				primary: "bg-primary text-primary-foreground hover:bg-primary/90",
				outline:
					"border-border bg-transparent text-foreground hover:bg-accent/50 aria-expanded:bg-accent/50",
				secondary: "bg-secondary text-foreground hover:bg-control-hover",
				ghost: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
				destructive:
					"border-danger/40 bg-danger/10 text-danger-fg hover:border-danger/60 hover:bg-danger/20",
				link: "text-link underline-offset-4 hover:underline",
			},
			size: {
				default:
					"h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
				icon: "size-8",
				"icon-xs":
					"size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
				"icon-sm":
					"size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
				"icon-lg": "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

/** 不出波纹的变体: link 的视觉是一段文字, 波纹会让它看起来像按钮. */
const NO_RIPPLE_VARIANTS: ReadonlyArray<string> = [VARIANT.link];

/**
 * 按钮.
 *
 * ripple 默认开启 (link 变体除外), 传 ripple={false} 关闭; 图标尺寸自动用更淡的波纹.
 */
function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	ripple = true,
	onPointerDown,
	onKeyDown,
	type,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		/** 点按水波纹. 默认 true. */
		ripple?: boolean;
	}) {
	const Comp = asChild ? Slot.Root : "button";
	const rippleProps = useRipple<HTMLButtonElement>({
		enabled: ripple && !NO_RIPPLE_VARIANTS.includes(variant ?? ""),
		size: size?.startsWith(VARIANT.icon) ? VARIANT.icon : VARIANT.default,
		onPointerDown,
		onKeyDown,
	});

	return (
		<Comp
			// type 原样透传: 不改原生默认值 (下游表单里不写 type 的 Button 仍是 submit); 不提交表单的部件自己传 BUTTON_TYPE
			type={type}
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
			{...rippleProps}
		/>
	);
}

export { Button, buttonVariants };