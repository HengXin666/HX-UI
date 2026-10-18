"use client";

import * as React from "react";
import { PanelLeftIcon } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./sheet";
import { cn } from "./utils";
import { ARIA, BUTTON_TYPE, EVENT, OPEN_STATE, SIDE, SIDEBAR_SHORTCUT, SLOT, STEP_BACK, TONE_VARIANT, UI_CLASSES, VARIANT } from "../constants";

/** 侧栏展开宽度, 收成图标条时的宽度, 移动端抽屉宽度. */
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const MOBILE_QUERY = "(max-width: 767px)";

type SidebarState = "expanded" | "collapsed";

interface SidebarContextValue {
	state: SidebarState;
	open: boolean;
	setOpen: (open: boolean) => void;
	openMobile: boolean;
	setOpenMobile: (open: boolean) => void;
	isMobile: boolean;
	toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

/** 读侧栏状态与开关. 必须在 SidebarProvider 之内调用. */
function useSidebar(): SidebarContextValue {
	const context = React.useContext(SidebarContext);
	if (!context) {
		throw new Error("useSidebar 必须在 <SidebarProvider> 内使用");
	}
	return context;
}

/** 视口是否为移动端宽度; 首帧按桌面渲染, 挂载后按 matchMedia 校正. */
function useIsMobile(): boolean {
	const [mobile, setMobile] = React.useState(false);
	React.useEffect(() => {
		const query = window.matchMedia(MOBILE_QUERY);
		const sync = (): void => setMobile(query.matches);
		sync();
		query.addEventListener(EVENT.change, sync);
		return () => query.removeEventListener(EVENT.change, sync);
	}, []);
	return mobile;
}

/**
 * 侧栏 (组合式, 对标 shadcn Sidebar).
 *
 * SidebarProvider 持有开合状态 (受控 open / onOpenChange 或非受控 defaultOpen),
 * 并注册 Cmd/Ctrl+B 快捷键; 移动端宽度下 Sidebar 自动改为 Sheet 抽屉.
 * 库里已有的 SidebarNavItemButton / CollapsibleRail / AppFrame 是固定版式的快捷件, 继续可用;
 * 这一组用于需要 "可收成图标条 + 分组 + 子菜单 + 移动端抽屉" 的应用外壳.
 */
function SidebarProvider({
	defaultOpen = true,
	open: openProp,
	onOpenChange,
	className,
	style,
	children,
	...props
}: React.ComponentProps<"div"> & {
	defaultOpen?: boolean;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}): React.JSX.Element {
	const isMobile = useIsMobile();
	const [openMobile, setOpenMobile] = React.useState(false);
	const [inner, setInner] = React.useState(defaultOpen);
	const open = openProp ?? inner;
	const setOpen = React.useCallback(
		(value: boolean) => {
			if (openProp === undefined) {
				setInner(value);
			}
			onOpenChange?.(value);
		},
		[openProp, onOpenChange],
	);
	const toggleSidebar = React.useCallback(() => {
		if (isMobile) {
			setOpenMobile((value) => !value);
		} else {
			setOpen(!open);
		}
	}, [isMobile, open, setOpen]);

	React.useEffect(() => {
		const onKeyDown = (event: KeyboardEvent): void => {
			if (event.key === SIDEBAR_SHORTCUT && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				toggleSidebar();
			}
		};
		window.addEventListener(EVENT.keydown, onKeyDown);
		return () => window.removeEventListener(EVENT.keydown, onKeyDown);
	}, [toggleSidebar]);

	const state: SidebarState = open ? OPEN_STATE.expanded : OPEN_STATE.collapsed;
	const value = React.useMemo<SidebarContextValue>(
		() => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
		[state, open, setOpen, isMobile, openMobile, toggleSidebar],
	);

	return (
		<SidebarContext.Provider value={value}>
			<div
				data-slot="sidebar-wrapper"
				style={{ "--sidebar-width": SIDEBAR_WIDTH, "--sidebar-width-icon": SIDEBAR_WIDTH_ICON, ...style } as React.CSSProperties}
				className={cn("group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-muted", className)}
				{...props}
			>
				{children}
			</div>
		</SidebarContext.Provider>
	);
}

function Sidebar({
	side = SIDE.left,
	variant = TONE_VARIANT.sidebar,
	collapsible = OPEN_STATE.offcanvas,
	className,
	children,
	...props
}: React.ComponentProps<"div"> & {
	side?: "left" | "right";
	variant?: "sidebar" | "floating" | "inset";
	collapsible?: "offcanvas" | "icon" | "none";
}): React.JSX.Element {
	const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
	/** floating 与 inset 两种外观四周留白, 收成图标条时宽度要把留白算进去. */
	const padded = variant === TONE_VARIANT.floating || variant === TONE_VARIANT.inset;

	if (collapsible === OPEN_STATE.none) {
		return (
			<div data-slot={SLOT.sidebar} className={cn("flex h-full w-(--sidebar-width) flex-col bg-card text-foreground", className)} {...props}>
				{children}
			</div>
		);
	}

	if (isMobile) {
		return (
			<Sheet open={openMobile} onOpenChange={setOpenMobile}>
				<SheetContent
					data-sidebar={SLOT.sidebar}
					data-slot={SLOT.sidebar}
					data-mobile={ARIA.true}
					showCloseButton={false}
					className="w-(--sidebar-width) bg-card p-0 text-foreground [&>button]:hidden"
					style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
					side={side}
				>
					<SheetHeader className={UI_CLASSES.srOnly}>
						<SheetTitle>侧栏</SheetTitle>
						<SheetDescription>移动端侧栏导航</SheetDescription>
					</SheetHeader>
					<div className="flex size-full flex-col">{children}</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<div
			className="group peer hidden text-foreground md:block"
			data-state={state}
			data-collapsible={state === OPEN_STATE.collapsed ? collapsible : ""}
			data-variant={variant}
			data-side={side}
			data-slot={SLOT.sidebar}
		>
			<div
				data-slot="sidebar-gap"
				className={cn(
					"relative w-(--sidebar-width) bg-transparent transition-[width] duration-(--duration-base) ease-out",
					"group-data-[collapsible=offcanvas]:w-0 group-data-[side=right]:rotate-180",
					padded
						? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
						: "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
				)}
			/>
			<div
				data-slot="sidebar-container"
				className={cn(
					"fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-(--duration-base) ease-out md:flex",
					side === SIDE.left
						? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
						: "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
					padded
						? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
						: "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
					className,
				)}
				{...props}
			>
				<div
					data-sidebar={SLOT.sidebar}
					data-slot="sidebar-inner"
					className="flex size-full flex-col bg-card group-data-[variant=floating]:rounded-xl group-data-[variant=floating]:border group-data-[variant=floating]:border-border group-data-[variant=floating]:shadow-sm"
				>
					{children}
				</div>
			</div>
		</div>
	);
}

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>): React.JSX.Element {
	const { toggleSidebar } = useSidebar();
	return (
		<Button
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

export {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarInput,
	SidebarInset,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
	useIsMobile,
	useSidebar,
};
