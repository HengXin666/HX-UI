"use client";

import type * as React from "react";
import { PORTFOLIO_CLASS, PORTFOLIO_DEFAULT, PORTFOLIO_PROJECT_LAYOUT, PORTFOLIO_SLOT, PORTFOLIO_TEXT_ZH } from "../../constants/blocks-portfolio-v111";
import { BlockShell } from "../_shared/BlockShell";
import { useBlockLabels } from "../_shared/BlocksProvider";
import { renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, ProjectGridLayout, ProjectItem, SectionHeadingData } from "../_shared/types";
import { ProjectCard } from "./parts/ProjectCard";

export interface ProjectGridProps extends BlockBaseProps {
  items: ReadonlyArray<ProjectItem>;
  heading?: SectionHeadingData;
  /** grid 卡片网格 (容器 @xl 两列, @4xl 三列) / list 列表行 (缩略图在左). */
  layout?: ProjectGridLayout;
  /** 精选项排到最前. 默认 false, 保持数据顺序. */
  featuredFirst?: boolean;
  /** "精选"标记文案. */
  featuredLabel?: string;
  ref?: React.Ref<HTMLElement>;
}

/**
 * 项目网格: 缩略图复用 src/media/Image, 标题为整卡主链接, 可选精选标记与额外外链.
 * hover 有缩略图放大与箭头位移, 只用 transform, 减弱动效下静止.
 */
export function ProjectGrid({
  items,
  heading,
  layout = PORTFOLIO_DEFAULT.projectLayout,
  featuredFirst = false,
  featuredLabel = PORTFOLIO_TEXT_ZH.featured,
  labels: labelsProp,
  ref,
  ...shell
}: ProjectGridProps): React.JSX.Element {
  const labels = useBlockLabels(labelsProp);
  const ordered = featuredFirst ? [...items].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false)) : items;
  const list = layout === PORTFOLIO_PROJECT_LAYOUT.list;
  return (
    <BlockShell {...shell} ref={ref} heading={heading} renderHeading={heading ? renderSectionHeading : undefined}>
      <ul data-slot={PORTFOLIO_SLOT.projects} data-layout={layout} className={list ? PORTFOLIO_CLASS.listLayout : PORTFOLIO_CLASS.gridLayout}>
        {ordered.map((item, index) => (
          <ProjectCard
            key={item.href ?? (typeof item.title === "string" ? item.title : index)}
            item={item}
            layout={layout}
            featuredLabel={featuredLabel}
            externalLabel={labels.externalLink}
          />
        ))}
      </ul>
    </BlockShell>
  );
}
