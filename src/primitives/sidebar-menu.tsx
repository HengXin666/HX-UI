"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { useRipple } from "./ripple";
import { useSidebar } from "./sidebar";
import { Skeleton } from "./skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "./utils";
import { ALIGN, BUTTON_TYPE, HASH_MULTIPLIER, OPEN_STATE, SIDE, SIZE, SPACE, TAG, UI_CLASSES, UI_NUMBERS, VARIANT, isString } from "../constants";

/**
 * 侧栏里的菜单项 (对标 shadcn SidebarMenu); 分组 SidebarGroup* 在 sidebar-parts.tsx.
 *
 * 收成图标条 (collapsible="icon") 时: 分组标题淡出, 菜单项只剩图标, 文字改由 tooltip 显示,
 * 角标与子菜单隐藏. 菜单项默认带水波纹, 当前页用 isActive 标记.
 */
function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">): React.JSX.Element {
	return <ul data-slot="sidebar-menu" data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-px", className)} {...props} />;
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">): React.JSX.Element {
	return <li data-slot="sidebar-menu-item" data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props} />;
}

const sidebarMenuButtonVariants = cva(
	[
		"peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-[13px] text-foreground outline-hidden",
		"transition-[width,height,padding,background-color,color] duration-(--duration-fast) ease-out",
		"hover:bg-accent/60 focus-visible:ring-1 focus-visible:ring-ring/60 active:bg-accent",
		"disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
		"group-has-data-[sidebar=menu-action]/menu-item:pr-8 data-[state=open]:hover:bg-accent/60",
		"data-[active=true]:bg-primary/10 data-[active=true]:font-semibold data-[active=true]:ring-1 data-[active=true]:ring-primary/25 data-[active=true]:ring-inset",
		"group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!",
		"[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground",
	].join(SPACE),
	{
		variants: {
			variant: {
				default: "",
				outline: "border border-border bg-background hover:border-border",
			},
			size: {
				default: "h-8",
				sm: "h-7 text-[12px]",
				lg: "h-12 group-data-[collapsible=icon]:p-0!",
			},
		},
		defaultVariants: { variant: VARIANT.default, size: VARIANT.default },
	},
);

function SidebarMenuButton({
	asChild = false,
	isActive = false,
	variant = VARIANT.default,
	size = VARIANT.default,
	tooltip,
	ripple = true,
	onPointerDown,
	onKeyDown,
	className,
	...props
}: React.ComponentProps<"button"> & {
	asChild?: boolean;
	isActive?: boolean;
	/** 收成图标条时悬停显示的文字. */
	tooltip?: string | React.ComponentProps<typeof TooltipContent>;
	/** 点按水波纹. 默认 true. */
	ripple?: boolean;
} & VariantProps<typeof sidebarMenuButtonVariants>): React.JSX.Element {
	const Comp = asChild ? Slot.Root : TAG.button;
	const { isMobile, state } = useSidebar();
	const rippleProps = useRipple<HTMLButtonElement>({ enabled: ripple, onPointerDown, onKeyDown });
	const button = (
		<Comp
			type={asChild ? undefined : BUTTON_TYPE}
			data-slot="sidebar-menu-button"
			data-sidebar="menu-button"
			data-size={size}
			data-active={isActive}
			className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
			{...props}
			{...rippleProps}
		/>
	);
	if (!tooltip) {
		return button;
	}
	const content = isString(tooltip) ? { children: tooltip } : tooltip;
	return (
		<Tooltip>
			<TooltipTrigger asChild>{button}</TooltipTrigger>
			<TooltipContent side={SIDE.right} align={ALIGN.center} hidden={state !== OPEN_STATE.collapsed || isMobile} {...content} />
		</Tooltip>
	);
}

function SidebarMenuAction({
	className,
	asChild = false,
	showOnHover = false,
	...props
}: React.ComponentProps<"button"> & { asChild?: boolean; showOnHover?: boolean }): React.JSX.Element {
	const Comp = asChild ? Slot.Root : TAG.button;
	return (
		<Comp
			type={asChild ? undefined : BUTTON_TYPE}
			data-slot="sidebar-menu-action"
			data-sidebar="menu-action"
			className={cn(
				"absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-muted-foreground outline-hidden",
				"transition-[color,background-color,opacity] duration-(--duration-fast) hover:bg-accent hover:text-foreground [&>svg]:size-4 [&>svg]:shrink-0",
				UI_CLASSES.iconHidden,
				showOnHover && "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="sidebar-menu-badge"
			data-sidebar="menu-badge"
			className={cn(
				"pointer-events-none absolute top-1.5 right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-[11px] font-medium text-muted-foreground tabular-nums select-none",
				UI_CLASSES.iconHidden,
				className,
			)}
			{...props}
		/>
	);
}

function SidebarMenuSkeleton({
	className,
	showIcon = false,
	...props
}: React.ComponentProps<"div"> & { showIcon?: boolean }): React.JSX.Element {
	/** 宽度由 useId 派生: 服务端与客户端算出同一个值, hydration 不会因随机数不一致而报错. */
	const id = React.useId();
	const width = React.useMemo(() => {
		let hash = 0;
		for (const char of id) {
			hash = (hash * HASH_MULTIPLIER + char.charCodeAt(0)) % UI_NUMBERS.skeletonSpread;
		}
		return `${hash + UI_NUMBERS.skeletonMin}%`;
	}, [id]);
	return (
		<div data-slot="sidebar-menu-skeleton" data-sidebar="menu-skeleton" className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)} {...props}>
			{showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
			<Skeleton className="h-4 max-w-(--skeleton-width) flex-1" style={{ "--skeleton-width": width } as React.CSSProperties} />
		</div>
	);
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">): React.JSX.Element {
	return (
		<ul
			data-slot="sidebar-menu-sub"
			data-sidebar="menu-sub"
			className={cn(
				"mx-3.5 flex min-w-0 translate-x-px flex-col gap-px border-l border-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">): React.JSX.Element {
	return <li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" className={cn("group/menu-sub-item relative", className)} {...props} />;
}

function SidebarMenuSubButton({
	asChild = false,
	size = SIZE.md,
	isActive = false,
	className,
	...props
}: React.ComponentProps<"a"> & { asChild?: boolean; size?: "sm" | "md"; isActive?: boolean }): React.JSX.Element {
	const Comp = asChild ? Slot.Root : TAG.a;
	return (
		<Comp
			data-slot="sidebar-menu-sub-button"
			data-sidebar="menu-sub-button"
			data-size={size}
			data-active={isActive}
			className={cn(
				"flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-foreground outline-hidden",
				"transition-colors duration-(--duration-fast) hover:bg-accent/60 focus-visible:ring-1 focus-visible:ring-ring/60",
				"data-[active=true]:bg-accent data-[active=true]:font-medium data-[size=md]:text-[13px] data-[size=sm]:text-[12px]",
				"[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export {
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	sidebarMenuButtonVariants,
};
