import type { ComponentProps } from "react";
import { MeshGradient } from "@hx/ui";
import meshRaw from "../../../../../../src/effects/MeshGradient.tsx?raw";
import { SPEC_GROUP } from "../../groups";
import { T, color, range, toggle, type ComponentSpec } from "../../types";
import { EFFECT_TOKENS, FILL, KEY, FADE_LABEL, FADE_DESC, ANIMATED_DESC, CHILDREN_ROW, MESH_KEYS, COLORS, meshProps } from "./shared";

export const MESH_GRADIENT: ComponentSpec = {
  id: "mesh-gradient",
  label: "MeshGradient 网格渐变",
  desc: "多团径向光叠成的 mesh 背景, 缓慢漂移; 只产出 var(--令牌) 与 color-mix, 换肤自动跟随.",
  group: SPEC_GROUP.background,
  importName: "MeshGradient",
  source: "src/effects/MeshGradient.tsx",
  raw: meshRaw,
  deps: [],
  fill: true,
  fixed: { className: FILL },
  controls: [
    { ...color(MESH_KEYS[0], "颜色 1", EFFECT_TOKENS, EFFECT_TOKENS[0], T.tokens, "语义令牌名数组, 每个一团径向光, 建议 3 个以上; 这里三格分别调第 1 到 3 项."), prop: COLORS },
    { ...color(MESH_KEYS[1], "颜色 2", EFFECT_TOKENS, "accent-2", T.tokens, "colors 的第 2 项."), prop: COLORS },
    { ...color(MESH_KEYS[2], "颜色 3", EFFECT_TOKENS, "success", T.tokens, "colors 的第 3 项."), prop: COLORS },
    range(KEY.intensity, "强度", [0, 1, 0.05], 0.6, "强度 0..1, 决定每团光的令牌混入比例."),
    toggle(KEY.animated, "漂移", true, ANIMATED_DESC),
    toggle(KEY.fade, FADE_LABEL, false, FADE_DESC),
  ],
  extraProps: [CHILDREN_ROW],
  toProps: meshProps,
  render: (props) => <MeshGradient {...(props as unknown as ComponentProps<typeof MeshGradient>)} />,
};
