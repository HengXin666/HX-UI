import { useState, type JSX } from "react";
import {
  Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@hx/ui";
import { Callout, H2, H3, P, Preview, PropsTable } from "../components/DocKit";

/**
 * Dialog 页。
 *
 * 两个容易踩的点写在源码里: 内容区用单条 max-w 而不是 max-w + sm:max-w (避免
 * twMerge 在 sm 断点覆盖使用方宽度), 以及打开时不自动聚焦 (onOpenAutoFocus
 * 直接 preventDefault), 免得焦点跑到第一个输入框弹出输入法。
 */
export function DialogPage(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <P>
        遮罩是 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">bg-black/20</code> 加一层
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> backdrop-blur-xs</code>;
        面板 width 固定 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">max-w-[min(24rem,calc(100%-2rem))]</code>,
        想更宽必须覆盖这个值, 而不是加 max-w-lg 去叠加。
      </P>

      <H2>基础</H2>
      <P>最小可用形态: 触发器 + 标题 + 说明。右上角关闭按钮默认就在, 不用自己放。</P>
      <Preview
        align="start"
        code={`<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">打开说明</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>关于本地模型</DialogTitle>
      <DialogDescription>
        模型权重从本地目录加载, 不经过网络。删除缓存后需要重新下载。
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>`}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">打开说明</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>关于本地模型</DialogTitle>
              <DialogDescription>
                模型权重从本地目录加载, 不经过网络。删除缓存后需要重新下载。
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </Preview>

      <H2>带页脚按钮</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">DialogFooter</code> 用负边距贴到面板底边,
        自带一条 1px 上边线与 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">bg-muted/50</code> 底,
        所以不要再给外层加 padding。它接受 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">showCloseButton</code> 自动补一个关闭按钮。
      </P>
      <Preview
        align="start"
        code={`<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">删除会话</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>删除这个会话?</DialogTitle>
      <DialogDescription>删除后本地记录不可恢复, 正在跑的任务会被中断。</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">取消</Button>
      </DialogClose>
      <Button variant="destructive">确认删除</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* 简单确认: 页脚自己补关闭按钮, 不用手写 DialogClose */}
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">同步设置</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>从云端拉取设置?</DialogTitle>
      <DialogDescription>本机未提交的改动会被覆盖。</DialogDescription>
    </DialogHeader>
    <DialogFooter showCloseButton />
  </DialogContent>
</Dialog>`}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">删除会话</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>删除这个会话?</DialogTitle>
              <DialogDescription>删除后本地记录不可恢复, 正在跑的任务会被中断。</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <Button variant="destructive">确认删除</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">同步设置</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>从云端拉取设置?</DialogTitle>
              <DialogDescription>本机未提交的改动会被覆盖。</DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      </Preview>

      <H2>受控开关</H2>
      <P>
        外部有按钮要打开它, 或者需要在关闭时提交表单时用受控。注意
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> onOpenChange</code> 会在点遮罩、按 Esc、点关闭按钮时都收到 false,
        想区分就得自己接 DialogClose 的 onClick。
      </P>
      <Preview
        align="start"
        code={`const [open, setOpen] = useState(false);

<Button variant="primary" onClick={() => setOpen(true)}>新建工作区</Button>

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>新建工作区</DialogTitle>
      <DialogDescription>状态: {open ? "已打开" : "已关闭"}</DialogDescription>
    </DialogHeader>
    <DialogFooter showCloseButton />
  </DialogContent>
</Dialog>`}
      >
        <Button variant="primary" onClick={() => setOpen(true)}>新建工作区</Button>
        <span className="self-center text-[12px] text-muted-foreground">
          状态: {open ? "已打开" : "已关闭"}
        </span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建工作区</DialogTitle>
              <DialogDescription>状态: {open ? "已打开" : "已关闭"}。这个面板完全由外面的 state 控制。</DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      </Preview>

      <Callout title="打开时不抢焦点">
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">DialogContent</code> 对
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> onOpenAutoFocus</code> 做了 preventDefault。
        如果你的对话框第一个元素就是输入框、并且希望它自动聚焦, 得自己把这个行为加回来。
      </Callout>

      <H2>属性</H2>
      <H3>Dialog (根)</H3>
      <PropsTable
        rows={[
          { name: "open / onOpenChange", type: "boolean / (open: boolean) => void", desc: "受控开关。不传则用 Trigger / Close 自己管。" },
          { name: "defaultOpen", type: "boolean", default: "false", desc: "非受控初值。" },
          { name: "modal", type: "boolean", default: "true", desc: "模态: 打开时锁滚动、挡外部交互。" },
        ]}
      />
      <H3>DialogContent</H3>
      <PropsTable
        rows={[
          { name: "showCloseButton", type: "boolean", default: "true", desc: "右上角的关闭按钮。" },
          { name: "overlayClassName", type: "string", desc: "单独改遮罩的类串。" },
          { name: "className", type: "string", desc: "面板类串。要改宽度请覆盖 max-w, 不要叠加。" },
        ]}
      />
      <H3>DialogFooter</H3>
      <PropsTable
        rows={[
          { name: "showCloseButton", type: "boolean", default: "false", desc: "在按钮组末尾补一个 Close (文案是英文 Close)。" },
          { name: "className", type: "string", desc: "额外类串, 例如 sm:justify-start。" },
        ]}
      />
    </>
  );
}
