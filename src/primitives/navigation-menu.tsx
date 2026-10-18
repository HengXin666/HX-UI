"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "./utils";
import { ARIA, SPACE, UI_CLASSES } from "../constants";

/**
 * 站点导航菜单: 顶部一排入口, 悬停或点击展开大面板.
 *
 * 面板在入口之间切换时, 视口 (NavigationMenuViewport) 的宽高跟着内容插值,
 * 内容按移动方向左右滑入 (radix 写 data-motion), 这是它与一排 Popover 的区别.
 * viewport={false} 时每个面板就地弹出, 不共用视口.
 */
function NavigationMenu({
	className,
	children,
	viewport = true,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & { viewport?: boolean }): React.JSX.Element {
	return (
		<NavigationMenuPrimitive.Root
			data-slot="navigation-menu"
			data-viewport={viewport}
			className={cn("group/navigation-menu relative flex max-w-max flex-1 items-center justify-center", className)}
			{...props}
		>
			{children}
			{viewport && <NavigationMenuViewport />}
		</NavigationMenuPrimitive.Root>
	);
}

function NavigationMenuList({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.List>): React.JSX.Element {
	return (
		<NavigationMenuPrimitive.List
			data-slot="navigation-menu-list"
			className={cn("group flex flex-1 list-none items-center justify-center gap-1", className)}
			{...props}
		/>
	);
}

function NavigationMenuItem({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Item>): React.JSX.Element {
	return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" className={cn(UI_CLASSES.relative, className)} {...props} />;
}

const navigationMenuTriggerStyle = cva(
	[
		"group inline-flex h-8 w-max items-center justify-center rounded-lg px-3 text-[13px] font-medium text-foreground outline-none",
		"transition-colors duration-(--duration-fast) hover:bg-accent/60 focus-visible:bg-accent/60",
		"disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent/50",
	].join(SPACE),
);

function NavigationMenuTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>): React.JSX.Element {
	return (
		<NavigationMenuPrimitive.Trigger
			data-slot="navigation-menu-trigger"
			className={cn(navigationMenuTriggerStyle(), className)}
			{...props}
		>
			{children}
			<ChevronDownIcon
				aria-hidden={ARIA.true}
				className="relative top-px ml-1 size-3 text-muted-foreground transition-transform duration-(--duration-base) group-data-[state=open]:rotate-180"
			/>
		</NavigationMenuPrimitive.Trigger>
	);
}

function NavigationMenuContent({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>): React.JSX.Element {
	return (
		<NavigationMenuPrimitive.Content
			data-slot="navigation-menu-content"
			className={cn(
				"top-0 left-0 w-full p-2 md:absolute md:w-auto",
				"data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out",
				"data-[motion=from-end]:slide-in-from-right-12 data-[motion=from-start]:slide-in-from-left-12",
				"data-[motion=to-end]:slide-out-to-right-12 data-[motion=to-start]:slide-out-to-left-12 duration-(--duration-base) ease-out",
				"group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden",
				"group-data-[viewport=false]/navigation-menu:rounded-xl group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:border-border",
				"group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:shadow-md",
				"group-data-[viewport=false]/navigation-menu:data-open:animate-in group-data-[viewport=false]/navigation-menu:data-open:fade-in-0 group-data-[viewport=false]/navigation-menu:data-open:zoom-in-95",
				"group-data-[viewport=false]/navigation-menu:data-closed:animate-out group-data-[viewport=false]/navigation-menu:data-closed:fade-out-0 group-data-[viewport=false]/navigation-menu:data-closed:zoom-out-95",
				className,
			)}
			{...props}
		/>
	);
}

function NavigationMenuViewport({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>): React.JSX.Element {
	return (
		<div className="absolute top-full left-0 isolate z-50 flex justify-center">
			<NavigationMenuPrimitive.Viewport
				data-slot="navigation-menu-viewport"
				className={cn(
					"relative mt-1.5 h-(--radix-navigation-menu-viewport-height) w-full origin-top-center overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-md",
					"transition-[width,height] duration-(--duration-base) ease-out md:w-(--radix-navigation-menu-viewport-width)",
					"data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
					className,
				)}
				{...props}
			/>
		</div>
	);
}

function NavigationMenuLink({ className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Link>): React.JSX.Element {
	return (
		<NavigationMenuPrimitive.Link
			data-slot="navigation-menu-link"
			className={cn(
				"flex flex-col gap-1 rounded-lg p-2 text-[13px] outline-none transition-colors duration-(--duration-fast)",
				"hover:bg-accent/60 focus-visible:bg-accent/60 data-[active=true]:bg-accent/50 data-[active=true]:text-foreground",
				"[&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

/** 当前入口下方的小三角指示. */
function NavigationMenuIndicator({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>): React.JSX.Element {
	return (
		<NavigationMenuPrimitive.Indicator
			data-slot="navigation-menu-indicator"
			className={cn(
				"top-full z-1 flex h-1.5 items-end justify-center overflow-hidden transition-[opacity,transform] duration-(--duration-base)",
				"data-[state=visible]:animate-in data-[state=visible]:fade-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out",
				className,
			)}
			{...props}
		>
			<div className="relative top-[60%] size-2 rotate-45 rounded-tl-sm border-t border-l border-border bg-popover" />
		</NavigationMenuPrimitive.Indicator>
	);
}

export {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuIndicator,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	NavigationMenuViewport,
	navigationMenuTriggerStyle,
};
