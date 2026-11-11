import { Button, Input, Label, Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@hx/ui";
import sheetRaw from "../../../../../../src/primitives/sheet.tsx?raw";
import { select, text, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 侧滑面板. 桌面端从四边滑入, 有焦点陷阱与 Esc 关闭; 主演示是编辑个人资料.
 */

type Side = "right" | "left" | "top" | "bottom";
const FIELDS = [
  { id: "sheet-name", label: "昵称", value: "林悦" },
  { id: "sheet-handle", label: "用户名", value: "@linyue" },
];

function SheetDemo(props: Record<string, unknown>) {
  const { side, title, showCloseButton, footer } = props as { side: Side; title: string; showCloseButton: boolean; footer: boolean };
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">编辑资料</Button>
      </SheetTrigger>
      <SheetContent side={side} showCloseButton={showCloseButton}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>改动保存后, 团队成员刷新页面即可看到.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4">
          {FIELDS.map((field) => (
            <div key={field.id} className="grid gap-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input id={field.id} defaultValue={field.value} />
            </div>
          ))}
        </div>
        {footer ? (
          <SheetFooter>
            <Button variant="primary">保存</Button>
            <SheetClose asChild>
              <Button variant="outline">取消</Button>
            </SheetClose>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function usage(values: Values): string {
  const content = ["<SheetContent", values.side === "right" ? "" : ` side="${values.side}"`, values.showCloseButton ? "" : " showCloseButton={false}", ">"].join("");
  const fields = FIELDS.map((field) => `      <Label htmlFor="${field.id}">${field.label}</Label>\n      <Input id="${field.id}" defaultValue="${field.value}" />`).join("\n");
  const footer = values.footer ? `\n    <SheetFooter>\n      <Button variant="primary">保存</Button>\n      <SheetClose asChild>\n        <Button variant="outline">取消</Button>\n      </SheetClose>\n    </SheetFooter>` : "";
  const body = `<Sheet>\n  <SheetTrigger asChild>\n    <Button variant="outline">编辑资料</Button>\n  </SheetTrigger>\n  ${content}\n    <SheetHeader>\n      <SheetTitle>${String(values.title)}</SheetTitle>\n      <SheetDescription>改动保存后, 团队成员刷新页面即可看到.</SheetDescription>\n    </SheetHeader>\n    <div className="grid gap-4 px-4">\n${fields}\n    </div>${footer}\n  </SheetContent>\n</Sheet>`;
  return demo(["Button", "Input", "Label", "Sheet", ...(values.footer ? ["SheetClose"] : []), "SheetContent", "SheetDescription", ...(values.footer ? ["SheetFooter"] : []), "SheetHeader", "SheetTitle", "SheetTrigger"], body);
}

export const SHEET: PageSpec = {
  id: "sheet",
  kind: "composite",
  importName: "Sheet",
  parts: ["SheetContent"],
  source: "src/primitives/sheet.tsx",
  raw: sheetRaw,
  deps: ["radix-ui", "lucide-react"],
  controls: [
    select("side", "方向", ["right", "left", "top", "bottom"], "right", "", "SheetContent 的 side: 从哪一边滑入. 进场 ease-out, 退场 ease-in 且更快."),
    text("title", "标题", "编辑个人资料", "SheetTitle 的内容, 也是可访问名称."),
    toggle("showCloseButton", "右上角关闭键", true, "SheetContent 是否带右上角的关闭键."),
    toggle("footer", "页脚按钮", true, "不是属性: 加一行 SheetFooter, 放保存与 SheetClose."),
  ],
  propDesc: {
    children: "触发器与内容.",
    open: "受控的打开状态, 与 onOpenChange 成对使用.",
    defaultOpen: "非受控的初始打开状态.",
    onOpenChange: "打开状态变化时回调 (Esc, 点遮罩, 关闭键都会触发).",
    modal: "模态时锁住页面滚动与外部交互. 默认 true.",
    "SheetContent.side": "从哪一边滑入, 默认 right.",
    "SheetContent.showCloseButton": "是否带右上角的关闭键.",
    "SheetContent.overlayClassName": "遮罩层的类名.",
    "SheetContent.forceMount": "始终挂载, 由外部动画库控制进出场.",
    "SheetContent.asChild": "把内容交给唯一的子元素渲染.",
    "SheetContent.deferPointerDownOutside": "点外部关闭推迟到 pointerup, 拖动起点在面板内时不误关.",
    "SheetContent.onEscapeKeyDown": "按 Esc 时回调, preventDefault 可阻止关闭.",
    "SheetContent.onPointerDownOutside": "在面板外按下指针时回调, preventDefault 可阻止关闭.",
    "SheetContent.onFocusOutside": "焦点移到面板外时回调.",
    "SheetContent.onInteractOutside": "面板外的任何交互 (指针或焦点) 时回调.",
    "SheetContent.onOpenAutoFocus": "打开时的自动聚焦回调.",
    "SheetContent.onCloseAutoFocus": "关闭后焦点回到触发器之前回调, preventDefault 可改去别处.",
  },
  propsNote: "面板高度不超过视口, 超长内容在面板内纵向滚动, 底部操作始终可达. 可拖拽的移动端面板用 Drawer.",
  render: (props) => <SheetDemo {...props} />,
  usage,
  examples: [
    {
      id: "left",
      title: "从左侧滑入",
      desc: "导航抽屉常用左侧; 本站窄屏时的目录就是一个左侧 Sheet.",
      code: `<SheetContent side="left">…</SheetContent>`,
      render: () => <SheetDemo side="left" title="编辑个人资料" showCloseButton footer={false} />,
    },
  ],
  keyboard: [
    { keys: ["Enter"], action: "在触发器上打开面板." },
    { keys: ["Tab"], action: "在面板内循环聚焦, 不会跑到页面上." },
    { keys: ["Shift", "Tab"], action: "反向循环聚焦." },
    { keys: ["Esc"], action: "关闭面板, 焦点回到触发器." },
  ],
};
