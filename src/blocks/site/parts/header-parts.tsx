"use client";

import * as React from "react";
import { SITE_BLOCK_CLASS, SITE_BLOCK_SLOT } from "../../../constants/blocks-site-v101";
import { SITE_CLASSES, SITE_CONTAINER } from "../../../constants/site";
import { cn } from "../../../primitives/utils";
import { currentPage, linkTarget } from "../../../site/slots";
import { MobileNav } from "../../../site/nav/MobileNav";
import { SearchOverlay } from "../../../site/overlay/SearchOverlay";
import type { SiteContainerSize, SiteNavItem } from "../../../site/types";
import { CtaButton } from "../../_shared/SectionHeading";
import type { Cta, LinkItem, Logo } from "../../_shared/types";
import type { SearchSpec, SiteBlockAriaLabels, SiteBrand } from "./types";

/** 亮暗双图 logo: 暗图默认可见, 祖先 data-mode="light" 时换亮图 (与 media/ThemedImage 同口径). */
export function BrandLogo({ logo }: { logo: Logo }): React.JSX.Element {
  const dark = logo.darkSrc ?? logo.srcDark;
  const size = { width: logo.width, height: logo.height };
  if (logo.node !== undefined) return <span data-slot={SITE_BLOCK_SLOT.brandLogo} aria-hidden="true">{logo.node}</span>;
  if (!dark) {
    return <img data-slot={SITE_BLOCK_SLOT.brandLogo} src={logo.src} alt="" {...size} decoding="async" className={SITE_BLOCK_CLASS.logo} />;
  }
  return (
    <>
      <img data-slot={SITE_BLOCK_SLOT.brandLogo} src={dark} alt="" {...size} decoding="async" className={cn(SITE_BLOCK_CLASS.logo, SITE_BLOCK_CLASS.logoDark)} />
      <img data-slot={SITE_BLOCK_SLOT.brandLogoLight} src={logo.src} alt="" {...size} decoding="async" className={cn(SITE_BLOCK_CLASS.logo, SITE_BLOCK_CLASS.logoLight)} />
    </>
  );
}

/** 品牌链接: 有可见名称时 logo 装饰化; 只有 logo 时以 ariaLabel / logo.name 命名. */
export function BrandLink({ brand }: { brand: SiteBrand }): React.JSX.Element {
  const label = brand.name === undefined ? (brand.ariaLabel ?? brand.logo?.name) : brand.ariaLabel;
  return (
    <a href={brand.href} aria-label={label} data-slot={SITE_BLOCK_SLOT.brand} className={cn(SITE_BLOCK_CLASS.brandLink, SITE_CLASSES.focus)}>
      {brand.logo ? <BrandLogo logo={brand.logo} /> : null}
      {brand.name !== undefined ? <span data-slot={SITE_BLOCK_SLOT.brandName}>{brand.name}</span> : null}
    </a>
  );
}

/** 搜索入口: 复用 SearchOverlay 零件 (Dialog + Command, Esc 关闭并归还焦点). */
export function SearchEntry({ search }: { search?: SearchSpec }): React.JSX.Element | null {
  return search ? <SearchOverlay {...search} /> : null;
}

/** 桌面操作区: 搜索 + Cta 按钮组. */
export function HeaderActions({ actions, search }: { actions?: Cta[]; search?: SearchSpec }): React.JSX.Element | null {
  if (!actions?.length && !search) return null;
  return (
    <div data-slot={SITE_BLOCK_SLOT.actions} className={SITE_BLOCK_CLASS.actions}>
      <SearchEntry search={search} />
      {actions?.map((cta, index) => <CtaButton key={index} cta={cta} />)}
    </div>
  );
}

/** 二级本地导航 (apple 产品页式): 具名 nav, 窄屏横滑. */
export function LocalNav({ items, label, container, className }: { items?: LinkItem[]; label: string; container: SiteContainerSize; className?: string }): React.JSX.Element | null {
  if (!items?.length) return null;
  return (
    <nav aria-label={label} data-slot={SITE_BLOCK_SLOT.localNav} className={cn(SITE_BLOCK_CLASS.localNav, className)}>
      <ul data-slot={SITE_BLOCK_SLOT.localNavList} className={cn(SITE_CLASSES.container, SITE_CONTAINER[container], SITE_BLOCK_CLASS.localNavList)}>
        {items.map((item, index) => (
          <li key={index}>
            <a
              href={item.href}
              aria-current={currentPage(item.current)}
              data-slot={SITE_BLOCK_SLOT.localNavLink}
              className={cn(SITE_CLASSES.link, "whitespace-nowrap aria-[current=page]:text-foreground", SITE_CLASSES.focus)}
              {...linkTarget(item.external)}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export interface MobileDrawerProps {
  items: SiteNavItem[];
  aria: SiteBlockAriaLabels;
  search?: SearchSpec;
  footer?: Cta[];
  account?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * 移动抽屉: 复用 MobileNav 零件 (vaul / radix Dialog: 焦点陷阱, 外部 inert, Esc 先返回上级再关闭, 关闭后焦点归还触发按钮).
 * 账号区 = 自定义节点 + Cta 按钮 (整宽堆叠).
 */
export function MobileDrawer({ items, aria, search, footer, account, open, defaultOpen, onOpenChange }: MobileDrawerProps): React.JSX.Element {
  const hasAccount = account !== undefined || Boolean(footer?.length);
  return (
    <MobileNav
      items={items}
      labels={{ open: aria.mobileOpen, title: aria.mobileTitle, back: aria.back, close: aria.close }}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      search={search ? <SearchOverlay {...search} /> : undefined}
      account={
        hasAccount ? (
          <div data-slot={SITE_BLOCK_SLOT.mobileAccount} className={SITE_BLOCK_CLASS.stack}>
            {account}
            {footer?.map((cta, index) => <CtaButton key={index} cta={cta} className="w-full" />)}
          </div>
        ) : undefined
      }
    />
  );
}
