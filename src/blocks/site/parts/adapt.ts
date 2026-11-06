/**
 * 区块数据 (LinkItem / LinkGroup / MegaMenuSpec, 来自 _shared/types) -> src/site 零件数据 (SiteLink / SiteNavItem) 的适配,
 * 以及 BlockWidth / BlockTone 到零件档位的映射与 aria 名称解析. 纯函数, 每次渲染调用.
 */
import * as React from "react";
import {
  SITE_BLOCK_ARIA_FALLBACK,
  SITE_BLOCK_CONTAINER,
  SITE_BLOCK_DEFAULT,
  SITE_BLOCK_ID,
  SITE_BLOCK_INTENT,
} from "../../../constants/blocks-site-v101";
import { IconSlot } from "../../../layout/Icon";
import type { SiteContainerSize, SiteFeatured, SiteLink, SiteLinkGroup, SiteNavItem, SiteSocialLink, SiteTone } from "../../../site/types";
import { useBlockLabels } from "../../_shared/BlocksProvider";
import type { BlockLabels, BlockTone, BlockWidth, IconName, LinkGroup, LinkItem } from "../../_shared/types";
import type { MegaMenuPanelData, MegaMenuSpec, SiteBlockAriaLabels, SiteNavEntry } from "./types";

/** 拼零件 id: 前缀-序号-序号. */
export function siteId(...parts: Array<string | number>): string {
  return parts.join(SITE_BLOCK_ID.sep);
}

/** IconName (Iconify 串 / 组件 / 节点) -> 节点. */
export function iconNode(icon?: IconName): React.ReactNode {
  return icon === undefined || icon === null ? undefined : React.createElement(IconSlot, { source: icon });
}

export function toSiteLink(item: LinkItem, id: string): SiteLink {
  return { id, label: item.label, href: item.href, description: item.description, icon: iconNode(item.icon), external: item.external, current: item.current };
}

export function toSiteLinks(items: LinkItem[] | undefined, prefix: string): SiteLink[] {
  return (items ?? []).map((item, index) => toSiteLink(item, siteId(prefix, index)));
}

export function toSiteGroup(group: LinkGroup, id: string): SiteLinkGroup {
  return { id, title: group.title, links: toSiteLinks(group.items, id) };
}

export function toSiteGroups(groups: LinkGroup[] | undefined, prefix: string): SiteLinkGroup[] {
  return (groups ?? []).map((group, index) => toSiteGroup(group, siteId(prefix, index)));
}

export function isMegaSpec(entry: SiteNavEntry): entry is MegaMenuSpec {
  return typeof entry === "object" && entry !== null && "mega" in entry && entry.mega !== undefined;
}

/** 零件 MegaMenu 只有一张特色卡: 取第一张有 href 的卡; 多卡完整展示见 MegaMenuPanel 区块. */
function firstFeatured(mega: MegaMenuPanelData): SiteFeatured | undefined {
  const card = mega.featured?.find((item) => item.cta.href !== undefined);
  if (!card?.cta.href) return undefined;
  const image = card.media?.src ? { src: card.media.src, alt: card.media.alt } : undefined;
  return { href: card.cta.href, title: card.title, description: card.description, image, external: card.cta.external };
}

function megaGroups(mega: MegaMenuPanelData, id: string): SiteLinkGroup[] {
  const groups = toSiteGroups(mega.columns, id);
  if (mega.footer?.length && mega.footerTitle !== undefined) {
    groups.push(toSiteGroup({ title: mega.footerTitle, items: mega.footer }, siteId(id, groups.length)));
  }
  return groups;
}

/** 顶栏 / 移动导航共用的入口列表: 带 mega 的入口展开为分组 (桌面下拉, 移动钻取). */
export function toNavItems(entries: SiteNavEntry[] | undefined): SiteNavItem[] {
  return (entries ?? []).map((entry, index) => {
    const id = siteId(SITE_BLOCK_ID.nav, index);
    if (isMegaSpec(entry)) {
      return { id, label: entry.label, href: entry.href, current: entry.current, groups: megaGroups(entry.mega, id), featured: firstFeatured(entry.mega) };
    }
    return { id, label: entry.label, href: entry.href, current: entry.current };
  });
}

/** 社交链接: 零件要求字符串名称作 aria-label; label 不是字符串时退到 href. */
export function toSocialLinks(items: LinkItem[] | undefined): SiteSocialLink[] {
  return (items ?? []).map((item, index) => ({
    id: siteId(SITE_BLOCK_ID.social, index),
    label: typeof item.label === "string" ? item.label : item.href,
    href: item.href,
    icon: iconNode(item.icon) ?? item.label,
  }));
}

export function containerOf(width: BlockWidth | undefined): SiteContainerSize {
  return SITE_BLOCK_CONTAINER[width ?? SITE_BLOCK_DEFAULT.width];
}

export function intentOf(tone: BlockTone | undefined, intent?: SiteTone): SiteTone {
  return intent ?? (tone ? SITE_BLOCK_INTENT[tone] : SITE_BLOCK_INTENT.plain);
}

/** aria 名称: ariaLabels > labels (BlocksProvider 叠加) 的兜底键. */
export function useSiteAria(labels?: Partial<BlockLabels>, overrides?: Partial<SiteBlockAriaLabels>): SiteBlockAriaLabels {
  const base = useBlockLabels(labels);
  return React.useMemo(() => {
    const out = {} as SiteBlockAriaLabels;
    for (const key of Object.keys(SITE_BLOCK_ARIA_FALLBACK) as Array<keyof SiteBlockAriaLabels>) {
      out[key] = overrides?.[key] ?? base[SITE_BLOCK_ARIA_FALLBACK[key]];
    }
    return out;
  }, [base, overrides]);
}
