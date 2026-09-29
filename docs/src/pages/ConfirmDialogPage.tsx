import type { JSX } from "react";
import { useState } from "react";
import { Button, ConfirmDialog, ConfirmDialogHost, confirmDialog } from "@hx/ui";
import { Callout, H2, P, Preview, PropsTable } from "../components/DocKit";

/**
 * ConfirmDialog 页。
 *
 * 本页要能跑起来, 根部必须挂一次 <ConfirmDialogHost /> —— 文档站已在 App.tsx 挂了。
 * 少了它, confirmDialog() 返回的 Promise 永远不会 settle, await 它的那段代码
 * 会静默停在那里, 既没有报错也没有对话框。这是命令式 API 唯一的坑, 所以单独说。
 */
export function ConfirmDialogPage(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [danger, setDanger] = useState(false);
  const [typed, setTyped] = useState(false);
  const [log, setLog] = useState("(还没做出选择)");

  return (
    <>
      <P>
        两种调用方式, 覆盖两类真实场景。先看命令式 —— 高危操作往往发生在 async 分支中间,
        那时手边没有 React 状态可用, 声明式写不进去。
      </P>

      <H2>命令式: await</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">confirmDialog(options)</code>
        返回 Promise&lt;boolean&gt;, 一行拿到用户的答案。
      </P>
      <Preview
        align="start"
        code={`async function handleClear() {
  const ok = await confirmDialog({
    title: "清空运行记录?",
    message: "将删除全部 1284 条记录。该操作不可撤销。",
    variant: "danger",
    confirmLabel: "清空",
  });
  if (!ok) return;
  await api.clearRuns();
}`}
      >
        <Button
          variant="destructive"
          size="sm"
          onClick={async () => {
            const ok = await confirmDialog({
              title: "清空运行记录?",
              message: "将删除全部 1284 条记录。该操作不可撤销。",
              variant: "danger",
              confirmLabel: "清空",
            });
            setLog(ok ? "用户点了「清空」" : "用户取消了");
          }}
        >
          清空运行记录
        </Button>
        <span className="self-center font-mono text-[11.5px] text-muted-foreground">{log}</span>
      </Preview>

      <H2>危险操作必须用 variant="danger"</H2>
      <P>
        把红色做成 variant, 而不是让调用点自己传一个红色按钮 —— 后者迟早会出现
        "清空全部"配一个蓝色主按钮。做成 variant 之后危险语义<b className="text-foreground">无法被漏掉</b>:
        标题会带三角图标并转成 destructive 色。
      </P>
      <Preview
        align="start"
        code={`<ConfirmDialog
  open={danger}
  variant="danger"
  title="删除出口节点?"
  message="使用该出口的 42 个账号会立即失去网络。"
  confirmLabel="删除"
  onConfirm={() => setDanger(false)}
  onCancel={() => setDanger(false)}
/>`}
      >
        <Button variant="outline" size="sm" onClick={() => setDanger(true)}>打开危险确认</Button>
        <ConfirmDialog
          open={danger}
          variant="danger"
          title="删除出口节点?"
          message="使用该出口的 42 个账号会立即失去网络。"
          confirmLabel="删除"
          onConfirm={() => setDanger(false)}
          onCancel={() => setDanger(false)}
        />
      </Preview>

      <H2>不可逆操作: requireText</H2>
      <P>
        真·不可逆的操作 (删除整个数据集) 用点一次按钮挡住是不够的 —— 人手快会直接点过去。
        要求输入确认词是唯一真正有效的摩擦: 确认按钮在输入正确前一直是禁用的。
      </P>
      <Preview
        align="start"
        code={`<ConfirmDialog
  open={typed}
  variant="danger"
  title="删除全部账号"
  message="这将清空账号池及全部登录凭据。"
  requireText="删除全部账号"
  hint="此操作没有备份, 无法恢复。"
  confirmLabel="我明白, 删除"
  onConfirm={() => setTyped(false)}
  onCancel={() => setTyped(false)}
/>`}
      >
        <Button variant="outline" size="sm" onClick={() => setTyped(true)}>删除全部账号</Button>
        <ConfirmDialog
          open={typed}
          variant="danger"
          title="删除全部账号"
          message="这将清空账号池及全部登录凭据。"
          requireText="删除全部账号"
          hint="此操作没有备份, 无法恢复。"
          confirmLabel="我明白, 删除"
          onConfirm={() => setTyped(false)}
          onCancel={() => setTyped(false)}
        />
      </Preview>

      <H2>声明式</H2>
      <P>已经有状态的地方直接用受控组件, 不必绕一圈 Promise。</P>
      <Preview
        align="start"
        code={`const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>重跑任务</Button>
<ConfirmDialog
  open={open}
  title="重跑这个任务?"
  message="已有产物会被覆盖。"
  confirmLabel="重跑"
  onConfirm={() => setOpen(false)}
  onCancel={() => setOpen(false)}
/>`}
      >
        <Button size="sm" onClick={() => setOpen(true)}>重跑任务</Button>
        <ConfirmDialog
          open={open}
          title="重跑这个任务?"
          message="已有产物会被覆盖。"
          confirmLabel="重跑"
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Preview>

      <Callout title="别忘了在根部挂 ConfirmDialogHost">
        命令式入口用的是模块级 store + useSyncExternalStore (与 Toast 同一思路), 好处是
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">confirmDialog()</code> 能在任何地方调用,
        包括事件回调、请求失败分支、甚至非 React 代码, 不需要先拿到 context。
        代价是整个应用要挂一次宿主组件。
      </Callout>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "title", type: "ReactNode", desc: "标题。必给。" },
          { name: "message", type: "ReactNode", desc: "正文, 保留换行 (whitespace-pre-wrap)。" },
          { name: "variant", type: '"default" | "danger"', default: '"default"', desc: "danger 会加三角图标并染 destructive 色。" },
          { name: "confirmLabel / cancelLabel", type: "string", default: '"确定" / "取消"', desc: "按钮文案。" },
          { name: "requireText", type: "string", desc: "要求输入这段文字才能确认。" },
          { name: "hint", type: "ReactNode", desc: "按钮上方的补充提示。" },
          { name: "dismissible", type: "boolean", default: "true", desc: "false 时禁用 Esc 与点击遮罩关闭, 必须做出选择。" },
        ]}
      />
    </>
  );
}
