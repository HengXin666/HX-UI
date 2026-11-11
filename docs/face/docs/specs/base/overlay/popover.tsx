import { Button, Input, Popover, PopoverArrow, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@hx/ui";
import popoverRaw from "../../../../../../src/primitives/popover.tsx?raw";
import { range, select, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 弹出层. 点触发器打开一块常驻面板, 点外面或 Esc 关闭; 主演示是分享文档链接.
 */

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";
const LINK = "docs.hx-ui.dev/s/q3-roadmap";

function PopoverDemo(props: Record<string, unknown>) {
  const { side, align, sideOffset, arrow } = props as { side: Side; align: Align; sideOffset: number; arrow: boolean };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">分享</Button>
      </PopoverTrigger>
      <PopoverContent side={side} align={align} sideOffset={sideOffset}>
        <PopoverHeader>
          <PopoverTitle>分享 "第三季度路线图"</PopoverTitle>
          <PopoverDescription>拿到链接的组织成员可以查看与评论.</PopoverDescription>
        </PopoverHeader>
        <div className="flex gap-2">
          <Input aria-label="分享链接" readOnly defaultValue={LINK} className="h-7" />
          <Button size="sm" variant="primary">
            复制
          </Button>
        </div>
        {arrow ? <PopoverArrow /> : null}
      </PopoverContent>
    </Popover>
  );
}

function usage(values: Values): string {
  const attrs = [values.side === "bottom" ? "" : ` side="${values.side}"`, values.align === "center" ? "" : ` align="${values.align}"`, values.sideOffset === 4 ? "" : ` sideOffset={${values.sideOffset}}`].join("");
  const arrow = values.arrow ? "\n    <PopoverArrow />" : "";
  const body = `<Popover>\n  <PopoverTrigger asChild>\n    <Button variant="outline">分享</Button>\n  </PopoverTrigger>\n  <PopoverContent${attrs}>\n    <PopoverHeader>\n      <PopoverTitle>分享 "第三季度路线图"</PopoverTitle>\n      <PopoverDescription>拿到链接的组织成员可以查看与评论.</PopoverDescription>\n    </PopoverHeader>\n    <div className="flex gap-2">\n      <Input aria-label="分享链接" readOnly defaultValue="${LINK}" />\n      <Button size="sm" variant="primary">复制</Button>\n    </div>${arrow}\n  </PopoverContent>\n</Popover>`;
  return demo(["Button", "Input", "Popover", ...(values.arrow ? ["PopoverArrow"] : []), "PopoverContent", "PopoverDescription", "PopoverHeader", "PopoverTitle", "PopoverTrigger"], body);
}

export const POPOVER: PageSpec = {
  id: "popover",
  kind: "composite",
  importName: "Popover",
  parts: ["PopoverContent"],
  source: "src/primitives/popover.tsx",
  raw: popoverRaw,
  deps: ["radix-ui"],
  controls: [
    select("side", "方位", ["bottom", "top", "left", "right"], "bottom", "", "PopoverContent 的 side: 优先出现在触发器的哪一侧, 空间不够时自动翻到对侧."),
    select("align", "对齐", ["center", "start", "end"], "center", "", "PopoverContent 的 align: 沿触发器边的对齐方式."),
    range("sideOffset", "间距", [0, 24, 2], 4, "PopoverContent 的 sideOffset: 与触发器的距离 (px)."),
    toggle("arrow", "箭头", false, "不是属性: 在内容里放一个 PopoverArrow, 指向触发器."),
  ],
  propDesc: {
    children: "触发器与内容.",
    open: "受控的打开状态, 与 onOpenChange 成对使用.",
    defaultOpen: "非受控的初始打开状态.",
    onOpenChange: "打开状态变化时回调.",
    modal: "true 时锁住外部交互并困住焦点; 默认 false, 外部仍可点.",
    "PopoverContent.side": "优先出现的方位, 默认 bottom.",
    "PopoverContent.sideOffset": "与触发器的距离 (px).",
    "PopoverContent.align": "沿触发器边的对齐.",
    "PopoverContent.alignOffset": "对齐方向上的偏移 (px).",
    "PopoverContent.avoidCollisions": "碰到视口边缘时翻转或平移 (默认开).",
    "PopoverContent.collisionPadding": "与视口边缘至少留出的距离.",
    "PopoverContent.collisionBoundary": "碰撞检测的边界元素, 默认视口.",
    "PopoverContent.arrowPadding": "箭头与内容圆角之间至少留出的距离.",
    "PopoverContent.sticky": "滚动时贴住触发器的方式: partial 或 always.",
    "PopoverContent.hideWhenDetached": "触发器被裁出可视区时隐藏内容.",
    "PopoverContent.updatePositionStrategy": "always 时每帧都重算位置.",
    "PopoverContent.deferPointerDownOutside": "点外部关闭推迟到 pointerup.",
    "PopoverContent.onEscapeKeyDown": "按 Esc 时回调, preventDefault 可阻止关闭.",
    "PopoverContent.onPointerDownOutside": "在内容外按下指针时回调, preventDefault 可阻止关闭.",
    "PopoverContent.onFocusOutside": "焦点移到内容外时回调.",
    "PopoverContent.onInteractOutside": "内容外的任何交互时回调.",
    "PopoverContent.onOpenAutoFocus": "打开时的自动聚焦回调.",
    "PopoverContent.onCloseAutoFocus": "关闭后焦点回到触发器之前回调.",
    "PopoverContent.forceMount": "始终挂载, 由外部动画库控制进出场.",
    "PopoverContent.asChild": "把内容交给唯一的子元素渲染.",
  },
  propsNote: "PopoverHeader / PopoverTitle / PopoverDescription 只有原生属性; PopoverArrow 只有 asChild. 只想看一眼的补充信息用 HoverCard, 一句说明用 Tooltip.",
  render: (props) => <PopoverDemo {...props} />,
  usage,
  examples: [
    {
      id: "top",
      title: "上方, 带箭头",
      code: `<PopoverContent side="top" sideOffset={8}>\n  …\n  <PopoverArrow />\n</PopoverContent>`,
      render: () => <PopoverDemo side="top" align="center" sideOffset={8} arrow />,
    },
  ],
  keyboard: [
    { keys: ["Enter"], action: "在触发器上打开或关闭; Space 同样." },
    { keys: ["Tab"], action: "在内容里按顺序聚焦, 离开内容后面板仍开着 (非模态)." },
    { keys: ["Esc"], action: "关闭, 焦点回到触发器." },
  ],
};
