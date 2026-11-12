import { useState } from "react";
import { NudgeField } from "../../../../../../src/controls";
import nudgeRaw from "../../../../../../src/controls/range/input/NudgeField.tsx?raw";
import { color, initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { RANGE_TONES } from "./tones";

/**
 * controls 批 1: 拨动数值框. 演示是设计工具的属性面板: 拖标签改 "圆角", 旁边那张卡的圆角跟着 onChange 走.
 * 拖动手感 (sensitivity, rubberReach, returnDuration) 在 Props 表; 调参只开静态可见的.
 */

const CONTROLS: readonly ControlDef[] = [
  text("label", "标签", "圆角", "左侧可拖的标签, 也是读屏名称."),
  text("suffix", "单位", "px", "数值后缀."),
  range("defaultValue", "初始值", [0, 48, 1], 16, "非受控的初始值."),
  range("max", "最大值", [24, 96, 4], 48, "上限; 越界拖动时橡皮筋, 松手弹回."),
  range("step", "步长", [1, 8, 1], 1, "拖动与方向键一步; Shift 乘 coarseMultiplier, Alt 乘 fineMultiplier."),
  select("size", "尺寸", ["sm", "md", "lg"], "lg", '"sm" | "md" | "lg"', "高度与字号三档."),
  toggle("showFill", "底部填充", true, "按当前值在框底画一条比例填充."),
  toggle("showDelta", "显示增量", true, "拖动时旁边浮出 +3 / -2 这样的增量."),
  toggle("showDirty", "标记已改", true, "值不等于 defaultValue 时在标签旁亮一个点."),
  color("accentTone", "强调色", RANGE_TONES, "foreground", "RangeTone", "填充条与已改标记的颜色."),
  toggle("disabled", "禁用", false, "半透明, 不响应拖动与输入."),
];
const BASE = initialValues(CONTROLS);

function NudgeDemo(props: Record<string, unknown>) {
  const [radius, setRadius] = useState(Number(props.defaultValue));
  return (
    <div className="flex w-[min(26rem,calc(100vw-6rem))] flex-col gap-4 rounded-2xl border border-border bg-card p-4 text-left">
      <p className="text-[13px] font-medium text-foreground">卡片样式 · 检查器</p>
      <div className="flex flex-wrap items-center justify-center gap-6">
        <NudgeField {...props} onChange={setRadius} />
        <div aria-hidden className="grid size-28 place-items-center border border-border bg-background text-[12px] text-muted-foreground" style={{ borderRadius: radius }}>
          {radius}
          {String(props.suffix ?? "")}
        </div>
      </div>
    </div>
  );
}

export const NUDGE_FIELD: PageSpec = {
  id: "nudge-field",
  kind: "control",
  importName: "NudgeField",
  source: "src/controls/range/input/NudgeField.tsx",
  raw: nudgeRaw,
  deps: [],
  controls: CONTROLS,
  height: 360,
  render: (props) => <NudgeDemo {...props} />,
  usage: (values: Values) => controlUsage("NudgeField", values, { ...BASE, size: "md", label: "", suffix: "", defaultValue: -1, max: 100, showDirty: false }),
  propDesc: {
    value: "受控值.",
    min: "下限.",
    rubberReach: "越界时橡皮筋最多拉出的 px.",
    coarseMultiplier: "按住 Shift 时一步的倍数.",
    fineMultiplier: "按住 Alt 时一步的倍数.",
    chipTone: "框底色.",
    onChange: "值每变一次调用 (拖动中连续).",
    onCommit: "松手, 回车或按键之后报一次最终值.",
  },
  propsNote: "外层是 <div data-slot=\"nudge-field\">, className 落在它上面; 里面的文本框是 <input role=\"spinbutton\">, 可以直接输入数字.",
  examples: [
    {
      id: "panel",
      title: "一列属性",
      desc: "属性面板里常见的三项: 不同单位, 不同范围与步长.",
      code: `<NudgeField label="宽" suffix="px" defaultValue={320} max={1440} step={8} />\n<NudgeField label="不透明" suffix="%" defaultValue={80} />\n<NudgeField label="字距" suffix="em" defaultValue={0} min={-0.1} max={0.3} step={0.01} />`,
      align: "stretch",
      render: () => (
        <div className="flex flex-col items-start gap-2 p-6">
          <NudgeField label="宽" suffix="px" defaultValue={320} max={1440} step={8} />
          <NudgeField label="不透明" suffix="%" defaultValue={80} />
          <NudgeField label="字距" suffix="em" defaultValue={0} min={-0.1} max={0.3} step={0.01} />
        </div>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦文本框, 可直接输入数字; Enter 提交并失焦, Esc 放弃输入." },
    { keys: ["↑"], action: "加一步; ↓ 减一步. ← / → / Home / End 留给光标移动." },
    { keys: ["Shift", "↑"], action: "一步乘 coarseMultiplier (默认 10); Alt 乘 fineMultiplier (默认 0.1)." },
    { keys: ["PageUp"], action: "加十步; PageDown 减十步." },
  ],
  reduced: {
    desc: "减少动效下拖动照常改值, 但越界不拉橡皮筋, 松手不回弹, 增量提示直接出现与消失.",
    notes: ["拖过上下限时框不跟着拉出, 停在原位.", "松手直接归位, 没有弹簧.", "增量提示 (+3 / -2) 出现与消失没有淡变."],
  },
};
