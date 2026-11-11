import { useState } from "react";
import { Checkbox, Label } from "@hx/ui";
import checkboxRaw from "../../../../../../src/primitives/checkbox.tsx?raw";
import { select, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 复选框. 三种状态 (未选, 选中, 半选) 由 checked 决定, 半选不用另传图标.
 */

const STATES: Readonly<Record<string, boolean | "indeterminate">> = { unchecked: false, checked: true, indeterminate: "indeterminate" };

function CheckboxDemo(props: Record<string, unknown>) {
  const { state, disabled, invalid } = props as { state: string; disabled: boolean; invalid: boolean };
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-demo" defaultChecked={STATES[state]} disabled={disabled} aria-invalid={invalid || undefined} />
      <Label htmlFor="checkbox-demo">接受服务条款与隐私政策</Label>
    </div>
  );
}

function usage(values: Values): string {
  const state = STATES[String(values.state)];
  const attrs = [state === true ? " defaultChecked" : state === "indeterminate" ? ' defaultChecked="indeterminate"' : "", values.disabled ? " disabled" : "", values.invalid ? " aria-invalid" : ""].join("");
  return demo(["Checkbox", "Label"], `<div className="flex items-center gap-2">\n  <Checkbox id="terms"${attrs} />\n  <Label htmlFor="terms">接受服务条款与隐私政策</Label>\n</div>`);
}

export const CHECKBOX: PageSpec = {
  id: "checkbox",
  kind: "single",
  importName: "Checkbox",
  source: "src/primitives/checkbox.tsx",
  raw: checkboxRaw,
  deps: ["radix-ui", "lucide-react"],
  controls: [
    select("state", "初始状态", ["unchecked", "checked", "indeterminate"], "checked", "", "defaultChecked: 非受控的初始状态; \"indeterminate\" 是半选, 显示一道横线."),
    toggle("disabled", "禁用", false, "禁用, 透明度降低且不响应点击."),
    toggle("invalid", "校验失败", false, "aria-invalid: 边框转危险色, 读屏器读出 \"无效\"."),
  ],
  propDesc: {
    checked: "受控的状态: true, false 或 \"indeterminate\" (半选), 与 onCheckedChange 成对使用.",
    defaultChecked: "非受控的初始状态.",
    required: "表单校验时必须勾选.",
    onCheckedChange: "状态变化时回调, 参数是新状态.",
    asChild: "把行为交给唯一的子元素渲染.",
  },
  propsNote: "其余属性 (name, value, disabled, aria-*) 透传给 Radix Checkbox 的根 <button>; 在 <form> 里会同步一个隐藏的原生 input.",
  height: 260,
  render: (props) => <CheckboxDemo {...props} />,
  usage,
  examples: [
    {
      id: "states",
      title: "三种状态与禁用",
      code: `<Checkbox aria-label="未选" />\n<Checkbox defaultChecked aria-label="选中" />\n<Checkbox defaultChecked="indeterminate" aria-label="半选" />\n<Checkbox disabled aria-label="禁用" />\n<Checkbox disabled defaultChecked aria-label="禁用并选中" />`,
      render: () => (
        <>
          <Checkbox aria-label="未选" />
          <Checkbox defaultChecked aria-label="选中" />
          <Checkbox defaultChecked="indeterminate" aria-label="半选" />
          <Checkbox disabled aria-label="禁用" />
          <Checkbox disabled defaultChecked aria-label="禁用并选中" />
        </>
      ),
    },
    {
      id: "parent",
      title: "全选与半选",
      desc: "父项在子项部分勾选时显示半选, 点一下全选.",
      code: `const [picked, setPicked] = useState(["design"]);\nconst all = picked.length === TEAMS.length;\n\n<Checkbox\n  checked={all ? true : picked.length > 0 ? "indeterminate" : false}\n  onCheckedChange={(next) => setPicked(next === true ? TEAMS.map((t) => t.id) : [])}\n/>`,
      render: () => <ParentDemo />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦到复选框; 禁用的跳过." },
    { keys: ["Space"], action: "切换勾选; 半选时按下变为选中." },
  ],
};

const TEAMS = [
  { id: "design", label: "设计" },
  { id: "web", label: "前端" },
  { id: "infra", label: "基础设施" },
];


function ParentDemo() {
  const [picked, setPicked] = useState<string[]>(["design"]);
  const all = picked.length === TEAMS.length;
  return (
    <div className="grid gap-2 text-left">
      <Label>
        <Checkbox checked={all ? true : picked.length > 0 ? "indeterminate" : false} onCheckedChange={(next) => setPicked(next === true ? TEAMS.map((team) => team.id) : [])} />
        全部团队
      </Label>
      {TEAMS.map((team) => (
        <Label key={team.id} className="pl-6">
          <Checkbox checked={picked.includes(team.id)} onCheckedChange={(next) => setPicked((prev) => (next === true ? [...prev, team.id] : prev.filter((id) => id !== team.id)))} />
          {team.label}
        </Label>
      ))}
    </div>
  );
}
