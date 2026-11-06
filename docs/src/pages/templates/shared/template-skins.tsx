import { useState, type JSX, type ReactNode } from "react";
import { VStack } from "../../../../../src/box/Stack";
import { SKIN, SKIN_LIST } from "../../../../../src/constants/skins";
import { SegmentedControl, type SegmentedControlItem } from "../../../../../src/layout/SegmentedControl";

/** 整页模板 (V2-03) 支持的三套皮肤. 名称与标签都取自 src/constants/skins, 不另写字面量. */
export const TEMPLATE_SKINS = [SKIN.default, SKIN.mono, SKIN.linear] as const;

export type TemplateSkin = (typeof TEMPLATE_SKINS)[number];

const SKIN_ITEMS: SegmentedControlItem<TemplateSkin>[] = TEMPLATE_SKINS.map((name) => ({
  key: name,
  label: SKIN_LIST.find((entry) => entry.name === name)?.label ?? name,
}));

export interface SkinSwitcherProps {
  initial?: TemplateSkin;
  /** 渲染整页; 收到当前皮肤名, 由页面写进 PageComposer 的 skin (根节点 data-skin). */
  children: (skin: TemplateSkin) => ReactNode;
}

/** 皮肤切换条 + 整页. 只用 SegmentedControl 与 VStack, 不写任何样式类. */
export function SkinSwitcher({ initial = SKIN.default, children }: SkinSwitcherProps): JSX.Element {
  const [skin, setSkin] = useState<TemplateSkin>(initial);
  return (
    <VStack gap="md">
      <SegmentedControl items={SKIN_ITEMS} value={skin} onChange={setSkin} />
      {children(skin)}
    </VStack>
  );
}
