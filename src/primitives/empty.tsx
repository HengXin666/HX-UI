import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";
import { SLOT, UI_CLASSES, VARIANT } from "../constants";

/**
 * 空状态 (组合式, 对标 shadcn Empty).
 *
 * EmptyState 是按 kind (empty / error / loading / denied) 出固定文案的快捷写法;
 * 这一组用于自定义图标, 标题, 说明与操作按钮的排版. 内容整体淡入上浮.
 */
function Empty({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot={SLOT.empty}
			className={cn(
				"flex min-w-0 flex-1 flex-col items-center justify-center gap-5 rounded-xl border-dashed border-border p-6 text-center text-balance md:p-10",
				"animate-in fade-in-0 slide-in-from-bottom-1 duration-(--duration-base)",
				className,
			)}
			{...props}
		/>
	);
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="empty-header" className={cn("flex max-w-sm flex-col items-center gap-2 text-center", className)} {...props} />;
}

const emptyMediaVariants = cva(
	"mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: UI_CLASSES.transparent,
				icon: "size-10 rounded-lg border border-border bg-secondary text-muted-foreground [&_svg:not([class*='size-'])]:size-5",
			},
		},
		defaultVariants: { variant: VARIANT.default },
	},
);

function EmptyMedia({
	className,
	variant = VARIANT.default,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>): React.JSX.Element {
	return <div data-slot="empty-icon" data-variant={variant} className={cn(emptyMediaVariants({ variant, className }))} {...props} />;
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="empty-title" className={cn("text-[15px] font-medium tracking-tight text-heading", className)} {...props} />;
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">): React.JSX.Element {
	return (
		<div
			data-slot="empty-description"
			className={cn("text-[13px]/relaxed text-muted-foreground [&>a]:text-link [&>a]:underline [&>a]:underline-offset-4", className)}
			{...props}
		/>
	);
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="empty-content" className={cn("flex w-full max-w-sm min-w-0 flex-col items-center gap-3 text-[13px] text-balance", className)} {...props} />;
}

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle };
