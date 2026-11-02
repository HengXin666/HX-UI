"use client";

import * as React from "react";
import { CASE_CLASS, CASE_STUDIES_VARIANT, SOCIAL_CLASS, SOCIAL_DEFAULT, SOCIAL_SLOT } from "../../constants/blocks-marketing-v104";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../primitives/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../primitives/tabs";
import { BlockShell } from "../_shared/BlockShell";
import { useBlockLabels } from "../_shared/BlocksProvider";
import { renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, LinkItem, Logo, Media, Person, Rich, SectionHeadingData, Stat } from "../_shared/types";
import { CaseStudyPanel } from "./social-proof/CaseStudyPanel";
import { LogoMark } from "./social-proof/parts";

export type CaseStudiesVariant = (typeof CASE_STUDIES_VARIANT)[keyof typeof CASE_STUDIES_VARIANT];

/** 一个客户案例 (stripe: 图 + 数据 + 用到的产品; supabase: logo tabs + 引言). */
export interface CaseStudyItem {
  /** tabs / accordion 的值与 React key; 不给时用下标. */
  id?: string;
  logo: Logo;
  title: Rich;
  description?: Rich;
  /** 关键数据点 (value 为数字时按 locale 格式化). */
  metrics?: Stat[];
  media?: Media;
  products?: Array<string | LinkItem>;
  quote?: { text: Rich; person?: Person };
  /** 案例详情链接: 渲染为 link 外观的 Cta; 需要别的外观时给 cta. */
  href?: string;
  cta?: Cta;
}

export interface CaseStudiesProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  items: CaseStudyItem[];
  /** tabs (logo 切换) / accordion (逐条展开). 默认 tabs. */
  variant?: CaseStudiesVariant;
  /** "用到的产品" 小标题 (可见文案, 来自数据). */
  productsLabel?: Rich;
  /** "阅读案例" 之类的链接文案, 只在条目给了 href 而没给 cta 时使用. */
  linkLabel?: Rich;
  /** 受控 / 非受控 (component-contract 2.1): 当前展开或选中的条目 id. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  ref?: React.Ref<HTMLElement>;
}

const keyOf = (item: CaseStudyItem, index: number): string => item.id ?? String(index);

/**
 * 客户案例区块 (审计 B8). tabs: logo 作触发器 (名称给读屏), 面板 = 标题 + CaseStudyPanel;
 * accordion: 单开可收起, 触发器 = logo + 标题. 两种形态共用同一面板, 数据结构相同, 可随时切换.
 */
export function CaseStudies({
  heading,
  items,
  variant = SOCIAL_DEFAULT.caseVariant,
  productsLabel,
  linkLabel,
  value,
  defaultValue,
  onValueChange,
  labels: labelsProp,
  ...base
}: CaseStudiesProps): React.JSX.Element {
  const labels = useBlockLabels(labelsProp);
  const initial = defaultValue ?? (items.length > 0 ? keyOf(items[0], 0) : undefined);
  const panel = (item: CaseStudyItem) => {
    const cta: Cta | undefined = item.cta ?? (item.href && linkLabel !== undefined ? { label: linkLabel, href: item.href, variant: "link", iconEnd: true } : undefined);
    return (
      <CaseStudyPanel
        description={item.description}
        metrics={item.metrics}
        media={item.media}
        products={item.products}
        productsLabel={productsLabel}
        quote={item.quote}
        cta={cta}
        labels={labels}
      />
    );
  };

  const body =
    variant === CASE_STUDIES_VARIANT.accordion ? (
      <Accordion type="single" collapsible value={value} defaultValue={value === undefined ? initial : undefined} onValueChange={onValueChange}>
        {items.map((item, index) => (
          <AccordionItem key={keyOf(item, index)} value={keyOf(item, index)} className={CASE_CLASS.accordionItem}>
            <AccordionTrigger className={CASE_CLASS.accordionTrigger}>
              <span className={CASE_CLASS.triggerInner}>
                <LogoMark logo={{ ...item.logo, href: undefined }} decorative />
                <span className={CASE_CLASS.triggerTitle}>{item.title}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className={CASE_CLASS.content}>{panel(item)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    ) : (
      <Tabs value={value} defaultValue={value === undefined ? initial : undefined} onValueChange={onValueChange}>
        <TabsList variant="pill" className={CASE_CLASS.tabsList}>
          {items.map((item, index) => (
            <TabsTrigger key={keyOf(item, index)} value={keyOf(item, index)} className={CASE_CLASS.tabsTrigger}>
              <LogoMark logo={{ ...item.logo, href: undefined }} decorative />
              <span className={SOCIAL_CLASS.srOnly}>{item.logo.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {items.map((item, index) => (
          <TabsContent key={keyOf(item, index)} value={keyOf(item, index)}>
            <h3 className={CASE_CLASS.tabsTitle}>{item.title}</h3>
            {panel(item)}
          </TabsContent>
        ))}
      </Tabs>
    );

  return (
    <BlockShell {...base} heading={heading} renderHeading={renderSectionHeading}>
      <div data-slot={SOCIAL_SLOT.caseStudies} data-variant={variant}>
        {body}
      </div>
    </BlockShell>
  );
}
