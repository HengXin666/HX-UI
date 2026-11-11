import type { ComponentProps } from "react";
import { Grain, MeshGradient } from "@hx/ui";
import grainRaw from "../../../../../../src/effects/Grain.tsx?raw";
import { SPEC_GROUP } from "../../groups";
import { range, select, type ComponentSpec } from "../../types";
import { FILL } from "./shared";

export const GRAIN: ComponentSpec = {
  id: "grain",
  label: "Grain 噪点颗粒",
  desc: "盖在内容上方的灰阶噪点层, 不接收指针; 噪声是内联 SVG feTurbulence, 不引图片不含色值.",
  group: SPEC_GROUP.background,
  importName: "Grain",
  source: "src/effects/Grain.tsx",
  raw: grainRaw,
  deps: [],
  fill: true,
  controls: [
    range("opacity", "不透明度", [0, 1, 0.02], 0.12, "颗粒不透明度 0..1."),
    select("blend", "混合", ["normal", "overlay", "soft-light", "multiply", "screen"], "overlay", "GrainBlend", "与下层的混合方式."),
  ],
  render: (props) => (
    <MeshGradient className={FILL}>
      <Grain {...(props as unknown as ComponentProps<typeof Grain>)} />
    </MeshGradient>
  ),
};
