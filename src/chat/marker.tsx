import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../primitives/utils";
import { ROLE, UI_CLASSES, VARIANT } from "../constants";

const markerVariants = cva("flex w-full items-center gap-2 text-[12px] text-muted-foreground", {
	variants: {
		variant: {
			default: "px-1",
			border: "rounded-lg border border-border px-3 py-2",
			separator:
				"before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border [&>[data-slot=marker-content]]:flex-none",
		},
		tone: {
			default: "",
			success: "text-success-fg",
			warning: "text-warning-fg",
			danger: "text-danger-fg",
			info: UI_CLASSES.link,
		},
	},
	defaultVariants: { variant: VARIANT.default, tone: VARIANT.default },
});

/**
 * 会话里的行内标记 (对标 shadcn Marker): 系统提示, 状态行, 带边框的说明行, 或带文字的分隔线.
 *
 * variant: default 普通一行, border 带边框的说明块, separator 两侧分隔线中间文字 (例如日期).
 * tone 用语义状态色. shimmer 让文字带一道扫光, 用于 "正在思考..." 这类进行中状态;
 * 系统要求减弱动效时扫光不动.
 */
function Marker({
	className,
	variant,
	tone,
	shimmer = false,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof markerVariants> & { shimmer?: boolean }): React.JSX.Element {
	return (
		<div
			role={ROLE.note}
			data-slot="marker"
			data-variant={variant}
			data-shimmer={shimmer || undefined}
			className={cn(markerVariants({ variant, tone }), "animate-in fade-in-0 duration-(--duration-base)", className)}
			{...props}
		/>
	);
}

function MarkerIcon({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element {
	return <span data-slot="marker-icon" className={cn("flex shrink-0 items-center [&_svg:not([class*='size-'])]:size-3.5", className)} {...props} />;
}

function MarkerContent({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element {
	return (
		<span
			data-slot="marker-content"
			className={cn(UI_CLASSES.truncate, className)}
			{...props}
		/>
	);
}

export { Marker, MarkerContent, MarkerIcon, markerVariants };
