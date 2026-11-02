import { ArrowUpRightIcon } from "lucide-react";
import type * as React from "react";
import { EXTERNAL_LINK } from "../../../constants/blocks";
import { PORTFOLIO_CLASS, PORTFOLIO_DEFAULT, PORTFOLIO_FLAG, PORTFOLIO_PROJECT_LAYOUT, PORTFOLIO_SLOT } from "../../../constants/blocks-portfolio-v111";
import { IconSlot } from "../../../layout/Icon";
import { Prose } from "../../../typography/Prose";
import type { ProjectGridLayout, ProjectItem } from "../../_shared/types";
import { PortfolioMedia } from "./PortfolioMedia";
import { TagList } from "./TagList";

export interface ProjectCardProps {
  item: ProjectItem;
  layout: ProjectGridLayout;
  featuredLabel: string;
  /** "新窗口打开"读屏提示. */
  externalLabel: string;
}

/**
 * 一张项目卡 (li). 标题链接用 after:absolute 撑满整卡, 成为唯一主链接; 额外外链 (源码 / 演示) 抬到 z-10 之上仍可点.
 * grid 档缩略图在上, list 档缩略图在左列.
 */
export function ProjectCard({ item, layout, featuredLabel, externalLabel }: ProjectCardProps): React.JSX.Element {
  const list = layout === PORTFOLIO_PROJECT_LAYOUT.list;
  const external = item.external ? EXTERNAL_LINK : {};
  const title =
    item.href !== undefined ? (
      <a href={item.href} className={PORTFOLIO_CLASS.cardLink} {...external}>
        {item.title}
        <IconSlot source={ArrowUpRightIcon} className={PORTFOLIO_CLASS.arrow} />
        {item.external && <span className={PORTFOLIO_CLASS.srOnly}>{` (${externalLabel})`}</span>}
      </a>
    ) : (
      item.title
    );
  return (
    <li data-slot={PORTFOLIO_SLOT.project} data-featured={item.featured ? PORTFOLIO_FLAG.on : undefined} className={list ? PORTFOLIO_CLASS.row : PORTFOLIO_CLASS.card}>
      {item.media !== undefined && (
        <div className={PORTFOLIO_CLASS.thumb}>
          <PortfolioMedia media={item.media} ratio={PORTFOLIO_DEFAULT.thumbRatio} className={PORTFOLIO_CLASS.thumbImage} />
        </div>
      )}
      <div className={PORTFOLIO_CLASS.cardBody}>
        <div className={PORTFOLIO_CLASS.cardTitleRow}>
          <h3 className={PORTFOLIO_CLASS.cardTitle}>{title}</h3>
          {item.featured && <span className={PORTFOLIO_CLASS.featured}>{featuredLabel}</span>}
        </div>
        {item.body !== undefined && (
          <Prose size="sm" className={PORTFOLIO_CLASS.heroBio}>
            {typeof item.body === "string" ? <p>{item.body}</p> : item.body}
          </Prose>
        )}
        <TagList tags={item.tags} />
        {item.links !== undefined && item.links.length > 0 && (
          <ul className={PORTFOLIO_CLASS.extraLinks}>
            {item.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={PORTFOLIO_CLASS.allPostsLink} {...(link.external ? EXTERNAL_LINK : {})}>
                  {link.icon !== undefined && <IconSlot source={link.icon} />}
                  {link.label}
                  {link.external && <span className={PORTFOLIO_CLASS.srOnly}>{` (${externalLabel})`}</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
