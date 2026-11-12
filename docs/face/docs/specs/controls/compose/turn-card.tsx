import { useState } from "react";
import { TurnCard } from "../../../../../../src/controls";
import turnRaw from "../../../../../../src/controls/compose/overlay/TurnCard.tsx?raw";
import { color, initialValues, range, select, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { COMPOSE_SURFACES } from "./tones";

/**
 * controls 批 2: 翻转卡. 演示是一张活动入场证: 正面是名字与场次, 背面是当天日程. 点击或回车翻面,
 * 拖动时卡片跟手转, 松手按速度甩到最近一面; 悬停时按指针位置微倾并抬起, 一层高光跟着指针走.
 */

const CONTROLS: readonly ControlDef[] = [
  toggle("defaultFlipped", "初始背面", false, "非受控时一开始显示背面."),
  select("axis", "翻转轴", ["y", "x"], "y", '"x" | "y"', "y 左右翻, x 上下翻."),
  range("width", "宽度", [180, 300, 10], 240, "卡宽 px."),
  range("height", "高度", [200, 360, 10], 300, "卡高 px."),
  range("radius", "圆角", [0, 32, 1], 22, "卡片圆角 px."),
  color("background", "卡面色", COMPOSE_SURFACES, "card", "HxColor", "两面的底色."),
  toggle("shadow", "投影", true, "卡片下的投影."),
  range("stiffness", "翻转刚度", [40, 400, 10], 170, "翻面弹簧的刚度, 越大翻得越快."),
  range("damping", "翻转阻尼", [4, 40, 1], 20, "翻面弹簧的阻尼, 越小回弹越多."),
  toggle("tilt", "悬停微倾", true, "悬停时按指针位置微倾并抬起."),
  range("tiltMax", "最大倾角", [2, 30, 1], 12, "悬停微倾的上限 (度)."),
  range("hoverScale", "悬停放大", [1, 1.12, 0.01], 1.03, "悬停时抬起的缩放."),
  toggle("glare", "高光", true, "悬停时一层径向高光跟着指针走."),
  range("glareOpacity", "高光浓度", [0.05, 0.6, 0.01], 0.22, "高光的最大不透明度."),
  range("perspective", "透视距离", [300, 2400, 50], 1100, "透视距离 px, 越小透视越夸张."),
];
const BASE = initialValues(CONTROLS);

function Front() {
  return (
    <div className="flex size-full flex-col justify-between p-5 text-left">
      <div>
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground">HX-UI 设计周 · 2026</p>
        <p className="mt-1 text-[12px] text-muted-foreground">上海 · 11 月 21 日</p>
      </div>
      <div>
        <p className="text-[24px] font-semibold leading-tight">林知夏</p>
        <p className="text-[13px] text-muted-foreground">前端工程 · 讲者</p>
      </div>
      <p className="font-mono text-[12px] text-primary">入场证 No. 0412</p>
    </div>
  );
}

const AGENDA = [
  ["09:30", "签到与早餐"],
  ["10:30", "主题: 组件的手感"],
  ["14:00", "工作坊: 弹簧与阻尼"],
  ["16:30", "闭门圆桌"],
] as const;

function Back() {
  return (
    <div className="flex size-full flex-col gap-3 p-5 text-left">
      <p className="text-[13px] font-medium">当天日程</p>
      <ul className="flex flex-col gap-2 text-[12.5px]">
        {AGENDA.map(([time, item]) => (
          <li key={time} className="flex gap-3">
            <span className="font-mono text-muted-foreground">{time}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-auto text-[11.5px] text-muted-foreground">翻回正面: 再点一次或按 Enter</p>
    </div>
  );
}

function TurnDemo(props: Record<string, unknown>) {
  const [back, setBack] = useState(Boolean(props.defaultFlipped));
  return (
    <div className="flex flex-col items-center gap-3">
      <TurnCard {...props} label="林知夏的入场证" front={<Front />} back={<Back />} onFlipChange={setBack} />
      <p className="font-mono text-[12px] text-muted-foreground">onFlipChange: {back ? "背面" : "正面"}</p>
    </div>
  );
}

export const TURN_CARD: PageSpec = {
  id: "turn-card",
  kind: "control",
  importName: "TurnCard",
  source: "src/controls/compose/overlay/TurnCard.tsx",
  raw: turnRaw,
  deps: [],
  controls: CONTROLS,
  height: 400,
  render: (props) => <TurnDemo {...props} />,
  usage: (values: Values) =>
    controlUsage("TurnCard", { ...values, front: "{<Front />}", back: "{<Back />}" }, { ...BASE, width: 300, height: 400, front: "", back: "" }).replace(/"\{(<\w+ \/>)\}"/g, "{$1}"),
  propDesc: {
    front: "正面内容.",
    back: "背面内容.",
    flipped: "受控翻面.",
    onFlipChange: "翻面时调用, 参数是否背面.",
    flipOnClick: "点击翻面; 关掉时只能拖动或按键.",
    draggable: "拖动翻面.",
    dragDistance: "拖满多少 px 转半圈; 0 取卡片在该轴上的尺寸.",
    color: "卡面文字颜色.",
    label: "读屏名称.",
    className: "根元素类名.",
  },
  propsNote: "根元素是 role=\"button\" (tabIndex 0), aria-pressed 表示背面朝外; 朝里的一面 aria-hidden. 翻转与倾斜都是保留速度的弹簧, 半路反拖不跳变.",
  examples: [
    {
      id: "x",
      title: "上下翻的小卡",
      desc: "axis=\"x\" 上下翻; 关掉微倾与高光, 只保留翻面.",
      code: `<TurnCard axis="x" width={200} height={120} tilt={false} glare={false} front={<p>本周目标</p>} back={<p>上线 17 页 controls 文档</p>} />`,
      render: () => (
        <TurnCard
          axis="x"
          width={200}
          height={120}
          tilt={false}
          glare={false}
          label="本周目标"
          front={<p className="grid size-full place-items-center text-[14px]">本周目标</p>}
          back={<p className="grid size-full place-items-center px-4 text-[13px]">上线 17 页 controls 文档</p>}
        />
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦卡片." },
    { keys: ["Enter"], action: "翻面; Space 同." },
  ],
  reduced: {
    desc: "减少动效下点击, 拖动与按键都照常翻面, 只是直接切到另一面, 没有翻转与悬停微倾.",
    notes: ["翻面直接切换, 不转.", "悬停不倾斜, 不抬起, 不出高光.", "拖动松手后直接落到最近一面."],
    height: 420,
  },
};
