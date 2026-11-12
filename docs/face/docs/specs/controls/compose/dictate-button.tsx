import { useState } from "react";
import { DictateButton } from "../../../../../../src/controls";
import dictateRaw from "../../../../../../src/controls/compose/input/DictateButton.tsx?raw";
import { color, initialValues, range, select, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { COMPOSE_ACCENTS, COMPOSE_SURFACES } from "./tones";

/**
 * controls 批 2: 听写键. 演示是会议记录旁的听写键: 轻点开始收音, 胶囊向右展开出波形与计时, 再点停止;
 * 按住超过 holdAfter 松手即停, 按住时左滑取消. 没接麦克风时用内置的模拟语音电平 (reactive="simulated").
 */

const CONTROLS: readonly ControlDef[] = [
  select("mode", "模式", ["auto", "toggle", "hold"], "auto", '"auto" | "toggle" | "hold"', "auto: 轻点切换, 按住超过 holdAfter 松手即停; toggle: 只切换; hold: 按住说话, 松手即停."),
  range("holdAfter", "长按门槛", [100, 1500, 50], 300, "auto 模式下按住多久算 \"按住说话\" ms."),
  range("size", "尺寸", [24, 48, 2], 32, "收起时的边长 px, 也是胶囊高."),
  select("shape", "形状", ["pill", "circle"], "pill", '"pill" | "circle"', "pill 全圆角; circle 收起是圆, 展开是圆角矩形."),
  color("accent", "收音色", COMPOSE_ACCENTS, "foreground", "HxColor", "收音中图标, 波形与计时的颜色."),
  color("background", "底色", COMPOSE_SURFACES, "secondary", "HxColor", "胶囊底色; 演示取 secondary, 与台面拉开一档好看清形状."),
  toggle("waveform", "波形", true, "展开区画 24 根电平条."),
  toggle("showTime", "计时", true, "展开区右边显示 m:ss."),
  range("reach", "两侧留白", [0, 24, 1], 8, "展开区两侧的 px."),
  range("sensitivity", "灵敏度", [0.2, 3, 0.1], 1, "电平条高度的增益."),
  range("floor", "底噪高度", [0, 0.6, 0.02], 0.1, "静音时电平条的最低高度 (0 到 1)."),
  range("release", "回落时长", [40, 1200, 20], 240, "电平包络回落的 ms; 越长波形越平滑."),
  range("openDuration", "展开时长", [0, 800, 20], 200, "胶囊展开的 ms."),
  toggle("disabled", "禁用", false, "变淡, 不响应."),
];
const BASE = initialValues(CONTROLS);
const DEFAULTS: Values = { ...BASE, size: 28, background: "muted" };

function seconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

function DictateDemo(props: Record<string, unknown>) {
  const [log, setLog] = useState("轻点开始听写, 再点停止; 按住时左滑取消");
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-left">
        <span className="text-[13px] text-muted-foreground">周三评审会 · 记录</span>
        <DictateButton
          {...props}
          ariaLabel="听写会议记录"
          onStart={() => setLog("onStart: 收音中")}
          onStop={({ durationMs, cancelled }) => setLog(cancelled ? `onStop: 已取消 (${seconds(durationMs)} 秒)` : `onStop: 录下 ${seconds(durationMs)} 秒`)}
        />
      </div>
      <p className="font-mono text-[12px] text-muted-foreground">{log}</p>
    </div>
  );
}

export const DICTATE_BUTTON: PageSpec = {
  id: "dictate-button",
  kind: "control",
  importName: "DictateButton",
  source: "src/controls/compose/input/DictateButton.tsx",
  raw: dictateRaw,
  deps: [],
  controls: CONTROLS,
  height: 260,
  render: (props) => <DictateDemo {...props} />,
  usage: (values: Values) => controlUsage("DictateButton", { ...values, ariaLabel: "听写会议记录" }, { ...DEFAULTS, ariaLabel: "" }),
  propDesc: {
    iconColor: "收起时麦克风图标的颜色.",
    slideToCancel: "按住时左滑取消.",
    cancelDistance: "左滑多少 px 算取消.",
    attack: "电平包络上升的 ms.",
    pressScale: "按下时的缩放.",
    reactive: "电平来源: simulated 用内置模拟语音, mic 请求麦克风并读低频段.",
    ariaLabel: "读屏名称, 默认 Dictate.",
    onStart: "开始收音时调用.",
    onStop: "停止时调用, 参数 { durationMs, cancelled }.",
    className: "按钮类名.",
  },
  propsNote: "根元素是 <button>, aria-pressed 表示收音中, data-listening 同步; 波形与计时 aria-hidden. 窗口失焦或页面隐藏时自动停止.",
  examples: [
    {
      id: "circle",
      title: "圆形按住说话",
      desc: "mode=\"hold\" 配 circle: 按住期间收音, 松手即停, 适合对讲式的输入.",
      code: `<DictateButton mode="hold" shape="circle" size={40} accent="danger" showTime={false} />`,
      render: () => <DictateButton mode="hold" shape="circle" size={40} accent="danger" showTime={false} ariaLabel="按住说话" />,
    },
    {
      id: "timer",
      title: "只要计时",
      desc: "waveform={false} 时展开区只剩计时, 胶囊也更短.",
      code: `<DictateButton waveform={false} accent="primary" background="accent" />`,
      render: () => <DictateButton waveform={false} accent="primary" background="accent" ariaLabel="开始录音" />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦按钮." },
    { keys: ["Enter"], action: "开始或停止收音 (任何模式都是切换); Space 同." },
    { keys: ["Esc"], action: "收音中取消 (onStop 的 cancelled 为 true)." },
  ],
  reduced: {
    desc: "减少动效下收音, 波形与计时照常 (它们是信息), 只是胶囊直接展开, 按下不缩放.",
    notes: ["胶囊宽度直接到位, 展开区不模糊淡入.", "按下时不缩放.", "波形仍按电平逐帧画, 计时照常走."],
  },
};
