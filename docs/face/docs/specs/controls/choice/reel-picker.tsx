import { useState } from "react";
import { ReelPicker, type ReelPickerProps } from "../../../../../../src/controls";

/** ReelItem 没从公共出口导出, 演示从属性类型里取. */
type ReelItem = Exclude<NonNullable<ReelPickerProps["items"]>[number], string>;
import reelRaw from "../../../../../../src/controls/choice/pick/ReelPicker.tsx?raw";
import { color, initialValues, range, select, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlDemo } from "../shared";
import { tag } from "../../usage-code";
import { CHOICE_ACCENTS } from "./tones";

/**
 * controls 批 2: 滚轮选项列. 演示是世界时钟的城市选择: 当前项停在中线, 上下各行沿弧线退开, 倾斜, 变淡, 变模糊;
 * 滚轮, 拖动, 点击与方向键都会换项. 选项值用拼音, 显示中文, 旁边写出该城市此刻的时间差.
 */

const ITEMS: readonly ReelItem[] = [
  { value: "beijing", label: "北京" },
  { value: "tokyo", label: "东京" },
  { value: "singapore", label: "新加坡" },
  { value: "dubai", label: "迪拜" },
  { value: "berlin", label: "柏林" },
  { value: "london", label: "伦敦" },
  { value: "newyork", label: "纽约" },
];
const OFFSET: Readonly<Record<string, string>> = {
  beijing: "与本地相同",
  tokyo: "快 1 小时",
  singapore: "相同",
  dubai: "慢 4 小时",
  berlin: "慢 7 小时",
  london: "慢 8 小时",
  newyork: "慢 13 小时",
};

const CONTROLS: readonly ControlDef[] = [
  select("defaultValue", "初始值", ITEMS.map((item) => item.value), "tokyo", "string", "非受控的初始项 (value)."),
  select("side", "锚定侧", ["left", "right"], "left", '"left" | "right"', "文字贴这一侧排, 远行朝这一侧退开."),
  range("fontSize", "字号", [1, 3, 0.1], 1.6, "字号 rem."),
  range("rows", "可见行数", [3, 9, 2], 5, "可见行数, 决定高度."),
  range("spacing", "行距", [1, 2, 0.05], 1.4, "行距, 字号的倍数."),
  range("curve", "弧度", [0, 3, 0.1], 1, "远行横向退开的程度."),
  range("tilt", "倾斜", [0, 20, 1], 6, "每行倾斜的度数."),
  range("blur", "模糊", [0, 6, 0.5], 2, "每行模糊的 px."),
  range("fade", "变淡", [0, 0.5, 0.05], 0.25, "每行透明度递减量."),
  range("inset", "内边距", [0, 120, 4], 24, "锚定侧的内边距 px."),
  range("smoothing", "跟随时长", [40, 800, 20], 200, "位置跟随的时间常数 ms."),
  toggle("loop", "循环", false, "首尾相接; 打开后第一项上方接着最后几项."),
  color("activeTone", "当前项色", CHOICE_ACCENTS, "foreground", "ChoiceTone", "中线那一项的颜色."),
  toggle("disabled", "禁用", false, "变淡, 不响应."),
];
const BASE = initialValues(CONTROLS);

function ReelDemo(props: Record<string, unknown>) {
  const [city, setCity] = useState(String(props.defaultValue));
  return (
    <div className="flex w-[min(22rem,calc(100vw-6rem))] items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left">
      <div className="min-w-0 flex-1">
        <ReelPicker {...props} items={ITEMS} ariaLabel="世界时钟城市" onChange={(value) => setCity(value)} />
      </div>
      <div className="w-24 shrink-0">
        <p className="text-[12px] text-muted-foreground">时差</p>
        <p className="mt-1 text-[14px] font-medium text-foreground">{OFFSET[city]}</p>
      </div>
    </div>
  );
}

const usage = (values: Values): string => {
  const body = tag("ReelPicker", values, { ...BASE, defaultValue: "", fontSize: 3, rows: 7, inset: 80 }).replace("<ReelPicker", "<ReelPicker items={ITEMS}");
  return controlDemo(["ReelPicker"], body, `\n\nconst ITEMS = [\n  { value: "beijing", label: "北京" },\n  { value: "tokyo", label: "东京" },\n  { value: "singapore", label: "新加坡" },\n  { value: "dubai", label: "迪拜" },\n  { value: "berlin", label: "柏林" },\n  { value: "london", label: "伦敦" },\n  { value: "newyork", label: "纽约" },\n];`);
};

export const REEL_PICKER: PageSpec = {
  id: "reel-picker",
  kind: "control",
  importName: "ReelPicker",
  source: "src/controls/choice/pick/ReelPicker.tsx",
  raw: reelRaw,
  deps: [],
  controls: CONTROLS,
  height: 420,
  render: (props) => <ReelDemo {...props} />,
  usage,
  propDesc: {
    items: "选项, 字符串或 { value, label, disabled? }.",
    value: "受控值.",
    onChange: "换项时调用, 参数是 value 与下标.",
    textTone: "非当前项的颜色.",
    minOpacity: "最远行的最低不透明度.",
    draggable: "可拖动换项.",
    soundUrl: "换项时播放的提示音地址, 空串不播.",
    soundVolume: "提示音音量 0 到 1.",
    ariaLabel: "listbox 的读屏名称.",
    className: "根元素类名.",
  },
  propsNote: "根元素 role=\"listbox\" (aria-activedescendant 指向当前项), 每行 role=\"option\"; 位置由临界阻尼弹簧跟随, 中途换目标保留速度.",
  examples: [
    {
      id: "right",
      title: "右侧锚定, 循环",
      desc: "side=\"right\" 文字贴右排, 远行朝右退开; loop 首尾相接, 适合小时 / 分钟这类环形值.",
      code: `<ReelPicker items={["00", "15", "30", "45"]} side="right" loop rows={3} fontSize={1.4} inset={16} />`,
      render: () => (
        <div className="w-40">
          <ReelPicker items={["00", "15", "30", "45"]} side="right" loop rows={3} fontSize={1.4} inset={16} ariaLabel="分钟" />
        </div>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦列表." },
    { keys: ["↑", "↓"], action: "上一项 / 下一项 (跳过禁用项); loop 时到头接回另一端." },
    { keys: ["Home"], action: "第一项; End 最后一项." },
  ],
  reduced: {
    desc: "减少动效下换项照常, 位置直接跳到新项; 弧线, 倾斜, 变淡与模糊是排版的一部分, 照常保留.",
    notes: ["换项不滑动, 直接到位.", "各行的弧线退开, 倾斜, 透明度与模糊照常, 因为它们标出离中线多远.", "当前项换色不过渡."],
    height: 300,
  },
};
