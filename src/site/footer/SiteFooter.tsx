"use client";

import * as React from "react";
import { SITE_CLASSES, SITE_CONTAINER } from "../../constants/site";
import { cn } from "../../primitives/utils";
import { resolveSlots, type SlotProps } from "../slots";
import type { SiteContainerSize, SiteLink, SiteLinkGroup, SiteSocialLink } from "../types";
import { FooterColumns, FooterLegal, FooterSocial, type SiteFooterSlot } from "./footer-parts";

export type { SiteFooterSlot };

/** nav: 链接分组导航的名称; social: 社交列表名称; legal: 法务链接导航名称. */
export interface SiteFooterLabels {
	nav: string;
	social: string;
	legal: string;
}

export interface SiteFooterProps extends Omit<React.ComponentProps<"footer">, "children">, SlotProps<SiteFooterSlot> {
	labels: SiteFooterLabels;
	/** 链接分组数组, 每组一列; md 以下折叠成 accordion. */
	groups?: SiteLinkGroup[];
	/** 品牌区 (logo + 名称). */
	brand?: React.ReactNode;
	/** 品牌下方的一句介绍. */
	description?: React.ReactNode;
	/** 订阅表单插槽 (调用方自带表单与文案). */
	subscribe?: React.ReactNode;
	social?: SiteSocialLink[];
	legal?: SiteLink[];
	/** 语言选择插槽 (通常是 LocaleSwitcher, 页脚里推荐 mode="dialog"). */
	locale?: React.ReactNode;
	/** 版权行. */
	copyright?: React.ReactNode;
	/** 内容容器宽度档, 默认 content. */
	container?: SiteContainerSize;
}

/**
 * 多列页脚: 品牌 + 订阅插槽, 链接分组 (移动端折叠成 accordion), 底部一行放版权, 法务链接, 语言选择与社交图标.
 * 根节点是 <footer> (contentinfo 地标); 链接分组与法务链接各自是具名 <nav>.
 *
 * 不用 forwardRef: React 19 中 ref 是普通 prop (契约 6.1), ref 指向 <footer>.
 *
 * .agents/notes/implemented/feature/2026-11-02-site-shell-parts.md
 */
export function SiteFooter({
	labels,
	groups = [],
	brand,
	description,
	subscribe,
	social = [],
	legal = [],
	locale,
	copyright,
	container = "content",
	classNames,
	styles,
	className,
	style,
	...props
}: SiteFooterProps): React.JSX.Element {
	const slots = resolveSlots({ classNames, styles }, undefined);
	const hasLead = Boolean(brand || description || subscribe);

	return (
		<footer
			{...props}
			data-slot="site-footer"
			className={slots.className("root", "border-t border-border bg-background text-foreground", className)}
			style={slots.style("root", style)}
		>
			<div
				data-slot="site-footer-container"
				className={slots.className("container", cn(SITE_CLASSES.container, SITE_CONTAINER[container], "flex flex-col gap-10 py-12"))}
				style={slots.style("container")}
			>
				<div
					data-slot="site-footer-top"
					className={slots.className("top", cn("grid gap-10", hasLead && groups.length > 0 && "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"))}
					style={slots.style("top")}
				>
					{hasLead ? (
						<div data-slot="site-footer-brand" className={slots.className("brand", "flex max-w-sm flex-col gap-4")} style={slots.style("brand")}>
							{brand}
							{description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
							{subscribe ? (
								<div data-slot="site-footer-subscribe" className={slots.className("subscribe")} style={slots.style("subscribe")}>
									{subscribe}
								</div>
							) : null}
						</div>
					) : null}
					{groups.length > 0 ? (
						<nav aria-label={labels.nav} data-slot="site-footer-nav" className={slots.className("nav")} style={slots.style("nav")}>
							<FooterColumns groups={groups} slots={slots} />
						</nav>
					) : null}
				</div>
				<div
					data-slot="site-footer-bottom"
					className={slots.className("bottom", "flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between")}
					style={slots.style("bottom")}
				>
					<div data-slot="site-footer-meta" className={slots.className("meta", "flex flex-col gap-2 md:flex-row md:items-center md:gap-6")} style={slots.style("meta")}>
						{copyright ? (
							<p data-slot="site-footer-copyright" className={slots.className("copyright", SITE_CLASSES.description)} style={slots.style("copyright")}>
								{copyright}
							</p>
						) : null}
						{legal.length > 0 ? <FooterLegal links={legal} label={labels.legal} slots={slots} /> : null}
					</div>
					<div data-slot="site-footer-end" className={slots.className("end", "flex items-center gap-2")} style={slots.style("end")}>
						{locale ? (
							<div data-slot="site-footer-locale" className={slots.className("locale")} style={slots.style("locale")}>
								{locale}
							</div>
						) : null}
						{social.length > 0 ? <FooterSocial links={social} label={labels.social} slots={slots} /> : null}
					</div>
				</div>
			</div>
		</footer>
	);
}
