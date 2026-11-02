"use client";

import type * as React from "react";
import { EXTERNAL_LINK } from "../../../constants/blocks";
import { PORTFOLIO_CLASS, PORTFOLIO_SLOT } from "../../../constants/blocks-portfolio-v111";
import { IconSlot } from "../../../layout/Icon";
import { useBlockLabels } from "../../_shared/BlocksProvider";
import type { BlockLabels, LinkItem } from "../../_shared/types";

export interface SocialLinksProps {
  items: ReadonlyArray<LinkItem>;
  /** 列表的可访问名称. */
  label: string;
  labels?: Partial<BlockLabels>;
}

/**
 * 社交链接行. 带 icon 的项渲染为图标链接 (文字进 sr-only, 同时作 title 提示);
 * 无 icon 的项渲染为文字链接. external 自动补 target / rel 与"新窗口"读屏提示.
 */
export function SocialLinks({ items, label, labels: labelsProp }: SocialLinksProps): React.JSX.Element | null {
  const labels = useBlockLabels(labelsProp);
  if (items.length === 0) return null;
  return (
    <ul data-slot={PORTFOLIO_SLOT.social} aria-label={label} className={PORTFOLIO_CLASS.socialList}>
      {items.map((item) => {
        const iconOnly = item.icon !== undefined;
        return (
          <li key={item.href}>
            <a
              href={item.href}
              title={iconOnly && typeof item.label === "string" ? item.label : undefined}
              aria-current={item.current ? "page" : undefined}
              className={PORTFOLIO_CLASS.socialLink}
              {...(item.external ? EXTERNAL_LINK : {})}
            >
              {iconOnly && <IconSlot source={item.icon} className={PORTFOLIO_CLASS.socialIcon} />}
              <span className={iconOnly ? PORTFOLIO_CLASS.srOnly : undefined}>{item.label}</span>
              {item.external && <span className={PORTFOLIO_CLASS.srOnly}>{` (${labels.externalLink})`}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
