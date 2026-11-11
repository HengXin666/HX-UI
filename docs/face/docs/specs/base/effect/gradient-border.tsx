import type { ComponentProps } from "react";
import { GradientBorder } from "@hx/ui";
import borderRaw from "../../../../../../src/effects/GradientBorder.tsx?raw";
import { EFFECT_TOKENS } from "../background/shared";
import { SPEC_GROUP } from "../../groups";
import { T, color, range, type ComponentSpec } from "../../types";
import { DEMO_CARD, THUMB_SCALE, COLORS } from "./shared";

export const GRADIENT_BORDER: ComponentSpec = {
  id: "gradient-border",
  label: "GradientBorder 渐变描边",
  desc: "叠在宿主 1px 边框上的静态渐变描边, 与流光边框同一手法, 只剩 1px 环; 静态无动效.",
  group: SPEC_GROUP.effect,
  importName: "GradientBorder",
  source: "src/effects/GradientBorder.tsx",
  raw: borderRaw,
  deps: [],
  thumbScale: THUMB_SCALE,
  controls: [
    { ...color("from", "起点", EFFECT_TOKENS, EFFECT_TOKENS[0], T.tokens, "渐变色标的语义令牌名数组, 按顺序排列; 这里两格分别调起点与终点."), prop: COLORS },
    { ...color("to", "终点", EFFECT_TOKENS, EFFECT_TOKENS[1], T.tokens, "colors 的第 2 项."), prop: COLORS },
    range("angle", "角度", [0, 360, 5], 135, "渐变角度 (deg)."),
  ],
  toProps: (values) => ({ [COLORS]: [values.from, values.to], angle: values.angle }),
  render: (props) => (
    <div className={DEMO_CARD}>
      静态渐变描边
      <GradientBorder {...(props as unknown as ComponentProps<typeof GradientBorder>)} />
    </div>
  ),
};
