import { useState } from "react";
import { ArcKnob } from "../../../../../../src/controls";
import knobRaw from "../../../../../../src/controls/range/input/ArcKnob.tsx?raw";
import { color, initialValues, range, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { RANGE_TONES } from "./tones";

/**
 * controls 批 1: 弧形旋钮. 演示是调音台的一路增益: 下面一行写出 onChangeEnd 报出的值.
 * 跟随速度 speed, 回弹 tapBounce / flickBounce 与惯性 momentum 只在拖动与甩出时看得到, 留在 Props 表.
 */

const CONTROLS: readonly ControlDef[] = [
  text("label", "标签", "输入增益", "读数下方的小字, 也是读屏名称."),
  text("unit", "单位", "%", "读数后缀, 也进 aria-valuetext."),
  range("defaultValue", "初始值", [0, 100, 1], 62, "非受控的初始值."),
  range("step", "步长", [1, 10, 1], 1, "吸附与方向键一步的大小."),
  range("size", "尺寸", [140, 300, 10], 220, "整个旋钮的边长 px, 读数与标签字号按它缩放."),
  range("sweep", "张角", [180, 340, 10], 320, "圆弧张角 (度), 缺口朝下."),
  range("thickness", "弧线粗细", [1, 12, 1], 5, "圆弧轨道的线宽 px."),
  color("accentTone", "读数头色", RANGE_TONES, "foreground", "RangeTone", "已走过那段弧与读数头的颜色."),
  color("inkTone", "读数色", RANGE_TONES, "foreground", "RangeTone", "中间数字的颜色."),
  toggle("disabled", "禁用", false, "半透明, 不响应指针与键盘."),
];
const BASE = initialValues(CONTROLS);

function KnobDemo(props: Record<string, unknown>) {
  const [log, setLog] = useState("拖动圆弧, 或聚焦后按方向键");
  return (
    <div className="flex flex-col items-center gap-3">
      <ArcKnob {...props} onChangeEnd={(value) => setLog(`onChangeEnd: ${value}${String(props.unit ?? "")}`)} />
      <p className="font-mono text-[12px] text-muted-foreground">{log}</p>
    </div>
  );
}

export const ARC_KNOB: PageSpec = {
  id: "arc-knob",
  kind: "control",
  importName: "ArcKnob",
  source: "src/controls/range/input/ArcKnob.tsx",
  raw: knobRaw,
  deps: [],
  controls: CONTROLS,
  height: 400,
  render: (props) => <KnobDemo {...props} />,
  usage: (values: Values) => controlUsage("ArcKnob", values, { ...BASE, label: "", unit: "", size: -1 }),
  propDesc: {
    value: "受控值; 给了它就由外部驱动, 变化时读数头以弹簧走过去.",
    min: "最小值.",
    max: "最大值.",
    speed: "拖动时读数跟随指针的快慢.",
    tapBounce: "点按跳过去时的回弹.",
    flickBounce: "甩出滑行后吸附时的回弹.",
    momentum: "甩出惯性的倍数, 0 不滑行.",
    cometReach: "彗尾满长 (度), 速度越快尾巴越长.",
    cometWidth: "彗尾的线宽 px.",
    onChange: "读数每变一次都调用 (拖动中连续触发).",
    onChangeEnd: "松手, 点按或按键之后报一次最终值.",
  },
  propsNote: "根元素是 <svg role=\"slider\" tabIndex={0}>, aria-valuenow / aria-valuetext 跟着读数走; className 落在它上面.",
  examples: [
    {
      id: "pair",
      title: "一组小旋钮",
      desc: "调音台一排: 同尺寸, 不同色调区分通道; 温度旋钮换单位与步长.",
      code: `<ArcKnob label="低频" unit="dB" min={-12} max={12} defaultValue={3} size={150} accentTone="primary" />\n<ArcKnob label="色温" unit="K" min={2700} max={6500} step={100} defaultValue={4000} size={150} accentTone="warning" />`,
      render: () => (
        <>
          <ArcKnob label="低频" unit="dB" min={-12} max={12} defaultValue={3} size={150} accentTone="primary" />
          <ArcKnob label="色温" unit="K" min={2700} max={6500} step={100} defaultValue={4000} size={150} accentTone="warning" />
        </>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦旋钮 (svg 本身带 tabIndex), 出 1px 焦点环." },
    { keys: ["←", "↓"], action: "减一步; → / ↑ 加一步." },
    { keys: ["PageUp"], action: "加十步; PageDown 减十步." },
    { keys: ["Home"], action: "到最小值; End 到最大值." },
  ],
  reduced: {
    desc: "减少动效下读数直接跳到目标值: 没有弹簧, 没有惯性滑行, 没有彗尾.",
    notes: ["点按, 拖动与按键都让读数头立即落到新位置.", "甩出不滑行, 松手即停.", "不画随速度伸缩的彗尾."],
    height: 300,
  },
};
