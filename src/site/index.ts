/**
 * 站点外壳零件 (src/site/): 页面级的顶栏, 导航, 公告条, 语言与主题切换, 搜索层与页脚.
 * 区块层组合它们; 根入口 src/index.ts 的接线由集成分片统一处理.
 */

/**
 * 公共类型与 slot 工具.
 *
 * .agents/notes/implemented/feature/2026-11-02-site-shell-parts.md
 */
export type { SiteCollapse, SiteContainerSize, SiteFeatured, SiteHeightSize, SiteLink, SiteLinkGroup, SiteNavItem, SiteSocialLink, SiteTone } from "./types";
export { resolveSlots } from "./slots";
export type { SlotClassNames, SlotProps, SlotResolver, SlotStyles } from "./slots";

export { SiteHeader } from "./header/SiteHeader";
export type { SiteHeaderProps, SiteHeaderSlot, SiteHeaderState } from "./header/SiteHeader";
export { useSiteScroll } from "./header/use-scroll-state";
export type { SiteScrollState } from "./header/use-scroll-state";
export { AnnouncementBar } from "./header/AnnouncementBar";
export type { AnnouncementBarLabels, AnnouncementBarProps, AnnouncementBarSlot } from "./header/AnnouncementBar";

export { MegaMenu } from "./nav/MegaMenu";
export type { MegaMenuLabels, MegaMenuProps, MegaMenuSlot } from "./nav/MegaMenu";
export { MobileNav } from "./nav/MobileNav";
export type { MobileNavLabels, MobileNavProps, MobileNavSlot, MobileNavState } from "./nav/MobileNav";

export { LocaleSwitcher } from "./overlay/LocaleSwitcher";
export type { LocaleGroup, LocaleOption, LocaleSwitcherLabels, LocaleSwitcherProps, LocaleSwitcherSlot } from "./overlay/LocaleSwitcher";
export { SearchOverlay } from "./overlay/SearchOverlay";
export type {
	SearchOverlayGroup,
	SearchOverlayItem,
	SearchOverlayLabels,
	SearchOverlayProps,
	SearchOverlaySlot,
	SearchOverlayTerm,
} from "./overlay/SearchOverlay";

export { SiteFooter } from "./footer/SiteFooter";
export type { SiteFooterLabels, SiteFooterProps, SiteFooterSlot } from "./footer/SiteFooter";

export { ThemeSwitcher } from "./theme/ThemeSwitcher";
export type { ThemeSwitcherLabels, ThemeSwitcherProps, ThemeSwitcherSlot } from "./theme/ThemeSwitcher";
export { THEME_MODES, isThemeMode, useThemeMode } from "./theme/use-theme-mode";
export type { ResolvedThemeMode, ThemeMode, UseThemeModeOptions, UseThemeModeReturn } from "./theme/use-theme-mode";

export {
	ANNOUNCEMENT_BAR_SLOTS,
	LOCALE_SWITCHER_SLOTS,
	MEGA_MENU_SLOTS,
	MOBILE_NAV_SLOTS,
	SEARCH_OVERLAY_SLOTS,
	SITE_COLLAPSE,
	SITE_CONTAINER,
	SITE_FOOTER_SLOTS,
	SITE_HEADER_SLOTS,
	SITE_HEIGHT,
	SITE_OVERLAY_MODE,
	SITE_STORAGE,
	SITE_THEME_VARIANT,
	SITE_TONE,
	THEME_SWITCHER_SLOTS,
} from "../constants/site";
