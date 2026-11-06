import { useState, type JSX } from "react";
import { SegmentedControl } from "@hx/ui";
import { BlockShell } from "../../../../../src/blocks/_shared/BlockShell";
import { PageComposer } from "../../../../../src/blocks/_shared/PageComposer";
import type { BlockRegistry } from "../../../../../src/blocks/_shared/types";
import { CaseStudies } from "../../../../../src/blocks/marketing/CaseStudies";
import { ChangelogList } from "../../../../../src/blocks/marketing/ChangelogList";
import { CodeShowcase } from "../../../../../src/blocks/marketing/CodeShowcase";
import { CtaBanner } from "../../../../../src/blocks/marketing/CtaBanner";
import { FeatureGrid } from "../../../../../src/blocks/marketing/FeatureGrid";
import { Hero } from "../../../../../src/blocks/marketing/Hero";
import { InstallBlock } from "../../../../../src/blocks/marketing/InstallBlock";
import { siteBlockRegistry } from "../../../../../src/blocks/site";
import { SKIN, SKIN_LIST } from "../../../../../src/constants/skins";
import { OSS_PAGE, OSS_SKINS } from "./data";

/** 本页用到的区块注册表 (src/blocks/registry.ts 归集成任务, 这里只注入本页所需). */
export const OSS_REGISTRY = {
  ...siteBlockRegistry,
  Hero,
  InstallBlock,
  CodeShowcase,
  FeatureGrid,
  CaseStudies,
  ChangelogList,
  CtaBanner,
} satisfies BlockRegistry;

type OssSkin = (typeof OSS_SKINS)[number];

const SKIN_ITEMS = OSS_SKINS.map((name) => ({ key: name, label: SKIN_LIST.find((s) => s.name === name)?.label ?? name }));

/**
 * V2-01 开源项目站整页模板: 只组合区块 + data.ts 的 JSON, 零自定义 class.
 * 顶部的分段按钮切换 default / mono / fintech 三套皮肤, 皮肤经 PageComposer 的 skin 写到根节点 data-skin,
 * 区块代码不感知皮肤名; default 不写属性, 与无皮肤层时逐字节一致.
 */
export function OpenSourcePage(): JSX.Element {
  const [skin, setSkin] = useState<OssSkin>(SKIN.default);
  return (
    <>
      <BlockShell pad="sm" tone="muted" width="content" aria-label="皮肤切换">
        <SegmentedControl items={SKIN_ITEMS} value={skin} onChange={setSkin} />
      </BlockShell>
      <PageComposer
        blocks={OSS_PAGE}
        registry={OSS_REGISTRY}
        skin={skin === SKIN.default ? undefined : skin}
        locale="zh-CN"
        as="div"
      />
    </>
  );
}
