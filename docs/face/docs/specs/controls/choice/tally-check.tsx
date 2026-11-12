import { useState } from "react";
import { TallyCheck, type ChoiceTone } from "../../../../../../src/controls";
import tallyRaw from "../../../../../../src/controls/choice/toggle/TallyCheck.tsx?raw";
import { color, initialValues, range, select, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { CHOICE_ACCENTS } from "./tones";

/**
 * controls 批 2: 待办勾选. 演示是 v0.18 发布前的核对清单: 方框填充从 35% 鼓满, 勾线描出, 文字变淡并从一侧划线;
 * 中途反选时每根弹簧从当前值回退. 前两项已勾, 下面一行写出已完成数.
 */

const CONTROLS: readonly ControlDef[] = [
  range("boxSize", "方框", [18, 40, 1], 26, "方框边长 px."),
  range("boxRadius", "方框圆角", [0, 20, 1], 8, "方框圆角 px."),
  range("fontSize", "字号", [13, 22, 1], 16, "文字字号 px."),
  color("fillTone", "填充色", CHOICE_ACCENTS, "primary", "ChoiceTone", "勾选后方框的填充色; 演示里勾线色跟着换配套前景色."),
  color("tone", "边框与文字色", ["foreground", "muted-foreground"], "foreground", "ChoiceTone", "未勾时的边框与文字色."),
  range("bounce", "回弹", [0, 0.6, 0.05], 0.2, "填充与勾线的回弹, 0 不过冲."),
  range("strikeLag", "划线延迟", [0, 0.6, 0.02], 0.12, "删除线比勾选晚多少秒起笔."),
  range("doneOpacity", "完成透明度", [0.2, 1, 0.02], 0.42, "勾上后文字的透明度."),
  select("strike", "划线方向", ["left", "right", "none"], "left", '"left" | "right" | "none"', "删除线从哪边画起, none 不画."),
  toggle("disabled", "禁用", false, "变淡, 不响应."),
];
const BASE = initialValues(CONTROLS);
const CHECK_ON: Readonly<Record<string, ChoiceTone>> = {
  primary: "primary-foreground",
  foreground: "background",
  success: "background",
  warning: "background",
  destructive: "destructive-foreground",
};
const toProps = (values: Values): Record<string, unknown> => ({ ...values, checkTone: CHECK_ON[String(values.fillTone)] });

const TASKS = [
  { id: "gates", label: "门禁 14 条全过", done: true },
  { id: "api", label: "api 快照已更新", done: true },
  { id: "notes", label: "写 v0.18 发布说明", done: false },
  { id: "tag", label: "打 tag 并推到 npm", done: false },
] as const;

function TallyDemo(props: Record<string, unknown>) {
  const [done, setDone] = useState<Record<string, boolean>>(() => Object.fromEntries(TASKS.map((task) => [task.id, task.done])));
  const count = Object.values(done).filter(Boolean).length;
  return (
    <div className="flex w-[min(22rem,calc(100vw-6rem))] flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left">
      <p className="text-[13px] font-medium text-foreground">发布 v0.18 前</p>
      {TASKS.map((task) => (
        <TallyCheck key={task.id} {...props} label={task.label} defaultChecked={task.done} onChange={(on) => setDone((prev) => ({ ...prev, [task.id]: on }))} />
      ))}
      <p className="font-mono text-[12px] text-muted-foreground">
        已完成 {count} / {TASKS.length}
      </p>
    </div>
  );
}

export const TALLY_CHECK: PageSpec = {
  id: "tally-check",
  kind: "control",
  importName: "TallyCheck",
  source: "src/controls/choice/toggle/TallyCheck.tsx",
  raw: tallyRaw,
  deps: [],
  controls: CONTROLS,
  toProps,
  height: 300,
  render: (props) => <TallyDemo {...props} />,
  usage: (values: Values) => controlUsage("TallyCheck", { ...toProps(values), label: "写 v0.18 发布说明" } as Values, { ...toProps(BASE), boxSize: 28, boxRadius: 9, fontSize: 18, label: "" } as Values),
  propDesc: {
    label: "文字, 也作读屏名称.",
    checked: "受控的勾选状态.",
    defaultChecked: "非受控的初始状态.",
    onChange: "切换时调用.",
    checkTone: "勾线颜色.",
    ariaLabel: "读屏名称; 给了 label 时用 label.",
    className: "根元素类名.",
  },
  propsNote: "整行是 role=\"checkbox\" 的按钮, aria-checked 同步, 点文字也能切换; 方框与勾线 aria-hidden.",
  examples: [
    {
      id: "plain",
      title: "不划线, 不回弹",
      desc: "设置页里当普通复选用: strike=\"none\", bounce 为 0, 完成态文字不变淡.",
      code: `<TallyCheck label="接收周报邮件" strike="none" bounce={0} doneOpacity={1} fillTone="success" checkTone="background" />`,
      render: () => <TallyCheck label="接收周报邮件" strike="none" bounce={0} doneOpacity={1} fillTone="success" checkTone="background" />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦这一项." },
    { keys: ["Space"], action: "切换勾选; Enter 同." },
  ],
  reduced: {
    desc: "减少动效下勾选照常, 填充, 勾线与删除线直接到位, 按下不缩放, 文字变淡没有过渡.",
    notes: ["填充不从 35% 鼓起, 勾线与删除线直接画满.", "按下时方框不缩放.", "完成态文字直接变淡 (过渡 0ms)."],
  },
};
