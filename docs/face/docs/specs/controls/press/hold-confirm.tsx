import { useState } from "react";
import { HoldConfirm } from "../../../../../../src/controls";
import holdRaw from "../../../../../../src/controls/press/hold/HoldConfirm.tsx?raw";
import { initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage, omit } from "../shared";

/**
 * controls 批 1: 按住确认. 演示是删除仓库: 轻点只给提示 (onTap), 按满 holdTime 才删 (onHold), 下面一行写出回调.
 */

const CONTROLS: readonly ControlDef[] = [
  text("label", "按钮文字", "按住删除仓库", "不是属性: 演示里传给 children 的文字."),
  select("tone", "填充色调", ["danger", "primary", "success"], "danger", '"primary" | "danger" | "success"', "填充色调, 只取语义 token."),
  select("size", "尺寸", ["sm", "md", "lg"], "md", '"sm" | "md" | "lg"', "高度与字号三档."),
  range("radius", "圆角", [0, 24, 1], 14, "圆角 px."),
  select("fillDirection", "填充方向", ["right", "left", "up", "down"], "right", '"right" | "left" | "up" | "down"', "进度从哪一边推过去; 波浪边只在左右方向出现."),
  range("holdTime", "按住时长", [600, 4000, 100], 2000, "从空到满要按住多久 ms; 中途松开按已填比例回退."),
  toggle("wave", "波浪边", true, "填充前沿是一道正弦波, 相位随进度推进."),
  range("waveAmplitude", "波幅", [2, 14, 1], 6, "波浪边的振幅 px."),
  range("pressScale", "按下缩放", [0.9, 1, 0.01], 0.97, "按住期间整颗按钮的缩放."),
  toggle("glow", "完成闪光", true, "填满那一刻用填充色闪一下."),
  toggle("disabled", "禁用", false, "半透明, 不响应按压."),
];
const BASE = initialValues(CONTROLS);

function HoldDemo({ label, ...props }: Record<string, unknown>) {
  const [log, setLog] = useState("按住不放, 填满才会删除");
  return (
    <div className="flex flex-col items-center gap-4">
      <HoldConfirm {...props} doneLabel="已删除" onTap={() => setLog("onTap: 轻点不算数, 要按住")} onHold={() => setLog("onHold: hx-ui/legacy-site 已删除")}>
        {String(label)}
      </HoldConfirm>
      <p className="font-mono text-[12px] text-muted-foreground">{log}</p>
    </div>
  );
}

export const HOLD_CONFIRM: PageSpec = {
  id: "hold-confirm",
  kind: "control",
  importName: "HoldConfirm",
  source: "src/controls/press/hold/HoldConfirm.tsx",
  raw: holdRaw,
  deps: [],
  controls: CONTROLS,
  height: 300,
  render: (props) => <HoldDemo {...props} />,
  usage: (values: Values) =>
    controlUsage("HoldConfirm", { ...omit(values, ["label"]), doneLabel: "已删除" }, { ...omit(BASE, ["label"]), doneLabel: "" }, String(values.label)),
  propDesc: {
    children: "空闲态文字, 默认 Hold to delete.",
    doneLabel: "填满后的文字, 默认 Deleted.",
    icon: "文字前的图标.",
    doneIcon: "完成态的图标.",
    releaseTime: "从满格回退到空要多久 ms, 中途松开按比例缩短.",
    resetAfter: "完成后多久回到空闲 ms.",
    onHold: "按满 holdTime 时调用.",
    onTap: "按下不足 250ms 就松开时调用, 用来提示 \"要按住\".",
  },
  propsNote: "根元素是 <button type=\"button\">, 状态写在 data-state (idle / holding / done); 指针移出按钮 10px 外, 失焦或页面隐藏都算松开.",
  examples: [
    {
      id: "up",
      title: "自下而上的确认",
      desc: "fillDirection=\"up\" 配 success, 用在 \"按住提交审核\" 这类正向动作; 上下方向没有波浪边.",
      code: `<HoldConfirm tone="success" fillDirection="up" holdTime={1200} doneLabel="已提交">\n  按住提交审核\n</HoldConfirm>`,
      render: () => (
        <HoldConfirm tone="success" fillDirection="up" holdTime={1200} doneLabel="已提交">
          按住提交审核
        </HoldConfirm>
      ),
    },
    {
      id: "sizes",
      title: "三档尺寸",
      desc: "sm / md / lg 同一套填充与波浪, 只是高度与字号不同.",
      code: `<HoldConfirm size="sm" tone="primary">按住发布</HoldConfirm>\n<HoldConfirm size="md" tone="primary">按住发布</HoldConfirm>\n<HoldConfirm size="lg" tone="primary">按住发布</HoldConfirm>`,
      render: () => (
        <>
          <HoldConfirm size="sm" tone="primary">按住发布</HoldConfirm>
          <HoldConfirm size="md" tone="primary">按住发布</HoldConfirm>
          <HoldConfirm size="lg" tone="primary">按住发布</HoldConfirm>
        </>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦按钮; 失焦等于松开." },
    { keys: ["Space"], action: "按住开始填充, 松开回退; 按满触发 onHold. 自动重复的按键不重新开始." },
    { keys: ["Enter"], action: "同 Space." },
  ],
  reduced: {
    desc: "按住时长照常计时 (它就是确认本身); 去掉缩放, 波浪边与完成闪光, 松开直接清零.",
    notes: [
      "进度仍按 holdTime 线性填满, 填充色照常推进.",
      "不出波浪边, 按住时不缩放, 填满时不闪光.",
      "中途松开直接回到空, 不做回退动画.",
    ],
  },
};
