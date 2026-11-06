"use client";

import * as React from "react";
import { ChevronRightIcon } from "lucide-react";
import { BUTTON_TYPE } from "../../constants";
import { SITE_CLASSES, type MOBILE_NAV_SLOTS } from "../../constants/site";
import { cn } from "../../primitives/utils";
import { currentPage, linkTarget, type SlotResolver } from "../slots";
import type { SiteLink, SiteLinkGroup, SiteNavItem } from "../types";

export type MobileNavSlot = (typeof MOBILE_NAV_SLOTS)[number];

type Slots = SlotResolver<MobileNavSlot>;

function MobileNavLink({ link, slots, onNavigate }: { link: SiteLink; slots: Slots; onNavigate: () => void }): React.JSX.Element {
	return (
		<a
			href={link.href}
			aria-current={currentPage(link.current)}
			onClick={onNavigate}
			data-slot="mobile-nav-link"
			className={slots.className("link", cn(SITE_CLASSES.row, "aria-[current=page]:font-medium", SITE_CLASSES.focus))}
			style={slots.style("link")}
			{...linkTarget(link.external)}
		>
			{link.icon ? <span aria-hidden className="inline-flex shrink-0 text-muted-foreground">{link.icon}</span> : null}
			<span className="min-w-0 flex-1 truncate">{link.label}</span>
		</a>
	);
}

export interface MobileNavRootListProps {
	items: SiteNavItem[];
	slots: Slots;
	onEnter: (id: string) => void;
	onNavigate: () => void;
	/** 记录每个钻取按钮, 返回上级时焦点回到它. */
	registerItem: (id: string, node: HTMLButtonElement | null) => void;
}

/** 第一级: 有 groups 的入口是钻取按钮, 其余是链接. */
export function MobileNavRootList({ items, slots, onEnter, onNavigate, registerItem }: MobileNavRootListProps): React.JSX.Element {
	return (
		<ul data-slot="mobile-nav-list" className={slots.className("list", SITE_CLASSES.list)} style={slots.style("list")}>
			{items.map((item) => (
				<li key={item.id} data-slot="mobile-nav-item" className={slots.className("item")} style={slots.style("item")}>
					{item.groups?.length ? (
						<button
							type={BUTTON_TYPE}
							ref={(node) => registerItem(item.id, node)}
							onClick={() => onEnter(item.id)}
							data-slot="mobile-nav-next-button"
							className={slots.className("next-button", cn(SITE_CLASSES.row, "justify-between text-left", SITE_CLASSES.focus))}
							style={slots.style("next-button")}
						>
							<span className="min-w-0 flex-1 truncate">{item.label}</span>
							<ChevronRightIcon aria-hidden className={cn(SITE_CLASSES.icon, "text-muted-foreground rtl:rotate-180")} />
						</button>
					) : (
						<MobileNavLink link={{ id: item.id, label: item.label, href: item.href ?? "#", current: item.current }} slots={slots} onNavigate={onNavigate} />
					)}
				</li>
			))}
		</ul>
	);
}

function MobileNavGroup({ group, slots, onNavigate }: { group: SiteLinkGroup; slots: Slots; onNavigate: () => void }): React.JSX.Element {
	const titleId = React.useId();
	return (
		<div role="group" aria-labelledby={titleId} data-slot="mobile-nav-group" className={slots.className("group", "flex flex-col gap-1")} style={slots.style("group")}>
			<p id={titleId} data-slot="mobile-nav-group-title" className={slots.className("group-title", "px-3 pt-2 text-xs font-medium text-muted-foreground")} style={slots.style("group-title")}>
				{group.title}
			</p>
			<ul data-slot="mobile-nav-list" className={slots.className("list", SITE_CLASSES.list)} style={slots.style("list")}>
				{group.links.map((link) => (
					<li key={link.id} data-slot="mobile-nav-item" className={slots.className("item")} style={slots.style("item")}>
						<MobileNavLink link={link} slots={slots} onNavigate={onNavigate} />
					</li>
				))}
			</ul>
		</div>
	);
}

/** 第二级: 当前入口的全部分组. */
export function MobileNavLevel({ item, slots, onNavigate }: { item: SiteNavItem; slots: Slots; onNavigate: () => void }): React.JSX.Element {
	return (
		<div data-slot="mobile-nav-level" className={slots.className("level", "flex flex-col gap-3")} style={slots.style("level")}>
			{(item.groups ?? []).map((group) => (
				<MobileNavGroup key={group.id} group={group} slots={slots} onNavigate={onNavigate} />
			))}
		</div>
	);
}
