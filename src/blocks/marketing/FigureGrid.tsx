"use client";

import * as React from "react";
import { BLOCK_REVEAL } from "../../constants/blocks";
import { MV103_CLASS, MV103_DEFAULT, MV103_SLOT, figureLabelOf } from "../../constants/blocks-marketing-v103";
import { MOTION_TAG } from "../../constants/motion";
import { StaggerItem } from "../../motion/Stagger";
import { BlockShell } from "../_shared/BlockShell";
import { renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, Rich, SectionHeadingData } from "../_shared/types";

/** 一条编号说明: 示意图 (可选) + 编号 + 标题 + 说明. */
export interface FigureGridItem {
  key?: string;
  title: Rich;
  body?: Rich;
  /** 编号上方的示意节点 (线稿 SVG, 产品片段). */
  figure?: React.ReactNode;
  /** 覆盖自动编号 (例如 "Fig 1.4"). */
  label?: Rich;
}

export interface FigureGridProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  items: FigureGridItem[];
  /** 编号前缀, 默认 "Fig". */
  prefix?: string;
  /** 编号主序号: Fig <major>.<n>, 默认 0. */
  major?: number;
  ref?: React.Ref<HTMLElement>;
}

function Cell({ stagger, className, children }: { stagger: boolean; className: string; children: React.ReactNode }): React.JSX.Element {
  if (stagger) return <StaggerItem as={MOTION_TAG.li} className={className}>{children}</StaggerItem>;
  return <li className={className}>{children}</li>;
}

/**
 * 编号说明网格 (linear.app 的 "A new species of product tool" 三列 Fig 0.1 / 0.2 / 0.3).
 * 宽容器三列, 列间 1px 分隔; 窄容器单列, 行间分隔. 编号为等宽小字, 自动按 prefix + major + 序号生成.
 * 遵循 docs/architecture/component-contract.md.
 */
export function FigureGrid({
  heading,
  items,
  prefix = MV103_DEFAULT.figurePrefix,
  major = MV103_DEFAULT.figureMajor,
  labels: _labels,
  reveal,
  ref,
  ...shell
}: FigureGridProps): React.JSX.Element {
  const stagger = reveal === BLOCK_REVEAL.stagger;
  return (
    <BlockShell {...shell} ref={ref} reveal={reveal} heading={heading} renderHeading={renderSectionHeading}>
      <ol role="list" data-slot={MV103_SLOT.figureList} className={MV103_CLASS.figureList}>
        {items.map((item, index) => (
          <Cell key={item.key ?? index} stagger={stagger} className={MV103_CLASS.figureItem}>
            {item.figure !== undefined && (
              <div aria-hidden data-slot={MV103_SLOT.figureMedia} className={MV103_CLASS.figureMedia}>
                {item.figure}
              </div>
            )}
            <span data-slot={MV103_SLOT.figureLabel} className={MV103_CLASS.figureLabel}>
              {item.label ?? figureLabelOf(prefix, major, index)}
            </span>
            <h3 className={MV103_CLASS.title}>{item.title}</h3>
            {item.body !== undefined && <p className={MV103_CLASS.body}>{item.body}</p>}
          </Cell>
        ))}
      </ol>
    </BlockShell>
  );
}
