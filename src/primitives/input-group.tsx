"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "./button";
import { cn } from "./utils";
import { BUTTON_TYPE, ROLE, SIZE, TAG, VARIANT } from "../constants";

/**
 * 输入组: 一个输入框加前后缀 (图标 / 文字 / 按钮 / 快捷键), 外观是一个整体.
 *
 * 边框画在外层 InputGroup 上, 里面的 InputGroupInput 去掉自己的边框;
 * 聚焦反馈用 has-[:focus-visible] 落到外层边框, 与 Input 的反馈一致.
 * 点击前后缀区域时把焦点交给输入框, 不让点击落空.
 */
function InputGroup({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="input-group"
			role={ROLE.group}
			className={cn(
				"group/input-group relative flex h-8 w-full min-w-0 items-center rounded-lg border border-border/60 shadow-none outline-none dark:bg-input/20",
				"transition-[border-color,background-color] duration-(--duration-fast) hover:border-border",
				"has-[>textarea]:h-auto has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-end]]:h-auto",
				"has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-end]]:flex-col",
				"has-[[data-slot=input-group-control]:focus-visible]:border-ring/60",
				"has-[[data-slot][aria-invalid=true]]:border-destructive/70",
				"has-[[data-slot=input-group-control]:disabled]:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

const inputGroupAddonVariants = cva(
	"flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-[13px] font-medium text-muted-foreground select-none [&>kbd]:rounded-[4px] [&>svg:not([class*='size-'])]:size-4",
	{
		variants: {
			align: {
				"inline-start": "order-first pl-2.5 has-[>button]:-ml-1",
				"inline-end": "order-last pr-2.5 has-[>button]:-mr-1",
				"block-start": "order-first w-full justify-start px-2.5 pt-2",
				"block-end": "order-last w-full justify-start px-2.5 pb-2",
			},
		},
		defaultVariants: { align: "inline-start" },
	},
);

function InputGroupAddon({
	className,
	align = "inline-start",
	onClick,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>): React.JSX.Element {
	return (
		<div
			role={ROLE.group}
			data-slot="input-group-addon"
			data-align={align}
			className={cn(inputGroupAddonVariants({ align }), className)}
			{...props}
			onClick={(event) => {
				onClick?.(event);
				if (event.defaultPrevented || (event.target as HTMLElement).closest(TAG.button)) {
					return;
				}
				event.currentTarget.parentElement?.querySelector<HTMLElement>("[data-slot=input-group-control]")?.focus();
			}}
		/>
	);
}

/** 组内按钮: 默认 ghost + xs, 贴合输入框高度. */
function InputGroupButton({
	className,
	type = BUTTON_TYPE,
	variant = VARIANT.ghost,
	size = SIZE.xs,
	...props
}: React.ComponentProps<typeof Button>): React.JSX.Element {
	return (
		<Button
			type={type}
			data-slot="input-group-button"
			variant={variant}
			size={size}
			className={cn("shadow-none", className)}
			{...props}
		/>
	);
}

/** 组内纯文字前后缀 (例如 "https://" 或 ".com"). */
function InputGroupText({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element {
	return (
		<span
			data-slot="input-group-text"
			className={cn("flex items-center gap-2 text-[13px] text-muted-foreground [&_svg:not([class*='size-'])]:size-4", className)}
			{...props}
		/>
	);
}

const CONTROL_CLASS =
	"flex-1 min-w-0 rounded-none border-0 bg-transparent px-2.5 text-base shadow-none outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm";

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">): React.JSX.Element {
	return <input data-slot="input-group-control" className={cn(CONTROL_CLASS, "h-full py-1", className)} {...props} />;
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<"textarea">): React.JSX.Element {
	return (
		<textarea
			data-slot="input-group-control"
			className={cn(CONTROL_CLASS, "min-h-16 w-full resize-none py-2", className)}
			{...props}
		/>
	);
}

export {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	InputGroupTextarea,
	inputGroupAddonVariants,
};
