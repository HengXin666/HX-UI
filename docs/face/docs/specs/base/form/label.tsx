import { Checkbox, Input, Label } from "@hx/ui";
import labelRaw from "../../../../../../src/primitives/label.tsx?raw";
import { select, text, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 表单标签. 点标签聚焦或切换关联的控件; 控件禁用时标签跟着变淡, 不用另写类名.
 */

function LabelDemo(props: Record<string, unknown>) {
  const { label, control, disabled } = props as { label: string; control: string; disabled: boolean };
  if (control === "input") {
    return (
      <div className="grid w-[20rem] max-w-full gap-2 text-left">
        <Label htmlFor="label-demo-name">{label}</Label>
        <Input id="label-demo-name" defaultValue="林悦" disabled={disabled} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="label-demo-remember" defaultChecked disabled={disabled} />
      <Label htmlFor="label-demo-remember">{label}</Label>
    </div>
  );
}

function usage(values: Values): string {
  const disabled = values.disabled ? " disabled" : "";
  const body =
    values.control === "input"
      ? `<div className="grid gap-2">\n  <Label htmlFor="name">${String(values.label)}</Label>\n  <Input id="name" defaultValue="林悦"${disabled} />\n</div>`
      : `<div className="flex items-center gap-2">\n  <Checkbox id="remember" defaultChecked${disabled} />\n  <Label htmlFor="remember">${String(values.label)}</Label>\n</div>`;
  return demo([values.control === "input" ? "Input" : "Checkbox", "Label"], body);
}

export const LABEL: PageSpec = {
  id: "label",
  kind: "single",
  importName: "Label",
  source: "src/primitives/label.tsx",
  raw: labelRaw,
  deps: ["radix-ui"],
  controls: [
    text("label", "文字", "记住这台设备 30 天", "标签文字 (children)."),
    select("control", "关联控件", ["checkbox", "input"], "checkbox", "", "不是属性: 标签用 htmlFor 关联的控件. 勾选框在前标签在后, 输入框标签在上."),
    toggle("disabled", "控件禁用", false, "不是 Label 的属性: 关联控件 disabled 时, 排在它后面的标签 (peer-disabled) 自动变淡."),
  ],
  propDesc: { asChild: "把标签交给唯一的子元素渲染." },
  propsNote: "其余属性 (htmlFor 等) 透传给原生 <label>. 控件在标签之后时靠 peer-disabled 变淡; 放在 Field 里时由 Field 的 data-disabled 统一处理.",
  height: 280,
  render: (props) => <LabelDemo {...props} />,
  usage,
  examples: [
    {
      id: "wrap",
      title: "包住控件",
      desc: "不想写 id 时直接用 Label 包住控件, 点文字同样会切换.",
      code: `<Label>\n  <Checkbox defaultChecked />\n  同步到所有设备\n</Label>`,
      render: () => (
        <Label>
          <Checkbox defaultChecked />
          同步到所有设备
        </Label>
      ),
    },
  ],
  keyboard: [
    { keys: ["点击标签"], action: "聚焦关联的输入框, 或切换关联的勾选框 / 单选项." },
    { keys: ["读屏"], action: "关联控件的可访问名称就是标签文字, 控件本身不必再写 aria-label." },
  ],
};
