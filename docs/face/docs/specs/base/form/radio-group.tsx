import { Label, RadioGroup, RadioGroupItem, cn } from "@hx/ui";
import radioRaw from "../../../../../../src/primitives/radio-group.tsx?raw";
import { select, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 单选组. 主演示是结账页的配送方式; 卡片样式用 indicator={false} 自己画整张卡.
 */

const SHIPPING = [
  { value: "standard", label: "标准配送", note: "3 至 5 个工作日, 免运费" },
  { value: "express", label: "次日达", note: "当日 16:00 前下单, 运费 18 元" },
  { value: "pickup", label: "门店自提", note: "徐汇店, 到店出示取货码" },
];
const CARD = "flex flex-col items-start gap-0.5 rounded-lg border border-border p-3 text-left data-[state=checked]:border-primary data-[state=checked]:bg-primary/5";

function RadioDemo(props: Record<string, unknown>) {
  const { layout, orientation, initial, disabled } = props as { layout: string; orientation: "horizontal" | "vertical"; initial: string; disabled: boolean };
  const cards = layout === "cards";
  const flow = orientation === "horizontal" ? "grid-flow-col auto-cols-fr" : "";
  return (
    <RadioGroup defaultValue={initial} orientation={orientation} disabled={disabled} aria-label="配送方式" className={cn("w-[34rem] max-w-full text-left", flow)}>
      {SHIPPING.map((item) =>
        cards ? (
          <RadioGroupItem key={item.value} value={item.value} indicator={false} className={CARD}>
            <span className="text-[13px] font-medium text-foreground">{item.label}</span>
            <span className="text-[12px] text-muted-foreground">{item.note}</span>
          </RadioGroupItem>
        ) : (
          <div key={item.value} className="flex items-center gap-2">
            <RadioGroupItem value={item.value} id={`ship-${item.value}`} />
            <Label htmlFor={`ship-${item.value}`}>{item.label}</Label>
          </div>
        ),
      )}
    </RadioGroup>
  );
}

function usage(values: Values): string {
  const attrs = [`defaultValue="${values.initial}"`, values.orientation === "horizontal" ? `orientation="horizontal" className="grid-flow-col"` : "", values.disabled ? "disabled" : "", `aria-label="配送方式"`].filter(Boolean).join(" ");
  const items = SHIPPING.map((item) =>
    values.layout === "cards"
      ? `  <RadioGroupItem value="${item.value}" indicator={false} className="rounded-lg border p-3 data-[state=checked]:border-primary">\n    <span>${item.label}</span>\n    <span className="text-muted-foreground">${item.note}</span>\n  </RadioGroupItem>`
      : `  <div className="flex items-center gap-2">\n    <RadioGroupItem value="${item.value}" id="ship-${item.value}" />\n    <Label htmlFor="ship-${item.value}">${item.label}</Label>\n  </div>`,
  ).join("\n");
  return demo(values.layout === "cards" ? ["RadioGroup", "RadioGroupItem"] : ["Label", "RadioGroup", "RadioGroupItem"], `<RadioGroup ${attrs}>\n${items}\n</RadioGroup>`);
}

export const RADIO_GROUP: PageSpec = {
  id: "radio-group",
  kind: "composite",
  importName: "RadioGroup",
  parts: ["RadioGroupItem"],
  source: "src/primitives/radio-group.tsx",
  raw: radioRaw,
  deps: ["radix-ui"],
  controls: [
    select("layout", "样式", ["list", "cards"], "list", "", "不是属性: list 是圆点加标签; cards 给每项 indicator={false}, 用 data-[state=checked] 画整张卡."),
    select("orientation", "方向", ["vertical", "horizontal"], "vertical", "", "方向键的方向 (aria-orientation); 横排的版式由 className 给, 演示加了 grid-flow-col."),
    select("initial", "默认选中", SHIPPING.map((item) => item.value), "standard", "", "defaultValue: 非受控的初始选中项."),
    toggle("disabled", "禁用", false, "整组禁用."),
  ],
  propDesc: {
    name: "表单提交时的字段名.",
    form: "关联到页面上另一个 <form> 的 id.",
    required: "表单校验时必须选一项.",
    disabled: "整组禁用.",
    dir: "阅读方向, 影响左右方向键.",
    orientation: "方向键的方向: vertical 用上下, horizontal 用左右; 不传时上下左右都可以.",
    loop: "方向键到头后回到另一端 (默认开).",
    defaultValue: "非受控的初始选中项.",
    value: "受控的选中项, 与 onValueChange 成对使用.",
    onValueChange: "选中项变化时回调.",
    asChild: "把根元素交给唯一的子元素渲染.",
    "RadioGroupItem.value": "这一项的值. 必填.",
    "RadioGroupItem.checked": "由 RadioGroup 管, 一般不直接传.",
    "RadioGroupItem.required": "由 RadioGroup 的 required 下发.",
    "RadioGroupItem.asChild": "把单选项交给唯一的子元素渲染.",
  },
  propsNote: "文字标签由调用方用 Label 关联 (htmlFor) 或像卡片样式那样写进 children.",
  height: 320,
  render: (props) => <RadioDemo {...props} />,
  usage,
  examples: [
    {
      id: "cards",
      title: "卡片样式, 横排",
      desc: "三张卡并排, 选中的边框转 primary; 方向键在卡片之间移动.",
      code: `<RadioGroup defaultValue="express" orientation="horizontal" className="grid-flow-col">\n  <RadioGroupItem value="standard" indicator={false} className="rounded-lg border p-3 data-[state=checked]:border-primary">…</RadioGroupItem>\n  …\n</RadioGroup>`,
      render: () => <RadioDemo layout="cards" orientation="horizontal" initial="express" disabled={false} />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦到选中的那一项 (没有选中时是第一项); 整组只占一个 Tab 位." },
    { keys: ["↑", "↓"], action: "移到上一项 / 下一项并选中 (横排时是 ← →)." },
    { keys: ["Space"], action: "选中当前聚焦的项." },
  ],
};
