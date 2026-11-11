import type { ComponentProps } from "react";
import { Beam } from "@hx/ui";
import beamRaw from "../../../../../../src/effects/Beam.tsx?raw";
import { SPEC_GROUP } from "../../groups";
import { T, color, range, toggle, type ComponentSpec } from "../../types";
import { EFFECT_TOKENS, HOST, KEY, INTENSITY_DESC } from "./shared";

export const BEAM: ComponentSpec = {
  id: "beam",
  label: "Beam 光束",
  desc: "从光源投下一道模糊的锥形光, 光源处带一团光晕; 放进任意 isolate 宿主里使用.",
  group: SPEC_GROUP.background,
  importName: "Beam",
  source: "src/effects/Beam.tsx",
  raw: beamRaw,
  deps: [],
  fill: true,
  controls: [
    color("color", "颜色", EFFECT_TOKENS, EFFECT_TOKENS[0], T.str, "取色的语义令牌名."),
    range("angle", "角度", [-60, 60, 1], 18, "光束偏转角 (deg), 0 为竖直向下."),
    range("x", "光源 X", [0, 100, 1], 50, "光源横向位置 (%)."),
    range("y", "光源 Y", [0, 100, 1], 0, "光源纵向位置 (%)."),
    range("width", "宽度", [40, 480, 10], 180, "光束宽度 (px)."),
    range(KEY.intensity, "强度", [0, 1, 0.05], 0.7, INTENSITY_DESC),
    toggle(KEY.animated, "呼吸", false, "缓慢呼吸. 减弱动效时总是静止."),
  ],
  render: (props) => (
    <div className={HOST}>
      <Beam {...(props as unknown as ComponentProps<typeof Beam>)} />
    </div>
  ),
};
