import { useState } from "react";
import { Button, ConfirmDialog, confirmDialog, toast } from "@hx/ui";
import confirmRaw from "../../../../../../src/primitives/confirm-dialog.tsx?raw";
import { select, text, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 确认对话框. 声明式 <ConfirmDialog open> 与命令式 await confirmDialog() 两种用法;
 * 主演示是清空回收站, 打开 requireText 后要输入确认词才能点确认.
 */

const WORD = "回收站";

function ConfirmDemo(props: Record<string, unknown>) {
  const { title, variant, requireText, dismissible, hint } = props as { title: string; variant: "default" | "danger"; requireText: boolean; dismissible: boolean; hint: boolean };
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        清空回收站
      </Button>
      <ConfirmDialog
        open={open}
        title={title}
        message="回收站里的 128 个文件会被永久删除."
        confirmLabel="清空"
        variant={variant}
        requireText={requireText ? WORD : undefined}
        hint={hint ? "删除后 30 天内仍可联系管理员从备份恢复." : undefined}
        dismissible={dismissible}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

function usage(values: Values): string {
  const attrs = [
    "open={open}",
    `title="${String(values.title)}"`,
    'message="回收站里的 128 个文件会被永久删除."',
    'confirmLabel="清空"',
    values.variant === "danger" ? 'variant="danger"' : "",
    values.requireText ? `requireText="${WORD}"` : "",
    values.hint ? 'hint="删除后 30 天内仍可联系管理员从备份恢复."' : "",
    values.dismissible ? "" : "dismissible={false}",
    "onConfirm={() => { clearTrash(); setOpen(false); }}",
    "onCancel={() => setOpen(false)}",
  ].filter(Boolean);
  const body = `<>\n  <Button variant="outline" onClick={() => setOpen(true)}>清空回收站</Button>\n  <ConfirmDialog\n    ${attrs.join("\n    ")}\n  />\n</>`;
  return demo(["Button", "ConfirmDialog"], body, '\nimport { useState } from "react";').replace("export function Demo() {\n", "export function Demo() {\n  const [open, setOpen] = useState(false);\n");
}

async function archiveAll(): Promise<void> {
  const ok = await confirmDialog({ title: "归档全部已读邮件?", message: "归档后仍可在 \"归档\" 里找到.", confirmLabel: "归档" });
  if (ok) toast.success("已归档 36 封邮件");
  else toast.info("已取消");
}

export const CONFIRM_DIALOG: PageSpec = {
  id: "confirm-dialog",
  kind: "single",
  importName: "ConfirmDialog",
  source: "src/primitives/confirm-dialog.tsx",
  raw: confirmRaw,
  deps: ["radix-ui"],
  controls: [
    text("title", "标题", "清空回收站?", "对话框标题, 也是可访问名称."),
    select("variant", "语义", ["default", "danger"], "danger", "", "danger 时标题转危险色并带警示图标, 确认键是 destructive."),
    toggle("requireText", "确认词", true, "requireText: 要求输入这段文字才能确认, 用于真正不可逆的操作."),
    toggle("hint", "附加提示", false, "hint: 按钮上方的一行补充说明."),
    toggle("dismissible", "可直接关闭", true, "关掉后没有右上角关闭键, Esc 与点遮罩也不关, 必须二选一."),
  ],
  propDesc: {
    open: "是否打开. 必填, 由调用方的状态控制.",
    onConfirm: "点确认时回调. 必填.",
    onCancel: "点取消, 关闭键, Esc 或遮罩时回调. 必填.",
    title: "标题. 必填.",
    message: "正文说明.",
    confirmLabel: "确认键文字, 默认 \"确定\".",
    cancelLabel: "取消键文字, 默认 \"取消\".",
  },
  propsNote: "命令式用法 await confirmDialog({ title, ... }) 返回 Promise<boolean>, 选项与这里的属性同名; 要求应用根部挂一次 <ConfirmDialogHost />.",
  render: (props) => <ConfirmDemo {...props} />,
  usage,
  examples: [
    {
      id: "imperative",
      title: "命令式: 在事件回调里一行拿到答案",
      desc: "适合 async 分支中间; 本站根部已挂 ConfirmDialogHost, 点下面的按钮即可.",
      code: `const ok = await confirmDialog({\n  title: "归档全部已读邮件?",\n  message: "归档后仍可在 \\"归档\\" 里找到.",\n  confirmLabel: "归档",\n});\nif (ok) archive();`,
      render: () => (
        <Button variant="outline" onClick={() => void archiveAll()}>
          归档全部已读
        </Button>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "在确认词输入框, 取消与确认之间循环." },
    { keys: ["Esc"], action: "等同取消; dismissible={false} 时无效." },
    { keys: ["Enter"], action: "在按钮上触发它; 确认词没输对时确认键是禁用的." },
  ],
};
