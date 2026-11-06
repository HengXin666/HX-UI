"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import { EXTERNAL_LINK } from "../../constants/blocks";
import { PORTFOLIO_CLASS, PORTFOLIO_FLAG, PORTFOLIO_SLOT, PORTFOLIO_TEXT_ZH } from "../../constants/blocks-portfolio-v111";
import { Prose } from "../../typography/Prose";
import { BlockShell } from "../_shared/BlockShell";
import { useBlockLabels } from "../_shared/BlocksProvider";
import { renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, ExperienceItem, SectionHeadingData } from "../_shared/types";
import { TagList } from "./parts/TagList";

export interface ExperienceTimelineProps extends BlockBaseProps {
  items: ReadonlyArray<ExperienceItem>;
  heading?: SectionHeadingData;
  /** 只显示最近 N 条, 其余由"展开全部"按钮显示. 不给或不小于条数时全部显示. */
  limit?: number;
  /** 展开 / 收起按钮的可见文案; 默认取 labels.expand / labels.collapse. */
  showAllLabel?: string;
  showLessLabel?: string;
  /** 当前在职徽标文案. */
  currentLabel?: string;
  ref?: React.Ref<HTMLElement>;
}

function Org({ item, external }: { item: ExperienceItem; external: string }): React.JSX.Element {
  if (item.href === undefined) return <>{item.org}</>;
  return (
    <a href={item.href} className={PORTFOLIO_CLASS.timelineOrgLink} {...EXTERNAL_LINK}>
      {item.org}
      <span className={PORTFOLIO_CLASS.srOnly}>{` (${external})`}</span>
    </a>
  );
}

/**
 * 经历时间线: 时间段 + 职位 · 公司 (可链接) + 描述 (Prose) + 技术标签 chips.
 * current 的条目带描边底与"在职"徽标 (data-current); limit 截断后用按钮展开全部 (aria-expanded + aria-controls).
 * 窄容器下时间段在上, 宽容器 (@2xl) 下时间段占左列.
 */
export function ExperienceTimeline({
  items,
  heading,
  limit,
  showAllLabel,
  showLessLabel,
  currentLabel = PORTFOLIO_TEXT_ZH.current,
  labels: labelsProp,
  ref,
  ...shell
}: ExperienceTimelineProps): React.JSX.Element {
  const labels = useBlockLabels(labelsProp);
  const listId = React.useId();
  const [expanded, setExpanded] = React.useState(false);
  const truncated = limit !== undefined && limit >= 0 && limit < items.length;
  const visible = truncated && !expanded ? items.slice(0, limit) : items;
  return (
    <BlockShell {...shell} ref={ref} heading={heading} renderHeading={heading ? renderSectionHeading : undefined}>
      <ol id={listId} data-slot={PORTFOLIO_SLOT.timeline} className={PORTFOLIO_CLASS.timelineList}>
        {visible.map((item, index) => (
          <li
            key={`${typeof item.org === "string" ? item.org : index}-${typeof item.period === "string" ? item.period : index}`}
            data-slot={PORTFOLIO_SLOT.timelineItem}
            data-current={item.current ? PORTFOLIO_FLAG.on : undefined}
            aria-current={item.current ? "true" : undefined}
            className={PORTFOLIO_CLASS.timelineItem}
          >
            <p className={PORTFOLIO_CLASS.timelinePeriod}>{item.period}</p>
            <div className={PORTFOLIO_CLASS.timelineBody}>
              <h3 className={PORTFOLIO_CLASS.timelineTitle}>
                {item.title}
                <span className={PORTFOLIO_CLASS.timelineSep}>{" · "}</span>
                <Org item={item} external={labels.externalLink} />
                {item.current && <span className={PORTFOLIO_CLASS.currentBadge}>{currentLabel}</span>}
              </h3>
              {item.body !== undefined && (
                <Prose size="sm" className={PORTFOLIO_CLASS.heroBio}>
                  {typeof item.body === "string" ? <p>{item.body}</p> : item.body}
                </Prose>
              )}
              <TagList tags={item.tags} />
            </div>
          </li>
        ))}
      </ol>
      {truncated && (
        <button
          type={BUTTON_TYPE}
          data-slot={PORTFOLIO_SLOT.timelineToggle}
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((v) => !v)}
          className={PORTFOLIO_CLASS.toggle}
        >
          {expanded ? (showLessLabel ?? labels.collapse) : (showAllLabel ?? `${labels.expand} (${items.length})`)}
        </button>
      )}
    </BlockShell>
  );
}
