"use client";

import * as React from "react";
import { ContextMenu as ContextMenuPrimitive } from "radix-ui";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { useRipple } from "./ripple";
import {
	MENU_CHECK_ITEM, MENU_CONTENT, MENU_INDICATOR, MENU_ITEM, MENU_LABEL,
	MENU_SEPARATOR, MENU_SHORTCUT, MENU_SUB_OPEN, POPUP_MOTION, POPUP_SURFACE,
} from "./styles";
import { cn } from "./utils";
import { VARIANT } from "../constants";

/**
 * 右键菜单 (组合式, 对标 shadcn ContextMenu).
 *
 * 库里已有声明式的 ContextMenu (传 MenuAction[] 即可), 下游一直在用, 名字不能让出;
 * 组合式的根因此叫 ContextMenuRoot, 其余部件沿用 shadcn 的名字.
 * 需要勾选项 / 单选组 / 子菜单 / 自定义内容时用这一组, 只要一列动作时仍用声明式的.
 */
function ContextMenuRoot(props: React.ComponentProps<typeof ContextMenuPrimitive.Root>): React.JSX.Element {
	return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuTrigger(props: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>): React.JSX.Element {
	return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />;
}

function ContextMenuGroup(props: React.ComponentProps<typeof ContextMenuPrimitive.Group>): React.JSX.Element {
	return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />;
}

function ContextMenuPortal(props: React.ComponentProps<typeof ContextMenuPrimitive.Portal>): React.JSX.Element {
	return <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />;
}

function ContextMenuSub(props: React.ComponentProps<typeof ContextMenuPrimitive.Sub>): React.JSX.Element {
	return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />;
}

function ContextMenuRadioGroup(props: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>): React.JSX.Element {
	return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />;
}

function ContextMenuContent({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Content>): React.JSX.Element {
	return (
		<ContextMenuPrimitive.Portal>
			<ContextMenuPrimitive.Content
				data-slot="context-menu-content"
				className={cn(
					POPUP_SURFACE,
					MENU_CONTENT,
					POPUP_MOTION,
					"max-h-(--radix-context-menu-content-available-height) origin-(--radix-context-menu-content-transform-origin) overflow-y-auto",
					className,
				)}
				{...props}
			/>
		</ContextMenuPrimitive.Portal>
	);
}

type MenuItemExtras = {
	/** 左侧留出与勾选项对齐的缩进. */
	inset?: boolean;
	/** destructive 时文字转危险色. */
	variant?: "default" | "destructive";
	/** 点按水波纹. 默认 true. */
	ripple?: boolean;
};

function ContextMenuItem({
	className,
	inset,
	variant = VARIANT.default,
	ripple = true,
	onPointerDown,
	onKeyDown,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & MenuItemExtras): React.JSX.Element {
	const rippleProps = useRipple<HTMLDivElement>({ enabled: ripple, onPointerDown, onKeyDown });
	return (
		<ContextMenuPrimitive.Item
			data-slot="context-menu-item"
			data-inset={inset || undefined}
			data-variant={variant}
			className={cn(MENU_ITEM, className)}
			{...props}
			{...rippleProps}
		/>
	);
}

function ContextMenuSubTrigger({
	className,
	inset,
	children,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & { inset?: boolean }): React.JSX.Element {
	return (
		<ContextMenuPrimitive.SubTrigger
			data-slot="context-menu-sub-trigger"
			data-inset={inset || undefined}
			className={cn(MENU_ITEM, MENU_SUB_OPEN, className)}
			{...props}
		>
			{children}
			<ChevronRightIcon className="ml-auto text-muted-foreground" />
		</ContextMenuPrimitive.SubTrigger>
	);
}

function ContextMenuSubContent({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>): React.JSX.Element {
	return (
		<ContextMenuPrimitive.Portal>
			<ContextMenuPrimitive.SubContent
				data-slot="context-menu-sub-content"
				className={cn(POPUP_SURFACE, MENU_CONTENT, POPUP_MOTION, "origin-(--radix-context-menu-content-transform-origin)", className)}
				{...props}
			/>
		</ContextMenuPrimitive.Portal>
	);
}

function ContextMenuCheckboxItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>): React.JSX.Element {
	return (
		<ContextMenuPrimitive.CheckboxItem
			data-slot="context-menu-checkbox-item"
			className={cn(MENU_ITEM, MENU_CHECK_ITEM, className)}
			{...props}
		>
			<span className={MENU_INDICATOR}>
				<ContextMenuPrimitive.ItemIndicator>
					<CheckIcon />
				</ContextMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</ContextMenuPrimitive.CheckboxItem>
	);
}

function ContextMenuRadioItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>): React.JSX.Element {
	return (
		<ContextMenuPrimitive.RadioItem
			data-slot="context-menu-radio-item"
			className={cn(MENU_ITEM, MENU_CHECK_ITEM, className)}
			{...props}
		>
			<span className={MENU_INDICATOR}>
				<ContextMenuPrimitive.ItemIndicator>
					<CircleIcon className="size-2 fill-current" />
				</ContextMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</ContextMenuPrimitive.RadioItem>
	);
}

function ContextMenuLabel({
	className,
	inset,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Label> & { inset?: boolean }): React.JSX.Element {
	return (
		<ContextMenuPrimitive.Label
			data-slot="context-menu-label"
			data-inset={inset || undefined}
			className={cn(MENU_LABEL, className)}
			{...props}
		/>
	);
}

function ContextMenuSeparator({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Separator>): React.JSX.Element {
	return <ContextMenuPrimitive.Separator data-slot="context-menu-separator" className={cn(MENU_SEPARATOR, className)} {...props} />;
}

function ContextMenuShortcut({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element {
	return <span data-slot="context-menu-shortcut" className={cn(MENU_SHORTCUT, className)} {...props} />;
}

export {
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuPortal,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuRoot,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
};
