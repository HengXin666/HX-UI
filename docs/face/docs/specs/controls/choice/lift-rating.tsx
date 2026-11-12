import { useState } from "react";
import { LiftRating } from "../../../../../../src/controls";
import liftRaw from "../../../../../../src/controls/choice/rate/LiftRating.tsx?raw";
import { color, initialValues, range, select, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { CHOICE_ACCENTS } from "./tones";

/**
 * controls 批 2: 探头评分. 演示是外卖订单的评价卡: 悬停的那颗抬起放大, 上方探出提示, 左侧同时点亮作预览; 选中时弹一下.
 * 下面一行写出 onPreview 与 onChange 收到的分值.
 */

const LABELS = ["很差", "较差", "一般", "满意", "超出预期"];

const CONTROLS: readonly ControlDef[] = [
  range("defaultValue", "初始分", [0, 5, 1], 3, "非受控的初始分, 0 为未评."),
  select("shape", "形状", ["star", "heart", "circle"], "star", '"star" | "heart" | "circle"', "星, 心或圆点."),
  range("size", "尺寸", [20, 48, 2], 36, "每颗的边长 px."),
  color("activeTone", "点亮色", CHOICE_ACCENTS, "warning", "ChoiceTone", "点亮与预览的颜色."),
  range("lift", "抬起", [0, 16, 1], 6, "悬停那颗抬起的 px."),
  range("magnify", "放大", [1, 1.6, 0.05], 1.15, "悬停那颗的放大倍数."),
  range("riseDuration", "抬起时长", [80, 800, 20], 320, "抬起与放大的 ms."),
  range("popScale", "选中弹跳", [1, 2, 0.05], 1.3, "选中那一下弹到的倍数."),
  toggle("showTip", "提示", true, "悬停时上方探出提示 (labels 或数字)."),
  toggle("allowClear", "可清零", true, "再点当前分清零."),
  toggle("readOnly", "只读", false, "只显示分数, 不响应."),
  toggle("disabled", "禁用", false, "变淡, 不响应."),
];
const BASE = initialValues(CONTROLS);

function LiftDemo(props: Record<string, unknown>) {
  const [log, setLog] = useState(`当前 ${String(props.defaultValue)} 分`);
  return (
    <div className="flex w-[min(22rem,calc(100vw-6rem))] flex-col items-start gap-3 rounded-2xl border border-border bg-card px-4 pt-10 pb-4 text-left">
      <LiftRating
        {...props}
        labels={LABELS}
        ariaLabel="给这单配送打分"
        onPreview={(value) => setLog(`onPreview: ${value} 分`)}
        onChange={(value) => setLog(`onChange: ${value} 分${value ? ` · ${LABELS[value - 1]}` : " · 已清零"}`)}
      />
      <p className="text-[13px] font-medium text-foreground">这单配送怎么样?</p>
      <p className="text-[12px] text-muted-foreground">老王麻辣烫 · 骑手 陈师傅 · 准时送达</p>
      <p className="font-mono text-[12px] text-muted-foreground">{log}</p>
    </div>
  );
}

export const LIFT_RATING: PageSpec = {
  id: "lift-rating",
  kind: "control",
  importName: "LiftRating",
  source: "src/controls/choice/rate/LiftRating.tsx",
  raw: liftRaw,
  deps: [],
  controls: CONTROLS,
  height: 320,
  render: (props) => <LiftDemo {...props} />,
  usage: (values: Values) =>
    controlUsage("LiftRating", values, { ...BASE, defaultValue: 0, size: 28 }).replace("<LiftRating", '<LiftRating labels={["很差", "较差", "一般", "满意", "超出预期"]}'),
  propDesc: {
    value: "受控分值.",
    onChange: "选中时调用, 参数是新分值 (清零为 0).",
    onPreview: "悬停或聚焦预览时调用, 离开时回报当前值.",
    count: "颗数.",
    icon: "换掉内置形状.",
    labels: "每档的提示文字, 缺省显示数字.",
    idleTone: "未点亮的颜色.",
    tipTone: "提示气泡底色.",
    tipTextTone: "提示文字色.",
    ariaLabel: "radiogroup 的读屏名称, 默认 Rating.",
    className: "根元素类名.",
  },
  propsNote: "根元素 role=\"radiogroup\", 每颗 role=\"radio\" (aria-label 是该档提示), roving tabindex; 只读时 aria-readonly.",
  examples: [
    {
      id: "hearts",
      title: "十颗心, 只读",
      desc: "count={10} 配 heart, readOnly 用来展示平均分.",
      code: `<LiftRating count={10} shape="heart" defaultValue={8} size={22} activeTone="destructive" readOnly />`,
      render: () => <LiftRating count={10} shape="heart" defaultValue={8} size={22} activeTone="destructive" readOnly ariaLabel="平均 8 分" />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦当前分那一颗 (未评时第一颗)." },
    { keys: ["←", "→"], action: "减 / 加一分并选中; ↑ ↓ 同." },
    { keys: ["Home"], action: "1 分; End 满分." },
    { keys: ["Backspace"], action: "清零 (allowClear 时); Delete 同." },
  ],
  reduced: {
    desc: "减少动效下悬停预览与提示照常, 只是不抬起不放大, 选中不弹跳, 提示直接出现.",
    notes: ["悬停那颗不抬起, 不放大.", "选中时不弹跳.", "提示直接出现与消失, 不探出."],
  },
};
