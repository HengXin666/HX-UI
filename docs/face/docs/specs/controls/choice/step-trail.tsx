import { useState } from "react";
import { StepTrail, type ChoiceTone } from "../../../../../../src/controls";
import trailRaw from "../../../../../../src/controls/choice/steps/StepTrail.tsx?raw";
import { color, initialValues, range, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { CHOICE_ACCENTS, CHOICE_SURFACES } from "./tones";

/**
 * controls 批 2: 分步流程. 演示是文档站的发布向导 (选分支, 写说明, 核对, 发布): 连线填充, 内容高度与换步滑入都由弹簧驱动,
 * 中途连点从当前位置与速度接着走. 点指示点可直接跳步, 最后一步的完成键调用 onComplete.
 */

const CONTROLS: readonly ControlDef[] = [
  range("initialStep", "初始步", [1, 4, 1], 1, "非受控的初始步 (从 1 数)."),
  text("nextLabel", "下一步文字", "下一步", "前进键的文字."),
  text("backLabel", "上一步文字", "上一步", "后退键的文字; 第 1 步不显示."),
  text("completeLabel", "完成文字", "发布到 Pages", "最后一步的前进键文字."),
  toggle("nextDisabled", "禁止前进", false, "当前步还不能前进时置灰前进键."),
  toggle("clickableDots", "点击跳步", true, "点指示点直接跳到那一步."),
  color("activeTone", "当前色", CHOICE_ACCENTS, "primary", "ChoiceTone", "当前步与已完成步的点, 连线填充与前进键底色; 演示里字色跟着换配套前景色."),
  color("idleTone", "未到底色", CHOICE_SURFACES, "muted", "ChoiceTone", "还没走到的点的底色."),
  color("lineTone", "连线色", ["border", "muted-foreground", "secondary"], "border", "ChoiceTone", "连线未填充部分的颜色."),
];
const BASE = initialValues(CONTROLS);
const ON_TEXT: Readonly<Record<string, ChoiceTone>> = {
  primary: "primary-foreground",
  foreground: "background",
  success: "background",
  warning: "background",
  destructive: "destructive-foreground",
};
const toProps = (values: Values): Record<string, unknown> => ({ ...values, activeTextTone: ON_TEXT[String(values.activeTone)] });

const STEPS = [
  { title: "选分支", body: "docs/controls-c2 · 领先 main 4 个提交, 最近一次 e2cad4b." },
  { title: "写说明", body: "controls 第 2 批: 输入 8 件与选择 9 件的组件页, 预览台随内容收缩." },
  { title: "核对", body: "门禁 14 条 ALL PASS, docs tsc 通过, 17 页逐个调参扫描." },
  { title: "发布", body: "推到 gh-pages 后约 2 分钟生效, 旧版本留在 /v0.17/ 下." },
] as const;

function TrailDemo(props: Record<string, unknown>) {
  const [log, setLog] = useState("onStepChange: -");
  return (
    <div className="flex w-[min(24rem,calc(100vw-6rem))] flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left">
      <StepTrail {...props} ariaLabel="发布向导" onStepChange={(step) => setLog(`onStepChange: ${step}`)} onComplete={() => setLog("onComplete: 已发布")}>
        {STEPS.map((step) => (
          <div key={step.title} className="py-3">
            <p className="text-[14px] font-medium text-foreground">{step.title}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </StepTrail>
      <p className="font-mono text-[12px] text-muted-foreground">{log}</p>
    </div>
  );
}

export const STEP_TRAIL: PageSpec = {
  id: "step-trail",
  kind: "control",
  importName: "StepTrail",
  source: "src/controls/choice/steps/StepTrail.tsx",
  raw: trailRaw,
  deps: [],
  controls: CONTROLS,
  toProps,
  height: 300,
  render: (props) => <TrailDemo {...props} />,
  usage: (values: Values) =>
    controlUsage("StepTrail", toProps(values) as Values, { ...toProps(BASE), nextLabel: "Continue", backLabel: "Back", completeLabel: "Complete" } as Values).replace(
      " />",
      ">\n  <p>选分支</p>\n  <p>写说明</p>\n  <p>核对</p>\n  <p>发布</p>\n</StepTrail>",
    ),
  propDesc: {
    children: "每个子节点是一步的内容.",
    step: "受控的当前步 (从 1 数); 总步数 + 1 表示已完成.",
    onStepChange: "换步时调用, 参数是新的步数.",
    onComplete: "最后一步按下完成键时调用.",
    activeTextTone: "前进键与当前点的字色.",
    idleTextTone: "未到点的数字色.",
    ariaLabel: "指示点列表 (ol) 的读屏名称.",
    className: "根元素类名.",
  },
  propsNote: "指示点是 ol 列表, 内容区是带 \"当前 / 总数\" aria-label 的 role=\"group\"; 完成后内容区收起并 aria-hidden, 前后键不再显示.",
  examples: [
    {
      id: "gated",
      title: "表单没填完不能前进",
      desc: "nextDisabled 由外部表单状态给, 指示点也关掉点击, 只能按顺序走.",
      code: `<StepTrail nextDisabled clickableDots={false} activeTone="success" activeTextTone="background">\n  <p>填写账号</p>\n  <p>验证邮箱</p>\n</StepTrail>`,
      render: () => (
        <StepTrail nextDisabled clickableDots={false} activeTone="success" activeTextTone="background" ariaLabel="注册">
          <p className="py-2 text-[13px] text-foreground">填写账号</p>
          <p className="py-2 text-[13px] text-foreground">验证邮箱</p>
        </StepTrail>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "依次聚焦可点的指示点, 上一步与下一步键." },
    { keys: ["Enter"], action: "按下聚焦的指示点或前后键; Space 同." },
  ],
  reduced: {
    desc: "减少动效下换步照常, 连线直接填到位, 内容不滑入, 高度直接落定.",
    notes: ["连线填充与内容高度直接跳到目标, 没有弹簧.", "换步时内容不左右滑入淡入.", "当前点直接是放大后的大小, 不走缩放过渡; 颜色过渡为 0."],
  },
};
