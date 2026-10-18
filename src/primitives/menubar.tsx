"use client";

import * as React from "react";
import { Menubar as MenubarPrimitive } from "radix-ui";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { useRipple } from "./ripple";
import {
	MENU_CHECK_ITEM, MENU_CONTENT, MENU_INDICATOR, MENU_ITEM, MENU_LABEL,
	MENU_SEPARATOR, MENU_SHORTCUT, MENU_SUB_OPEN, POPUP_MOTION, POPUP_SURFACE,
} from "./styles";
import { cn } from "./utils";
import { ALIGN, POPUP_OFFSET, POPUP_OFFSET_STEP, VARIANT } from "../constants";

/**
 * 菜单栏: 桌面应用式的 "文件 / 编辑 / 视图" 一排菜单.
 *
 * 打开一个菜单后左右方向键与鼠标横扫会直接切到相邻菜单, 这是它与一排 DropdownMenu 的区别.
 * 菜单项外观与 DropdownMenu / ContextMenu 同一套.
 */
function Menubar({ className, ...props }: React.ComponentProps<typeof MenubarPrimitive.Root>): React.JSX.Element {
	return (
		<MenubarPrimitive.Root
			data-slot="menubar"
			className={cn("flex h-9 items-center gap-1 rounded-lg border border-border bg-card p-1", className)}
			{...props}
		/>
	);
}

function MenubarMenu(props: React.ComponentProps<typeof MenubarPrimitive.Menu>): React.JSX.Element {
	return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />;
}

function MenubarGroup(props: React.ComponentProps<typeof MenubarPrimitive.Group>): React.JSX.Element {
	return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />;
}

function MenubarPortal(props: React.ComponentProps<typeof MenubarPrimitive.Portal>): React.JSX.Element {
	return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />;
}

function MenubarRadioGroup(props: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>): React.JSX.Element {
	return <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />;
}

function MenubarSub(props: React.ComponentProps<typeof MenubarPrimitive.Sub>): React.JSX.Element {
	return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;
}

function MenubarTrigger({ className, ...props }: React.ComponentProps<typeof MenubarPrimitive.Trigger>): React.JSX.Element {
	return (
		<MenubarPrimitive.Trigger
			data-slot="menubar-trigger"
			className={cn(
				"flex items-center rounded-md px-2 py-1 text-[13px] font-medium outline-hidden select-none",
				"transition-colors duration-(--duration-fast) hover:bg-accent/60 focus:bg-accent/60 data-[state=open]:bg-accent",
				className,
			)}
			{...props}
		/>
	);
}

function MenubarContent({
	className,
	align = ALIGN.start,
	alignOffset = -4,
	sideOffset = POPUP_OFFSET + POPUP_OFFSET_STEP,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.Content>): React.JSX.Element {
	return (
		<MenubarPortal>
			<MenubarPrimitive.Content
				data-slot="menubar-content"
				align={align}
				alignOffset={alignOffset}
				sideOffset={sideOffset}
				className={cn(POPUP_SURFACE, MENU_CONTENT, POPUP_MOTION, "min-w-[12rem] origin-(--radix-menubar-content-transform-origin)", className)}
				{...props}
			/>
		</MenubarPortal>
	);
}

function MenubarItem({
	className,
	inset,
	variant = VARIANT.default,
	ripple = true,
	onPointerDown,
	onKeyDown,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.Item> & {
	inset?: boolean;
	variant?: "default" | "destructive";
	/** 点按水波纹. 默认 true. */
	ripple?: boolean;
}): React.JSX.Element {
	const rippleProps = useRipple<HTMLDivElement>({ enabled: ripple, onPointerDown, onKeyDown });
	return (
		<MenubarPrimitive.Item
			data-slot="menubar-item"
			data-inset={inset || undefined}
			data-variant={variant}
			className={cn(MENU_ITEM, className)}
			{...props}
			{...rippleProps}
		/>
	);
}

function MenubarCheckboxItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem>): React.JSX.Element {
	return (
		<MenubarPrimitive.CheckboxItem data-slot="menubar-checkbox-item" className={cn(MENU_ITEM, MENU_CHECK_ITEM, className)} {...props}>
			<span className={MENU_INDICATOR}>
				<MenubarPrimitive.ItemIndicator>
					<CheckIcon />
				</MenubarPrimitive.ItemIndicator>
			</span>
			{children}
		</MenubarPrimitive.CheckboxItem>
	);
}

function MenubarRadioItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioItem>): React.JSX.Element {
	return (
		<MenubarPrimitive.RadioItem data-slot="menubar-radio-item" className={cn(MENU_ITEM, MENU_CHECK_ITEM, className)} {...props}>
			<span className={MENU_INDICATOR}>
				<MenubarPrimitive.ItemIndicator>
					<CircleIcon className="size-2 fill-current" />
				</MenubarPrimitive.ItemIndicator>
			</span>
			{children}
		</MenubarPrimitive.RadioItem>
	);
}

function MenubarLabel({
	className,
	inset,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.Label> & { inset?: boolean }): React.JSX.Element {
	return <MenubarPrimitive.Label data-slot="menubar-label" data-inset={inset || undefined} className={cn(MENU_LABEL, className)} {...props} />;
}

function MenubarSeparator({ className, ...props }: React.ComponentProps<typeof MenubarPrimitive.Separator>): React.JSX.Element {
	return <MenubarPrimitive.Separator data-slot="menubar-separator" className={cn(MENU_SEPARATOR, className)} {...props} />;
}

function MenubarShortcut({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element {
	return <span data-slot="menubar-shortcut" className={cn(MENU_SHORTCUT, className)} {...props} />;
}

function MenubarSubTrigger({
	className,
	inset,
	children,
	...props
}: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & { inset?: boolean }): React.JSX.Element {
	return (
		<MenubarPrimitive.SubTrigger
			data-slot="menubar-sub-trigger"
			data-inset={inset || undefined}
			className={cn(MENU_ITEM, MENU_SUB_OPEN, className)}
			{...props}
		>
			{children}
			<ChevronRightIcon className="ml-auto text-muted-foreground" />
		</MenubarPrimitive.SubTrigger>
	);
}

function MenubarSubContent({ className, ...props }: React.ComponentProps<typeof MenubarPrimitive.SubContent>): React.JSX.Element {
	return (
		<MenubarPortal>
			<MenubarPrimitive.SubContent
				data-slot="menubar-sub-content"
				className={cn(POPUP_SURFACE, MENU_CONTENT, POPUP_MOTION, "origin-(--radix-menubar-content-transform-origin)", className)}
				{...props}
			/>
		</MenubarPortal>
	);
}

export {
	Menubar,
	MenubarCheckboxItem,
	MenubarContent,
	MenubarGroup,
	MenubarItem,
	MenubarLabel,
	MenubarMenu,
	MenubarPortal,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
};
