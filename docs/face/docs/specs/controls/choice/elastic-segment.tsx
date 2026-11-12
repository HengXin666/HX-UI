import { useState } from "react";
import { ElasticSegment, type ElasticItem } from "../../../../../../src/controls";
import elasticRaw from "../../../../../../src/controls/choice/pick/ElasticSegment.tsx?raw";
import { color, initialValues, range, select, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlDemo } from "../shared";
import { tag } from "../../usage-code";
import { CHOICE_SURFACES } from "./tones";

/**
 * controls 批 2: 橡皮分段. 演示是日程视图的切换: 拇指的头边先走, 尾边晚一拍并带着头边的部分速度追上, 落定时压一下再回弹;
 * 可拖动, 越界有阻尼, 甩动按速度跳到下一档. 下面列出该视图下的日程条数.
 */

const ITEMS: readonly ElasticItem[] = [
  { value: "day", label: "日" },
  { value: "week", label: "周" },
  { value: "month", label: "月" },
  { value: "agenda", label: "日程列表" },
];
const SUMMARY: Readonly<Record<string, string>> = {
  day: "11 月 12 日 · 4 个日程, 最早 09:30 站会",
  week: "第 46 周 · 17 个日程, 周四下午最满",
  month: "11 月 · 63 个日程, 21 日设计周",
  agenda: "接下来 30 天 · 按时间排 58 条",
};

const CONTROLS: readonly ControlDef[] = [
  select("defaultValue", "初始值", ITEMS.map((item) => item.value), "week", "string", "非受控的初始选中项."),
  select("size", "尺寸", ["sm", "md", "lg"], "lg", '"sm" | "md" | "lg"', "高度, 字号与内边距三档."),
  range("radius", "圆角", [0, 20, 1], 10, "轨道圆角 px, 拇指少 inset."),
  range("inset", "拇指内缩", [0, 6, 1], 3, "拇指与轨道边的间距 px."),
  toggle("equalSlots", "等宽槽位", true, "各段等宽; 关掉按文字宽度分配."),
  range("stretch", "拉伸", [0, 200, 5], 100, "尾边延迟与拉伸上限的百分比, 0 为整块平移."),
  range("squash", "落定压缩", [0, 12, 1], 3, "尾边落定时反向压过目标的 px."),
  range("speed", "速度", [0.25, 3, 0.05], 1, "整体速度倍率."),
  range("glide", "尾边跟随", [0, 100, 5], 75, "尾边继承头边速度的百分比."),
  color("thumbTone", "拇指色", ["background", ...CHOICE_SURFACES], "background", "ChoiceTone", "拇指底色."),
  toggle("disabled", "禁用", false, "变淡, 不响应."),
];
const BASE = initialValues(CONTROLS);

function ElasticDemo(props: Record<string, unknown>) {
  const [view, setView] = useState(String(props.defaultValue));
  return (
    <div className="flex w-[min(22rem,calc(100vw-6rem))] flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left">
      <p className="text-[13px] font-medium text-foreground">日历 · 林知夏</p>
      <ElasticSegment {...props} items={ITEMS} ariaLabel="日历视图" onChange={setView} />
      <p className="text-[12.5px] text-muted-foreground">{SUMMARY[view]}</p>
    </div>
  );
}

const usage = (values: Values): string => {
  const body = tag("ElasticSegment", values, { ...BASE, defaultValue: "", size: "md" }).replace("<ElasticSegment", "<ElasticSegment items={ITEMS}");
  return controlDemo(["ElasticSegment"], body, `\n\nconst ITEMS = [\n  { value: "day", label: "日" },\n  { value: "week", label: "周" },\n  { value: "month", label: "月" },\n  { value: "agenda", label: "日程列表" },\n];`);
};

export const ELASTIC_SEGMENT: PageSpec = {
  id: "elastic-segment",
  kind: "control",
  importName: "ElasticSegment",
  source: "src/controls/choice/pick/ElasticSegment.tsx",
  raw: elasticRaw,
  deps: [],
  controls: CONTROLS,
  height: 300,
  render: (props) => <ElasticDemo {...props} />,
  usage,
  propDesc: {
    items: "分段 ({ value, label, disabled? }).",
    value: "受控值.",
    onChange: "选中项变化时调用.",
    trackTone: "轨道底色.",
    textTone: "未选中文字色.",
    activeTextTone: "选中文字色.",
    draggable: "拇指可拖动; 甩动按速度跳到下一档.",
    ariaLabel: "radiogroup 的读屏名称.",
    className: "根元素类名.",
  },
  propsNote: "根元素 role=\"radiogroup\", 每段 role=\"radio\" + aria-checked, roving tabindex; 拇指是 aria-hidden 的叠层.",
  examples: [
    {
      id: "flat",
      title: "整块平移",
      desc: "stretch={0} 时拇指整块平移, 没有头尾之分; 适合密度高的工具栏.",
      code: `<ElasticSegment items={ITEMS} defaultValue="day" size="sm" stretch={0} squash={0} />`,
      render: () => <ElasticSegment items={ITEMS} defaultValue="day" size="sm" stretch={0} squash={0} ariaLabel="日历视图 (平移)" />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦选中的那一段." },
    { keys: ["←", "→"], action: "移到上一段 / 下一段并选中, 拇指随之拉伸过去; ↑ ↓ 同." },
    { keys: ["Home"], action: "第一段; End 最后一段." },
  ],
  reduced: {
    desc: "减少动效下选中照常, 拇指直接跳到新位置, 不拉伸不回弹.",
    notes: ["拇指不分头尾, 直接落到选中段.", "落定不压缩回弹; 拖动松手直接吸附.", "文字换色不过渡."],
  },
};
