import { useState } from "react";
import { StretchSlider } from "../../../../../../src/controls";
import stretchRaw from "../../../../../../src/controls/range/input/StretchSlider.tsx?raw";
import { initialValues, range, select, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";

/**
 * controls 批 1: 弹性滑块. 演示是播放器音量: 拖过两端轨道被拉长, 松手弹回; 下面一行写出 onChangeEnd.
 * 越界拉伸上限 maxStretch 与回弹 bounce 只在拖出界时看得到, 留在 Props 表.
 */

const CONTROLS: readonly ControlDef[] = [
  range("defaultValue", "初始值", [0, 100, 1], 64, "非受控的初始值."),
  select("orientation", "方向", ["horizontal", "vertical"], "horizontal", '"horizontal" | "vertical"', "横放或竖放; 竖放时从下往上填."),
  toggle("stepped", "吸附步长", true, "指针取值吸附到 step; 关掉时连续取值, step 只给键盘与滚轮."),
  range("step", "步长", [1, 25, 1], 10, "键盘, 滚轮与吸附的一步."),
  toggle("ticks", "刻度", true, "stepped 时在每一步画一条刻度; 不吸附时不画."),
  select("valuePosition", "读数位置", ["top", "bottom", "none"], "top", '"none" | "top" | "bottom"', "数值显示在轨道上方, 下方或不显示."),
  toggle("thumb", "拇指", false, "在填充端画一个圆形拇指."),
  range("thickness", "粗细", [2, 16, 1], 6, "静止时轨道粗细 px; 激活时到 activeThickness."),
  range("restOpacity", "静止浓度", [0.3, 1, 0.05], 0.7, "静止时轨道不透明度, 激活时到 1."),
  range("fillFrom", "填充起点", [0, 100, 5], 0, "从这个值开始往当前值填; 设成 50 就是双向填充."),
  toggle("disabled", "禁用", false, "变淡, 不响应."),
];
const BASE = initialValues(CONTROLS);

function StretchDemo(props: Record<string, unknown>) {
  const [log, setLog] = useState("拖动, 滚轮或方向键调音量");
  const vertical = props.orientation === "vertical";
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-[min(22rem,calc(100vw-6rem))] rounded-2xl border border-border bg-card p-4 text-left">
        <p className="text-[13px] font-medium text-foreground">雨夜电台 · 第 37 期</p>
        <p className="mt-1 text-[12px] text-muted-foreground">正在播放 · 23:14 / 58:02 · 音量</p>
        <div className={vertical ? "mt-4 flex h-56 justify-center" : "mt-5"}>
          <StretchSlider {...props} ariaLabel="音量" onChangeEnd={(value) => setLog(`onChangeEnd: ${Math.round(value)}`)} />
        </div>
      </div>
      <p className="font-mono text-[12px] text-muted-foreground">{log}</p>
    </div>
  );
}

export const STRETCH_SLIDER: PageSpec = {
  id: "stretch-slider",
  kind: "control",
  importName: "StretchSlider",
  source: "src/controls/range/input/StretchSlider.tsx",
  raw: stretchRaw,
  deps: ["lucide-react"],
  controls: CONTROLS,
  height: 420,
  render: (props) => <StretchDemo {...props} />,
  usage: (values: Values) => controlUsage("StretchSlider", { ...values, ariaLabel: "音量" }, { ...BASE, defaultValue: 50, stepped: false, step: 1, ticks: false, ariaLabel: "" }),
  propDesc: {
    value: "受控值.",
    min: "下限.",
    max: "上限.",
    onChange: "值每变一次调用.",
    startIcon: "低端图标, 默认小喇叭; 给 null 不画.",
    endIcon: "高端图标, 默认大喇叭; 给 null 不画.",
    formatValue: "读数的格式化, 默认取整.",
    activeThickness: "悬停或拖动时轨道粗细 px.",
    growOnHover: "悬停时也变粗; 关掉只在拖动时变粗.",
    ariaLabel: "读屏名称, 默认 Value.",
  },
  propsNote: "轨道是 role=\"slider\" 的元素 (带 aria-orientation, aria-valuetext); 两端图标拖出界时会被轻轻推开, 都 aria-hidden.",
  examples: [
    {
      id: "balance",
      title: "左右声道平衡",
      desc: "min -50 到 50, fillFrom 0 从中间往两边填; 图标换成文字.",
      code: `<StretchSlider min={-50} max={50} defaultValue={12} fillFrom={0} startIcon="L" endIcon="R" ariaLabel="声道平衡" />`,
      render: () => (
        <div className="w-[min(22rem,calc(100vw-6rem))]">
          <StretchSlider min={-50} max={50} defaultValue={12} fillFrom={0} startIcon="L" endIcon="R" ariaLabel="声道平衡" />
        </div>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦轨道, 键盘聚焦时出焦点环." },
    { keys: ["←", "↓"], action: "减一步; → / ↑ 加一步." },
    { keys: ["PageUp"], action: "加十步; PageDown 减十步; Home / End 到两端." },
  ],
  reduced: {
    desc: "减少动效下值照常跟手, 但轨道不再越界拉长, 粗细与填充直接到位, 不回弹.",
    notes: ["拖出两端时轨道不拉伸, 图标不被推开.", "悬停 / 拖动时粗细与不透明度直接切换.", "松手不回弹, 键盘与滚轮改值时填充直接跳到新位置."],
  },
};
