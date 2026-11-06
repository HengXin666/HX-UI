"use client";

import type * as React from "react";
import { DOCS_CLASS, DOCS_SLOT } from "../../../constants/blocks-docs-v109";
import { IconSlot } from "../../../layout/Icon";
import { cn } from "../../../primitives/utils";
import type { LinkGroup } from "../../_shared/types";

export interface DocsSidebarProps {
  groups: ReadonlyArray<LinkGroup>;
  label: string;
  /** 当前路径; 与 item.href 相等的项视为当前页 (item.current 优先). */
  currentHref?: string;
  onNavigate?: () => void;
  className?: string;
}

/** 文档侧栏: 分组标题 + 链接, 当前页 aria-current="page". 桌面栏与移动 Sheet 共用. */
export function DocsSidebar({ groups, label, currentHref, onNavigate, className }: DocsSidebarProps): React.JSX.Element {
  return (
    <nav aria-label={label} data-slot={DOCS_SLOT.sidebar} className={cn(DOCS_CLASS.sidebarNav, className)}>
      {groups.map((group, gi) => (
        <div key={typeof group.title === "string" ? group.title : gi} data-slot={DOCS_SLOT.sidebarGroup} className={DOCS_CLASS.sidebarGroup}>
          <p className={DOCS_CLASS.sidebarGroupTitle}>{group.title}</p>
          <ul className={DOCS_CLASS.sidebarList}>
            {group.items.map((item) => {
              const current = item.current ?? (currentHref !== undefined && item.href === currentHref);
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    data-slot={DOCS_SLOT.sidebarLink}
                    aria-current={current ? "page" : undefined}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer noopener" : undefined}
                    onClick={onNavigate}
                    className={cn(DOCS_CLASS.sidebarLink, DOCS_CLASS.focus)}
                  >
                    <IconSlot source={item.icon} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && <span className={DOCS_CLASS.sidebarBadge}>{item.badge}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
