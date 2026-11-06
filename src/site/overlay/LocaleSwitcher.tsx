"use client";

import * as React from "react";
import { ChevronDownIcon, GlobeIcon } from "lucide-react";
import { BUTTON_TYPE } from "../../constants";
import { SITE_CLASSES, SITE_LOCALE_SEARCH_MIN, SITE_OVERLAY_MODE } from "../../constants/site";
import { useControllableState } from "../../hooks/state/useControllableState";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../primitives/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../../primitives/popover";
import { cn } from "../../primitives/utils";
import { resolveSlots, type SlotProps } from "../slots";
import { LocaleList, type LocaleGroup, type LocaleListLabels, type LocaleSwitcherSlot } from "./locale-list";

export type { LocaleGroup, LocaleOption, LocaleSwitcherSlot } from "./locale-list";

/** trigger: 触发按钮的读屏前缀 (可见部分是当前语言与地区); title: 弹层标题. */
export interface LocaleSwitcherLabels extends LocaleListLabels {
	trigger: string;
	title: string;
}

export interface LocaleSwitcherProps
	extends Omit<React.ComponentProps<"button">, "value" | "defaultValue" | "onChange" | "children" | "type">,
		SlotProps<LocaleSwitcherSlot, { open: boolean }> {
	groups: LocaleGroup[];
	value?: string | null;
	defaultValue?: string | null;
	onValueChange?: (value: string) => void;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** popover: 锚定下拉; dialog: 居中对话框 (国家很多或在页脚里时). 默认 popover. */
	mode?: (typeof SITE_OVERLAY_MODE)[keyof typeof SITE_OVERLAY_MODE];
	/** 是否显示搜索框; 不传时选项超过 SITE_LOCALE_SEARCH_MIN 个才显示. */
	searchable?: boolean;
	labels: LocaleSwitcherLabels;
}

/**
 * 地区与语言选择: 触发按钮显示当前语言与国家, 弹出分组列表, 选项多时带搜索.
 * 底座: popover 模式用 Popover, dialog 模式用 Dialog, 列表都用 Command (cmdk, role=listbox / option).
 * 关闭后焦点归还触发按钮 (radix). root slot 与 ref 指向触发按钮 (Popover / Dialog Root 无 DOM).
 * 不用 forwardRef: React 19 中 ref 是普通 prop (契约 6.1).
 */
export function LocaleSwitcher({
	groups,
	value: valueProp,
	defaultValue = null,
	onValueChange,
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	mode = SITE_OVERLAY_MODE.popover,
	searchable,
	labels,
	classNames,
	styles,
	className,
	style,
	...props
}: LocaleSwitcherProps): React.JSX.Element {
	const [value, setValue] = useControllableState<string | null>({ value: valueProp, defaultValue, onChange: onValueChange });
	const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
	const slots = resolveSlots({ classNames, styles }, { open });
	const contentRef = React.useRef<HTMLDivElement>(null);
	const options = groups.flatMap((group) => group.options);
	const current = options.find((option) => option.value === value) ?? null;
	const showSearch = searchable ?? options.length > SITE_LOCALE_SEARCH_MIN;

	const pick = (next: string): void => {
		setValue(next);
		setOpen(false);
	};

	const trigger = (
		<button
			type={BUTTON_TYPE}
			{...props}
			data-slot="locale-switcher"
			data-state={open ? "open" : "closed"}
			className={slots.className(
				"root",
				cn("inline-flex h-(--control-h-md) items-center gap-2 rounded-(--radius-md) px-2", SITE_CLASSES.link, "hover:bg-accent", SITE_CLASSES.focus),
				className,
			)}
			style={slots.style("root", style)}
		>
			<GlobeIcon aria-hidden data-slot="locale-switcher-trigger-icon" className={slots.className("trigger-icon", SITE_CLASSES.icon)} />
			<span className="sr-only">{labels.trigger}</span>
			{current ? (
				<span data-slot="locale-switcher-value" className={slots.className("value", "text-foreground")} style={slots.style("value")}>
					{current.label}
				</span>
			) : null}
			{current?.region ? (
				<span data-slot="locale-switcher-region" className={slots.className("region")} style={slots.style("region")}>
					{current.region}
				</span>
			) : null}
			<ChevronDownIcon aria-hidden className={cn(SITE_CLASSES.icon, "opacity-60")} />
		</button>
	);

	const list = <LocaleList groups={groups} value={value} searchable={showSearch} labels={labels} slots={slots} onPick={pick} />;

	if (mode === SITE_OVERLAY_MODE.dialog) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>{trigger}</DialogTrigger>
				<DialogContent
					ref={contentRef}
					aria-describedby={undefined}
					onOpenAutoFocus={(event) => {
						/** DialogContent 默认阻止自动聚焦 (契约 11.5); 这里主动聚焦搜索框或列表, 保证键盘可直接操作. */
						event.preventDefault();
						contentRef.current?.querySelector<HTMLElement>("[cmdk-input], [cmdk-list]")?.focus();
					}}
					data-slot="locale-switcher-content"
					className={slots.className("content", "gap-3 p-4")}
					style={slots.style("content")}
				>
					<DialogHeader>
						<DialogTitle data-slot="locale-switcher-title" className={slots.className("title")} style={slots.style("title")}>
							{labels.title}
						</DialogTitle>
					</DialogHeader>
					{list}
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent
				align="end"
				aria-label={labels.title}
				data-slot="locale-switcher-content"
				className={slots.className("content", "w-72 p-0")}
				style={slots.style("content")}
			>
				{list}
			</PopoverContent>
		</Popover>
	);
}
