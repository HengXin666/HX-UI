import { useState } from "react";
import { SwellSlider } from "../../../../../../src/controls";
import swellRaw from "../../../../../../src/controls/range/input/SwellSlider.tsx?raw";
import { color, initialValues, range, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { RANGE_TONES } from "./tones";

/**
 * controls 批 1: 竖条滑杆. 一排竖条组成轨道, 值头移动越快, 头部附近的竖条隆起得越高, 留下一道尾迹.
 * 演示是均衡器的一路; 隆起的力度 (sensitivity, reach, skew, glide) 只在移动时看得到, 留在 Props 表.
 */

const CONTROLS: readonly ControlDef[] = [
  range("defaultValue", "初始值", [0, 100, 1], 58, "非受控的初始值."),
  range("bars", "竖条数", [12, 48, 1], 32, "轨道由多少根竖条组成."),
  range("height", "隆起高度", [24, 96, 4], 56, "竖条隆起时的最大高度 px, 也是组件高度."),
  range("restHeight", "静止高度", [4, 24, 1], 12, "静止时竖条高度 px."),
  range("gap", "条距", [1, 8, 1], 4, "竖条之间 px."),
  color("fillTone", "已填色", RANGE_TONES, "foreground", "RangeTone", "值头左侧竖条的颜色."),
  color("trackTone", "未填色", ["input", "muted", "foreground"], "input", "RangeTone", "值头右侧竖条的颜色."),
  toggle("showValue", "显示读数", true, "在轨道旁显示当前值."),
  range("step", "步长", [1, 10, 1], 1, "拖动吸附与方向键的一步."),
  toggle("disabled", "禁用", false, "变淡, 不响应."),
];
const BASE = initialValues(CONTROLS);

function SwellDemo(props: Record<string, unknown>) {
  const [value, setValue] = useState(Number(props.defaultValue));
  return (
    <div className="flex w-[min(24rem,calc(100vw-6rem))] flex-col gap-3">
      <div className="flex items-baseline justify-between text-[12px] text-muted-foreground">
        <span>中频 1 kHz</span>
        <span className="font-mono tabular-nums">{((value - 50) / 4).toFixed(1)} dB</span>
      </div>
      <SwellSlider {...props} ariaLabel="中频增益" onChange={setValue} />
    </div>
  );
}

export const SWELL_SLIDER: PageSpec = {
  id: "swell-slider",
  kind: "control",
  importName: "SwellSlider",
  source: "src/controls/range/input/SwellSlider.tsx",
  raw: swellRaw,
  deps: [],
  controls: CONTROLS,
  height: 260,
  render: (props) => <SwellDemo {...props} />,
  usage: (values: Values) => controlUsage("SwellSlider", { ...values, ariaLabel: "中频增益" }, { ...BASE, defaultValue: 50, showValue: false, ariaLabel: "" }),
  propDesc: {
    value: "受控值.",
    onChange: "值每变一次调用.",
    min: "下限.",
    max: "上限.",
    sensitivity: "速度到隆起幅度的倍数.",
    reach: "尾迹向两侧铺开的条数.",
    skew: "尾迹偏向运动后方的程度 (0 对称).",
    formatValue: "读数格式化.",
    ariaLabel: "读屏名称, 默认 Value.",
  },
  propsNote: "根上的轨道是 role=\"slider\" 的元素, 竖条都 aria-hidden; className 落在外层.",
  examples: [
    {
      id: "dense",
      title: "细密的进度条",
      desc: "更多更细的竖条, 静止高度压低, 当作可拖动的播放进度.",
      code: `<SwellSlider bars={48} gap={2} restHeight={6} height={40} defaultValue={32} fillTone="primary" ariaLabel="播放进度" />`,
      render: () => (
        <div className="w-[min(24rem,calc(100vw-6rem))]">
          <SwellSlider bars={48} gap={2} restHeight={6} height={40} defaultValue={32} fillTone="primary" ariaLabel="播放进度" />
        </div>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦轨道, 出 1px 焦点环." },
    { keys: ["←", "↓"], action: "减一步; → / ↑ 加一步." },
    { keys: ["PageUp"], action: "加十步; PageDown 减十步; Home / End 到两端." },
  ],
  reduced: {
    desc: "减少动效下值头直接跳到新值, 竖条不隆起, 没有尾迹.",
    notes: ["拖动与按键时竖条保持静止高度, 不随速度隆起.", "值头不以弹簧滑过去, 直接到位.", "已填 / 未填的分界照常跟着值走."],
  },
};
