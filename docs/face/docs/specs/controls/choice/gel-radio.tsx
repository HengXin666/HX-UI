import { useState } from "react";
import { GelRadio, type GelItem } from "../../../../../../src/controls";
import gelRaw from "../../../../../../src/controls/choice/pick/GelRadio.tsx?raw";
import { color, initialValues, range, select, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlDemo } from "../shared";
import { tag } from "../../usage-code";
import { CHOICE_ACCENTS } from "./tones";

/**
 * controls 批 2: 果冻单选. 演示是结算页的配送方式: 选中块由三层叠成, 每层刚度, 质量和回弹不同, 跨得越远越软,
 * 拖出一条果冻尾巴; 中途再选时从当前位置和速度接上. 下面写出所选方式的运费与送达时间.
 */

const ITEMS: readonly GelItem[] = [
  { value: "standard", label: "标准" },
  { value: "next", label: "次日达" },
  { value: "same", label: "当日达" },
  { value: "pickup", label: "自提", disabled: true },
];
const NOTE: Readonly<Record<string, string>> = {
  standard: "免运费 · 预计 11 月 15 日送达",
  next: "运费 ¥8 · 明天 18:00 前送达",
  same: "运费 ¥18 · 今天 21:00 前送达",
  pickup: "附近自提点已满",
};

const CONTROLS: readonly ControlDef[] = [
  select("defaultValue", "初始值", ["standard", "next", "same"], "next", "string", "非受控的初始选中项."),
  select("size", "尺寸", ["sm", "md", "lg"], "lg", '"sm" | "md" | "lg"', "高度, 字号与内边距三档."),
  color("tone", "选中色", CHOICE_ACCENTS, "primary", "ChoiceTone", "选中块颜色; 文字跟着换配套前景色."),
  range("stagger", "层间错峰", [0, 80, 2], 22, "三层起步的错峰 ms."),
  range("stiffness", "刚度", [100, 1200, 20], 580, "最硬那层的刚度, 其余两层按比例变软."),
  range("bounce", "回弹", [0, 0.6, 0.02], 0.2, "回弹量, 0 不过冲."),
  toggle("disabled", "禁用", false, "变淡, 不响应."),
];
const BASE = initialValues(CONTROLS);
const ACTIVE_TEXT: Readonly<Record<string, string>> = {
  primary: "primary-foreground",
  foreground: "background",
  success: "background",
  warning: "background",
  destructive: "destructive-foreground",
};
const toProps = (values: Values): Record<string, unknown> => ({ ...values, activeTextTone: ACTIVE_TEXT[String(values.tone)] });

function GelDemo(props: Record<string, unknown>) {
  const [value, setValue] = useState(String(props.defaultValue));
  return (
    <div className="flex w-[min(22rem,calc(100vw-6rem))] flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left">
      <p className="text-[13px] font-medium text-foreground">配送方式 · 订单 #20261112-0418</p>
      <GelRadio {...props} items={ITEMS} ariaLabel="配送方式" onChange={setValue} />
      <p className="text-[12.5px] text-muted-foreground">{NOTE[value]}</p>
    </div>
  );
}

const usage = (values: Values): string => {
  const body = tag("GelRadio", toProps(values) as Values, { ...toProps(BASE), defaultValue: "", size: "md" } as Values).replace("<GelRadio", "<GelRadio items={ITEMS}");
  return controlDemo(["GelRadio"], body, `\n\nconst ITEMS = [\n  { value: "standard", label: "标准" },\n  { value: "next", label: "次日达" },\n  { value: "same", label: "当日达" },\n  { value: "pickup", label: "自提", disabled: true },\n];`);
};

export const GEL_RADIO: PageSpec = {
  id: "gel-radio",
  kind: "control",
  importName: "GelRadio",
  source: "src/controls/choice/pick/GelRadio.tsx",
  raw: gelRaw,
  deps: [],
  controls: CONTROLS,
  toProps,
  height: 300,
  render: (props) => <GelDemo {...props} />,
  usage,
  propDesc: {
    items: "选项 ({ value, label, disabled? }); 禁用项跳过.",
    value: "受控值.",
    onChange: "选中项变化时调用.",
    textTone: "未选中文字色.",
    activeTextTone: "选中文字色.",
    ariaLabel: "radiogroup 的读屏名称.",
    className: "根元素类名.",
  },
  propsNote: "根元素 role=\"radiogroup\", 每项 role=\"radio\" + aria-checked, roving tabindex; 三层选中块 aria-hidden.",
  examples: [
    {
      id: "soft",
      title: "更软的果冻",
      desc: "stiffness 降到 260, stagger 拉到 60: 跨两格时尾巴拖得更长.",
      code: `<GelRadio items={ITEMS} defaultValue="standard" stiffness={260} stagger={60} bounce={0.35} tone="success" />`,
      render: () => <GelRadio items={ITEMS} defaultValue="standard" stiffness={260} stagger={60} bounce={0.35} tone="success" activeTextTone="background" ariaLabel="配送方式 (软)" />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦选中项." },
    { keys: ["←", "→"], action: "漫游即选中, 跳过禁用项; ↑ ↓ 同." },
    { keys: ["Home"], action: "第一项; End 最后一项." },
  ],
  reduced: {
    desc: "减少动效下选中照常, 三层选中块一起直接落到新位置, 没有错峰与尾巴.",
    notes: ["三层不错峰, 直接跳到选中项.", "没有回弹与果冻尾巴.", "文字换色不过渡."],
  },
};
