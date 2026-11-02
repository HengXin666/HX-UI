"use client";

import * as React from "react";
import { SITE_BLOCK_DEFAULT, SITE_BLOCK_SLOT } from "../../constants/blocks-site-v101";
import { BlockShell } from "../_shared/BlockShell";
import { toNavItems, useSiteAria } from "./parts/adapt";
import { MobileDrawer } from "./parts/header-parts";
import type { MobileNavBlockProps } from "./parts/types";

export type { MobileNavBlockProps };

/**
 * 移动导航区块 (design 4.1 MobileNav): 触发按钮 + 全屏抽屉, 分级钻取 (有 mega / 分组的入口进入第二级, 返回回到来源入口),
 * 第一级顶部搜索入口, 底部账号区 (自定义节点 + Cta). 复用 src/site MobileNav 零件: radix Dialog 焦点陷阱与外部 inert,
 * Esc 在第二级先返回上级, 在第一级关闭并把焦点还给触发按钮. open / defaultOpen / onOpenChange 三件套.
 * 通常由 SiteHeader 区块内置; 单独使用时 (自定义顶栏, 文档站侧栏) 外壳承接 BlockBaseProps.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-site-v101.md
 */
export function MobileNav({
  items,
  footer,
  account,
  search,
  open,
  defaultOpen,
  onOpenChange,
  ariaLabels,
  labels,
  pad = SITE_BLOCK_DEFAULT.pad,
  ...shell
}: MobileNavBlockProps): React.JSX.Element {
  const aria = useSiteAria(labels, ariaLabels);
  const navItems = React.useMemo(() => toNavItems(items), [items]);
  return (
    <BlockShell {...shell} pad={pad}>
      <div data-slot={SITE_BLOCK_SLOT.mobileNav}>
        <MobileDrawer
          items={navItems}
          aria={aria}
          search={search}
          footer={footer}
          account={account}
          open={open}
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
        />
      </div>
    </BlockShell>
  );
}
