import type { JSX } from "react";
import { PageComposer } from "../../../../../src/blocks/_shared/PageComposer";
import type { BlockRegistry } from "../../../../../src/blocks/_shared/types";
import { Hero } from "../../../../../src/blocks/marketing/Hero";
import { LogoWall } from "../../../../../src/blocks/marketing/LogoWall";
import { siteBlockRegistry } from "../../../../../src/blocks/site";
import { SKIN } from "../../../../../src/constants/skins";
import { LINEAR_CLONE_PAGE } from "./data";

/** 本页只注入首屏用到的三个区块. */
export const LINEAR_CLONE_REGISTRY = {
  ...siteBlockRegistry,
  Hero,
  LogoWall,
} satisfies BlockRegistry;

/**
 * linear.app 首屏复刻 (以战代练). 只组合现有区块 + 现有 linear 皮肤, 零自定义 class, 零 style 覆盖:
 * 与 linear 的每一处差距都原样留在画面上, 作为 docs/reference/2026-ui-library-clone-findings.md 的证据.
 * 不在这里用 classNames / styles 逐像素修正 -- 那等于给库打补丁, 会把缺口藏起来.
 */
export function LinearClonePage(): JSX.Element {
  return (
    <PageComposer
      blocks={LINEAR_CLONE_PAGE}
      registry={LINEAR_CLONE_REGISTRY}
      skin={SKIN.linear}
      locale="en-US"
      as="div"
    />
  );
}
