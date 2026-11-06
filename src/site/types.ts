/**
 * 站点外壳零件共用的数据形状: 链接, 链接分组, 导航入口, 特色卡, 社交链接与维度档名.
 */
import type * as React from "react";
import type { SITE_COLLAPSE, SITE_CONTAINER, SITE_HEIGHT, SITE_TONE } from "../constants/site";

/** 一条链接. label 是可见文字, 也是可访问名称. */
export interface SiteLink {
	id: string;
	label: React.ReactNode;
	href: string;
	description?: React.ReactNode;
	/** 装饰图标, 组件会包 aria-hidden. */
	icon?: React.ReactNode;
	external?: boolean;
	/** 当前页, 输出 aria-current="page". */
	current?: boolean;
}

/** 一组链接: 标题 + 链接列表 (MegaMenu 的一列, SiteFooter 的一列). */
export interface SiteLinkGroup {
	id: string;
	title: React.ReactNode;
	links: SiteLink[];
}

/** MegaMenu 右侧特色卡. */
export interface SiteFeatured {
	href: string;
	title: React.ReactNode;
	description?: React.ReactNode;
	image?: { src: string; alt: string };
	external?: boolean;
}

/** 顶级导航入口: 有 groups 时展开面板 (桌面) 或钻取二级 (移动), 否则是普通链接. */
export interface SiteNavItem {
	id: string;
	label: React.ReactNode;
	href?: string;
	current?: boolean;
	groups?: SiteLinkGroup[];
	featured?: SiteFeatured;
}

/** 社交图标链接: 只有图标, label 作为 aria-label. */
export interface SiteSocialLink {
	id: string;
	label: string;
	href: string;
	icon: React.ReactNode;
}

export type SiteHeightSize = keyof typeof SITE_HEIGHT;
export type SiteContainerSize = keyof typeof SITE_CONTAINER;
export type SiteTone = (typeof SITE_TONE)[keyof typeof SITE_TONE];
export type SiteCollapse = (typeof SITE_COLLAPSE)[keyof typeof SITE_COLLAPSE];
