"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";
import { SITE_CLASSES, type SEARCH_OVERLAY_SLOTS } from "../../constants/site";
import { CommandGroup, CommandItem } from "../../primitives/command";
import type { SlotResolver } from "../slots";

export type SearchOverlaySlot = (typeof SEARCH_OVERLAY_SLOTS)[number];

type Slots = SlotResolver<SearchOverlaySlot>;

/** 一条结果. label 参与过滤, href 存在且未传 onSelect 时选中即跳转. */
export interface SearchOverlayItem {
	id: string;
	label: string;
	description?: React.ReactNode;
	href?: string;
	icon?: React.ReactNode;
	keywords?: string[];
}

export interface SearchOverlayGroup {
	id: string;
	label: React.ReactNode;
	items: SearchOverlayItem[];
}

/** 热门词. */
export interface SearchOverlayTerm {
	id: string;
	label: string;
}

/** 热门词: 横排胶囊, 仍是 cmdk 选项, 方向键可达, 选中后填入搜索框. */
export function SearchPopular({ terms, heading, slots, onPick }: { terms: SearchOverlayTerm[]; heading: string; slots: Slots; onPick: (term: string) => void }): React.JSX.Element {
	return (
		<CommandGroup
			heading={heading}
			forceMount
			data-slot="search-overlay-popular"
			className={slots.className("popular", "[&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-wrap [&_[cmdk-group-items]]:gap-1.5 [&_[cmdk-group-items]]:px-2 [&_[cmdk-group-items]]:pb-2")}
			style={slots.style("popular")}
		>
			{terms.map((term) => (
				<CommandItem
					key={term.id}
					value={`${term.id}-${term.label}`}
					onSelect={() => onPick(term.label)}
					forceMount
					data-slot="search-overlay-popular-item"
					className={slots.className("popular-item", "rounded-(--radius-full) border border-border px-3 py-1")}
					style={slots.style("popular-item")}
				>
					<SearchIcon aria-hidden className="size-3 shrink-0" />
					{term.label}
				</CommandItem>
			))}
		</CommandGroup>
	);
}

/** 分组结果. */
export function SearchGroups({ groups, slots, onPick }: { groups: SearchOverlayGroup[]; slots: Slots; onPick: (item: SearchOverlayItem) => void }): React.JSX.Element {
	return (
		<>
			{groups.map((group) => (
				<CommandGroup key={group.id} heading={group.label} data-slot="search-overlay-group" className={slots.className("group")} style={slots.style("group")}>
					{group.items.map((item) => (
						<CommandItem
							key={item.id}
							value={`${group.id}-${item.id}`}
							keywords={[item.label, ...(item.keywords ?? [])]}
							onSelect={() => onPick(item)}
							data-slot="search-overlay-item"
							className={slots.className("item", "items-start")}
							style={slots.style("item")}
						>
							{item.icon ? <span aria-hidden className="mt-0.5 inline-flex shrink-0">{item.icon}</span> : null}
							<span className="flex min-w-0 flex-col gap-0.5">
								<span className="truncate">{item.label}</span>
								{item.description ? (
									<span data-slot="search-overlay-item-description" className={slots.className("item-description", SITE_CLASSES.description)} style={slots.style("item-description")}>
										{item.description}
									</span>
								) : null}
							</span>
						</CommandItem>
					))}
				</CommandGroup>
			))}
		</>
	);
}
