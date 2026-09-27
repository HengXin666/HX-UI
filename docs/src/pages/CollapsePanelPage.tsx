import { useState, type JSX } from "react";
import { Button, CollapsePanel, Spin } from "@hx/ui";
import { Callout, H2, H3, P, Preview, PropsTable } from "../components/DocKit";

/**
 * CollapsePanel 页。
 *
 * 这个组件的源码注释解释了它为什么会是现在这样, 值得原样转达给使用者:
 * 它**不用** framer-motion 的 height: 0 → auto, 因为那是 JS 驱动、每帧写内联 height
 * 并触发强制样式重算。消息列表跑在虚拟列表上时, 每帧的尺寸变化都会变成一次列表重测量。
 * 改成 grid-template-rows 0fr → 1fr 的 CSS 过渡后, 动画走浏览器自己的时间线, 不占主线程 JS。
 */
export function CollapsePanelPage(): JSX.Element {
  const [open, setOpen] = useState(true);
  const [cardOpen, setCardOpen] = useState(false);

  return (
    <>
      <P>
        它本身<b className="text-foreground">不是</b>手风琴: 没有标题栏、没有箭头、不管互斥。它只负责"把一块内容高度从 0 撑开或收回",
        标题与开关状态由使用方给。折叠动画 200ms, 缓动
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> cubic-bezier(0.25,0.1,0.25,1)</code>。
      </P>

      <H2>基础</H2>
      <P>
        收起后内容会<b className="text-foreground">从树上卸载</b>, 不是只加 display:none。这条很关键: 面板里放 shiki 高亮的代码块或
        markdown 时, 常驻挂载等于把折叠的代价提前付掉。
      </P>
      <Preview
        align="start"
        code={`const [open, setOpen] = useState(true);

<Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
  {open ? "收起" : "展开"}
</Button>

<CollapsePanel open={open}>
  <div className="rounded-lg border border-border bg-card/40 p-3 text-[12.5px] text-muted-foreground">
    内容随便放。收起后这块会从 DOM 里消失。
  </div>
</CollapsePanel>`}
      >
        <div className="w-full">
          <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "收起" : "展开"}
          </Button>
          <div className="mt-3">
            <CollapsePanel open={open}>
              <div className="rounded-lg border border-border bg-card/40 p-3 text-[12.5px] leading-relaxed text-muted-foreground">
                内容随便放。收起后这块会从 DOM 里消失; 再次展开时重新挂载。
                展开动画是 CSS 的 grid-template-rows 过渡, 不经过 React 协调。
              </div>
            </CollapsePanel>
          </div>
        </div>
      </Preview>

      <H2>展开时加载内容</H2>
      <P>
        按需挂载的直接好处: 展开的那一刻才开始拉数据或渲染重组件。下面这个面板收起期间
        Spin 根本不在页面上。
      </P>
      <Preview
        align="start"
        code={`const [open, setOpen] = useState(false);

<Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>运行日志</Button>

<CollapsePanel open={open}>
  <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 p-3">
    <Spin size="sm" className="text-muted-foreground" />
    <span className="text-[12.5px] text-muted-foreground">正在拉取日志…</span>
  </div>
</CollapsePanel>`}
      >
        <div className="w-full">
          <Button variant="outline" size="sm" onClick={() => setCardOpen((v) => !v)}>
            {cardOpen ? "收起日志" : "展开日志"}
          </Button>
          <div className="mt-3">
            <CollapsePanel open={cardOpen}>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 p-3">
                <Spin size="sm" className="text-muted-foreground" />
                <span className="text-[12.5px] text-muted-foreground">收起期间这个 Spin 不在 DOM 里。</span>
              </div>
            </CollapsePanel>
          </div>
        </div>
      </Preview>

      <H2>嵌套与内边距</H2>
      <P>
        内层内容容器带 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">overflow-hidden</code>,
        否则子元素的外边距会漏出去把父级撑出滚动条。要额外的内边距用
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> contentClassName</code>, 不要套一层再自己补 padding。
      </P>
      <Preview
        align="start"
        code={`<CollapsePanel open={true} contentClassName="pb-3">
  <div className="rounded-lg border border-border bg-muted/30 p-3 text-[12.5px]">
    外层没有 padding, 底部那 12px 是 contentClassName 给的。
  </div>
</CollapsePanel>`}
      >
        <div className="w-full">
          <CollapsePanel open contentClassName="pb-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-[12.5px] text-muted-foreground">
              外层没有 padding, 底部那 12px 来自 contentClassName。
            </div>
          </CollapsePanel>
        </div>
      </Preview>

      <Callout title="首帧直接展开时不播动画">
        初值就是 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">{"open={true}"}</code> 时组件直接落到展开态,
        既不播入场动画, 也不排定时器 (旧实现每个初始收起的面板都会白排一个 200ms timer)。
        导出态 (<code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">exportPanel + hidden</code>) 就是靠这条做到"导出前不闪一下"。
      </Callout>

      <H2>属性</H2>
      <H3>CollapsePanel</H3>
      <PropsTable
        rows={[
          { name: "open", type: "boolean", desc: "必填。展开状态, 完全受控。" },
          { name: "children", type: "ReactNode", desc: "面板内容。收起后卸载, 不是隐藏。" },
          { name: "id", type: "string", desc: "面板容器 id。导出流程按 id 找面板。" },
          { name: "exportPanel", type: "boolean", default: "false", desc: "给导出流程的标记属性; 为假时不落到 DOM 上。" },
          { name: "hidden", type: "boolean", default: "false", desc: "导出态下折叠的面板保留在 DOM 里但 hidden。" },
          { name: "contentClassName", type: "string", desc: "内层内容容器的额外类名, 用来补内边距。" },
        ]}
      />
      <Callout kind="warning" title="它是 div, 不是按钮">
        面板不接管键盘与 aria。要在展开/收起之间做无障碍, 请用真正的 button 控制
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> open</code>, 并在按钮上写
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> aria-expanded</code> 与
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> aria-controls</code>。
      </Callout>
    </>
  );
}
