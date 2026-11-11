import type { ComponentProps } from "react";
import { SpotlightCard } from "@hx/ui";
import spotRaw from "../../../../../../src/effects/SpotlightCard.tsx?raw";
import { SPEC_GROUP } from "../../groups";
import { range, type ComponentSpec } from "../../types";
import { DEMO_CARD, DEMO_LABEL, THUMB_SCALE, CHILDREN_ROW } from "./shared";

export const SPOTLIGHT_CARD: ComponentSpec = {
  id: "spotlight-card",
  label: "SpotlightCard 光斑卡",
  desc: "指针跟随的径向光斑, 坐标直接写 CSS 变量不触发重渲染; 触屏与减弱动效时不跟随, 键盘聚焦时中心亮起.",
  group: SPEC_GROUP.effect,
  importName: "SpotlightCard",
  source: "src/effects/SpotlightCard.tsx",
  raw: spotRaw,
  deps: [],
  thumbScale: THUMB_SCALE,
  children: DEMO_LABEL,
  fixed: { className: DEMO_CARD, tabIndex: 0 },
  controls: [range("size", "光斑直径", [80, 640, 10], 320, "光斑直径 (px).")],
  extraProps: [CHILDREN_ROW],
  render: (props) => (
    <SpotlightCard {...(props as unknown as ComponentProps<typeof SpotlightCard>)}>{DEMO_LABEL}</SpotlightCard>
  ),
};
