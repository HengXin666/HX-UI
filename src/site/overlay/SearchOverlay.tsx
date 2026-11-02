"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";
import { BUTTON_TYPE, UI_CLASSES } from "../../constants";
import { SITE_CLASSES } from "../../constants/site";
import { useMergeRefs } from "../../hooks/dom/useMergeRefs";
import { useControllableState } from "../../hooks/state/useControllableState";
import { useLocaleText } from "../../locale/LocaleProvider";
import { Command, CommandEmpty, CommandInput, CommandList } from "../../primitives/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../../primitives/dialog";
import { cn } from "../../primitives/utils";
import { resolveSlots, type SlotProps } from "../slots";
import { SearchGroups, SearchPopular, type SearchOverlayGroup, type SearchOverlayItem, type SearchOverlaySlot, type SearchOverlayTerm } from "./search-results";

export type { SearchOverlayGroup, SearchOverlayItem, SearchOverlaySlot, SearchOverlayTerm } from "./search-results";

/** loading 缺省时取 LocaleProvider 的 common.loading; 其余文案必须由调用方提供. */
export interface SearchOverlayLabels {
	title: string;
	description?: string;
	placeholder: string;
	popular: string;
	empty: string;
	/** 内置触发按钮的文字. */
	trigger?: string;
	loading?: string;
}

export interface SearchOverlayProps extends SlotProps<SearchOverlaySlot, { open: boolean; searchValue: string }> {
	groups: SearchOverlayGroup[];
	popular?: SearchOverlayTerm[];
	labels: SearchOverlayLabels;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	searchValue?: string;
	defaultSearchValue?: string;
	onSearchValueChange?: (value: string) => void;
	/** 选中结果. 不传时有 href 的结果直接跳转. */
	onSelect?: (item: SearchOverlayItem) => void;
	/** 由组件内置过滤 (静态清单), 默认 true; 结果来自服务端时设 false, 自行按 searchValue 更新 groups. */
	shouldFilter?: boolean;
	loading?: boolean;
	/** 自定义触发元素 (DialogTrigger asChild); false 不渲染触发器 (由外部受控 open). */
	trigger?: React.ReactElement | false;
	ref?: React.Ref<HTMLDivElement>;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * 站点搜索覆盖层: 底座是 Dialog + Command (cmdk).
 * 搜索框为空时显示热门词, 输入后显示分组结果; 方向键移动高亮, Enter 选中, Esc 关闭并把焦点还给触发器.
 * root slot 与 ref 指向对话框面板 (Dialog Root 无 DOM). 不用 forwardRef: React 19 中 ref 是普通 prop (契约 6.1).
 *
 * .agents/notes/implemented/feature/2026-11-02-site-shell-parts.md
 */
export function SearchOverlay({
	groups,
	popular = [],
	labels,
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	searchValue: searchProp,
	defaultSearchValue = "",
	onSearchValueChange,
	onSelect,
	shouldFilter = true,
	loading = false,
	trigger,
	ref,
	classNames,
	styles,
	className,
	style,
}: SearchOverlayProps): React.JSX.Element {
	const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
	const [query, setQuery] = useControllableState({ value: searchProp, defaultValue: defaultSearchValue, onChange: onSearchValueChange });
	const common = useLocaleText("common");
	const slots = resolveSlots({ classNames, styles }, { open, searchValue: query });
	const localRef = React.useRef<HTMLDivElement>(null);
	const contentRef = useMergeRefs(localRef, ref);
	const typing = query.trim().length > 0;

	const pick = (item: SearchOverlayItem): void => {
		setOpen(false);
		if (onSelect) onSelect(item);
		else if (item.href) window.location.assign(item.href);
	};

	const defaultTrigger = (
		<button
			type={BUTTON_TYPE}
			aria-label={labels.trigger ? undefined : labels.title}
			data-slot="search-overlay-trigger"
			className={slots.className(
				"trigger",
				cn("inline-flex h-(--control-h-md) items-center gap-2 rounded-(--radius-md) border border-border bg-background px-3", SITE_CLASSES.link, SITE_CLASSES.focus),
			)}
			style={slots.style("trigger")}
		>
			<SearchIcon aria-hidden className={SITE_CLASSES.icon} />
			{labels.trigger ? <span>{labels.trigger}</span> : null}
		</button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{trigger === false ? null : <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>}
			<DialogContent
				ref={contentRef}
				showCloseButton={false}
				{...(labels.description ? {} : { "aria-describedby": undefined })}
				onOpenAutoFocus={(event) => {
					/** DialogContent 默认阻止自动聚焦 (契约 11.5); 搜索层打开即可输入, 所以主动聚焦输入框. */
					event.preventDefault();
					localRef.current?.querySelector<HTMLInputElement>("[cmdk-input]")?.focus();
				}}
				data-slot="search-overlay"
				className={slots.className("root", "max-w-[min(40rem,calc(100%-2rem))] gap-0 overflow-hidden p-0", className)}
				style={slots.style("root", style)}
			>
				<DialogTitle className={UI_CLASSES.srOnly}>{labels.title}</DialogTitle>
				{labels.description ? <DialogDescription className={UI_CLASSES.srOnly}>{labels.description}</DialogDescription> : null}
				<Command shouldFilter={shouldFilter} data-slot="search-overlay-content" className={slots.className("content", "bg-transparent")} style={slots.style("content")}>
					<CommandInput
						value={query}
						onValueChange={setQuery}
						placeholder={labels.placeholder}
						aria-label={labels.placeholder}
						data-slot="search-overlay-input"
						className={slots.className("input", "h-12 text-sm")}
						style={slots.style("input")}
					/>
					<CommandList aria-busy={loading || undefined} data-slot="search-overlay-list" className={slots.className("list", "max-h-[min(60vh,28rem)]")} style={slots.style("list")}>
						{loading ? (
							<div role="status" data-slot="search-overlay-loading" className={slots.className("loading", "py-6 text-center " + SITE_CLASSES.description)} style={slots.style("loading")}>
								{labels.loading ?? common.loading}
							</div>
						) : null}
						{!loading && typing ? (
							<CommandEmpty data-slot="search-overlay-empty" className={slots.className("empty")} style={slots.style("empty")}>
								{labels.empty}
							</CommandEmpty>
						) : null}
						{!typing && popular.length > 0 ? <SearchPopular terms={popular} heading={labels.popular} slots={slots} onPick={setQuery} /> : null}
						{typing || popular.length === 0 ? <SearchGroups groups={groups} slots={slots} onPick={pick} /> : null}
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
}
