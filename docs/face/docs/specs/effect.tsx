import type { ComponentProps } from "react";
import { BorderBeam, GradientBorder, Marquee, SpotlightCard } from "@hx/ui";
import beamRaw from "../../../../src/effects/BorderBeam.tsx?raw";
import spotRaw from "../../../../src/effects/SpotlightCard.tsx?raw";
import borderRaw from "../../../../src/effects/GradientBorder.tsx?raw";
import marqueeRaw from "../../../../src/effects/Marquee.tsx?raw";
import { EFFECT_TOKENS } from "./background";
import { SPEC_GROUP } from "./groups";
import { NONE, T, color, range, select, text, toggle, type ComponentSpec } from "./types";

/** 演示卡: 效果件都叠在一张圆角卡上. */
const DEMO_CARD = "relative grid h-44 w-80 place-items-center rounded-2xl border border-border bg-card text-sm text-muted-foreground";
const DEMO_LABEL = "悬停或聚焦这张卡";
const REVERSE = "reverse";
/** 演示卡尺寸固定, 缩略图里放大些才看得清. */
const THUMB_SCALE = 0.62;
const COLORS = "colors";
const CHILDREN_ROW = { name: "children", type: "ReactNode", initial: NONE, desc: "卡片内容." };
const MARQUEE_ITEMS = ["按钮", "输入框", "下拉选择", "对话框", "抽屉", "日历", "图表", "代码块"];
const CHIP = "rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground";

export const EFFECT_SPECS: readonly ComponentSpec[] = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
    id: "marquee",
    label: "Marquee 跑马灯",
    desc: "内容渲染多份同步平移, 视觉无缝; 复制件不进可访问性树, 减弱动效时停下改为可手动横滚.",
    group: SPEC_GROUP.effect,
    importName: "Marquee",
    source: "src/effects/Marquee.tsx",
    raw: marqueeRaw,
    deps: [],
    thumbScale: THUMB_SCALE,
    children: "{items.map((item) => <span key={item}>{item}</span>)}",
    fixed: { className: "w-full" },
    controls: [
      range("duration", "一份时长", [4, 60, 1], 20, "滚完一份的时长 (秒). 不传用 effects.css 的默认值."),
      text("gap", "间距", "1rem", "项与项, 份与份之间的间距, 任意 CSS 长度."),
      range("repeat", "份数", [2, 6, 1], 2, "内容复制份数, 至少 2. 内容很短时调大, 避免出现空档."),
      toggle("pauseOnHover", "悬停暂停", true, "指针悬停时暂停. 键盘焦点落在里面时总是暂停."),
      toggle(REVERSE, "反向", false, "反向滚动 (横向从左往右, 纵向从上往下)."),
      toggle("fade", "两端渐隐", true, "两端渐隐."),
    ],
    render: (props) => (
      <Marquee {...(props as unknown as ComponentProps<typeof Marquee>)}>
        {MARQUEE_ITEMS.map((item) => (
          <span key={item} className={CHIP}>
            {item}
          </span>
        ))}
      </Marquee>
    ),
  },
];
