"use client";

import { MenuIcon } from "lucide-react";
import * as React from "react";
import { DOCS_CLASS, DOCS_SLOT } from "../../../constants/blocks-docs-v109";
import { Button } from "../../../primitives/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../../../primitives/sheet";
import { cn } from "../../../primitives/utils";
import type { LinkGroup } from "../../_shared/types";
import { DocsSidebar } from "./DocsSidebar";
import type { DocsText } from "./labels";

export interface DocsTopBarProps {
  /** 品牌位 (logo / 站名). */
  brand?: React.ReactNode;
  /** 右侧动作 (搜索入口, 版本切换, 主题切换, GitHub). */
  actions?: React.ReactNode;
  sidebar: ReadonlyArray<LinkGroup>;
  currentHref?: string;
  text: DocsText;
  className?: string;
}

/**
 * 内置顶栏: 容器 < @5xl 时显示菜单按钮, 侧栏进左侧 Sheet; 点击侧栏链接后自动收起.
 * 需要完整站点顶栏时用 DocsShell 的 header 插槽放入 SiteHeader.
 */
export function DocsTopBar({ brand, actions, sidebar, currentHref, text, className }: DocsTopBarProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  return (
    <header data-slot={DOCS_SLOT.topbar} className={cn(DOCS_CLASS.topbar, className)}>
      {sidebar.length > 0 && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className={DOCS_CLASS.menuButton} aria-label={text.openSidebar}>
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className={DOCS_CLASS.sidebarSheet}>
            <SheetTitle className={DOCS_CLASS.srOnly}>{text.sidebar}</SheetTitle>
            <DocsSidebar groups={sidebar} label={text.sidebar} currentHref={currentHref} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
      <div className={DOCS_CLASS.topbarMain}>{brand}</div>
      {actions}
    </header>
  );
}
