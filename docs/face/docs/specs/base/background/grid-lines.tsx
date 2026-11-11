import type { ComponentProps } from "react";
import { GridLines } from "@hx/ui";
import gridRaw from "../../../../../../src/effects/GridLines.tsx?raw";
import { SPEC_GROUP } from "../../groups";
import { range, toggle, type ComponentSpec } from "../../types";
import { FILL, KEY, STEP2, FADE_LABEL, FADE_DESC, CHILDREN_ROW } from "./shared";

export const GRID_LINES: ComponentSpec = {
  id: "grid-lines",
  label: "GridLines 网格准星",
  desc: "1px 网格线加交点十字准星 (vercel 式), 一张内联 SVG 的两个 pattern 画成, 线色从令牌混出.",
  group: SPEC_GROUP.background,
  importName: "GridLines",
  source: "src/effects/GridLines.tsx",
  raw: gridRaw,
  deps: [],
  fill: true,
  fixed: { className: FILL },
  controls: [
    range(KEY.size, "格距", [12, 96, STEP2], 32, "格距 (px)."),
    range("crossEvery", "准星间隔", [0, 8, 1], 4, "每隔几格在交点放一个十字准星, 0 关闭."),
    toggle(KEY.fade, FADE_LABEL, true, FADE_DESC),
  ],
  extraProps: [CHILDREN_ROW],
  render: (props) => <GridLines {...(props as unknown as ComponentProps<typeof GridLines>)} />,
};
