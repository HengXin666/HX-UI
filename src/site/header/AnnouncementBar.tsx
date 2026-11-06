"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { BUTTON_TYPE } from "../../constants";
import { SITE_CLASSES, SITE_STORAGE, SITE_TONE, type ANNOUNCEMENT_BAR_SLOTS } from "../../constants/site";
import { useLocalStorage } from "../../hooks/browser/useLocalStorage";
import { cn } from "../../primitives/utils";
import { linkTarget, resolveSlots, type SlotProps } from "../slots";
import type { SiteTone } from "../types";

export type AnnouncementBarSlot = (typeof ANNOUNCEMENT_BAR_SLOTS)[number];

/** region: 公告区的可访问名称; dismiss: 关闭按钮的可访问名称. */
export interface AnnouncementBarLabels {
	region: string;
	dismiss: string;
}

export interface AnnouncementBarProps
	extends Omit<React.ComponentProps<"div">, "children" | "role">,
		SlotProps<AnnouncementBarSlot, { open: boolean }> {
	children: React.ReactNode;
	/** 装饰图标, 自动 aria-hidden. */
	icon?: React.ReactNode;
	href?: string;
	/** 链接文字; 只给 href 不给 linkLabel 时整段正文成为链接. */
	linkLabel?: React.ReactNode;
	external?: boolean;
	tone?: SiteTone;
	/** 显示关闭按钮, 默认 true. */
	dismissible?: boolean;
	/** 记住关闭状态的 localStorage 键, 默认 SITE_STORAGE.announcement; 换公告时换键 (例如带版本号). false 不记住. */
	storageKey?: string | false;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	labels: AnnouncementBarLabels;
}

const barVariants = cva("relative w-full border-b text-sm", {
	variants: {
		tone: {
			[SITE_TONE.neutral]: "border-border bg-muted text-foreground",
			[SITE_TONE.primary]: "border-primary bg-primary text-primary-foreground",
			[SITE_TONE.success]: "border-success/30 bg-success/10 text-success-fg",
			[SITE_TONE.warning]: "border-warning/30 bg-warning/10 text-warning-fg",
			[SITE_TONE.danger]: "border-danger/30 bg-danger/10 text-danger-fg",
			[SITE_TONE.info]: "border-primary/30 bg-primary-subtle text-link",
		},
	},
	defaultVariants: { tone: SITE_TONE.neutral },
});

/**
 * 公告条: 页面顶部一行通知, 可带图标与链接, 可关闭并记住关闭状态.
 * 根节点 role=region + aria-label, 读屏可在地标列表里找到它, 但不会像 alert 那样打断播报.
 * 关闭后焦点落到 document.body 是可接受的: 公告条位于页面最顶, 下一个 Tab 停靠点就是顶栏.
 *
 * 不用 forwardRef: React 19 中 ref 是普通 prop (契约 6.1), ref 指向根 div.
 */
export function AnnouncementBar({
	children,
	icon,
	href,
	linkLabel,
	external,
	tone = SITE_TONE.neutral,
	dismissible = true,
	storageKey,
	open: openProp,
	defaultOpen = true,
	onOpenChange,
	labels,
	classNames,
	styles,
	className,
	style,
	...props
}: AnnouncementBarProps): React.JSX.Element | null {
	const persisted = storageKey !== false;
	const [dismissed, setDismissed] = useLocalStorage<boolean>(persisted && storageKey ? storageKey : SITE_STORAGE.announcement, !defaultOpen);
	const [memoryOpen, setMemoryOpen] = React.useState(defaultOpen);
	const open = openProp ?? (persisted ? !dismissed : memoryOpen);
	const slots = resolveSlots({ classNames, styles }, { open });

	const close = (): void => {
		if (openProp === undefined) {
			if (persisted) setDismissed(true);
			else setMemoryOpen(false);
		}
		onOpenChange?.(false);
	};

	if (!open) return null;

	const linkClass = slots.className("link", cn("font-medium underline underline-offset-4", SITE_CLASSES.focus));
	const content = href && !linkLabel ? (
		<a href={href} data-slot="announcement-bar-link" className={linkClass} style={slots.style("link")} {...linkTarget(external)}>
			{children}
		</a>
	) : (
		<>
			{children}
			{href ? (
				<a href={href} data-slot="announcement-bar-link" className={cn("ml-2", linkClass)} style={slots.style("link")} {...linkTarget(external)}>
					{linkLabel}
				</a>
			) : null}
		</>
	);

	return (
		<div
			{...props}
			role="region"
			aria-label={labels.region}
			data-slot="announcement-bar"
			data-tone={tone}
			data-state="open"
			className={slots.className("root", barVariants({ tone }), className)}
			style={slots.style("root", style)}
		>
			<div
				data-slot="announcement-bar-inner"
				className={slots.className("inner", cn(SITE_CLASSES.container, "flex min-h-(--control-h-lg) items-center justify-center gap-2 py-1.5", dismissible && "pr-12"))}
				style={slots.style("inner")}
			>
				{icon ? (
					<span aria-hidden data-slot="announcement-bar-icon" className={slots.className("icon", "inline-flex shrink-0 [&_svg]:size-4")} style={slots.style("icon")}>
						{icon}
					</span>
				) : null}
				<p data-slot="announcement-bar-content" className={slots.className("content", "min-w-0 text-center")} style={slots.style("content")}>
					{content}
				</p>
			</div>
			{dismissible ? (
				<button
					type={BUTTON_TYPE}
					aria-label={labels.dismiss}
					onClick={close}
					data-slot="announcement-bar-close-button"
					className={slots.className(
						"close-button",
						"absolute top-1/2 right-2 inline-flex size-(--control-h-sm) -translate-y-1/2 items-center justify-center rounded-(--radius-md) opacity-70 transition-opacity duration-(--duration-fast) hover:opacity-100 " + SITE_CLASSES.focus,
					)}
					style={slots.style("close-button")}
				>
					<XIcon aria-hidden className={SITE_CLASSES.icon} />
				</button>
			) : null}
		</div>
	);
}
