"use client";

import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { Button } from "./button";
import { MODAL_MOTION, MODAL_OVERLAY } from "./styles";
import { cn } from "./utils";
import { TONE_VARIANT, UI_CLASSES, VARIANT } from "../constants";

/**
 * 警示对话框 (组合式).
 *
 * 与 Dialog 的区别: 点遮罩不关闭, 必须在 "取消 / 确认" 里二选一, 用于不可撤销的操作.
 * 只要 "一句话问一下, 拿到 true / false" 时用 ConfirmDialog 或命令式 confirmDialog(),
 * 需要自定义内容 (输入确认名, 附带勾选项) 时用这一组.
 */
function AlertDialog(props: React.ComponentProps<typeof AlertDialogPrimitive.Root>): React.JSX.Element {
	return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger(props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>): React.JSX.Element {
	return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal(props: React.ComponentProps<typeof AlertDialogPrimitive.Portal>): React.JSX.Element {
	return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogOverlay({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>): React.JSX.Element {
	return <AlertDialogPrimitive.Overlay data-slot="alert-dialog-overlay" className={cn(MODAL_OVERLAY, className)} {...props} />;
}

function AlertDialogContent({
	className,
	size = VARIANT.default,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & { size?: "default" | "sm" }): React.JSX.Element {
	return (
		<AlertDialogPortal>
			<AlertDialogOverlay />
			<AlertDialogPrimitive.Content
				data-slot="alert-dialog-content"
				data-size={size}
				className={cn(
					"group/alert-dialog no-drag fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-popover p-4 text-sm text-popover-foreground shadow-lg outline-none",
					"max-w-[min(26rem,calc(100%-2rem))] data-[size=sm]:max-w-[min(20rem,calc(100%-2rem))]",
					MODAL_MOTION,
					className,
				)}
				{...props}
			/>
		</AlertDialogPortal>
	);
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="alert-dialog-header" className={cn(UI_CLASSES.grid, className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="alert-dialog-footer"
			className={cn(
				"-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t border-border bg-muted/50 p-4 sm:flex-row sm:justify-end",
				"group-data-[size=sm]/alert-dialog:grid group-data-[size=sm]/alert-dialog:grid-cols-2",
				className,
			)}
			{...props}
		/>
	);
}

/** 标题前的图标位 (例如警示三角), 颜色由调用方用语义类传入. */
function AlertDialogMedia({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="alert-dialog-media"
			className={cn("mb-1 inline-flex size-10 items-center justify-center rounded-lg bg-muted [&_svg:not([class*='size-'])]:size-5", className)}
			{...props}
		/>
	);
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>): React.JSX.Element {
	return (
		<AlertDialogPrimitive.Title
			data-slot="alert-dialog-title"
			className={cn("text-base leading-none font-medium text-heading", className)}
			{...props}
		/>
	);
}

function AlertDialogDescription({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>): React.JSX.Element {
	return (
		<AlertDialogPrimitive.Description
			data-slot="alert-dialog-description"
			className={cn(UI_CLASSES.description, className)}
			{...props}
		/>
	);
}

/** 确认按钮: 默认 primary, 危险操作传 variant={TONE_VARIANT.destructive}. */
function AlertDialogAction({
	className,
	variant = VARIANT.primary,
	size,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
	Pick<React.ComponentProps<typeof Button>, "variant" | "size">): React.JSX.Element {
	return (
		<Button variant={variant} size={size} asChild>
			<AlertDialogPrimitive.Action data-slot="alert-dialog-action" className={className} {...props} />
		</Button>
	);
}

function AlertDialogCancel({
	className,
	variant = TONE_VARIANT.outline,
	size,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> &
	Pick<React.ComponentProps<typeof Button>, "variant" | "size">): React.JSX.Element {
	return (
		<Button variant={variant} size={size} asChild>
			<AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" className={className} {...props} />
		</Button>
	);
}

export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogOverlay,
	AlertDialogPortal,
	AlertDialogTitle,
	AlertDialogTrigger,
};
