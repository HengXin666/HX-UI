import { useEffect, useState } from "react";
import { ReasoningTrace, type TraceStep } from "../../../../../../src/controls";
import traceRaw from "../../../../../../src/controls/compose/status/ReasoningTrace.tsx?raw";
import { color, initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage, omit } from "../shared";
import { COMPOSE_ACCENTS } from "./tones";

/**
 * controls 批 2: 推理过程的一行. 演示按脚本跑一次排查: 每 0.7 秒多一步, 到 "收尾时刻" 把 working 置 false;
 * 进行中图形呼吸, 文字扫光, 秒数走表; 结束时文字从模糊里落定, 图形在 55% 处换成勾, 步骤列表收起 (点标题可再展开).
 */

const SCRIPT: readonly TraceStep[] = [
  { id: "read", label: "读 DriftSelect.tsx 与 use-drift-pop.ts", done: true },
  { id: "find", label: "定位: 菜单收起时没有取消上一段弹出动画", done: true },
  { id: "plan", label: "改法: 在 close 里先 cancel 再收起, 补一条单测" },
];

const CONTROLS: readonly ControlDef[] = [
  text("label", "进行中文字", "正在排查菜单闪烁…", "进行中显示的文字, 带扫光."),
  text("doneLabel", "落定文字", "排查了 3 步", "落定后的文字; 空串沿用进行中文字."),
  range("finishAt", "收尾时刻", [600, 6000, 100], 2600, "不是属性: 演示在这一刻把 working 置为 false, 之后开始落定."),
  select("glyph", "图形", ["sparkle", "dot", "none"], "sparkle", '"sparkle" | "dot" | "none" | ReactNode', "行首图形, 进行中呼吸, 落定换成勾."),
  color("glyphColor", "图形色", COMPOSE_ACCENTS, "primary", "HxColor", "图形颜色; 不给时跟随文字色."),
  range("fontSize", "字号", [12, 20, 1], 15, "整行字号 px; 步骤列表按 0.875 倍."),
  range("breathPeriod", "呼吸周期", [0.6, 4, 0.1], 1.6, "图形呼吸一个来回的秒数."),
  range("breathDepth", "呼吸深度", [0, 0.9, 0.05], 0.45, "谷底透明度 = 1 - depth."),
  toggle("shimmer", "文字扫光", true, "进行中文字上走一道亮带."),
  range("shimmerDuration", "扫光周期", [0.6, 5, 0.1], 1.8, "扫光走一遍的秒数."),
  range("settleDuration", "落定时长", [0, 1500, 50], 350, "文字去模糊与图形换勾的总 ms."),
  range("settleBlur", "落定模糊", [0, 10, 1], 2, "落定开始时文字的模糊 px."),
  range("settleAfter", "落定延迟", [0, 2000, 100], 0, "working 变 false 后再等多少 ms 才落定."),
  toggle("showTimer", "秒表", true, "文字右边的秒数."),
  toggle("collapseOnSettle", "落定后收起", true, "落定时把步骤列表收起."),
  toggle("collapsible", "可折叠", true, "标题是按钮, 点它展开 / 收起步骤; 关掉时步骤一直显示."),
];
const BASE = initialValues(CONTROLS);

function TraceDemo({ finishAt, ...props }: Record<string, unknown>) {
  const [count, setCount] = useState(1);
  const [working, setWorking] = useState(true);
  useEffect(() => {
    const step = window.setInterval(() => setCount((n) => Math.min(SCRIPT.length, n + 1)), 700);
    const done = window.setTimeout(() => setWorking(false), Number(finishAt));
    return () => {
      window.clearInterval(step);
      window.clearTimeout(done);
    };
  }, [finishAt]);
  const steps = SCRIPT.slice(0, count).map((step, i) => ({ ...step, done: !working || i < count - 1 }));
  return (
    <div className="flex w-[min(26rem,calc(100vw-6rem))] flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left">
      <p className="self-end rounded-xl bg-muted px-3 py-2 text-[13px] text-foreground">下拉菜单收起的瞬间会闪一下, 帮我查查</p>
      <ReasoningTrace {...props} steps={steps} working={working} />
      <p className="text-[13px] leading-relaxed text-muted-foreground">{working ? "…" : "找到了: DriftSelect 收起时没有取消上一段弹出动画, 改成先 cancel 再收起, 已补单测."}</p>
    </div>
  );
}

export const REASONING_TRACE: PageSpec = {
  id: "reasoning-trace",
  kind: "control",
  importName: "ReasoningTrace",
  source: "src/controls/compose/status/ReasoningTrace.tsx",
  raw: traceRaw,
  deps: [],
  controls: CONTROLS,
  height: 280,
  render: (props) => <TraceDemo {...props} />,
  usage: (values: Values) =>
    controlUsage("ReasoningTrace", { ...omit(values, ["finishAt"]), working: "{busy}" }, { ...omit(BASE, ["finishAt"]), label: "Thinking…", doneLabel: "", glyphColor: "", fontSize: 16, working: "" }).replace(
      'working="{busy}"',
      "working={busy} steps={steps}",
    ),
  propDesc: {
    steps: "步骤列表 ({ id, label, done? }); 新加的一步上浮淡入, done 的一步用前景色.",
    renderLabel: "自己渲染文字, 参数是当前文字与是否进行中.",
    working: "进行中; 由 true 变 false 时开始落定.",
    elapsed: "外部给的秒数; 不给时组件自己每秒加一.",
    color: "整行文字颜色, 默认 currentColor.",
    onSettle: "落定结束时调用.",
    className: "根元素类名.",
    style: "根元素内联样式.",
  },
  propsNote: "文字所在的 span 是 role=\"status\", 秒数 aria-hidden; 可折叠时标题是带 aria-expanded / aria-controls 的按钮. 根元素 data-state 为 working 或 settled.",
  examples: [
    {
      id: "plain",
      title: "已经结束的一行",
      desc: "一开始就 working={false} 时直接显示落定的样子, 不播落定, 也不显示 0s.",
      code: `<ReasoningTrace working={false} label="读了 12 个文件" glyph="dot" />`,
      render: () => <ReasoningTrace working={false} label="读了 12 个文件" glyph="dot" />,
    },
    {
      id: "timer",
      title: "外部计时",
      desc: "elapsed 由外部给 (例如服务端回报的秒数), 组件不再自己走表; shimmer 关掉只留呼吸.",
      code: `<ReasoningTrace label="正在生成迁移脚本…" elapsed={41} shimmer={false} glyphColor="warning" />`,
      render: () => <ReasoningTrace label="正在生成迁移脚本…" elapsed={41} shimmer={false} glyphColor="warning" />,
    },
  ],
  keyboard: [{ keys: ["Tab"], action: "可折叠且有步骤时聚焦标题按钮; Enter / Space 展开或收起步骤列表." }],
  reduced: {
    desc: "减少动效下状态与秒表照常; 呼吸放慢到 2.4 秒一个来回, 文字不扫光, 落定直接换字换勾.",
    notes: ["图形呼吸放慢到 2.4s, 不随 breathPeriod.", "文字不扫光; 落定时不去模糊, 图形直接换成勾.", "新步骤直接出现, 不上浮淡入."],
    height: 260,
  },
};
