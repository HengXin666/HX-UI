"use client";

import * as React from "react";
import { ChevronLeftIcon, MenuIcon, XIcon } from "lucide-react";
import { BUTTON_TYPE } from "../../constants";
import { SITE_CLASSES, SITE_DRAWER_SIDE } from "../../constants/site";
import { useControllableState } from "../../hooks/state/useControllableState";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "../../primitives/drawer";
import { cn } from "../../primitives/utils";
import { resolveSlots, type SlotProps } from "../slots";
import type { SiteNavItem } from "../types";
import { MobileNavLevel, MobileNavRootList, type MobileNavSlot } from "./mobile-nav-parts";

export type { MobileNavSlot };

/** open: 触发按钮名称; title: 抽屉标题与导航地标名; back: 返回上级按钮; close: 关闭按钮. */
export interface MobileNavLabels {
	open: string;
	title: string;
	back: string;
	close: string;
}

export interface MobileNavState {
	open: boolean;
	/** 当前钻取到的入口 id, 第一级为 null. */
	level: string | null;
}

export interface MobileNavProps extends SlotProps<MobileNavSlot, MobileNavState> {
	items: SiteNavItem[];
	labels: MobileNavLabels;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** 搜索入口 (例如 SearchOverlay 的触发器), 只在第一级显示. */
	search?: React.ReactNode;
	/** 账号区 (头像, 登录 / 注册按钮), 固定在抽屉底部. */
	account?: React.ReactNode;
	/** 替换触发按钮里的图标. */
	triggerIcon?: React.ReactNode;
	side?: (typeof SITE_DRAWER_SIDE)[keyof typeof SITE_DRAWER_SIDE];
	/** 点击链接后是否关闭抽屉, 默认 true. */
	closeOnNavigate?: boolean;
	ref?: React.Ref<HTMLDivElement>;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * 移动端导航抽屉, 底座是 primitives/drawer (vaul, 基于 radix Dialog).
 * 分级钻取: 有 groups 的入口进入第二级, 返回按钮回到第一级, 焦点在两级之间正确移动
 * (进入时落到返回按钮, 返回时落回来源入口). Esc 在第二级先返回上级, 在第一级关闭抽屉,
 * 关闭后焦点归还触发按钮 (radix Dialog 行为); 抽屉内焦点陷阱与外部 inert 也由 radix 处理.
 *
 * root slot 与 ref 指向抽屉面板 (radix Root 无 DOM, 契约 4.4 / 6.2). 不用 forwardRef: React 19 中 ref 是普通 prop.
 *
 * .agents/notes/implemented/feature/2026-11-02-site-shell-parts.md
 */
export function MobileNav({
	items,
	labels,
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	search,
	account,
	triggerIcon,
	side = SITE_DRAWER_SIDE.right,
	closeOnNavigate = true,
	ref,
	classNames,
	styles,
	className,
	style,
}: MobileNavProps): React.JSX.Element {
	const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
	const [levelId, setLevelId] = React.useState<string | null>(null);
	const level = items.find((item) => item.id === levelId) ?? null;
	const slots = resolveSlots({ classNames, styles }, { open, level: level?.id ?? null });
	const backRef = React.useRef<HTMLButtonElement>(null);
	const itemNodes = React.useRef(new Map<string, HTMLButtonElement>());
	const returnTo = React.useRef<string | null>(null);

	React.useEffect(() => {
		if (level) {
			backRef.current?.focus();
		} else if (returnTo.current) {
			itemNodes.current.get(returnTo.current)?.focus();
			returnTo.current = null;
		}
	}, [level]);

	const changeOpen = (next: boolean): void => {
		setOpen(next);
		if (!next) {
			setLevelId(null);
			returnTo.current = null;
		}
	};
	const enter = (id: string): void => {
		returnTo.current = id;
		setLevelId(id);
	};
	const navigate = (): void => {
		if (closeOnNavigate) changeOpen(false);
	};
	const registerItem = (id: string, node: HTMLButtonElement | null): void => {
		if (node) itemNodes.current.set(id, node);
		else itemNodes.current.delete(id);
	};

	return (
		<Drawer open={open} onOpenChange={changeOpen} direction={side}>
			<DrawerTrigger asChild>
				<button
					type={BUTTON_TYPE}
					aria-label={labels.open}
					data-slot="mobile-nav-trigger"
					className={slots.className("trigger", cn(SITE_CLASSES.iconButton, SITE_CLASSES.focus))}
					style={slots.style("trigger")}
				>
					{triggerIcon ?? <MenuIcon aria-hidden className={SITE_CLASSES.icon} />}
				</button>
			</DrawerTrigger>
			<DrawerContent
				ref={ref}
				aria-describedby={undefined}
				onEscapeKeyDown={(event) => {
					if (!level) return;
					event.preventDefault();
					setLevelId(null);
				}}
				data-slot="mobile-nav"
				data-level={level ? level.id : undefined}
				className={slots.className("root", "flex flex-col", className)}
				style={slots.style("root", style)}
			>
				<div data-slot="mobile-nav-header" className={slots.className("header", "flex items-center gap-2 border-b border-border p-3")} style={slots.style("header")}>
					{level ? (
						<button
							ref={backRef}
							type={BUTTON_TYPE}
							onClick={() => setLevelId(null)}
							data-slot="mobile-nav-back-button"
							className={slots.className("back-button", cn("inline-flex items-center gap-1 rounded-(--radius-md) px-2 py-1", SITE_CLASSES.link, SITE_CLASSES.focus))}
							style={slots.style("back-button")}
						>
							<ChevronLeftIcon aria-hidden className={cn(SITE_CLASSES.icon, "rtl:rotate-180")} />
							{labels.back}
						</button>
					) : null}
					<DrawerTitle data-slot="mobile-nav-title" className={slots.className("title", "min-w-0 flex-1 truncate")} style={slots.style("title")}>
						{level ? level.label : labels.title}
					</DrawerTitle>
					<DrawerClose asChild>
						<button
							type={BUTTON_TYPE}
							aria-label={labels.close}
							data-slot="mobile-nav-close-button"
							className={slots.className("close-button", cn(SITE_CLASSES.iconButton, SITE_CLASSES.focus))}
							style={slots.style("close-button")}
						>
							<XIcon aria-hidden className={SITE_CLASSES.icon} />
						</button>
					</DrawerClose>
				</div>
				{search && !level ? (
					<div data-slot="mobile-nav-search" className={slots.className("search", "px-3 pt-3")} style={slots.style("search")}>
						{search}
					</div>
				) : null}
				<nav aria-label={labels.title} data-slot="mobile-nav-body" className={slots.className("body", "min-h-0 flex-1 overflow-y-auto p-3")} style={slots.style("body")}>
					{level ? (
						<MobileNavLevel item={level} slots={slots} onNavigate={navigate} />
					) : (
						<MobileNavRootList items={items} slots={slots} onEnter={enter} onNavigate={navigate} registerItem={registerItem} />
					)}
				</nav>
				{account ? (
					<div data-slot="mobile-nav-account" className={slots.className("account", "border-t border-border p-3")} style={slots.style("account")}>
						{account}
					</div>
				) : null}
			</DrawerContent>
		</Drawer>
	);
}
