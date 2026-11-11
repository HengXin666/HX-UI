import type { ComponentProps } from "react";
import { Backdrop } from "@hx/ui";
import backdropRaw from "../../../../../../src/effects/Backdrop.tsx?raw";
import { SPEC_GROUP } from "../../groups";
import { range, select, toggle, type ComponentSpec } from "../../types";
import { FILL, KEY, STEP2, FADE_LABEL, FADE_DESC, CHILDREN_ROW } from "./shared";

export const BACKDROP: ComponentSpec = {
  id: "backdrop",
  label: "Backdrop 背景底纹",
  desc: "网格, 点阵与极光三种底纹, 垫在子内容下面不影响布局与点击; 极光漂移只动 transform.",
  group: SPEC_GROUP.background,
  importName: "Backdrop",
  source: "src/effects/Backdrop.tsx",
  raw: backdropRaw,
  deps: [],
  fill: true,
  fixed: { className: FILL },
  controls: [
    select("variant", "底纹", ["grid", "dots", "aurora"], "aurora", '"grid" | "dots" | "aurora"', "grid 网格线, dots 点阵, aurora 主色与辅色的柔光极光."),
    range(KEY.size, "格距", [8, 64, STEP2], 24, "grid 的格距与 dots 的点距 (px). aurora 不使用."),
    toggle(KEY.fade, FADE_LABEL, true, FADE_DESC),
    toggle(KEY.animated, "漂移", true, "aurora 缓慢漂移. 减弱动效时总是静止."),
  ],
  extraProps: [CHILDREN_ROW],
  render: (props) => <Backdrop {...(props as unknown as ComponentProps<typeof Backdrop>)} />,
};
