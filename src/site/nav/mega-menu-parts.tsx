"use client";

import * as React from "react";
import { type MEGA_MENU_SLOTS, SITE_CLASSES } from "../../constants/site";
import { NavigationMenuLink } from "../../primitives/navigation-menu";
import { cn } from "../../primitives/utils";
import { currentPage, linkTarget, type SlotResolver } from "../slots";
import type { SiteFeatured, SiteLinkGroup, SiteNavItem } from "../types";

export type MegaMenuSlot = (typeof MEGA_MENU_SLOTS)[number];

type Slots = SlotResolver<MegaMenuSlot>;

/** 一列: 标题 + 链接列表. role=group 以标题命名, 读屏进入时会读出列名. */
function MegaMenuGroup({ group, slots }: { group: SiteLinkGroup; slots: Slots }): React.JSX.Element {
	const titleId = React.useId();
	return (
		<div role="group" aria-labelledby={titleId} data-slot="mega-menu-group" className={slots.className("group", "flex min-w-0 flex-col gap-2")} style={slots.style("group")}>
			<p id={titleId} data-slot="mega-menu-group-title" className={slots.className("group-title", "px-2 text-xs font-medium text-muted-foreground")} style={slots.style("group-title")}>
				{group.title}
			</p>
			<ul data-slot="mega-menu-group-list" className={slots.className("group-list", SITE_CLASSES.list)} style={slots.style("group-list")}>
				{group.links.map((link) => (
					<li key={link.id}>
						<NavigationMenuLink asChild active={link.current}>
							<a
								href={link.href}
								aria-current={currentPage(link.current)}
								data-slot="mega-menu-group-link"
								className={slots.className("group-link", cn("flex-row items-start gap-3", SITE_CLASSES.focus))}
								style={slots.style("group-link")}
								{...linkTarget(link.external)}
							>
								{link.icon ? <span aria-hidden className="mt-0.5 inline-flex shrink-0">{link.icon}</span> : null}
								<span className="flex min-w-0 flex-col gap-0.5">
									<span className={SITE_CLASSES.heading}>{link.label}</span>
									{link.description ? (
										<span data-slot="mega-menu-link-description" className={slots.className("link-description", SITE_CLASSES.description)} style={slots.style("link-description")}>
											{link.description}
										</span>
									) : null}
								</span>
							</a>
						</NavigationMenuLink>
					</li>
				))}
			</ul>
		</div>
	);
}

/** 右侧特色卡: 整卡是一个链接, 图片的 alt 由数据提供. */
function MegaMenuFeatured({ featured, slots }: { featured: SiteFeatured; slots: Slots }): React.JSX.Element {
	return (
		<NavigationMenuLink asChild>
			<a
				href={featured.href}
				data-slot="mega-menu-featured"
				className={slots.className(
					"featured",
					cn("w-64 shrink-0 gap-2 overflow-hidden rounded-(--radius-lg) border border-border bg-card p-0 text-card-foreground hover:bg-accent", SITE_CLASSES.focus),
				)}
				style={slots.style("featured")}
				{...linkTarget(featured.external)}
			>
				{featured.image ? (
					<img
						src={featured.image.src}
						alt={featured.image.alt}
						data-slot="mega-menu-featured-image"
						className={slots.className("featured-image", "aspect-video w-full object-cover")}
						style={slots.style("featured-image")}
					/>
				) : null}
				<span data-slot="mega-menu-featured-title" className={slots.className("featured-title", cn("px-3", featured.image ? "" : "pt-3", SITE_CLASSES.heading))} style={slots.style("featured-title")}>
					{featured.title}
				</span>
				{featured.description ? (
					<span data-slot="mega-menu-featured-description" className={slots.className("featured-description", cn("px-3 pb-3", SITE_CLASSES.description))} style={slots.style("featured-description")}>
						{featured.description}
					</span>
				) : null}
			</a>
		</NavigationMenuLink>
	);
}

/** 面板: 分组按列横排, 有特色卡时放在最右. 列数写进 --mega-menu-cols. */
export function MegaMenuPanel({ item, slots }: { item: SiteNavItem; slots: Slots }): React.JSX.Element {
	const groups = item.groups ?? [];
	const columns = { "--mega-menu-cols": String(groups.length) } as React.CSSProperties;
	return (
		<div data-slot="mega-menu-panel" className={slots.className("panel", "flex gap-6 p-4")} style={slots.style("panel")}>
			<div data-slot="mega-menu-columns" className={slots.className("columns", "grid grid-cols-[repeat(var(--mega-menu-cols),minmax(10rem,1fr))] gap-6")} style={slots.style("columns", columns)}>
				{groups.map((group) => (
					<MegaMenuGroup key={group.id} group={group} slots={slots} />
				))}
			</div>
			{item.featured ? <MegaMenuFeatured featured={item.featured} slots={slots} /> : null}
		</div>
	);
}
