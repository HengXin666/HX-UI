"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { MENU_SEPARATOR } from "./styles";
import { cn } from "./utils";
import { UI_CLASSES } from "../constants";

/**
 * 命令面板 (cmdk).
 *
 * 输入即过滤, 方向键移动高亮, Enter 选中; 分组标题与快捷键提示与菜单同一套外观.
 * 内嵌在页面里直接用 Command, 做 Cmd+K 全局面板时用 CommandDialog.
 */
function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>): React.JSX.Element {
	return (
		<CommandPrimitive
			data-slot="command"
			className={cn("flex size-full flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground", className)}
			{...props}
		/>
	);
}

function CommandDialog({
	title = "命令面板",
	description = "搜索要执行的命令",
	children,
	className,
	showCloseButton = false,
	...props
}: React.ComponentProps<typeof Dialog> & {
	title?: string;
	description?: string;
	className?: string;
	showCloseButton?: boolean;
}): React.JSX.Element {
	return (
		<Dialog {...props}>
			<DialogContent className={cn("max-w-[min(32rem,calc(100%-2rem))] overflow-hidden p-0", className)} showCloseButton={showCloseButton}>
				<DialogHeader className={UI_CLASSES.srOnly}>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-input-wrapper]_svg]:size-4 [&_[cmdk-item]]:py-2">
					{children}
				</Command>
			</DialogContent>
		</Dialog>
	);
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>): React.JSX.Element {
	return (
		<div data-slot="command-input-wrapper" className="flex h-10 items-center gap-2 border-b border-border px-3">
			<SearchIcon className="size-4 shrink-0 text-muted-foreground" />
			<CommandPrimitive.Input
				data-slot="command-input"
				className={cn(
					"flex h-10 w-full bg-transparent py-3 text-[13px] outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				{...props}
			/>
		</div>
	);
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>): React.JSX.Element {
	return (
		<CommandPrimitive.List
			data-slot="command-list"
			className={cn(
				"max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto p-1",
				"h-(--cmdk-list-height) transition-[height] duration-(--duration-fast) ease-out",
				className,
			)}
			{...props}
		/>
	);
}

function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>): React.JSX.Element {
	return (
		<CommandPrimitive.Empty
			data-slot="command-empty"
			className={cn("py-6 text-center text-[13px] text-muted-foreground", className)}
			{...props}
		/>
	);
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>): React.JSX.Element {
	return (
		<CommandPrimitive.Group
			data-slot="command-group"
			className={cn(
				"overflow-hidden text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1",
				"[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>): React.JSX.Element {
	return <CommandPrimitive.Separator data-slot="command-separator" className={cn(MENU_SEPARATOR, className)} {...props} />;
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>): React.JSX.Element {
	return (
		<CommandPrimitive.Item
			data-slot="command-item"
			className={cn(
				"relative flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] outline-hidden select-none",
				"transition-colors duration-(--duration-fast) data-[selected=true]:bg-accent/60 data-[selected=true]:text-foreground",
				"data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function CommandShortcut({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element {
	return (
		<span
			data-slot="command-shortcut"
			className={cn("ml-auto font-mono text-[11px] tracking-widest text-muted-foreground", className)}
			{...props}
		/>
	);
}

export {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
};
