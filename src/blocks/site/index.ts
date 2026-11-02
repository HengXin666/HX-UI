/**
 * 站点区块 (V1-01) 的桶文件: 顶栏, 大菜单面板, 移动导航, 公告条, 页脚. src/blocks/index.ts 与 src/index.ts 的接线归集成任务 V1-Z.
 * siteBlockRegistry 以 design 第 2 节的名词名 (不带 Block 后缀) 注册, 供 PageComposer 注入.
 */
import { SITE_BLOCK_NAME } from "../../constants/blocks-site-v101";
import type { BlockRegistry } from "../_shared/types";
import { AnnouncementBar } from "./AnnouncementBar";
import { MegaMenuPanel } from "./MegaMenuPanel";
import { MobileNav } from "./MobileNav";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export { AnnouncementBar, MegaMenuPanel, MobileNav, SiteFooter, SiteHeader };
export { isMegaSpec, toNavItems, useSiteAria } from "./parts/adapt";
export type {
  AnnouncementBlockProps,
  MegaMenuFeatured,
  MegaMenuPanelBlockProps,
  MegaMenuPanelData,
  MegaMenuSpec,
  MobileNavBlockProps,
  SearchSpec,
  SiteBlockAriaLabels,
  SiteBrand,
  SiteFooterBlockProps,
  SiteHeaderBlockProps,
  SiteNavEntry,
  SiteNewsletter,
  SiteStatusState,
} from "./parts/types";
/** 区块基座 (BlockBaseProps 等) 的类型来源: ../_shared/types. 这里转出, 方便调用方一处取齐站点区块所需类型. */
export type { BlockBaseProps, Cta, LinkGroup, LinkItem, Logo, Media } from "../_shared/types";

/** PageComposer 注册表片段: { SiteHeader, MegaMenuPanel, MobileNav, AnnouncementBar, SiteFooter }. */
export const siteBlockRegistry = {
  [SITE_BLOCK_NAME.header]: SiteHeader,
  [SITE_BLOCK_NAME.megaMenuPanel]: MegaMenuPanel,
  [SITE_BLOCK_NAME.mobileNav]: MobileNav,
  [SITE_BLOCK_NAME.announcement]: AnnouncementBar,
  [SITE_BLOCK_NAME.footer]: SiteFooter,
} satisfies BlockRegistry;
