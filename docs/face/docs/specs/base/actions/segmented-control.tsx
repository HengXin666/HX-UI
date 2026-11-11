import { useState } from "react";
import { SegmentedControl, type SegmentedControlItem } from "@hx/ui";
import segmentedRaw from "../../../../../../src/layout/SegmentedControl.tsx?raw";
import { range, select, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 分段控制. 主演示是收件箱的视图切换, 必有一项选中; 角标数字超过 99 显示 99+.
 */

type Inbox = "all" | "unread" | "starred" | "archived";
const ALL: readonly { key: Inbox; label: string; icon: string }[] = [
  { key: "all", label: "全部", icon: "icon-[solar--letter-linear]" },
  { key: "unread", label: "未读", icon: "icon-[solar--bell-linear]" },
  { key: "starred", label: "已标记", icon: "icon-[solar--star-linear]" },
  { key: "archived", label: "归档", icon: "icon-[solar--archive-linear]" },
];

function itemsOf(values: Record<string, unknown>): SegmentedControlItem<Inbox>[] {
  return ALL.slice(0, Number(values.count)).map((item) => ({
    key: item.key,
    label: item.label,
    ...(values.icons ? { icon: item.icon } : {}),
    ...(item.key === "unread" && Number(values.badge) > 0 ? { badge: Number(values.badge) } : {}),
  }));
}

function SegmentedDemo(props: Record<string, unknown>) {
  const [view, setView] = useState<Inbox>("all");
  return <SegmentedControl items={itemsOf(props)} value={view} onChange={setView} ripple={Boolean(props.ripple)} />;
}

function usage(values: Values): string {
  const items = itemsOf(values)
    .map((item) => `  { key: "${item.key}", label: "${item.label}"${item.icon ? `, icon: "${item.icon}"` : ""}${item.badge ? `, badge: ${item.badge}` : ""} },`)
    .join("\n");
  const ripple = values.ripple ? "" : " ripple={false}";
  return demo(
    ["SegmentedControl"],
    `<SegmentedControl items={ITEMS} value={view} onChange={setView}${ripple} />`,
    `\nimport { useState } from "react";\n\nconst ITEMS = [\n${items}\n];`,
  ).replace("export function Demo() {\n", 'export function Demo() {\n  const [view, setView] = useState("all");\n');
}

export const SEGMENTED_CONTROL: PageSpec = {
  id: "segmented-control",
  kind: "single",
  importName: "SegmentedControl",
  source: "src/layout/SegmentedControl.tsx",
  raw: segmentedRaw,
  deps: ["motion"],
  controls: [
    select("count", "分段数", ["2", "3", "4"], "4", "", "不是属性: 演示用的 items 取前几项. 选项多于 4 个时改用下拉或 Tabs."),
    toggle("icons", "图标", true, "不是属性: items 每项的 icon (Iconify 类名), 图标在文字左侧."),
    range("badge", "未读角标", [0, 120, 1], 12, "不是属性: \"未读\" 一项的 badge; 0 不显示, 超过 99 显示 99+."),
    toggle("ripple", "水波纹", true, "点按水波纹; 选中滑块从旧分段滑到新分段的途中不被裁掉."),
  ],
  propDesc: {
    items: "选项列表: key, label, 可选 icon 与 badge. 值的类型由各项的 key 推导. 必填.",
    value: "当前选中项的 key. 必填, 必有一项选中.",
    onChange: "选中项变化时回调; 可以直接传 useState 的 setState. 必填.",
    className: "根元素的类名.",
    suppressLayoutAnimation: "容器尺寸正在变化时设为 true, 选中滑块不做布局动画, 避免抖动.",
  },
  propsNote: "与 ToggleGroup 的区别: 这里是切视图, 必有一项选中且不可取消; 开关若干状态用 ToggleGroup.",
  height: 300,
  render: (props) => <SegmentedDemo {...props} />,
  usage,
  examples: [
    {
      id: "range",
      title: "只有文字的两段",
      desc: "最常见的形态: 两三个短词, 不带图标.",
      code: `const [unit, setUnit] = useState("c");\n\n<SegmentedControl\n  items={[{ key: "c", label: "摄氏" }, { key: "f", label: "华氏" }]}\n  value={unit}\n  onChange={setUnit}\n/>`,
      render: () => <UnitDemo />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "依次聚焦每个分段 (每段是一个原生 button)." },
    { keys: ["Enter"], action: "选中当前分段." },
    { keys: ["Space"], action: "选中当前分段." },
  ],
};

function UnitDemo() {
  const [unit, setUnit] = useState<"c" | "f">("c");
  return (
    <SegmentedControl
      items={[
        { key: "c", label: "摄氏" },
        { key: "f", label: "华氏" },
      ]}
      value={unit}
      onChange={setUnit}
    />
  );
}
