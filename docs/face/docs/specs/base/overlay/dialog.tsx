import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@hx/ui";
import dialogRaw from "../../../../../../src/primitives/dialog.tsx?raw";
import { text, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 样板批的复合组件页之一: Dialog.
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */

// ── Dialog ──────────────────────────────────────────────────────────
function DialogDemo(props: Record<string, unknown>) {
  const { title, description, showCloseButton, footer, modal } = props as Record<string, string & boolean>;
  return (
    <Dialog modal={modal}>
      <DialogTrigger asChild>
        <Button variant="outline">打开对话框</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {footer ? (
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button variant="destructive">删除</Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function dialogUsage(values: Values): string {
  const footer = values.footer
    ? `\n    <DialogFooter>\n      <DialogClose asChild>\n        <Button variant="outline">取消</Button>\n      </DialogClose>\n      <Button variant="destructive">删除</Button>\n    </DialogFooter>`
    : "";
  const root = values.modal ? "<Dialog>" : "<Dialog modal={false}>";
  const content = values.showCloseButton ? "<DialogContent>" : "<DialogContent showCloseButton={false}>";
  const body = `${root}\n  <DialogTrigger asChild>\n    <Button variant="outline">打开对话框</Button>\n  </DialogTrigger>\n  ${content}\n    <DialogHeader>\n      <DialogTitle>${String(values.title)}</DialogTitle>\n      <DialogDescription>${String(values.description)}</DialogDescription>\n    </DialogHeader>${footer}\n  </DialogContent>\n</Dialog>`;
  const parts = ["Button", "Dialog", ...(values.footer ? ["DialogClose"] : []), "DialogContent", "DialogDescription", ...(values.footer ? ["DialogFooter"] : []), "DialogHeader", "DialogTitle", "DialogTrigger"];
  return demo(parts, body);
}

export const DIALOG: PageSpec = {
  id: "dialog",
  kind: "composite",
  importName: "Dialog",
  parts: ["DialogContent", "DialogFooter"],
  source: "src/primitives/dialog.tsx",
  raw: dialogRaw,
  deps: ["radix-ui", "lucide-react"],
  controls: [
    text("title", "标题", "删除这个会话?", "DialogTitle 的内容, 也是对话框的可访问名称."),
    text("description", "说明", "删除后无法恢复, 会话里的附件一并移除.", "DialogDescription 的内容, 读屏器在标题后读出."),
    toggle("showCloseButton", "右上角关闭键", true, "DialogContent 是否带右上角的关闭键."),
    toggle("footer", "页脚按钮", true, "加一行 DialogFooter: 取消 (DialogClose) 与主操作."),
    toggle("modal", "模态", true, "模态时锁住页面滚动与外部交互."),
  ],
  propDesc: {
    children: "触发器与内容.",
    open: "受控的打开状态, 与 onOpenChange 成对使用.",
    defaultOpen: "非受控的初始打开状态.",
    onOpenChange: "打开状态变化时回调 (Esc, 点遮罩, 关闭键都会触发).",
    modal: "模态时锁住页面滚动与外部交互. 默认 true.",
    forceMount: "始终挂载, 由外部动画库控制进出场.",
    asChild: "把内容交给唯一的子元素渲染.",
    deferPointerDownOutside: "点外部关闭推迟到 pointerup, 拖动起点在面板内时不误关.",
    onEscapeKeyDown: "按 Esc 时回调, preventDefault 可阻止关闭.",
    onPointerDownOutside: "在面板外按下指针时回调, preventDefault 可阻止关闭.",
    onFocusOutside: "焦点移到面板外时回调.",
    onInteractOutside: "面板外的任何交互 (指针或焦点) 时回调.",
    onOpenAutoFocus: "打开时的自动聚焦; 本库已默认阻止, 焦点留在面板上, 不会弹出输入法.",
    onCloseAutoFocus: "关闭后焦点回到触发器之前回调, preventDefault 可改去别处.",
    overlayClassName: "遮罩层的类名.",
    showCloseButton: "是否自动补一个关闭按钮.",
  },
  hideProps: ["onOpenAutoFocus"],
  propsNote: "面板固定 max-w-[min(24rem,calc(100%-2rem))], 想更宽就在 DialogContent 上覆盖这个值, 不要叠 max-w-lg.",
  toProps: (values) => ({ ...values }),
  render: (props) => <DialogDemo {...props} />,
  usage: dialogUsage,
  examples: [
    {
      id: "basic",
      title: "只有说明",
      desc: "最小形态: 触发器, 标题, 说明. 关闭键默认就在.",
      code: `<Dialog>\n  <DialogTrigger asChild>\n    <Button variant="outline">打开说明</Button>\n  </DialogTrigger>\n  <DialogContent>\n    <DialogHeader>\n      <DialogTitle>关于本地模型</DialogTitle>\n      <DialogDescription>模型权重从本地目录加载, 不经过网络.</DialogDescription>\n    </DialogHeader>\n  </DialogContent>\n</Dialog>`,
      render: () => <DialogDemo title="关于本地模型" description="模型权重从本地目录加载, 不经过网络." showCloseButton footer={false} modal />,
    },
  ],
  keyboard: [
    { keys: ["Enter"], action: "在触发器上打开对话框." },
    { keys: ["Esc"], action: "关闭对话框, 焦点回到触发器." },
    { keys: ["Tab"], action: "在面板内循环聚焦, 不会跑到页面上." },
    { keys: ["Shift", "Tab"], action: "反向循环聚焦." },
  ],
};
