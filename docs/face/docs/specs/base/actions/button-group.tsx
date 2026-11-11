import { Fragment } from "react";
import { Button, ButtonGroup, ButtonGroupSeparator, ButtonGroupText, Input } from "@hx/ui";
import buttonGroupRaw from "../../../../../../src/primitives/button-group.tsx?raw";
import { select, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 按钮组. 主演示是邮件列表上方的一排动作, 子按钮的变体与尺寸也开放调, 便于看相邻边框怎么合并.
 */

type Variant = "outline" | "default" | "secondary";
type Size = "default" | "sm" | "lg";
const ACTIONS = ["归档", "标为已读", "稍后提醒"];

function ButtonGroupDemo(props: Record<string, unknown>) {
  const { orientation, variant, size, prefix } = props as { orientation: "horizontal" | "vertical"; variant: Variant; size: Size; prefix: boolean };
  // 无边框的 secondary 之间靠 ButtonGroupSeparator 分开; 带边框的变体相邻边合成一条, 不用分隔线.
  const split = variant === "secondary";
  return (
    <ButtonGroup orientation={orientation} aria-label="邮件操作">
      {prefix ? <ButtonGroupText>已选 3 封</ButtonGroupText> : null}
      {ACTIONS.map((label, index) => (
        <Fragment key={label}>
          {split && index > 0 ? <ButtonGroupSeparator orientation={orientation === "vertical" ? "horizontal" : "vertical"} /> : null}
          <Button variant={variant} size={size}>
            {label}
          </Button>
        </Fragment>
      ))}
    </ButtonGroup>
  );
}

function usage(values: Values): string {
  const open = `<Button${values.variant === "default" ? "" : ` variant="${values.variant}"`}${values.size === "default" ? "" : ` size="${values.size}"`}>`;
  const sep = values.orientation === "vertical" ? '\n  <ButtonGroupSeparator orientation="horizontal" />' : "\n  <ButtonGroupSeparator />";
  const split = values.variant === "secondary";
  const buttons = ACTIONS.map((label, index) => `${split && index > 0 ? sep : ""}\n  ${open}${label}</Button>`).join("");
  const root = values.orientation === "vertical" ? '<ButtonGroup orientation="vertical" aria-label="邮件操作">' : '<ButtonGroup aria-label="邮件操作">';
  const text = values.prefix ? "\n  <ButtonGroupText>已选 3 封</ButtonGroupText>" : "";
  const names = ["Button", "ButtonGroup", ...(split ? ["ButtonGroupSeparator"] : []), ...(values.prefix ? ["ButtonGroupText"] : [])];
  return demo(names, `${root}${text}${buttons}\n</ButtonGroup>`);
}

export const BUTTON_GROUP: PageSpec = {
  id: "button-group",
  kind: "single",
  importName: "ButtonGroup",
  parts: ["ButtonGroupText", "ButtonGroupSeparator"],
  source: "src/primitives/button-group.tsx",
  raw: buttonGroupRaw,
  deps: ["class-variance-authority", "radix-ui"],
  controls: [
    select("orientation", "方向", ["horizontal", "vertical"], "horizontal", "", "横排时左右相邻的圆角与左边框收掉, 竖排时上下相邻的收掉."),
    select("variant", "子按钮变体", ["outline", "default", "secondary"], "outline", "", "不是 ButtonGroup 的属性: 演示组里的 Button 变体. secondary 没有边框, 相邻两个之间要放 ButtonGroupSeparator."),
    select("size", "子按钮尺寸", ["default", "sm", "lg"], "default", "", "不是 ButtonGroup 的属性: 演示组里的 Button 尺寸, 整组同一档."),
    toggle("prefix", "前缀文字", false, "在组首放一块 ButtonGroupText, 与按钮同高同边框."),
  ],
  propDesc: {
    orientation: "排列方向. 横排合并左右相邻边框, 竖排合并上下相邻边框.",
    "ButtonGroupText.asChild": "把样式交给唯一的子元素渲染 (例如一个 label).",
    "ButtonGroupSeparator.orientation": "分隔线方向, 默认竖线; 竖排的组里传 horizontal.",
    "ButtonGroupSeparator.decorative": "纯装饰时读屏器跳过, 不读成分隔符.",
    "ButtonGroupSeparator.asChild": "把分隔线交给唯一的子元素渲染.",
  },
  propsNote: "其余属性透传给根 <div role=\"group\">; 请用 aria-label 说明这组按钮做什么.",
  height: 300,
  render: (props) => <ButtonGroupDemo {...props} />,
  usage,
  examples: [
    {
      id: "url",
      title: "输入框加前后缀",
      desc: "组里也能放 Input: 输入框撑满剩余宽度, 前缀文字与按钮贴着它的边.",
      code: `<ButtonGroup aria-label="仓库地址">\n  <ButtonGroupText>https://</ButtonGroupText>\n  <Input aria-label="仓库地址" defaultValue="github.com/hx-ui/hx-ui" />\n  <Button variant="outline">复制</Button>\n</ButtonGroup>`,
      render: () => (
        <ButtonGroup aria-label="仓库地址" className="w-full max-w-md">
          <ButtonGroupText>https://</ButtonGroupText>
          <Input aria-label="仓库地址" defaultValue="github.com/hx-ui/hx-ui" />
          <Button variant="outline">复制</Button>
        </ButtonGroup>
      ),
    },
    {
      id: "nested",
      title: "嵌套的组",
      desc: "ButtonGroup 里再放 ButtonGroup 时, 组与组之间自动留出间距.",
      code: `<ButtonGroup aria-label="编辑器">\n  <ButtonGroup aria-label="历史">\n    <Button variant="outline">撤销</Button>\n    <Button variant="outline">重做</Button>\n  </ButtonGroup>\n  <ButtonGroup aria-label="保存">\n    <Button variant="outline">存草稿</Button>\n    <Button variant="primary">发布</Button>\n  </ButtonGroup>\n</ButtonGroup>`,
      render: () => (
        <ButtonGroup aria-label="编辑器">
          <ButtonGroup aria-label="历史">
            <Button variant="outline">撤销</Button>
            <Button variant="outline">重做</Button>
          </ButtonGroup>
          <ButtonGroup aria-label="保存">
            <Button variant="outline">存草稿</Button>
            <Button variant="primary">发布</Button>
          </ButtonGroup>
        </ButtonGroup>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "按顺序聚焦组里的每个按钮; 组本身不占 Tab 位." },
    { keys: ["Enter"], action: "触发当前按钮." },
    { keys: ["Space"], action: "触发当前按钮." },
  ],
};
