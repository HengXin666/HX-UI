import type * as React from "react";
import { PORTFOLIO_CLASS, PORTFOLIO_SLOT } from "../../../constants/blocks-portfolio-v111";
import { cn } from "../../../primitives/utils";

export interface TagListProps {
  tags?: ReadonlyArray<string>;
  className?: string;
}

/** 技术 / 主题标签 chips. 没有标签时不渲染任何节点. */
export function TagList({ tags, className }: TagListProps): React.JSX.Element | null {
  if (tags === undefined || tags.length === 0) return null;
  return (
    <ul data-slot={PORTFOLIO_SLOT.tags} className={cn(PORTFOLIO_CLASS.tagList, className)}>
      {tags.map((tag) => (
        <li key={tag} className={PORTFOLIO_CLASS.tag}>
          {tag}
        </li>
      ))}
    </ul>
  );
}
