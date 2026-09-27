import { useState, type JSX } from "react";
import {
  Button, Popover, PopoverArrow, PopoverContent, PopoverDescription,
  PopoverHeader, PopoverTitle, PopoverTrigger,
} from "@hx/ui";
import { H2, H3, P, Preview, PropsTable } from "../components/DocKit";

/**
 * Popover 页。
 *
 * 面板有**默认宽度 w-72**(不是 w-fit), 所以窄内容会显得空; 要贴内容宽必须显式覆盖,
 * 这也是 DatePicker 必须写 className="w-auto" 的原因 —— 它把 Calendar 塞进来时不覆盖就会窄 288px 卡住。
 */
export function PopoverPage(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <P>
        Popover 是 Dialog 的非模态表亲: 不锁滚动、点外部即关。面板
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> rounded-lg</code> +
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> p-2.5</code>,
        列方向 gap-2.5, 自带 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">no-drag</code> (在可拖拽窗口里不会被当成拖拽把手)。
      </P>

      <H2>基础</H2>
      <P>Header / Title / Description 三段一起用, 间距由面板的 gap 给, 不用自己加 margin。</P>
      <Preview
        align="start"
        code={`<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">查看配额</Button>
  </PopoverTrigger>
  <PopoverContent align="start">
    <PopoverHeader>
      <PopoverTitle>本月配额</PopoverTitle>
      <PopoverDescription>已用 62%, 剩余 3.8M tokens。</PopoverDescription>
    </PopoverHeader>
  </PopoverContent>
</Popover>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">查看配额</Button>
          </PopoverTrigger>
          <PopoverContent align="start">
            <PopoverHeader>
              <PopoverTitle>本月配额</PopoverTitle>
              <PopoverDescription>已用 62%, 剩余 3.8M tokens。下月 1 日重置。</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </Preview>

      <H2>带箭头</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">PopoverArrow</code> 放在 Content 内部,
        width/height 已经写死 14×8, 填充色取 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">fill-popover</code> 所以不用管主题。
      </P>
      <Preview
        align="center"
        code={`<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon-sm" aria-label="帮助">
      <span className="icon-[solar--info-circle-linear] size-4" />
    </Button>
  </PopoverTrigger>
  <PopoverContent align="center" className="w-64">
    <PopoverArrow />
    <PopoverTitle>快捷键</PopoverTitle>
    <PopoverDescription>⌘K 打开命令面板, ⌘/ 切换注释。</PopoverDescription>
  </PopoverContent>
</Popover>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="帮助">
              <span className="icon-[solar--info-circle-linear] size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-64">
            <PopoverArrow />
            <PopoverTitle>快捷键</PopoverTitle>
            <PopoverDescription>⌘K 打开命令面板, ⌘/ 切换注释。</PopoverDescription>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="帮助">
              <span className="icon-[solar--info-circle-linear] size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-64">
            <PopoverTitle>快捷键</PopoverTitle>
            <PopoverDescription>⌘K 打开命令面板, ⌘/ 切换注释。</PopoverDescription>
          </PopoverContent>
        </Popover>
      </Preview>

      <H2>受控</H2>
      <Preview
        align="start"
        code={`const [open, setOpen] = useState(false);

<Button variant="primary" onClick={() => setOpen((v) => !v)}>切换浮层</Button>

<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <Button variant="link">触发器</Button>
  </PopoverTrigger>
  <PopoverContent align="start">
    <PopoverDescription>状态: {open ? "已打开" : "已关闭"}</PopoverDescription>
  </PopoverContent>
</Popover>`}
      >
        <Button variant="primary" onClick={() => setOpen((v) => !v)}>切换浮层</Button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="link">触发器 (点外部会关)</Button>
          </PopoverTrigger>
          <PopoverContent align="start">
            <PopoverDescription>状态: {open ? "已打开" : "已关闭"}。受控时点外部只发 onOpenChange(false), 由你决定关不关。</PopoverDescription>
          </PopoverContent>
        </Popover>
      </Preview>

      <H2>属性</H2>
      <H3>Popover (根)</H3>
      <PropsTable
        rows={[
          { name: "open / onOpenChange", type: "boolean / (open: boolean) => void", desc: "受控开关。不传则由 Trigger 自己管。" },
          { name: "modal", type: "boolean", default: "false", desc: "为真时打开期间视为模态。" },
        ]}
      />
      <H3>PopoverContent</H3>
      <PropsTable
        rows={[
          { name: "align", type: '"start" | "center" | "end"', default: '"center"', desc: "对齐方式。默认居中, 侧栏类场景更常用 start。" },
          { name: "sideOffset", type: "number", default: "4", desc: "与触发器的间距 (px)。" },
          { name: "className", type: "string", desc: "宽带默认 18rem。要按内容收窄写 w-auto。" },
          { name: "collisionPadding", type: "number | object", desc: "与视口边缘的避让距离。" },
        ]}
      />
      <H3>其他导出</H3>
      <PropsTable
        rows={[
          { name: "PopoverAnchor", type: "element", desc: "把定位锚点与实际触发器分开, 例如锚在输入框上、点按钮打开。" },
          { name: "PopoverArrow", type: "svg props", desc: "三角箭头, 尺寸 14×8。" },
          { name: "PopoverHeader / Title / Description", type: "div / h2 / p props", desc: "面板内部排版三段, Title 是 font-medium 不是标题级别。" },
        ]}
      />
    </>
  );
}
