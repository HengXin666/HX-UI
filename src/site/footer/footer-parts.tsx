"use client";

import * as React from "react";
import { SELECT_MODE } from "../../constants";
import { SITE_CLASSES, type SITE_FOOTER_SLOTS } from "../../constants/site";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../primitives/accordion";
import { cn } from "../../primitives/utils";
import { currentPage, linkTarget, type SlotResolver } from "../slots";
import type { SiteLink, SiteLinkGroup, SiteSocialLink } from "../types";

export type SiteFooterSlot = (typeof SITE_FOOTER_SLOTS)[number];

type Slots = SlotResolver<SiteFooterSlot>;

function FooterLinks({ links, slots }: { links: SiteLink[]; slots: Slots }): React.JSX.Element {
	return (
		<ul data-slot="site-footer-group-list" className={slots.className("group-list", "flex flex-col gap-2")} style={slots.style("group-list")}>
			{links.map((link) => (
				<li key={link.id}>
					<a
						href={link.href}
						aria-current={currentPage(link.current)}
						data-slot="site-footer-link"
						className={slots.className("link", cn(SITE_CLASSES.link, "inline-flex items-center gap-2 rounded-(--radius-sm)", SITE_CLASSES.focus))}
						style={slots.style("link")}
						{...linkTarget(link.external)}
					>
						{link.icon ? <span aria-hidden className="inline-flex shrink-0">{link.icon}</span> : null}
						{link.label}
					</a>
				</li>
			))}
		</ul>
	);
}

/** 桌面一列: 标题 (h2) + 链接, 以标题命名成 group. */
function FooterGroup({ group, slots }: { group: SiteLinkGroup; slots: Slots }): React.JSX.Element {
	const titleId = React.useId();
	return (
		<div role="group" aria-labelledby={titleId} data-slot="site-footer-group" className={slots.className("group", "flex min-w-0 flex-col gap-3")} style={slots.style("group")}>
			<h2 id={titleId} data-slot="site-footer-group-title" className={slots.className("group-title", SITE_CLASSES.heading)} style={slots.style("group-title")}>
				{group.title}
			</h2>
			<FooterLinks links={group.links} slots={slots} />
		</div>
	);
}

/**
 * 链接分组: md 起多列网格, md 以下折叠成 accordion (APG Accordion: Enter / Space 展开, 方向键在标题间移动).
 * 两套结构用 CSS 显隐切换, 隐藏的一套 display:none 不进可访问树, 服务端渲染与首帧一致.
 */
export function FooterColumns({ groups, slots }: { groups: SiteLinkGroup[]; slots: Slots }): React.JSX.Element {
	const columns = { "--site-footer-cols": String(Math.max(groups.length, 1)) } as React.CSSProperties;
	return (
		<>
			<div
				data-slot="site-footer-columns"
				className={slots.className("columns", "hidden gap-8 md:grid md:grid-cols-[repeat(var(--site-footer-cols),minmax(0,1fr))]")}
				style={slots.style("columns", columns)}
			>
				{groups.map((group) => (
					<FooterGroup key={group.id} group={group} slots={slots} />
				))}
			</div>
			<Accordion type={SELECT_MODE.multiple} data-slot="site-footer-accordion" className={slots.className("accordion", "md:hidden")} style={slots.style("accordion")}>
				{groups.map((group) => (
					<AccordionItem key={group.id} value={group.id}>
						<AccordionTrigger>{group.title}</AccordionTrigger>
						<AccordionContent>
							<FooterLinks links={group.links} slots={slots} />
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</>
	);
}

/** 法务行. */
export function FooterLegal({ links, label, slots }: { links: SiteLink[]; label: string; slots: Slots }): React.JSX.Element {
	return (
		<nav aria-label={label} data-slot="site-footer-legal" className={slots.className("legal")} style={slots.style("legal")}>
			<ul data-slot="site-footer-legal-list" className={slots.className("legal-list", "flex flex-wrap items-center gap-x-4 gap-y-2")} style={slots.style("legal-list")}>
				{links.map((link) => (
					<li key={link.id}>
						<a
							href={link.href}
							aria-current={currentPage(link.current)}
							data-slot="site-footer-legal-link"
							className={slots.className("legal-link", cn(SITE_CLASSES.description, "rounded-(--radius-sm) hover:text-foreground", SITE_CLASSES.focus))}
							style={slots.style("legal-link")}
							{...linkTarget(link.external)}
						>
							{link.label}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}

/** 社交图标: 只有图标, label 作为每个链接的 aria-label; 列表以 label 命名. */
export function FooterSocial({ links, label, slots }: { links: SiteSocialLink[]; label: string; slots: Slots }): React.JSX.Element {
	return (
		<ul aria-label={label} data-slot="site-footer-social" className={slots.className("social", "flex items-center gap-1")} style={slots.style("social")}>
			{links.map((link) => (
				<li key={link.id}>
					<a
						href={link.href}
						aria-label={link.label}
						data-slot="site-footer-social-link"
						className={slots.className("social-link", cn(SITE_CLASSES.iconButton, SITE_CLASSES.focus))}
						style={slots.style("social-link")}
						{...linkTarget(true)}
					>
						<span aria-hidden className="inline-flex [&_svg]:size-4">{link.icon}</span>
					</a>
				</li>
			))}
		</ul>
	);
}
