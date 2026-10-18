"use client";

import * as React from "react";
import { PanelLeftIcon } from "lucide-react";
import { Slot } from "radix-ui";
import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import { useSidebar } from "./sidebar";
import { cn } from "./utils";
import { BUTTON_TYPE, ROLE, SLOT, STEP_BACK, TAG, UI_CLASSES, VARIANT } from "../constants";

/**
 * 侧栏的版式件 (对标 shadcn): 开合按钮, 边缘拖拽条, 主内容区, 头 / 尾 / 分隔 / 内容区, 分组.
 * 从 sidebar.tsx 与 sidebar-menu.tsx 拆出, 两个文件都守在单文件行数上限之内;
 * 状态与 Provider 仍在 sidebar.tsx, 菜单项仍在 sidebar-menu.tsx.
 */

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>): React.JSX.Element {
	const { toggleSidebar } = useSidebar();
	return (
		<Button
			type={BUTTON_TYPE}
			data-sidebar={SLOT.trigger}
			data-slot="sidebar-trigger"
			variant={VARIANT.ghost}
			size={VARIANT.iconSm}
			className={className}
			onClick={(event) => {
				onClick?.(event);
				toggleSidebar();
			}}
			{...props}
		>
			<PanelLeftIcon />
			<span className={UI_CLASSES.srOnly}>切换侧栏</span>
		</Button>
	);
}

/** 侧栏边缘的细长拖拽区: 点击切换开合, 悬停显示 1px 提示线. */
function SidebarRail({ className, ...props }: React.ComponentProps<"button">): React.JSX.Element {
	const { toggleSidebar } = useSidebar();
	return (
		<button
			type={BUTTON_TYPE}
			data-sidebar="rail"
			data-slot="sidebar-rail"
			aria-label="切换侧栏"
			tabIndex={STEP_BACK}
			onClick={toggleSidebar}
			title="切换侧栏"
			className={cn(
				"absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-colors duration-(--duration-fast) sm:flex",
				"after:absolute after:inset-y-0 after:left-1/2 after:w-px hover:after:bg-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0",
				"in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
				"[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
				className,
			)}
			{...props}
		/>
	);
}

/** 侧栏旁边的主内容区. variant="inset" 时它是一块圆角面板. */
function SidebarInset({ className, ...props }: React.ComponentProps<"main">): React.JSX.Element {
	return (
		<main
			data-slot="sidebar-inset"
			className={cn(
				"relative flex w-full flex-1 flex-col bg-background",
				"md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:border-border",
				"md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>): React.JSX.Element {
	return <Input data-slot="sidebar-input" data-sidebar={SLOT.input} className={cn("h-8 w-full bg-background", className)} {...props} />;
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="sidebar-header" data-sidebar="header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />;
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="sidebar-footer" data-sidebar="footer" className={cn("flex flex-col gap-2 p-2", className)} {...props} />;
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>): React.JSX.Element {
	return <Separator data-slot="sidebar-separator" data-sidebar={SLOT.separator} className={cn("mx-2 w-auto bg-border", className)} {...props} />;
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="sidebar-content"
			data-sidebar="content"
			className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden", className)}
			{...props}
		/>
	);
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="sidebar-group" data-sidebar={ROLE.group} className={cn("relative flex w-full min-w-0 flex-col p-2", className)} {...props} />;
}

function SidebarGroupLabel({
	className,
	asChild = false,
	...props
}: React.ComponentProps<"div"> & { asChild?: boolean }): React.JSX.Element {
	const Comp = asChild ? Slot.Root : TAG.div;
	return (
		<Comp
			data-slot="sidebar-group-label"
			data-sidebar="group-label"
			className={cn(
				"flex h-8 shrink-0 items-center rounded-md px-2 text-[11px] font-medium text-muted-foreground outline-hidden",
				"transition-[margin,opacity] duration-(--duration-base) ease-out group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
				"[&>svg]:size-4 [&>svg]:shrink-0",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarGroupAction({
	className,
	asChild = false,
	...props
}: React.ComponentProps<"button"> & { asChild?: boolean }): React.JSX.Element {
	const Comp = asChild ? Slot.Root : TAG.button;
	return (
		<Comp
			type={asChild ? undefined : BUTTON_TYPE}
			data-slot="sidebar-group-action"
			data-sidebar="group-action"
			className={cn(
				"absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-muted-foreground outline-hidden",
				"transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/60 [&>svg]:size-4 [&>svg]:shrink-0",
				UI_CLASSES.iconHidden,
				className,
			)}
			{...props}
		/>
	);
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="sidebar-group-content" data-sidebar="group-content" className={cn("w-full text-[13px]", className)} {...props} />;
}

export {
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInput,
	SidebarInset,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
};
