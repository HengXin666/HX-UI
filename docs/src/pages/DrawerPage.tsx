import { useState, type JSX } from "react";
import {
  Button, Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter,
  DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@hx/ui";
import { Callout, H2, H3, P, Preview, PropsTable } from "../components/DocKit";

/**
 * Drawer 页。
 *
 * 底子是 vaul, 所以尺寸在**组件内部按方向写死**: 上下方向 max-h-[80vh] 且圆角只圆朝向的那两边,
 * 左右方向 w-3/4 与 sm:max-w-sm。要更宽得覆盖这些 data-[vaul-drawer-direction=...] 类,
 * 传 className="w-[520px]" 是无效的 (twMerge 之后仍被方向类压住)。
 */
export function DrawerPage(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <P>
        与 Dialog 同源但不同底: 遮罩只有 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">bg-black/10</code>,
        面板贴边、只圆朝内的两角, 从边缘滑入。底部方向还会多出一条 100px 宽的拖拽把手, 用
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> group-data-[vaul-drawer-direction=bottom]</code> 控制显隐。
      </P>

      <H2>底部抽屉</H2>
      <P>默认方向就是 bottom, 适合移动端与"从下往上展开一块内容"。头部在 bottom 方向会自动居中。</P>
      <Preview
        align="start"
        code={`<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">打开抽屉</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>运行日志</DrawerTitle>
        <DrawerDescription>
        最近 200 行, 只保存在本次会话里。拖动手柄或用按钮都能关; 内容区不带内边距, 由使用方自己排。
      </DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <DrawerClose asChild>
        <Button variant="outline">关闭</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">打开抽屉</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>运行日志</DrawerTitle>
              <DrawerDescription>
                最近 200 行, 只保存在本次会话里。拖动手柄或用按钮都能关; 内容区不带内边距, 由使用方自己排。
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">关闭</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Preview>

      <H2>方向</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">direction</code> 是根的属性。
        左右方向固定占 3/4 宽、sm 以上封顶 24rem, 拿来做工具面板或详情侧栏。
      </P>
      <Preview
        align="start"
        code={`<Drawer direction="right">
  <DrawerTrigger asChild>
    <Button variant="outline">右侧</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>文件详情</DrawerTitle>
    </DrawerHeader>
    <DrawerFooter>
      <DrawerClose asChild>
        <Button variant="outline">关闭</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>

{/* direction 还有 "left" 与 "top" */}`}
      >
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button variant="outline">右侧</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>文件详情</DrawerTitle>
              <DrawerDescription>右侧方向, 宽度 w-3/4 且 sm 以上封顶 24rem。</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">关闭</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Drawer direction="left">
          <DrawerTrigger asChild>
            <Button variant="outline">左侧</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>会话列表</DrawerTitle>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">关闭</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Drawer direction="top">
          <DrawerTrigger asChild>
            <Button variant="outline">顶部</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>通知中心</DrawerTitle>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">关闭</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Preview>

      <H2>受控</H2>
      <Preview
        align="start"
        code={`const [open, setOpen] = useState(false);

<Button variant="primary" onClick={() => setOpen(true)}>打开</Button>

<Drawer open={open} onOpenChange={setOpen}>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>受控抽屉</DrawerTitle>
    </DrawerHeader>
    <DrawerFooter>
      <Button variant="primary" onClick={() => setOpen(false)}>完成</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`}
      >
        <Button variant="primary" onClick={() => setOpen(true)}>打开</Button>
        <span className="self-center text-[12px] text-muted-foreground">状态: {open ? "已打开" : "已关闭"}</span>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>受控抽屉</DrawerTitle>
              <DrawerDescription>用外部按钮开关, 关闭按钮在页脚。</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button variant="primary" onClick={() => setOpen(false)}>完成</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Preview>

      <Callout kind="warning" title="宽度不要用 className 改">
        面板宽度/最大高度由方向类决定, 且方向类的选择器权重更高。要改尺寸就在
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> className</code> 里写同前缀的
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> data-[vaul-drawer-direction=right]:w-[520px]</code>, 或者直接不用 Drawer 改用固定面板。
      </Callout>

      <H2>属性</H2>
      <H3>Drawer (根)</H3>
      <PropsTable
        rows={[
          { name: "open / onOpenChange", type: "boolean / (open: boolean) => void", desc: "受控开关。" },
          { name: "direction", type: '"top" | "bottom" | "left" | "right"', default: '"bottom"', desc: "滑入方向, 同时决定面板占哪一边。" },
          { name: "dismissible", type: "boolean", default: "true", desc: "是否允许点遮罩或拖拽关闭。" },
          { name: "modal", type: "boolean", default: "true", desc: "模态时锁背景滚动。" },
          { name: "shouldScaleBackground", type: "boolean", default: "false", desc: "开启后背景会随拖拽缩放。" },
        ]}
      />
      <H3>DrawerContent</H3>
      <PropsTable
        rows={[
          { name: "overlayClassName", type: "string", desc: "单独改遮罩的类串。" },
          { name: "portalContainer", type: "HTMLElement", desc: "挂载容器。默认 body。" },
        ]}
      />
      <H3>DrawerHeader / DrawerFooter</H3>
      <PropsTable
        rows={[
          { name: "DrawerHeader", type: "div props", desc: "p-4, bottom 方向自动文字居中。" },
          { name: "DrawerFooter", type: "div props", desc: "mt-auto p-4, 永远贴在面板底部。" },
        ]}
      />
    </>
  );
}
