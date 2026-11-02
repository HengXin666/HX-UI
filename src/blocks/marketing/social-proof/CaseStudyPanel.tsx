"use client";

import * as React from "react";
import { CASE_CLASS, SOCIAL_SLOT, SOCIAL_DEFAULT } from "../../../constants/blocks-marketing-v104";
import { Badge } from "../../../layout/Badge";
import { useBlocks } from "../../_shared/BlocksProvider";
import { CtaButton } from "../../_shared/SectionHeading";
import type { BlockLabels, Cta, LinkItem, Media, Person, Rich, Stat } from "../../_shared/types";
import { ExpandableQuote } from "./ExpandableQuote";
import { linkProps, MediaView, PersonLine } from "./parts";

export interface CaseStudyPanelProps {
  description?: Rich;
  metrics?: Stat[];
  media?: Media;
  /** 用到的产品: 纯名字或带链接的 LinkItem. */
  products?: Array<string | LinkItem>;
  productsLabel?: Rich;
  quote?: { text: Rich; person?: Person };
  cta?: Cta;
  labels: Pick<BlockLabels, "expand" | "collapse">;
}

/** 关键数据点: 数字走 Intl (BlocksProvider.formatNumber), 字符串原样. */
function Metric({ stat }: { stat: Stat }): React.JSX.Element {
  const { formatNumber } = useBlocks();
  const value = typeof stat.value === "number" ? formatNumber(stat.value) : stat.value;
  const figure = (
    <>
      {stat.prefix}
      {value}
      {stat.suffix}
    </>
  );
  return (
    <div className={CASE_CLASS.metric}>
      <dt className={CASE_CLASS.metricLabel}>{stat.label}</dt>
      <dd className={CASE_CLASS.metricValue}>{stat.href ? <a {...linkProps(stat.href)}>{figure}</a> : figure}</dd>
    </div>
  );
}

/**
 * 客户案例面板 (stripe 手风琴 / supabase tabs 共用): 左图, 右侧 描述 + 数据点 + 用到的产品 + 引言 + 链接.
 * 容器窄于 @3xl 时上下堆叠, 媒体在上. dl 里 dt 在前 (语义), 视觉上用 flex-col-reverse 让数字在上.
 */
export function CaseStudyPanel({ description, metrics, media, products, productsLabel, quote, cta, labels }: CaseStudyPanelProps): React.JSX.Element {
  return (
    <div data-slot={SOCIAL_SLOT.casePanel} className={CASE_CLASS.panel}>
      {media && <MediaView media={media} />}
      <div className={CASE_CLASS.panelBody}>
        {description !== undefined && <div className={CASE_CLASS.description}>{description}</div>}
        {metrics && metrics.length > 0 && (
          <dl data-slot={SOCIAL_SLOT.caseMetrics} className={CASE_CLASS.metrics}>
            {metrics.map((stat, index) => (
              <Metric key={index} stat={stat} />
            ))}
          </dl>
        )}
        {products && products.length > 0 && (
          <div data-slot={SOCIAL_SLOT.caseProducts}>
            {productsLabel !== undefined && <p className={CASE_CLASS.productsTitle}>{productsLabel}</p>}
            <ul className={CASE_CLASS.products}>
              {products.map((product) => (
                <li key={typeof product === "string" ? product : product.href}>
                  {typeof product === "string" ? (
                    <Badge variant="outline">{product}</Badge>
                  ) : (
                    <Badge variant="outline" className={CASE_CLASS.productLink}>
                      <a {...linkProps(product.href, product.external)} aria-current={product.current ? "page" : undefined}>
                        {product.label}
                      </a>
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {quote && (
          <figure className={CASE_CLASS.quote}>
            <ExpandableQuote quote={quote.text} clampLines={SOCIAL_DEFAULT.clampLines} labels={labels} />
            {quote.person && (
              <figcaption>
                <PersonLine person={quote.person} />
              </figcaption>
            )}
          </figure>
        )}
        {cta && (
          <div>
            <CtaButton cta={cta} />
          </div>
        )}
      </div>
    </div>
  );
}
