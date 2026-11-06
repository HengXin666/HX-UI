"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import { SITE_CLASSES, type LOCALE_SWITCHER_SLOTS } from "../../constants/site";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../primitives/command";
import { cn } from "../../primitives/utils";
import type { SlotResolver } from "../slots";

export type LocaleSwitcherSlot = (typeof LOCALE_SWITCHER_SLOTS)[number];

/** 一个可选的地区 / 语言. label 是语言名, region 是国家或地区名, 两者都参与搜索. */
export interface LocaleOption {
	value: string;
	label: string;
	region?: string;
	/** 旗帜或区域图标, 装饰性. */
	flag?: React.ReactNode;
	/** 额外搜索词 (英文名, 拼音, 国家代码). */
	keywords?: string[];
}

export interface LocaleGroup {
	id: string;
	label: React.ReactNode;
	options: LocaleOption[];
}

/** search: 搜索框占位与名称; empty: 无结果; selected: 当前项给读屏的补充说明. */
export interface LocaleListLabels {
	search: string;
	empty: string;
	selected: string;
}

export interface LocaleListProps {
	groups: LocaleGroup[];
	value: string | null;
	searchable: boolean;
	labels: LocaleListLabels;
	slots: SlotResolver<LocaleSwitcherSlot>;
	onPick: (value: string) => void;
}

/** 分组列表 (cmdk): 方向键移动高亮, Enter 选中, 输入即过滤. */
export function LocaleList({ groups, value, searchable, labels, slots, onPick }: LocaleListProps): React.JSX.Element {
	return (
		<Command data-slot="locale-switcher-command" className="bg-transparent">
			{searchable ? (
				<CommandInput
					placeholder={labels.search}
					aria-label={labels.search}
					data-slot="locale-switcher-search"
					className={slots.className("search")}
					style={slots.style("search")}
				/>
			) : null}
			<CommandList data-slot="locale-switcher-list" className={slots.className("list", "max-h-80")} style={slots.style("list")}>
				<CommandEmpty data-slot="locale-switcher-empty" className={slots.className("empty")} style={slots.style("empty")}>
					{labels.empty}
				</CommandEmpty>
				{groups.map((group) => (
					<CommandGroup key={group.id} heading={group.label} data-slot="locale-switcher-group" className={slots.className("group")} style={slots.style("group")}>
						{group.options.map((option) => {
							const checked = option.value === value;
							return (
								<CommandItem
									key={option.value}
									value={option.value}
									keywords={[option.label, option.region ?? "", ...(option.keywords ?? [])]}
									onSelect={() => onPick(option.value)}
									data-slot="locale-switcher-item"
									data-state={checked ? "checked" : "unchecked"}
									className={slots.className("item", "data-[state=checked]:font-medium")}
									style={slots.style("item")}
								>
									{option.flag ? <span aria-hidden className="inline-flex shrink-0">{option.flag}</span> : null}
									<span className="min-w-0 flex-1 truncate">{option.label}</span>
									{option.region ? <span className={SITE_CLASSES.description}>{option.region}</span> : null}
									<span
										data-slot="locale-switcher-item-indicator"
										className={slots.className("item-indicator", cn("inline-flex", checked ? "" : "invisible"))}
										style={slots.style("item-indicator")}
									>
										<CheckIcon aria-hidden className={SITE_CLASSES.icon} />
										{checked ? <span className="sr-only">{labels.selected}</span> : null}
									</span>
								</CommandItem>
							);
						})}
					</CommandGroup>
				))}
			</CommandList>
		</Command>
	);
}
