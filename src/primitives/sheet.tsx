"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";
import { Button } from "./button";
import { MODAL_OVERLAY } from "./styles";
import { cn } from "./utils";
import { SIDE, UI_CLASSES, VARIANT } from "../constants";

/** 侧滑面板从哪一侧进入. */
type SheetSide = "top" | "right" | "bottom" | "left";

/**
 * 每一侧的定位与进出场. 进入 ease-out, 退出 ease-in 且更快:
 * 用户已经决定关掉了, 拖长退场只会挡住下一步操作.
 */
const SIDE_CLASS: Record<SheetSide, string> = {
	right:
		"inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm data-open:slide-in-from-right data-closed:slide-out-to-right",
	left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm data-open:slide-in-from-left data-closed:slide-out-to-left",
	top: "inset-x-0 top-0 h-auto border-b data-open:slide-in-from-top data-closed:slide-out-to-top",
	bottom: "inset-x-0 bottom-0 h-auto border-t data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
};

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>): React.JSX.Element {
	return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: React.ComponentProps<typeof SheetPrimitive.Trigger>): React.JSX.Element {
	return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>): React.JSX.Element {
	return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal(props: React.ComponentProps<typeof SheetPrimitive.Portal>): React.JSX.Element {
	return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>): React.JSX.Element {
	return <SheetPrimitive.Overlay data-slot="sheet-overlay" className={cn(MODAL_OVERLAY, className)} {...props} />;
}

/**
 * 侧滑面板 (Sheet).
 *
 * 建在 radix Dialog 上, 有焦点陷阱与 Esc 关闭; 与 Drawer 的区别: Drawer 是 vaul 的
 * 可拖拽底部抽屉 (移动端手势), Sheet 是桌面端从四边滑入的面板 (设置 / 详情 / 筛选).
 * 面板高度不超过视口, 超长内容在面板内纵向滚动, 底部操作始终可达.
 */
function SheetContent({
	className,
	children,
	side = SIDE.right,
	showCloseButton = true,
	overlayClassName,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
	side?: SheetSide;
	showCloseButton?: boolean;
	overlayClassName?: string;
}): React.JSX.Element {
	return (
		<SheetPortal>
			<SheetOverlay className={overlayClassName} />
			<SheetPrimitive.Content
				data-slot="sheet-content"
				data-side={side}
				className={cn(
					"no-drag fixed z-50 flex max-h-svh flex-col gap-4 overflow-y-auto overscroll-contain border-border bg-popover text-sm text-popover-foreground shadow-lg outline-none",
					"duration-(--duration-slow) ease-out data-closed:duration-(--duration-base) data-closed:ease-in",
					"data-open:animate-in data-closed:animate-out",
					SIDE_CLASS[side],
					className,
				)}
				{...props}
			>
				{children}
				{showCloseButton && (
					<SheetPrimitive.Close data-slot="sheet-close" asChild>
						<Button variant={VARIANT.ghost} size={VARIANT.iconSm} className="absolute top-3 right-3">
							<XIcon />
							<span className={UI_CLASSES.srOnly}>关闭</span>
						</Button>
					</SheetPrimitive.Close>
				)}
			</SheetPrimitive.Content>
		</SheetPortal>
	);
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5 p-4 pr-12", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>): React.JSX.Element {
	return (
		<SheetPrimitive.Title
			data-slot="sheet-title"
			className={cn("text-base leading-none font-medium text-heading", className)}
			{...props}
		/>
	);
}

function SheetDescription({
	className,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Description>): React.JSX.Element {
	return (
		<SheetPrimitive.Description
			data-slot="sheet-description"
			className={cn(UI_CLASSES.description, className)}
			{...props}
		/>
	);
}

export {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetOverlay,
	SheetPortal,
	SheetTitle,
	SheetTrigger,
	type SheetSide,
};
