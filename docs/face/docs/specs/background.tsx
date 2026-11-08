import type { ComponentProps } from "react";
import { Backdrop, Beam, Grain, GridLines, MeshGradient } from "@hx/ui";
import meshRaw from "../../../../src/effects/MeshGradient.tsx?raw";
import backdropRaw from "../../../../src/effects/Backdrop.tsx?raw";
import beamRaw from "../../../../src/effects/Beam.tsx?raw";
import gridRaw from "../../../../src/effects/GridLines.tsx?raw";
import grainRaw from "../../../../src/effects/Grain.tsx?raw";
import { SPEC_GROUP } from "./groups";
import { NONE, T, color, range, select, toggle, type ComponentSpec, type Values } from "./types";

/** 背景件可选的语义令牌. */
export const EFFECT_TOKENS = ["primary", "accent-2", "success", "warning", "danger", "link", "heading"];
/** 背景铺满预览台. */
const FILL = "size-full";
/** Beam 要放进 isolate 宿主里才能垫在内容下面. */
const HOST = "relative isolate size-full overflow-hidden";
const KEY = { fade: "fade", animated: "animated", intensity: "intensity", size: "size" } as const;
/** 格距滑块的步长 (px). */
const STEP2 = 2;
const FADE_LABEL = "渐隐";
const FADE_DESC = "从中心向四周渐隐, 避免底纹在边缘硬切.";
const ANIMATED_DESC = "缓慢漂移. 减弱动效时总是静止.";
const INTENSITY_DESC = "强度 0..1.";
const CHILDREN_ROW = { name: "children", type: "ReactNode", initial: NONE, desc: "垫在底纹上面的内容." };
const MESH_KEYS = ["color1", "color2", "color3"] as const;
const COLORS = "colors";

function meshProps(values: Values): Record<string, unknown> {
  return {
    [COLORS]: MESH_KEYS.map((key) => values[key]),
    intensity: values[KEY.intensity],
    animated: values[KEY.animated],
    fade: values[KEY.fade],
  };
}

export const BACKGROUND_SPECS: readonly ComponentSpec[] = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
];
