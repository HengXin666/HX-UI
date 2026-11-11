import { useState } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@hx/ui";
import dropdownRaw from "../../../../../../src/primitives/dropdown-menu.tsx?raw";
import { select, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 下拉菜单. 主演示是文件列表一行的 "更多" 菜单: 动作, 子菜单, 单选排序.
 */

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";
const SORTS = [
  { value: "name", label: "按名称" },
  { value: "modified", label: "按修改时间" },
];

function DropdownDemo(props: Record<string, unknown>) {
  const { side, align, label, sub, sort, disabled } = props as { side: Side; align: Align; label: boolean; sub: boolean; sort: boolean; disabled: boolean };
  const [order, setOrder] = useState("modified");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">更多操作</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className="w-52">
        {label ? <DropdownMenuLabel>季度汇报.key</DropdownMenuLabel> : null}
        <DropdownMenuItem>重命名</DropdownMenuItem>
        <DropdownMenuItem>创建副本</DropdownMenuItem>
        {sub ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>移动到</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>设计组</DropdownMenuItem>
              <DropdownMenuItem>市场部</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : null}
        <DropdownMenuItem disabled={disabled}>发布到官网</DropdownMenuItem>
        {sort ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={order} onValueChange={setOrder}>
              {SORTS.map((item) => (
                <DropdownMenuRadioItem key={item.value} value={item.value}>
                  {item.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">移到回收站</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function usage(values: Values): string {
  const attrs = [values.side === "bottom" ? "" : ` side="${values.side}"`, values.align === "center" ? "" : ` align="${values.align}"`].join("");
  const lines = [
    ...(values.label ? ["<DropdownMenuLabel>季度汇报.key</DropdownMenuLabel>"] : []),
    "<DropdownMenuItem>重命名</DropdownMenuItem>",
    "<DropdownMenuItem>创建副本</DropdownMenuItem>",
    ...(values.sub ? ["<DropdownMenuSub>", "  <DropdownMenuSubTrigger>移动到</DropdownMenuSubTrigger>", "  <DropdownMenuSubContent>", "    <DropdownMenuItem>设计组</DropdownMenuItem>", "    <DropdownMenuItem>市场部</DropdownMenuItem>", "  </DropdownMenuSubContent>", "</DropdownMenuSub>"] : []),
    `<DropdownMenuItem${values.disabled ? " disabled" : ""}>发布到官网</DropdownMenuItem>`,
    ...(values.sort ? ["<DropdownMenuSeparator />", "<DropdownMenuRadioGroup value={order} onValueChange={setOrder}>", ...SORTS.map((item) => `  <DropdownMenuRadioItem value="${item.value}">${item.label}</DropdownMenuRadioItem>`), "</DropdownMenuRadioGroup>"] : []),
    "<DropdownMenuSeparator />",
    '<DropdownMenuItem className="text-destructive">移到回收站</DropdownMenuItem>',
  ];
  const body = `<DropdownMenu>\n  <DropdownMenuTrigger asChild>\n    <Button variant="outline">更多操作</Button>\n  </DropdownMenuTrigger>\n  <DropdownMenuContent${attrs} className="w-52">\n${lines.map((line) => "    " + line).join("\n")}\n  </DropdownMenuContent>\n</DropdownMenu>`;
  const names = ["Button", "DropdownMenu", "DropdownMenuContent", "DropdownMenuItem", ...(values.label ? ["DropdownMenuLabel"] : []), ...(values.sort ? ["DropdownMenuRadioGroup", "DropdownMenuRadioItem"] : []), "DropdownMenuSeparator", ...(values.sub ? ["DropdownMenuSub", "DropdownMenuSubContent", "DropdownMenuSubTrigger"] : []), "DropdownMenuTrigger"];
  const code = demo(names, body);
  return values.sort ? code.replace('";\n\nexport function Demo() {\n', '";\nimport { useState } from "react";\n\nexport function Demo() {\n  const [order, setOrder] = useState("modified");\n') : code;
}

export const DROPDOWN_MENU: PageSpec = {
  id: "dropdown-menu",
  kind: "composite",
  importName: "DropdownMenu",
  parts: ["DropdownMenuContent", "DropdownMenuItem", "DropdownMenuRadioItem"],
  source: "src/primitives/dropdown-menu.tsx",
  raw: dropdownRaw,
  deps: ["radix-ui"],
  controls: [
    select("side", "方位", ["bottom", "top", "left", "right"], "bottom", "", "DropdownMenuContent 的 side, 空间不够时自动翻到对侧."),
    select("align", "对齐", ["center", "start", "end"], "center", "", "DropdownMenuContent 的 align."),
    toggle("label", "标题", true, "不是属性: 顶部放一行 DropdownMenuLabel, 说明正在操作谁."),
    toggle("sub", "子菜单", true, "不是属性: 放一组 DropdownMenuSub / SubTrigger / SubContent."),
    toggle("sort", "单选组", true, "不是属性: 放一组 DropdownMenuRadioGroup, 选中项带圆点."),
    toggle("disabled", "禁用一项", false, "DropdownMenuItem 的 disabled: 变淡, 方向键跳过."),
  ],
  propDesc: {
    children: "触发器与内容.",
    dir: "阅读方向, 影响子菜单的展开方向与左右方向键.",
    open: "受控的打开状态, 与 onOpenChange 成对使用.",
    defaultOpen: "非受控的初始打开状态.",
    onOpenChange: "打开状态变化时回调.",
    modal: "true (默认) 时打开期间页面其余部分不可交互.",
    "DropdownMenuContent.side": "优先出现的方位, 默认 bottom.",
    "DropdownMenuContent.sideOffset": "与触发器的距离 (px).",
    "DropdownMenuContent.align": "沿触发器边的对齐.",
    "DropdownMenuContent.alignOffset": "对齐方向上的偏移 (px).",
    "DropdownMenuContent.loop": "方向键到头后回到另一端.",
    "DropdownMenuContent.avoidCollisions": "碰到视口边缘时翻转或平移 (默认开).",
    "DropdownMenuContent.collisionPadding": "与视口边缘至少留出的距离.",
    "DropdownMenuContent.collisionBoundary": "碰撞检测的边界元素, 默认视口.",
    "DropdownMenuContent.arrowPadding": "箭头与面板圆角之间至少留出的距离.",
    "DropdownMenuContent.sticky": "滚动时贴住触发器的方式.",
    "DropdownMenuContent.hideWhenDetached": "触发器被裁出可视区时隐藏.",
    "DropdownMenuContent.updatePositionStrategy": "always 时每帧都重算位置.",
    "DropdownMenuContent.onEscapeKeyDown": "按 Esc 时回调, preventDefault 可阻止关闭.",
    "DropdownMenuContent.onPointerDownOutside": "在菜单外按下指针时回调.",
    "DropdownMenuContent.onFocusOutside": "焦点移到菜单外时回调.",
    "DropdownMenuContent.onInteractOutside": "菜单外的任何交互时回调.",
    "DropdownMenuContent.onCloseAutoFocus": "关闭后焦点回到触发器之前回调.",
    "DropdownMenuContent.forceMount": "始终挂载.",
    "DropdownMenuContent.asChild": "把菜单交给唯一的子元素渲染.",
    "DropdownMenuItem.disabled": "禁用这一项, 方向键跳过.",
    "DropdownMenuItem.onSelect": "选中这一项时回调 (点击或 Enter); preventDefault 可让菜单不关.",
    "DropdownMenuItem.textValue": "键入字母跳转时匹配的文字, 默认取内容文本.",
    "DropdownMenuItem.asChild": "把菜单项交给唯一的子元素渲染 (例如链接).",
    "DropdownMenuRadioItem.value": "这一项的值. 必填.",
    "DropdownMenuRadioItem.disabled": "禁用这一项.",
    "DropdownMenuRadioItem.onSelect": "选中这一项时回调.",
    "DropdownMenuRadioItem.textValue": "键入字母跳转时匹配的文字.",
    "DropdownMenuRadioItem.asChild": "把菜单项交给唯一的子元素渲染.",
  },
  propsNote: "DropdownMenuRadioGroup 有 value / onValueChange; DropdownMenuSub 有 open / defaultOpen / onOpenChange; SubTrigger 不开放 asChild (固定渲染文字与箭头).",
  render: (props) => <DropdownDemo {...props} />,
  usage,
  examples: [
    {
      id: "plain",
      title: "只有一列动作",
      desc: "最简形态: 触发器加几个菜单项与一条分隔线.",
      code: `<DropdownMenuContent align="end">\n  <DropdownMenuItem>重命名</DropdownMenuItem>\n  <DropdownMenuItem>创建副本</DropdownMenuItem>\n  <DropdownMenuSeparator />\n  <DropdownMenuItem>移到回收站</DropdownMenuItem>\n</DropdownMenuContent>`,
      render: () => <DropdownDemo side="bottom" align="end" label={false} sub={false} sort={false} disabled={false} />,
    },
  ],
  keyboard: [
    { keys: ["Enter"], action: "在触发器上打开菜单, 焦点落在第一项; Space 与 ↓ 同样." },
    { keys: ["↑", "↓"], action: "在菜单项之间移动, 跳过禁用项." },
    { keys: ["→"], action: "在子菜单触发项上展开子菜单; ← 收起." },
    { keys: ["Enter"], action: "选中当前项并关闭菜单." },
    { keys: ["Esc"], action: "关闭菜单, 焦点回到触发器." },
    { keys: ["A-Z"], action: "跳到以该字母开头的项." },
  ],
};
