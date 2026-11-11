import { Toggle, ToggleGroup, ToggleGroupItem } from "@hx/ui";
import toggleGroupRaw from "../../../../../../src/primitives/toggle-group.tsx?raw";
import { range, select, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 两态按钮与按钮组. 主演示是编辑器工具条的加粗 / 斜体 / 下划线, 单选与多选切 type 看语义变化.
 */

type Variant = "default" | "outline";
type Size = "default" | "sm" | "lg";
const MARKS = [
  { value: "bold", label: "加粗", icon: "icon-[solar--text-bold-linear]" },
  { value: "italic", label: "斜体", icon: "icon-[solar--text-italic-linear]" },
  { value: "underline", label: "下划线", icon: "icon-[solar--text-underline-linear]" },
];
const ICON_CLASS = "size-4 bg-current";

function Items() {
  return (
    <>
      {MARKS.map((mark) => (
        <ToggleGroupItem key={mark.value} value={mark.value} aria-label={mark.label}>
          <span aria-hidden className={`${mark.icon} ${ICON_CLASS}`} />
        </ToggleGroupItem>
      ))}
    </>
  );
}

function ToggleGroupDemo(props: Record<string, unknown>) {
  const { type, variant, size, spacing, disabled } = props as { type: string; variant: Variant; size: Size; spacing: number; disabled: boolean };
  const style = { variant, size, spacing, disabled, "aria-label": "文字格式" };
  return type === "multiple" ? (
    <ToggleGroup type="multiple" defaultValue={["bold", "italic"]} {...style}>
      <Items />
    </ToggleGroup>
  ) : (
    <ToggleGroup type="single" defaultValue="bold" {...style}>
      <Items />
    </ToggleGroup>
  );
}

function usage(values: Values): string {
  const attrs = [
    `type="${values.type}"`,
    values.type === "multiple" ? `defaultValue={["bold", "italic"]}` : `defaultValue="bold"`,
    values.variant === "default" ? "" : `variant="${values.variant}"`,
    values.size === "default" ? "" : `size="${values.size}"`,
    values.spacing === 0 ? "" : `spacing={${values.spacing}}`,
    values.disabled ? "disabled" : "",
    `aria-label="文字格式"`,
  ].filter(Boolean);
  const items = MARKS.map((mark) => `  <ToggleGroupItem value="${mark.value}" aria-label="${mark.label}">\n    <span aria-hidden className="${mark.icon} size-4" />\n  </ToggleGroupItem>`).join("\n");
  return demo(["ToggleGroup", "ToggleGroupItem"], `<ToggleGroup ${attrs.join(" ")}>\n${items}\n</ToggleGroup>`);
}

export const TOGGLE_GROUP: PageSpec = {
  id: "toggle-group",
  kind: "composite",
  importName: "ToggleGroup",
  parts: ["ToggleGroupItem", "Toggle"],
  source: "src/primitives/toggle-group.tsx",
  raw: toggleGroupRaw,
  deps: ["radix-ui", "class-variance-authority"],
  controls: [
    select("type", "选择方式", ["single", "multiple"], "single", "", "single 单选 (再点一次可取消), multiple 多选."),
    select("variant", "变体", ["default", "outline"], "default", "", "由组下发给每一项; outline 带描边, 贴合时相邻边框合成一条."),
    select("size", "尺寸", ["default", "sm", "lg"], "default", "", "由组下发给每一项."),
    range("spacing", "间距", [0, 4, 1], 0, "项与项之间的间距 (Tailwind 间距档); 0 时贴合成一条, 只有首尾保留圆角."),
    toggle("disabled", "禁用", false, "整组禁用, 不可聚焦也不响应点击."),
  ],
  propDesc: {
    type: "single 单选 (可取消), multiple 多选. 必填.",
    value: "受控的选中值: single 时是字符串, multiple 时是字符串数组.",
    defaultValue: "非受控的初始选中值.",
    onValueChange: "选中值变化时回调.",
    disabled: "整组禁用.",
    rovingFocus: "方向键在项之间移动焦点 (默认开), 关掉后每一项各占一个 Tab 位.",
    loop: "方向键到头后回到另一端 (默认开).",
    orientation: "方向键的方向: horizontal 用左右, vertical 用上下.",
    dir: "阅读方向, 影响左右方向键.",
    asChild: "把根元素交给唯一的子元素渲染.",
    "ToggleGroupItem.value": "这一项的值. 必填.",
    "ToggleGroupItem.variant": "单独覆盖这一项的变体; 组上给了 variant 时以组为准.",
    "ToggleGroupItem.size": "单独覆盖这一项的尺寸; 组上给了 size 时以组为准.",
    "Toggle.pressed": "受控的按下态, 与 onPressedChange 成对使用.",
    "Toggle.defaultPressed": "非受控的初始按下态.",
    "Toggle.onPressedChange": "按下态变化时回调.",
  },
  propsNote: "Toggle 是单个两态按钮, 不放进组时用它; 组里的每一项用 ToggleGroupItem.",
  height: 300,
  render: (props) => <ToggleGroupDemo {...props} />,
  usage,
  examples: [
    {
      id: "toggle",
      title: "单个两态按钮",
      desc: "Toggle 自己就是一个按下 / 弹起的按钮, 读屏器读出 aria-pressed.",
      code: `<Toggle aria-label="自动换行" defaultPressed>\n  <span aria-hidden className="icon-[solar--align-left-linear] size-4" />\n  自动换行\n</Toggle>\n<Toggle variant="outline" aria-label="显示空白字符">显示空白字符</Toggle>`,
      render: () => (
        <>
          <Toggle aria-label="自动换行" defaultPressed>
            <span aria-hidden className={`icon-[solar--align-left-linear] ${ICON_CLASS}`} />
            自动换行
          </Toggle>
          <Toggle variant="outline" aria-label="显示空白字符">
            显示空白字符
          </Toggle>
        </>
      ),
    },
    {
      id: "text",
      title: "带文字的单选",
      desc: "单选组也可以放文字, 但要切视图且必须有一项选中时用 SegmentedControl.",
      code: `<ToggleGroup type="single" variant="outline" defaultValue="week" aria-label="统计范围">\n  <ToggleGroupItem value="day">今天</ToggleGroupItem>\n  <ToggleGroupItem value="week">本周</ToggleGroupItem>\n  <ToggleGroupItem value="month">本月</ToggleGroupItem>\n</ToggleGroup>`,
      render: () => (
        <ToggleGroup type="single" variant="outline" defaultValue="week" aria-label="统计范围">
          <ToggleGroupItem value="day">今天</ToggleGroupItem>
          <ToggleGroupItem value="week">本周</ToggleGroupItem>
          <ToggleGroupItem value="month">本月</ToggleGroupItem>
        </ToggleGroup>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦到组里当前选中的项 (没有选中时是第一项); 再按 Tab 离开整组." },
    { keys: ["←", "→"], action: "在项之间移动焦点 (竖排时用 ↑ ↓), 到头后回到另一端." },
    { keys: ["Home", "End"], action: "跳到第一项 / 最后一项." },
    { keys: ["Space"], action: "切换当前项的按下态." },
    { keys: ["Enter"], action: "切换当前项的按下态." },
  ],
};
