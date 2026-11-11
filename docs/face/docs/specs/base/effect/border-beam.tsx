import type { ComponentProps } from "react";
import { BorderBeam } from "@hx/ui";
import beamRaw from "../../../../../../src/effects/BorderBeam.tsx?raw";
import { SPEC_GROUP } from "../../groups";
import { range, select, toggle, type ComponentSpec } from "../../types";
import { DEMO_CARD, REVERSE, THUMB_SCALE } from "./shared";

export const BORDER_BEAM: ComponentSpec = {
  id: "border-beam",
  label: "BorderBeam 流光边框",
  desc: "沿宿主 1px 边框流动的光, 永远不比边框粗; 放进任意 relative 且带圆角的容器里即可, 减弱动效时停转.",
  group: SPEC_GROUP.effect,
  importName: "BorderBeam",
  source: "src/effects/BorderBeam.tsx",
  raw: beamRaw,
  deps: [],
  thumbScale: THUMB_SCALE,
  controls: [
    select("tone", "取色", ["primary", "accent"], "primary", '"primary" | "accent"', "primary 主色, accent 辅色."),
    range("duration", "一圈时长", [1, 16, 0.5], 6, "绕边一圈的时长 (秒)."),
    range("delay", "延迟", [0, 4, 0.25], 0, "起步延迟 (秒), 多个光束错开时用."),
    toggle(REVERSE, "逆时针", false, "逆时针流动."),
  ],
  render: (props) => (
    <div className={DEMO_CARD}>
      流光沿 1px 边框走
      <BorderBeam {...(props as unknown as ComponentProps<typeof BorderBeam>)} />
    </div>
  ),
};
