"use client";

import * as React from "react";
import { SITE_CLASSES } from "../../constants/site";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "../../primitives/navigation-menu";
import { cn } from "../../primitives/utils";
import { currentPage, resolveSlots, type SlotProps } from "../slots";
import type { SiteNavItem } from "../types";
import { MegaMenuPanel, type MegaMenuSlot } from "./mega-menu-parts";

export type { MegaMenuSlot };

/** nav: 导航地标的可访问名称 (<nav aria-label>). */
export interface MegaMenuLabels {
	nav: string;
}

export interface MegaMenuProps
	extends Omit<React.ComponentProps<typeof NavigationMenu>, "children" | "aria-label">,
		SlotProps<MegaMenuSlot> {
	/** 有 groups 的入口展开多列面板, 否则渲染为顶层链接. */
	items: SiteNavItem[];
	labels: MegaMenuLabels;
}

/**
 * 多列分组下拉导航, 底座是 primitives/navigation-menu (radix NavigationMenu).
 *
 * 键盘 (radix 提供, 对齐 APG Disclosure Navigation): Tab / 方向键在顶层入口间移动, Enter / Space / ArrowDown
 * 打开面板并可 Tab 进入, Esc 关闭面板且焦点归还对应入口; 面板内链接选中后自动关闭.
 * 打开的入口 value 即 item.id, 可用 value / defaultValue / onValueChange 受控 (原样交给 radix, 契约 2.3).
 *
 * 不用 forwardRef: React 19 中 ref 是普通 prop (契约 6.1), ref 指向 <nav>.
 *
 * .agents/notes/implemented/feature/2026-11-02-site-shell-parts.md
 */
export function MegaMenu({ items, labels, classNames, styles, className, style, ...props }: MegaMenuProps): React.JSX.Element {
	const slots = resolveSlots({ classNames, styles }, undefined);
	return (
		<NavigationMenu
			{...props}
			aria-label={labels.nav}
			data-slot="mega-menu"
			className={slots.className("root", "", className)}
			style={slots.style("root", style)}
		>
			<NavigationMenuList data-slot="mega-menu-list" className={slots.className("list")} style={slots.style("list")}>
				{items.map((item) => (
					<NavigationMenuItem key={item.id} value={item.id} data-slot="mega-menu-item" className={slots.className("item")} style={slots.style("item")}>
						{item.groups?.length ? (
							<>
								<NavigationMenuTrigger data-slot="mega-menu-trigger" className={slots.className("trigger", SITE_CLASSES.focus)} style={slots.style("trigger")}>
									{item.label}
								</NavigationMenuTrigger>
								<NavigationMenuContent data-slot="mega-menu-content" className={slots.className("content", "p-0")} style={slots.style("content")}>
									<MegaMenuPanel item={item} slots={slots} />
								</NavigationMenuContent>
							</>
						) : (
							<NavigationMenuLink asChild active={item.current}>
								<a
									href={item.href}
									aria-current={currentPage(item.current)}
									data-slot="mega-menu-link"
									className={slots.className("link", cn(navigationMenuTriggerStyle(), SITE_CLASSES.focus))}
									style={slots.style("link")}
								>
									{item.label}
								</a>
							</NavigationMenuLink>
						)}
					</NavigationMenuItem>
				))}
			</NavigationMenuList>
		</NavigationMenu>
	);
}
