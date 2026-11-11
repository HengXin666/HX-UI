import { Switch } from "@hx/ui";
import switchRaw from "../../../../../../src/primitives/switch.tsx?raw";
import { select, toggle, type PageSpec, type Values } from "../../types";
import { demo, tag } from "../../usage-code";

/**
 * 样板批的两个可调单件页: Button 与 Switch.
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */

// ── Switch ──────────────────────────────────────────────────────────
const SWITCH_BASE: Values = { size: "default", defaultChecked: false, disabled: false };

export const SWITCH: PageSpec = {
  id: "switch",
  kind: "single",
  importName: "Switch",
  source: "src/primitives/switch.tsx",
  raw: switchRaw,
  deps: ["radix-ui", "motion"],
  controls: [
    select("size", "尺寸", ["default", "sm"], "default", "", "两档尺寸, 缩略块的位移量随尺寸走."),
    toggle("defaultChecked", "默认打开", true, "非受控的初始状态; 受控时改用 checked 与 onCheckedChange."),
    toggle("disabled", "禁用", false, "禁用, 透明度降到 50%."),
  ],
  propDesc: {
    checked: "受控的选中态, 与 onCheckedChange 成对使用.",
    defaultChecked: "非受控的初始选中态.",
    onCheckedChange: "选中态变化时回调, 参数是新值.",
    required: "表单校验时必须打开.",
    asChild: "把行为交给唯一的子元素渲染.",
  },
  propsNote: "其余属性 (name, value, disabled, aria-*) 透传给 Radix Switch 的根元素.",
  render: (props) => <Switch aria-label="演示开关" {...props} />,
  usage: (values) => demo(["Switch"], tag("Switch", { "aria-label": "接收通知", ...values }, { ...SWITCH_BASE, "aria-label": "" })),
  examples: [
    {
      id: "states",
      title: "尺寸与状态",
      code: `<Switch defaultChecked aria-label="开" />\n<Switch aria-label="关" />\n<Switch size="sm" defaultChecked aria-label="小号开" />\n<Switch size="sm" aria-label="小号关" />\n<Switch disabled defaultChecked aria-label="禁用" />`,
      render: () => (
        <>
          <Switch defaultChecked aria-label="开" />
          <Switch aria-label="关" />
          <Switch size="sm" defaultChecked aria-label="小号开" />
          <Switch size="sm" aria-label="小号关" />
          <Switch disabled defaultChecked aria-label="禁用" />
        </>
      ),
    },
    {
      id: "label",
      title: "带文字标签",
      desc: "用 label 包住或用 htmlFor 关联, 点文字也能切换, 读屏器读出标签.",
      code: `<label className="flex items-center gap-3 text-sm">\n  <Switch defaultChecked />\n  接收通知\n</label>`,
      render: () => (
        <label className="flex items-center gap-3 text-sm text-foreground">
          <Switch defaultChecked />
          接收通知
        </label>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦到开关." },
    { keys: ["Space"], action: "切换开与关." },
    { keys: ["Enter"], action: "切换开与关 (根元素是 role=\"switch\" 的 button)." },
  ],
};
