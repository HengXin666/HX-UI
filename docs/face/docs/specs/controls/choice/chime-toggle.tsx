import { useState } from "react";
import { ChimeToggle, type ChoiceTone } from "../../../../../../src/controls";
import chimeRaw from "../../../../../../src/controls/choice/toggle/ChimeToggle.tsx?raw";
import { color, initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { CHOICE_ACCENTS } from "./tones";

/**
 * controls 批 2: 订阅铃. 演示是发布说明的 "有新版本时通知我": 打开时铃铛按衰减摆动并放出声波, 文字交叉淡入,
 * 胶囊宽度跟弹簧展开; 关掉时轻晃一下. 角标数字是未读的版本数, 下面一行写出 onPressedChange.
 */

const CONTROLS: readonly ControlDef[] = [
  text("offLabel", "关闭文字", "有新版本时通知我", "关闭时的文字."),
  text("onLabel", "打开文字", "已订阅 v0.18 发布", "打开后的文字, 交叉淡入, 胶囊宽度跟着弹."),
  toggle("defaultPressed", "初始打开", false, "非受控时一开始就是打开态."),
  select("size", "尺寸", ["sm", "md", "lg"], "lg", '"sm" | "md" | "lg"', "高度, 字号与图标三档."),
  range("radius", "圆角", [0, 26, 1], 22, "胶囊圆角 px."),
  color("onBackgroundTone", "打开底色", CHOICE_ACCENTS, "foreground", "ChoiceTone", "打开态的底色; 演示里字色跟着取对应的前景色."),
  range("count", "角标数", [0, 12, 1], 3, "铃铛右上角的数字, 0 不显示."),
  toggle("badge", "角标", true, "count 大于 0 时是否显示角标."),
  range("ringAmplitude", "摆幅", [4, 40, 1], 17, "打开时铃铛第一摆的角度 (度)."),
  range("ringPasses", "摆动次数", [1, 10, 1], 5, "摆动来回次数."),
  range("ringDecay", "衰减", [0, 3, 0.1], 1, "每摆的衰减系数, 越大停得越快."),
  range("ringDuration", "摆动时长", [200, 2000, 20], 820, "整段摆动的 ms."),
  range("ringPivot", "支点", [0, 60, 1], 16, "摆动支点离图标顶部的百分比."),
  toggle("waves", "声波", true, "摆动时左右放出声波."),
  toggle("clapper", "铃舌", false, "画铃舌, 比铃身晚一拍摆动."),
  range("crossfadeMs", "换色时长", [0, 800, 20], 200, "底色与字色交叉渐变的 ms."),
  range("revealBounce", "展开回弹", [0, 0.6, 0.05], 0, "胶囊宽度弹簧的 bounce, 0 不过冲."),
  toggle("disabled", "禁用", false, "变淡, 不响应."),
];
const BASE = initialValues(CONTROLS);
const DEFAULTS: Values = { ...BASE, size: "md", offLabel: "Notify me", onLabel: "You'll be notified", count: 0 };
const ON_TEXT: Readonly<Record<string, ChoiceTone>> = {
  primary: "primary-foreground",
  foreground: "background",
  success: "background",
  warning: "background",
  destructive: "destructive-foreground",
};

function ChimeDemo(props: Record<string, unknown>) {
  const [on, setOn] = useState(Boolean(props.defaultPressed));
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-[min(22rem,calc(100vw-6rem))] flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left">
        <p className="text-[13px] font-medium text-foreground">HX UI 发布说明</p>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">v0.17.2 修了 DriftSelect 关闭途中再打开时的跳帧; 下一版 v0.18 预计 11 月 20 日发布.</p>
        <div className="mt-2">
          <ChimeToggle {...props} onTone={ON_TEXT[String(props.onBackgroundTone)]} onPressedChange={setOn} />
        </div>
      </div>
      <p className="font-mono text-[12px] text-muted-foreground">onPressedChange: {String(on)}</p>
    </div>
  );
}

export const CHIME_TOGGLE: PageSpec = {
  id: "chime-toggle",
  kind: "control",
  importName: "ChimeToggle",
  source: "src/controls/choice/toggle/ChimeToggle.tsx",
  raw: chimeRaw,
  deps: [],
  controls: CONTROLS,
  height: 260,
  render: (props) => <ChimeDemo {...props} />,
  usage: (values: Values) => controlUsage("ChimeToggle", { ...values, onTone: ON_TEXT[String(values.onBackgroundTone)] }, { ...DEFAULTS, onTone: "background" }),
  propDesc: {
    icon: "换掉铃铛; 给了就不画铃舌, 也不摆动.",
    label: "读屏名称; 不给时读当前文字.",
    tone: "关闭态字色与图标色.",
    backgroundTone: "关闭态底色.",
    onTone: "打开态字色.",
    badgeTone: "角标底色.",
    badgeTextTone: "角标数字色.",
    pressed: "受控的开关状态.",
    onPressedChange: "开关时调用.",
    className: "按钮类名.",
  },
  propsNote: "根元素是 <button aria-pressed>, data-state 为 on / off; 两段文字叠放, 不在场的一段 aria-hidden.",
  examples: [
    {
      id: "small",
      title: "小号, 带铃舌",
      desc: "size=\"sm\" 配 clapper, 摆得更狠一点 (ringAmplitude 28), 适合卡片角落的关注键.",
      code: `<ChimeToggle size="sm" clapper ringAmplitude={28} offLabel="关注" onLabel="已关注" />`,
      render: () => <ChimeToggle size="sm" clapper ringAmplitude={28} offLabel="关注" onLabel="已关注" />,
    },
    {
      id: "on",
      title: "已打开, 主色",
      desc: "defaultPressed 一开始就是打开态; 打开态换成 primary 底与 primary-foreground 字.",
      code: `<ChimeToggle defaultPressed onBackgroundTone="primary" onTone="primary-foreground" offLabel="提醒我" onLabel="开播时提醒" count={12} />`,
      render: () => <ChimeToggle defaultPressed onBackgroundTone="primary" onTone="primary-foreground" offLabel="提醒我" onLabel="开播时提醒" count={12} />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦按钮." },
    { keys: ["Enter"], action: "切换开关, 打开时铃铛摆动; Space 同." },
  ],
  reduced: {
    desc: "减少动效下开关, 文字与角标照常, 铃铛不摆, 不放声波, 胶囊宽度直接到位.",
    notes: ["打开与关闭时铃铛都不摆动, 也不放声波.", "胶囊宽度直接跳到新文字的宽度, 文字不上下错位.", "按下不缩放; 底色与字色仍按换色时长渐变."],
  },
};
