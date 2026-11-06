"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { SITE_CLASSES, SITE_COLLAPSE, SITE_CONTAINER, SITE_HEIGHT, SITE_HEIGHT_SHRUNK, type SITE_HEADER_SLOTS } from "../../constants/site";
import { cn } from "../../primitives/utils";
import { resolveSlots, type SlotProps } from "../slots";
import type { SiteCollapse, SiteContainerSize, SiteHeightSize } from "../types";
import { useSiteScroll } from "./use-scroll-state";

export type SiteHeaderSlot = (typeof SITE_HEADER_SLOTS)[number];

/** 公开状态, 与 data-scrolled / data-hidden / data-transparent 一致. */
export interface SiteHeaderState {
	scrolled: boolean;
	hidden: boolean;
	transparent: boolean;
}

export interface SiteHeaderProps extends Omit<React.ComponentProps<"header">, "children">, SlotProps<SiteHeaderSlot, SiteHeaderState> {
	/** 左侧品牌区 (logo + 名称), 两端都显示. */
	brand?: React.ReactNode;
	/** 桌面导航 (通常是 MegaMenu), md 以下隐藏. */
	nav?: React.ReactNode;
	/** 桌面右侧操作区 (搜索, 语言, 主题, 登录), md 以下隐藏. */
	actions?: React.ReactNode;
	/** 移动端入口 (通常是 MobileNav, 渲染抽屉触发按钮), 只在 md 以下显示. */
	mobileNav?: React.ReactNode;
	/** 吸顶, 默认 true. */
	sticky?: boolean;
	/** 覆盖在 hero 上: 未滚动时背景与边框透明, 并脱离文档流 (sticky 时 fixed, 否则 absolute). */
	transparent?: boolean;
	/** 滚动后的形态: none 不变, hide 下滚隐藏上滚出现, shrink 收矮一档. 默认 none. */
	collapse?: SiteCollapse;
	/** 高度档, 默认 md. */
	height?: SiteHeightSize;
	/** 内容容器宽度档, 默认 content. */
	container?: SiteContainerSize;
	/** 视为 "已滚动" 的 scrollY 阈值 (px). */
	scrollThreshold?: number;
}

const headerVariants = cva(
	[
		"group/site-header inset-x-0 top-0 z-(--z-header) w-full border-b border-border bg-background text-foreground",
		"transition-[background-color,border-color,box-shadow,transform] duration-(--duration-base) ease-out motion-reduce:transition-none",
		"data-scrolled:bg-background/80 data-scrolled:shadow-sm data-scrolled:supports-backdrop-filter:backdrop-blur-md",
		"data-transparent:not-data-scrolled:border-transparent data-transparent:not-data-scrolled:bg-transparent",
		"data-hidden:not-focus-within:-translate-y-full",
	],
	{
		variants: {
			position: { sticky: "sticky", fixed: "fixed", absolute: "absolute", static: "relative" },
		},
	},
);

function positionOf(sticky: boolean, transparent: boolean): "sticky" | "fixed" | "absolute" | "static" {
	if (transparent) return sticky ? "fixed" : "absolute";
	return sticky ? "sticky" : "static";
}

/** 布尔 data 属性: 真时写空串, 假时不写 (契约 5.2). */
const flag = (on: boolean): "" | undefined => (on ? "" : undefined);

/**
 * 站点顶栏: 吸顶, 滚动后加背景模糊与阴影, 可配置下滚隐藏或收矮, 支持透明覆盖 hero.
 * 断点切换纯靠 CSS (md), 服务端渲染与首帧一致: 桌面显示 nav + actions, 移动显示 mobileNav.
 * 隐藏状态下顶栏内有焦点时强制显示 (not-focus-within), 键盘用户不会把焦点藏到视口外.
 *
 * 不用 forwardRef: React 19 中 ref 是普通 prop (契约 6.1), ref 指向 <header>.
 *
 * .agents/notes/implemented/feature/2026-11-02-site-shell-parts.md
 */
export function SiteHeader({
	brand,
	nav,
	actions,
	mobileNav,
	sticky = true,
	transparent = false,
	collapse = SITE_COLLAPSE.none,
	height = "md",
	container = "content",
	scrollThreshold,
	classNames,
	styles,
	className,
	style,
	...props
}: SiteHeaderProps): React.JSX.Element {
	const { scrolled, hidden } = useSiteScroll(collapse, scrollThreshold);
	const slots = resolveSlots({ classNames, styles }, { scrolled, hidden, transparent });
	const shrunk = collapse === SITE_COLLAPSE.shrink && scrolled;

	return (
		<header
			{...props}
			data-slot="site-header"
			data-scrolled={flag(scrolled)}
			data-hidden={flag(hidden)}
			data-transparent={flag(transparent)}
			data-collapse={collapse}
			data-size={height}
			className={slots.className("root", headerVariants({ position: positionOf(sticky, transparent) }), className)}
			style={slots.style("root", style)}
		>
			<div
				data-slot="site-header-container"
				data-shrunk={flag(shrunk)}
				className={slots.className(
					"container",
					cn(
						SITE_CLASSES.container,
						SITE_CONTAINER[container],
						SITE_HEIGHT[height],
						SITE_HEIGHT_SHRUNK[height],
						"flex items-center gap-4 transition-[height] duration-(--duration-base) ease-out motion-reduce:transition-none",
					),
				)}
				style={slots.style("container")}
			>
				{brand ? (
					<div data-slot="site-header-brand" className={slots.className("brand", "flex shrink-0 items-center gap-2")} style={slots.style("brand")}>
						{brand}
					</div>
				) : null}
				{nav ? (
					<div data-slot="site-header-nav" className={slots.className("nav", "hidden min-w-0 flex-1 items-center md:flex")} style={slots.style("nav")}>
						{nav}
					</div>
				) : null}
				{actions ? (
					<div data-slot="site-header-actions" className={slots.className("actions", "ml-auto hidden items-center gap-2 md:flex")} style={slots.style("actions")}>
						{actions}
					</div>
				) : null}
				{mobileNav ? (
					<div data-slot="site-header-mobile" className={slots.className("mobile", "ml-auto flex items-center gap-1 md:hidden")} style={slots.style("mobile")}>
						{mobileNav}
					</div>
				) : null}
			</div>
		</header>
	);
}
