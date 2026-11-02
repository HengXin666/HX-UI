"use client";

import * as React from "react";
import { SITE_BLOCK_CLASS, SITE_BLOCK_DEFAULT, SITE_BLOCK_SLOT } from "../../constants/blocks-site-v101";
import { BlockShell } from "../_shared/BlockShell";
import { useSiteAria } from "./parts/adapt";
import type { MegaMenuPanelBlockProps } from "./parts/types";
import { PanelFeatured, PanelGroup, PanelLink } from "./parts/mega-panel-parts";

export type { MegaMenuPanelBlockProps };

/**
 * 大菜单面板区块 (design 4.1 MegaMenuPanel): 多列链接组 + 特色图片卡 + 底部链接, 可独立放进页面
 * (例如 "全部产品" 目录区), 同一份数据 (MegaMenuPanelData) 也挂在 SiteHeader 区块的 nav 入口上作下拉.
 * 列数随容器宽度 (@container) 1 -> 2 -> 4; 移动端在顶栏里转为 MobileNav 钻取列表.
 * 根为具名 nav (aria-label 默认 ariaLabels.nav).
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-site-v101.md
 */
export function MegaMenuPanel({
  columns,
  featured,
  footer,
  footerTitle: _footerTitle,
  labels,
  pad = SITE_BLOCK_DEFAULT.panelPad,
  ...shell
}: MegaMenuPanelBlockProps): React.JSX.Element {
  const aria = useSiteAria(labels);
  const { "aria-label": shellLabel, ...rest } = shell;
  return (
    <BlockShell {...rest} pad={pad}>
      <nav aria-label={shellLabel ?? aria.nav} data-slot={SITE_BLOCK_SLOT.megaPanel} className="flex flex-col gap-8">
        <div data-slot={SITE_BLOCK_SLOT.megaColumns} className={SITE_BLOCK_CLASS.columns}>
          {columns.map((group, index) => (
            <PanelGroup key={index} group={group} />
          ))}
        </div>
        {featured?.length ? (
          <div data-slot={SITE_BLOCK_SLOT.megaFeatured} className={SITE_BLOCK_CLASS.featured}>
            {featured.map((card, index) => (
              <PanelFeatured key={index} card={card} />
            ))}
          </div>
        ) : null}
        {footer?.length ? (
          <ul data-slot={SITE_BLOCK_SLOT.megaFooter} className="flex flex-wrap gap-2 border-t border-border pt-4">
            {footer.map((item, index) => (
              <li key={index}>
                <PanelLink item={item} />
              </li>
            ))}
          </ul>
        ) : null}
      </nav>
    </BlockShell>
  );
}
