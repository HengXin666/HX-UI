import { useState } from "react";
import { ArcField } from "../../../../../../src/controls";
import arcRaw from "../../../../../../src/controls/compose/input/ArcField.tsx?raw";
import { color, initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { COMPOSE_ACCENTS, COMPOSE_SURFACES } from "./tones";

/**
 * controls 批 2: 弯曲的单行输入框. 演示是周报订阅框: 外框, 文字与按钮沿同一条下垂曲线排布, Enter 或点按钮提交,
 * 下面一行写出 onSubmit 收到的值. 光标不在末尾或文字超长时换回直排编辑, 失焦再弯回去.
 */

const CONTROLS: readonly ControlDef[] = [
  text("placeholder", "占位文字", "工作邮箱", "空值时沿曲线显示的提示, 也是默认的读屏名称."),
  text("buttonText", "按钮文字", "订阅周报", "右端按钮的文字; 给 null 时不画按钮."),
  range("width", "宽度", [240, 480, 10], 300, "整个输入框宽 px."),
  range("bend", "弯曲", [-40, 40, 1], 28, "中点相对两端下垂的 px, 负值上拱."),
  range("height", "高度", [44, 80, 2], 60, "外框高 px."),
  range("cornerRadius", "圆角", [0, 32, 1], 18, "外框圆角 px; 按钮圆角跟着少 8."),
  range("fontSize", "字号", [12, 20, 1], 15, "文字与按钮字号 px."),
  select("shadowSize", "投影", ["none", "sm", "md", "lg"], "md", '"none" | "sm" | "md" | "lg"', "外框投影三档, 沿曲线外形投下."),
  color("buttonColor", "按钮色", COMPOSE_ACCENTS, "primary", "HxColor", "按钮底色."),
  color("surfaceColor", "底色", COMPOSE_SURFACES, "card", "HxColor", "外框填充色."),
  toggle("disabled", "禁用", false, "变淡, 输入框与按钮都不响应."),
];
const BASE = initialValues(CONTROLS);
const DEFAULTS: Values = {
  ...BASE,
  placeholder: "Enter your email",
  buttonText: "Get Started",
  width: 450,
  height: 64,
  fontSize: 16,
};

function ArcDemo(props: Record<string, unknown>) {
  const [log, setLog] = useState("Enter 或点按钮提交");
  return (
    <div className="flex flex-col items-center gap-5">
      <ArcField {...props} type="email" ariaLabel="订阅周报的邮箱" onSubmit={(value) => setLog(value ? `onSubmit: ${value}` : "onSubmit: (空)")} />
      <p className="font-mono text-[12px] text-muted-foreground">{log}</p>
    </div>
  );
}

export const ARC_FIELD: PageSpec = {
  id: "arc-field",
  kind: "control",
  importName: "ArcField",
  source: "src/controls/compose/input/ArcField.tsx",
  raw: arcRaw,
  deps: [],
  controls: CONTROLS,
  height: 300,
  render: (props) => <ArcDemo {...props} />,
  usage: (values: Values) => controlUsage("ArcField", values, DEFAULTS),
  propDesc: {
    value: "受控值.",
    defaultValue: "非受控的初始值.",
    onChange: "每次输入调用, 参数是新值.",
    onSubmit: "Enter 或点按钮时调用; 输入法组字时的 Enter 不算.",
    icon: "按钮文字右侧的图标.",
    type: "原生 input 的 type, 默认 email; email 与 number 读不到光标位置, 按按键推断.",
    name: "表单字段名.",
    ariaLabel: "读屏名称, 默认用占位文字.",
    textColor: "文字与聚焦时外框线的颜色.",
    placeholderColor: "占位文字颜色.",
    borderColor: "未聚焦时外框线的颜色.",
    buttonTextColor: "按钮文字颜色.",
    className: "根元素类名.",
  },
  propsNote: "曲线上的字是 svg textPath (aria-hidden), 真正可编辑的是叠在上面的透明原生 input; 根元素 data-mode 在 arc 与 straight 间切换.",
  examples: [
    {
      id: "arch",
      title: "上拱的搜索框",
      desc: "bend 给负值时曲线上拱; type=\"search\" 能读到光标, 光标移回中间立刻换直排编辑.",
      code: `<ArcField type="search" bend={-18} width={300} height={52} placeholder="搜索组件" buttonText="搜索" shadowSize="sm" />`,
      render: () => <ArcField type="search" bend={-18} width={300} height={52} placeholder="搜索组件" buttonText="搜索" shadowSize="sm" />,
    },
    {
      id: "plain",
      title: "不带按钮",
      desc: "buttonText={null} 时文字铺满整条曲线, 只靠 Enter 提交.",
      code: `<ArcField buttonText={null} width={280} bend={20} placeholder="给这张图起个名字" type="text" />`,
      render: () => <ArcField buttonText={null} width={280} bend={20} placeholder="给这张图起个名字" type="text" />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "先聚焦输入框, 再到右端按钮." },
    { keys: ["Enter"], action: "提交当前值 (调用 onSubmit); 输入法组字中不提交." },
    { keys: ["←", "→"], action: "光标离开末尾时整行换回直排编辑, 回到末尾再弯回曲线." },
  ],
  reduced: {
    desc: "减少动效下曲线排版与直排编辑照常切换, 只是不做交叉淡变, 光标不闪, 按钮按下不缩放.",
    notes: ["曲线文字与直排输入之间直接切换, 不淡入淡出.", "曲线上画出的光标常亮, 不闪烁.", "按钮按下不缩放, 投影与颜色不过渡."],
  },
};
