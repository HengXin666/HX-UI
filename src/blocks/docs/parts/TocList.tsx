"use client";

import type * as React from "react";
import { DOCS_CLASS, DOCS_DEFAULT, DOCS_SLOT } from "../../../constants/blocks-docs-v109";
import { cn } from "../../../primitives/utils";
import type { TocItem } from "../../_shared/types";

export interface TocListProps {
  items: ReadonlyArray<TocItem>;
  activeId?: string;
  onNavigate?: (id: string) => void;
  classNames?: { list?: string; item?: string; link?: string };
}

function depthClass(depth: number): string {
  const clamped = Math.min(Math.max(depth, DOCS_DEFAULT.tocBaseDepth), DOCS_DEFAULT.tocMaxDepth);
  return DOCS_CLASS.tocDepth[clamped] ?? "";
}

/** TOC 列表本体: 当前节 aria-current="location"; 深度按 h2/h3/h4 缩进 (逻辑属性, 支持 RTL). */
export function TocList({ items, activeId, onNavigate, classNames }: TocListProps): React.JSX.Element {
  return (
    <ul className={cn(DOCS_CLASS.tocList, classNames?.list)}>
      {items.map((item) => (
        <li key={item.id} data-slot={DOCS_SLOT.tocItem} data-depth={item.depth} className={classNames?.item}>
          <a
            href={`${DOCS_DEFAULT.hashPrefix}${encodeURIComponent(item.id)}`}
            aria-current={item.id === activeId ? "location" : undefined}
            onClick={onNavigate ? () => onNavigate(item.id) : undefined}
            className={cn(DOCS_CLASS.tocLink, DOCS_CLASS.focus, depthClass(item.depth), classNames?.link)}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
