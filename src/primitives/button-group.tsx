import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { Separator } from "./separator";
import { cn } from "./utils";
import { ORIENTATION, ROLE, SPACE, TAG } from "../constants";

const buttonGroupVariants = cva(
	[
		"flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10",
		"has-[>[data-slot=button-group]]:gap-2 [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
	].join(SPACE),
	{
		variants: {
			orientation: {
				horizontal:
					"[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
				vertical:
					"flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
			},
		},
		defaultVariants: { orientation: ORIENTATION.horizontal },
	},
);

/**
 * 按钮组: 把相关的按钮 / 输入框 / 下拉触发器拼成一条, 相邻边框合并成一条 1px.
 *
 * 子元素只要求是有边框的控件 (Button 的 default / outline, Input, SelectTrigger);
 * 嵌套 ButtonGroup 时组与组之间留 2 个单位间距.
 */
function ButtonGroup({
	className,
	orientation,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>): React.JSX.Element {
	return (
		<div
			role={ROLE.group}
			data-slot="button-group"
			data-orientation={orientation}
			className={cn(buttonGroupVariants({ orientation }), className)}
			{...props}
		/>
	);
}

/** 组内的说明文字块 (例如 "https://"), 与按钮同高同边框. */
function ButtonGroupText({
	className,
	asChild = false,
	...props
}: React.ComponentProps<"div"> & { asChild?: boolean }): React.JSX.Element {
	const Comp = asChild ? Slot.Root : TAG.div;
	return (
		<Comp
			data-slot="button-group-text"
			className={cn(
				"flex items-center gap-2 rounded-lg border border-border bg-muted px-2.5 text-[13px] font-medium text-muted-foreground",
				"[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		/>
	);
}

/** 组内分隔线: 用于两个无边框按钮 (ghost / secondary) 之间. */
function ButtonGroupSeparator({
	className,
	orientation = ORIENTATION.vertical,
	...props
}: React.ComponentProps<typeof Separator>): React.JSX.Element {
	return (
		<Separator
			data-slot="button-group-separator"
			orientation={orientation}
			className={cn("relative m-0! self-stretch bg-border data-[orientation=vertical]:h-auto", className)}
			{...props}
		/>
	);
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };
