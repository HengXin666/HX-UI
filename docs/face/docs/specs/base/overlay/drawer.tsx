import { Button, Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@hx/ui";
import drawerRaw from "../../../../../../src/primitives/drawer.tsx?raw";
import { select, text, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 抽屉 (vaul). 可拖拽关闭的移动端面板; 主演示是把一首歌加进歌单.
 */

type Direction = "bottom" | "top" | "left" | "right";
const LISTS = ["通勤路上", "周末慢跑", "深夜写代码"];

function DrawerDemo(props: Record<string, unknown>) {
  const { direction, title, description, footer } = props as { direction: Direction; title: string; description: string; footer: boolean };
  return (
    <Drawer direction={direction}>
      <DrawerTrigger asChild>
        <Button variant="outline">加入歌单</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-1 px-4">
          {LISTS.map((name) => (
            <Button key={name} variant="ghost" className="justify-start">
              {name}
            </Button>
          ))}
        </div>
        {footer ? (
          <DrawerFooter>
            <Button variant="primary">新建歌单</Button>
            <DrawerClose asChild>
              <Button variant="outline">取消</Button>
            </DrawerClose>
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function usage(values: Values): string {
  const root = values.direction === "bottom" ? "<Drawer>" : `<Drawer direction="${values.direction}">`;
  const footer = values.footer ? `\n    <DrawerFooter>\n      <Button variant="primary">新建歌单</Button>\n      <DrawerClose asChild>\n        <Button variant="outline">取消</Button>\n      </DrawerClose>\n    </DrawerFooter>` : "";
  const list = LISTS.map((name) => `      <Button variant="ghost">${name}</Button>`).join("\n");
  const body = `${root}\n  <DrawerTrigger asChild>\n    <Button variant="outline">加入歌单</Button>\n  </DrawerTrigger>\n  <DrawerContent>\n    <DrawerHeader>\n      <DrawerTitle>${String(values.title)}</DrawerTitle>\n      <DrawerDescription>${String(values.description)}</DrawerDescription>\n    </DrawerHeader>\n    <div className="grid gap-1 px-4">\n${list}\n    </div>${footer}\n  </DrawerContent>\n</Drawer>`;
  return demo(["Button", "Drawer", ...(values.footer ? ["DrawerClose"] : []), "DrawerContent", "DrawerDescription", ...(values.footer ? ["DrawerFooter"] : []), "DrawerHeader", "DrawerTitle", "DrawerTrigger"], body);
}

export const DRAWER: PageSpec = {
  id: "drawer",
  kind: "composite",
  importName: "Drawer",
  parts: ["DrawerContent"],
  source: "src/primitives/drawer.tsx",
  raw: drawerRaw,
  deps: ["vaul"],
  controls: [
    select("direction", "方向", ["bottom", "top", "left", "right"], "bottom", "", "从哪一边滑入, 也是拖拽关闭的方向; bottom 时顶部有拖拽手柄."),
    text("title", "标题", "加入歌单", "DrawerTitle 的内容, 也是可访问名称."),
    text("description", "说明", "《海边的卡夫卡》 · 坂本龙一", "DrawerDescription 的内容."),
    toggle("footer", "页脚按钮", true, "不是属性: 加一行 DrawerFooter, 放主操作与 DrawerClose."),
  ],
  propDesc: {
    direction: "滑入方向与拖拽关闭的方向, 默认 bottom.",
    open: "受控的打开状态, 与 onOpenChange 成对使用.",
    defaultOpen: "初始打开, 跳过首次进场动画; 之后仍响应 open 的变化.",
    onOpenChange: "打开状态变化时回调.",
    dismissible: "false 时拖拽, 点外部与 Esc 都不关闭; 要与受控的 open 一起用, 否则关不上.",
    modal: "false 时可以与抽屉外的元素交互而不关闭抽屉.",
    snapPoints: "停靠点, 从露出最少的一档开始: 0 到 1 的屏幕比例 (例如 [0.2, 0.5, 0.8]), 也可以写像素字符串.",
    activeSnapPoint: "受控的当前停靠点.",
    setActiveSnapPoint: "停靠点变化时回调.",
    fadeFromIndex: "从第几个停靠点开始遮罩渐显, 默认最后一个.",
    snapToSequentialPoint: "关掉按速度跳档: 甩得再快也只移到相邻停靠点.",
    closeThreshold: "0 到 1: 拖过面板高度的这个比例即关闭, 例如 0.5 是拖过一半.",
    handleOnly: "只允许拖 Drawer.Handle 手柄.",
    setBackgroundColorOnScale: "false 时打开抽屉不改 body 的背景色.",
    noBodyStyles: "true 时 vaul 不往 body 上写任何样式.",
    disablePreventScroll: "vaul 原注释: 为 true 时挂载期间阻止 body 滚动, 卸载时恢复.",
    repositionInputs: "true 时键盘挡住输入框由 vaul 调整位置; false 回到浏览器默认的滚动到可见.",
    scrollLockTimeout: "抽屉内容滚动后, 这段时间 (毫秒) 内不能拖动抽屉.",
    fixed: "true 时键盘弹起不把抽屉上移, 只改高度让内容可滚动.",
    onAnimationEnd: "进出场动画结束后回调, 参数是那时的打开状态.",
    children: "触发器与内容.",
    "DrawerContent.overlayClassName": "遮罩层的类名.",
    "DrawerContent.portalContainer": "传送门的挂载点.",
    "DrawerContent.asChild": "把内容交给唯一的子元素渲染.",
    "DrawerContent.deferPointerDownOutside": "点外部的处理推迟到 pointerup.",
    "DrawerContent.onEscapeKeyDown": "按 Esc 时回调, preventDefault 可阻止关闭.",
    "DrawerContent.onPointerDownOutside": "在面板外按下指针时回调.",
    "DrawerContent.onFocusOutside": "焦点移到面板外时回调.",
    "DrawerContent.onInteractOutside": "面板外的任何交互时回调.",
    "DrawerContent.onOpenAutoFocus": "打开时的自动聚焦回调.",
    "DrawerContent.onCloseAutoFocus": "关闭后焦点回到触发器之前回调.",
    "DrawerContent.forceMount": "始终挂载.",
  },
  propsNote: "与 Sheet 的区别: Drawer 是可拖拽的移动端面板 (vaul), Sheet 是桌面端从四边滑入的面板 (Radix Dialog). 说明为空的属性 vaul 源码没有注释, 见 vaul 文档.",
  render: (props) => <DrawerDemo {...props} />,
  usage,
  examples: [
    {
      id: "right",
      title: "从右侧滑入, 不带页脚",
      code: `<Drawer direction="right">…</Drawer>`,
      render: () => <DrawerDemo direction="right" title="加入歌单" description="《海边的卡夫卡》 · 坂本龙一" footer={false} />,
    },
  ],
  keyboard: [
    { keys: ["Enter"], action: "在触发器上打开抽屉." },
    { keys: ["Tab"], action: "在抽屉内循环聚焦." },
    { keys: ["Esc"], action: "关闭抽屉, 焦点回到触发器." },
    { keys: ["拖拽"], action: "按住面板 (或手柄) 往滑入的反方向拖, 过阈值松手即关闭." },
  ],
};
