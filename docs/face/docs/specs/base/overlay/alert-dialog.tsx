import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@hx/ui";
import alertRaw from "../../../../../../src/primitives/alert-dialog.tsx?raw";
import { select, text, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 警示对话框. 点遮罩不关, 必须在取消与确认里二选一; 主演示是删除项目.
 */

const WARN = "icon-[solar--danger-triangle-linear] size-5 bg-current";

function AlertDemo(props: Record<string, unknown>) {
  const { title, description, size, media, destructive } = props as { title: string; description: string; size: "default" | "sm"; media: boolean; destructive: boolean };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">删除项目</Button>
      </AlertDialogTrigger>
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          {media ? (
            <AlertDialogMedia className="text-destructive">
              <span aria-hidden className={WARN} />
            </AlertDialogMedia>
          ) : null}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? "destructive" : "primary"}>删除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function usage(values: Values): string {
  const media = values.media ? `\n      <AlertDialogMedia className="text-destructive">\n        <span aria-hidden className="icon-[solar--danger-triangle-linear] size-5" />\n      </AlertDialogMedia>` : "";
  const content = values.size === "sm" ? `<AlertDialogContent size="sm">` : "<AlertDialogContent>";
  const action = values.destructive ? `<AlertDialogAction variant="destructive">删除</AlertDialogAction>` : "<AlertDialogAction>删除</AlertDialogAction>";
  const body = `<AlertDialog>\n  <AlertDialogTrigger asChild>\n    <Button variant="outline">删除项目</Button>\n  </AlertDialogTrigger>\n  ${content}\n    <AlertDialogHeader>${media}\n      <AlertDialogTitle>${String(values.title)}</AlertDialogTitle>\n      <AlertDialogDescription>${String(values.description)}</AlertDialogDescription>\n    </AlertDialogHeader>\n    <AlertDialogFooter>\n      <AlertDialogCancel>取消</AlertDialogCancel>\n      ${action}\n    </AlertDialogFooter>\n  </AlertDialogContent>\n</AlertDialog>`;
  const names = ["AlertDialog", "AlertDialogAction", "AlertDialogCancel", "AlertDialogContent", "AlertDialogDescription", "AlertDialogFooter", "AlertDialogHeader", ...(values.media ? ["AlertDialogMedia"] : []), "AlertDialogTitle", "AlertDialogTrigger", "Button"];
  return demo(names, body);
}

export const ALERT_DIALOG: PageSpec = {
  id: "alert-dialog",
  kind: "composite",
  importName: "AlertDialog",
  parts: ["AlertDialogContent", "AlertDialogAction", "AlertDialogCancel"],
  source: "src/primitives/alert-dialog.tsx",
  raw: alertRaw,
  deps: ["radix-ui"],
  controls: [
    text("title", "标题", "删除 \"官网改版\" 项目?", "AlertDialogTitle 的内容, 也是对话框的可访问名称."),
    text("description", "说明", "项目里的 42 个页面与评论会一并删除, 无法恢复.", "AlertDialogDescription 的内容, 读屏器在标题后读出."),
    select("size", "尺寸", ["default", "sm"], "default", "", "AlertDialogContent 的 size: sm 更窄, 两个按钮并排各占一半."),
    toggle("media", "图标位", true, "不是属性: 标题前放一个 AlertDialogMedia (警示三角), 颜色由调用方用语义类给."),
    toggle("destructive", "危险确认", true, "AlertDialogAction 的 variant: destructive 用于不可撤销的操作, 默认 primary."),
  ],
  propDesc: {
    children: "触发器与内容.",
    open: "受控的打开状态, 与 onOpenChange 成对使用.",
    defaultOpen: "非受控的初始打开状态.",
    onOpenChange: "打开状态变化时回调 (取消, 确认, Esc 都会触发; 点遮罩不触发).",
    "AlertDialogContent.size": "default 或 sm; sm 时页脚两个按钮并排各占一半.",
    "AlertDialogContent.asChild": "把内容交给唯一的子元素渲染.",
    "AlertDialogContent.deferPointerDownOutside": "点外部的处理推迟到 pointerup.",
    "AlertDialogContent.onEscapeKeyDown": "按 Esc 时回调, preventDefault 可阻止关闭.",
    "AlertDialogContent.onFocusOutside": "焦点移到面板外时回调.",
    "AlertDialogContent.onOpenAutoFocus": "打开时的自动聚焦回调.",
    "AlertDialogContent.onCloseAutoFocus": "关闭后焦点回到触发器之前回调, preventDefault 可改去别处.",
    "AlertDialogContent.forceMount": "始终挂载, 由外部动画库控制进出场.",
    "AlertDialogAction.variant": "确认按钮的 Button 变体, 默认 primary; 危险操作传 destructive.",
    "AlertDialogAction.size": "确认按钮的 Button 尺寸.",
    "AlertDialogAction.asChild": "把按钮交给唯一的子元素渲染.",
    "AlertDialogCancel.variant": "取消按钮的 Button 变体, 默认 outline.",
    "AlertDialogCancel.size": "取消按钮的 Button 尺寸.",
    "AlertDialogCancel.asChild": "把按钮交给唯一的子元素渲染.",
  },
  propsNote: "只要问一句拿到 true / false 时用 ConfirmDialog 或命令式 confirmDialog(); 需要自定义内容时用这一组.",
  render: (props) => <AlertDemo {...props} />,
  usage,
  examples: [
    {
      id: "small",
      title: "小尺寸, 非危险",
      desc: "退出登录这类可以恢复的操作, 确认键用默认的 primary.",
      code: `<AlertDialogContent size="sm">\n  <AlertDialogHeader>\n    <AlertDialogTitle>退出登录?</AlertDialogTitle>\n    <AlertDialogDescription>未同步的草稿会保留在这台设备上.</AlertDialogDescription>\n  </AlertDialogHeader>\n  <AlertDialogFooter>\n    <AlertDialogCancel>取消</AlertDialogCancel>\n    <AlertDialogAction>退出</AlertDialogAction>\n  </AlertDialogFooter>\n</AlertDialogContent>`,
      render: () => <AlertDemo title="退出登录?" description="未同步的草稿会保留在这台设备上." size="sm" media={false} destructive={false} />,
    },
  ],
  keyboard: [
    { keys: ["Enter"], action: "在触发器上打开; 打开后焦点落在取消键上, 误按 Enter 不会删除." },
    { keys: ["Tab"], action: "在取消与确认之间循环, 不会跑到页面上." },
    { keys: ["Esc"], action: "等同取消, 焦点回到触发器." },
  ],
};
