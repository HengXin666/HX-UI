"use client";

import * as React from "react";
import { SITE_BLOCK_CLASS, SITE_BLOCK_DEFAULT, SITE_BLOCK_HEADER_TONE, SITE_BLOCK_POSITION, SITE_BLOCK_SLOT } from "../../constants/blocks-site-v101";
import { BLOCK_ALIGN } from "../../constants/blocks";
import { cn } from "../../primitives/utils";
import { SiteHeader as SiteHeaderPart } from "../../site/header/SiteHeader";
import { MegaMenu } from "../../site/nav/MegaMenu";
import { BlockShell } from "../_shared/BlockShell";
import { containerOf, toNavItems, useSiteAria } from "./parts/adapt";
import { AnnouncementCore, useAnnouncementOpen } from "./parts/announcement-core";
import { BrandLink, HeaderActions, LocalNav, MobileDrawer } from "./parts/header-parts";
import type { AnnouncementBlockProps, SiteHeaderBlockProps } from "./parts/types";

export type { SiteHeaderBlockProps };

/** 外壳定位: 外壳负责吸顶 / 覆盖 hero, 零件内部退回 relative (避免 sticky 被外壳高度困住). */
function shellPosition(sticky: boolean, transparent: boolean): string {
  if (transparent) return sticky ? SITE_BLOCK_POSITION.fixed : SITE_BLOCK_POSITION.absolute;
  return sticky ? SITE_BLOCK_POSITION.sticky : SITE_BLOCK_POSITION.static;
}

/** 公告条: 普通顶栏时排在外壳之前 (随页面滚走); 透明覆盖时放进外壳, 免得被覆盖层压住. */
function HeaderAnnouncement({ announcement }: { announcement: AnnouncementBlockProps }): React.JSX.Element | null {
  const [isOpen, dismiss] = useAnnouncementOpen(announcement);
  return <AnnouncementCore {...announcement} isOpen={isOpen} onDismiss={dismiss} />;
}

/**
 * 站点顶栏区块 (design 4.1 SiteHeader): 公告条 + 顶栏 + 大菜单 + 移动导航 + 可选二级本地导航, 全部数据驱动.
 * 复用 src/site 零件: SiteHeader (滚动 8px 后玻璃底 + 1px 底线, collapse hide / shrink), MegaMenu (radix NavigationMenu:
 * Esc 关闭面板并把焦点还给入口), MobileNav (抽屉焦点陷阱, 分级钻取, 搜索入口, 账号区), SearchOverlay, AnnouncementBar.
 * nav 入口是 LinkItem 或带 mega 面板数据的 MegaMenuSpec; actions 是 Cta[] (登录 / 开始使用).
 * BlockBaseProps: tone 落在顶栏底色, width 映射零件容器档, align=center 时导航居中, 其余交给 BlockShell.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-site-v101.md
 */
export function SiteHeader({
  brand,
  nav,
  actions,
  search,
  sticky = SITE_BLOCK_DEFAULT.sticky,
  transparent = SITE_BLOCK_DEFAULT.transparent,
  blurOnScroll = SITE_BLOCK_DEFAULT.blurOnScroll,
  collapse,
  announcement,
  localNav,
  mobileFooter,
  account,
  ariaLabels,
  labels,
  id,
  className,
  style,
  classNames,
  styles,
  tone,
  pad = SITE_BLOCK_DEFAULT.pad,
  width,
  align,
  reveal,
  backdrop,
  as = SITE_BLOCK_DEFAULT.tag,
  slots,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SiteHeaderBlockProps): React.JSX.Element {
  const aria = useSiteAria(labels, ariaLabels);
  const items = React.useMemo(() => toNavItems(nav), [nav]);
  const container = containerOf(width);
  const toneClass = transparent || !tone ? "" : SITE_BLOCK_HEADER_TONE[tone];
  const partClass = cn(SITE_BLOCK_CLASS.partStatic, toneClass, !blurOnScroll && SITE_BLOCK_CLASS.noBlur);
  const notice = announcement ? <HeaderAnnouncement announcement={{ labels, ...announcement }} /> : null;

  return (
    <>
      {transparent ? null : notice}
      <BlockShell
        id={id}
        className={cn(shellPosition(sticky, transparent), SITE_BLOCK_CLASS.shellClear, className)}
        style={style}
        classNames={classNames}
        styles={styles}
        tone={tone}
        pad={pad}
        width={SITE_BLOCK_DEFAULT.shellWidth}
        align={align}
        reveal={reveal}
        backdrop={backdrop}
        as={as}
        slots={slots}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      >
        <div data-slot={SITE_BLOCK_SLOT.header}>
          {transparent ? notice : null}
          <SiteHeaderPart
            sticky={false}
            transparent={transparent}
            collapse={collapse}
            container={container}
            className={partClass}
            classNames={align === BLOCK_ALIGN.center ? { nav: SITE_BLOCK_CLASS.centerNav } : undefined}
            brand={<BrandLink brand={brand} />}
            nav={items.length ? <MegaMenu items={items} labels={{ nav: aria.nav }} /> : undefined}
            actions={<HeaderActions actions={actions} search={search} />}
            mobileNav={<MobileDrawer items={items} aria={aria} search={search} footer={mobileFooter ?? actions} account={account} />}
          />
          <LocalNav items={localNav} label={aria.localNav} container={container} className={toneClass || SITE_BLOCK_CLASS.surface} />
        </div>
      </BlockShell>
    </>
  );
}
