"use client";

import * as React from "react";
import { SITE_BLOCK_CLASS, SITE_BLOCK_SLOT } from "../../../constants/blocks-site-v101";
import { SITE_CLASSES } from "../../../constants/site";
import { cn } from "../../../primitives/utils";
import { currentPage, linkTarget } from "../../../site/slots";
import { CtaButton } from "../../_shared/SectionHeading";
import type { LinkGroup, LinkItem } from "../../_shared/types";
import { iconNode } from "./adapt";
import type { MegaMenuFeatured } from "./types";

/** 一条面板链接: 图标 + 标题 + 说明, 整行可点. */
export function PanelLink({ item }: { item: LinkItem }): React.JSX.Element {
  return (
    <a
      href={item.href}
      aria-current={currentPage(item.current)}
      data-slot={SITE_BLOCK_SLOT.megaLink}
      className={cn(SITE_BLOCK_CLASS.row, SITE_CLASSES.focus)}
      {...linkTarget(item.external)}
    >
      {item.icon !== undefined ? (
        <span aria-hidden data-slot={SITE_BLOCK_SLOT.megaLinkIcon} className="mt-0.5 inline-flex shrink-0">
          {iconNode(item.icon)}
        </span>
      ) : null}
      <span data-slot={SITE_BLOCK_SLOT.megaLinkText} className="flex min-w-0 flex-col gap-0.5">
        <span className={SITE_CLASSES.heading}>{item.label}</span>
        {item.description !== undefined ? (
          <span data-slot={SITE_BLOCK_SLOT.megaLinkDescription} className={SITE_CLASSES.description}>
            {item.description}
          </span>
        ) : null}
      </span>
    </a>
  );
}

/** 一列: 标题 (h3) + 链接列表, 以标题命名成 group. */
export function PanelGroup({ group }: { group: LinkGroup }): React.JSX.Element {
  const titleId = React.useId();
  return (
    <div role="group" aria-labelledby={titleId} data-slot={SITE_BLOCK_SLOT.megaGroup} className={SITE_BLOCK_CLASS.stack}>
      <h3 id={titleId} data-slot={SITE_BLOCK_SLOT.megaGroupTitle} className={cn(SITE_BLOCK_CLASS.muted, "px-2 font-medium")}>
        {group.title}
      </h3>
      <ul data-slot={SITE_BLOCK_SLOT.megaGroupList} className={SITE_CLASSES.list}>
        {group.items.map((item, index) => (
          <li key={index}>
            <PanelLink item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 特色卡: 媒体 + 标题 + 说明 + Cta (Cta 是卡内真实可聚焦目标, 契约 9.1 Card). */
export function PanelFeatured({ card }: { card: MegaMenuFeatured }): React.JSX.Element {
  const media = card.media;
  return (
    <div data-slot={SITE_BLOCK_SLOT.megaFeaturedCard} className={SITE_BLOCK_CLASS.card}>
      {media?.src ? (
        <img
          data-slot={SITE_BLOCK_SLOT.megaFeaturedImage}
          src={media.src}
          srcSet={media.srcSet}
          sizes={media.sizes}
          alt={media.alt}
          width={media.width}
          height={media.height}
          loading={media.priority ? undefined : "lazy"}
          decoding="async"
          className={SITE_BLOCK_CLASS.image}
        />
      ) : media?.node !== undefined ? (
        media.node
      ) : null}
      <p data-slot={SITE_BLOCK_SLOT.megaFeaturedTitle} className={SITE_BLOCK_CLASS.title}>
        {card.title}
      </p>
      {card.description !== undefined ? (
        <p data-slot={SITE_BLOCK_SLOT.megaFeaturedDescription} className={SITE_BLOCK_CLASS.muted}>
          {card.description}
        </p>
      ) : null}
      <CtaButton cta={card.cta} />
    </div>
  );
}
