import { useState, type JSX } from "react";
import { SegmentedControl } from "@hx/ui";
import { BlockShell } from "../../../../../src/blocks/_shared/BlockShell";
import { PageComposer } from "../../../../../src/blocks/_shared/PageComposer";
import type { BlockRegistry } from "../../../../../src/blocks/_shared/types";
import { ComparisonMatrix } from "../../../../../src/blocks/marketing/ComparisonMatrix";
import { CtaBanner } from "../../../../../src/blocks/marketing/CtaBanner";
import { Faq } from "../../../../../src/blocks/marketing/Faq";
import { Hero } from "../../../../../src/blocks/marketing/Hero";
import { Pricing } from "../../../../../src/blocks/marketing/Pricing";
import { siteBlockRegistry } from "../../../../../src/blocks/site";
import { SKIN, SKIN_LIST } from "../../../../../src/constants/skins";
import { PRICING_PAGE, PRICING_SKINS } from "./data";

/** 本页用到的区块注册表 (src/blocks/registry.ts 归集成任务, 这里只注入本页所需). */
export const PRICING_REGISTRY = {
  ...siteBlockRegistry,
  Hero,
  Pricing,
  ComparisonMatrix,
  Faq,
  CtaBanner,
} satisfies BlockRegistry;

type PricingSkin = (typeof PRICING_SKINS)[number];

const SKIN_ITEMS = PRICING_SKINS.map((name) => ({ key: name, label: SKIN_LIST.find((s) => s.name === name)?.label ?? name }));

/**
 * V2-01 定价页整页模板: 只组合区块 + data.ts 的 JSON, 零自定义 class.
 * 顶部的分段按钮切换 default / mono / fintech 三套皮肤, 皮肤经 PageComposer 的 skin 写到根节点 data-skin,
 * 区块代码不感知皮肤名; default 不写属性, 与无皮肤层时逐字节一致.
 */
export function PricingPage(): JSX.Element {
  const [skin, setSkin] = useState<PricingSkin>(SKIN.default);
  return (
    <>
      <BlockShell pad="sm" tone="muted" width="content" aria-label="皮肤切换">
        <SegmentedControl items={SKIN_ITEMS} value={skin} onChange={setSkin} />
      </BlockShell>
      <PageComposer
        blocks={PRICING_PAGE}
        registry={PRICING_REGISTRY}
        skin={skin === SKIN.default ? undefined : skin}
        locale="zh-CN"
        as="div"
      />
    </>
  );
}
