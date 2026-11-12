import { useState } from "react";
import { PlushSwitch } from "../../../../../../src/controls";
import plushRaw from "../../../../../../src/controls/choice/toggle/PlushSwitch.tsx?raw";
import { color, initialValues, range, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { CHOICE_ACCENTS } from "./tones";

/**
 * controls 批 2: 软胶开关. 演示是通知设置里的 "夜间免打扰": 拇指跟位置弹簧走, 移动越快拉得越长, 按下鼓起,
 * 可拖动也可轻点; 中途反向时位置和速度都保留, 不从端点重播.
 */

const CONTROLS: readonly ControlDef[] = [
  text("label", "文字", "夜间免打扰", "开关右边的文字, 也作读屏名称."),
  toggle("defaultChecked", "初始打开", false, "非受控的初始状态."),
  range("width", "宽度", [48, 120, 2], 76, "轨道宽 px."),
  range("height", "高度", [24, 56, 2], 38, "轨道高 px."),
  range("radius", "圆角", [0, 28, 1], 19, "轨道圆角 px."),
  color("trackOnTone", "打开轨道色", CHOICE_ACCENTS, "primary", "ChoiceTone", "打开时的轨道色; 演示里拇指色跟着换配套前景色."),
  range("speed", "速度", [0, 100, 5], 50, "0 到 100, 越大位置弹簧越硬."),
  range("stretch", "拉长", [0, 80, 2], 36, "满速时拇指拉长的百分比."),
  range("hoverScale", "悬停鼓起", [1, 1.15, 0.005], 1.035, "悬停时拇指的缩放."),
  range("colorDuration", "换色时长", [0, 1000, 20], 320, "轨道与拇指换色的 ms."),
  toggle("disabled", "禁用", false, "变淡, 不响应."),
];
const BASE = initialValues(CONTROLS);
const THUMB_ON: Readonly<Record<string, string>> = {
  primary: "primary-foreground",
  foreground: "background",
  success: "background",
  warning: "background",
  destructive: "destructive-foreground",
};
const toProps = (values: Values): Record<string, unknown> => ({ ...values, thumbOnTone: THUMB_ON[String(values.trackOnTone)] });

function PlushDemo(props: Record<string, unknown>) {
  const [on, setOn] = useState(Boolean(props.defaultChecked));
  return (
    <div className="flex w-[min(22rem,calc(100vw-6rem))] flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left">
      <p className="text-[13px] font-medium text-foreground">通知设置</p>
      <PlushSwitch {...props} onChange={setOn} />
      <p className="text-[12.5px] text-muted-foreground">{on ? "23:00 到次日 07:00 之间不响铃, 只留角标" : "全天按正常方式提醒"}</p>
    </div>
  );
}

export const PLUSH_SWITCH: PageSpec = {
  id: "plush-switch",
  kind: "control",
  importName: "PlushSwitch",
  source: "src/controls/choice/toggle/PlushSwitch.tsx",
  raw: plushRaw,
  deps: [],
  controls: CONTROLS,
  toProps,
  height: 280,
  render: (props) => <PlushDemo {...props} />,
  usage: (values: Values) => controlUsage("PlushSwitch", toProps(values) as Values, { ...toProps(BASE), label: "" } as Values),
  propDesc: {
    checked: "受控状态.",
    onChange: "切换时调用.",
    trackTone: "关闭时的轨道色.",
    thumbTone: "关闭时的拇指色.",
    thumbOnTone: "打开时的拇指色.",
    ariaLabel: "读屏名称; 给了 label 时用 label.",
    id: "按钮 id, 便于外部 <label htmlFor>.",
    className: "根元素类名.",
  },
  propsNote: "开关本体是 role=\"switch\" 的按钮, aria-checked 同步; 给 label 时用 aria-labelledby 指向它. 拇指 aria-hidden.",
  examples: [
    {
      id: "small",
      title: "紧凑尺寸, 绿色",
      desc: "表格行里用 48x26 的小号; 拉长调到 60, 拖快时更软.",
      code: `<PlushSwitch defaultChecked width={48} height={26} radius={13} stretch={60} trackOnTone="success" thumbOnTone="background" label="自动续费" />`,
      render: () => <PlushSwitch defaultChecked width={48} height={26} radius={13} stretch={60} trackOnTone="success" thumbOnTone="background" label="自动续费" />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦开关." },
    { keys: ["Space"], action: "切换; Enter 同." },
  ],
  reduced: {
    desc: "减少动效下切换照常, 拇指直接到另一端, 不拉长不鼓起, 换色也直接完成.",
    notes: ["拇指直接跳到另一端, 没有弹簧与拉长.", "悬停与按下不鼓起.", "轨道与拇指换色直接完成 (1ms), 不随 colorDuration."],
  },
};
