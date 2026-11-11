import { HoverCard, HoverCardContent, HoverCardTrigger } from "@hx/ui";
import hoverRaw from "../../../../../../src/primitives/hover-card.tsx?raw";
import { range, select, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 悬停卡片. 指针停在提及的用户名上时预览资料; 只放看一眼的信息, 不放必须操作的控件.
 */

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

function Profile() {
  return (
    <div className="flex gap-3 text-left">
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-[13px] font-medium text-foreground">
        林
      </span>
      <div className="grid gap-1">
        <p className="text-[13px] font-medium text-foreground">林悦 @linyue</p>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">设计系统负责人, 维护组件库的令牌与图标. 上海 · 2023 年 4 月加入.</p>
      </div>
    </div>
  );
}

function HoverDemo(props: Record<string, unknown>) {
  const { openDelay, side, align, sideOffset } = props as { openDelay: number; side: Side; align: Align; sideOffset: number };
  return (
    <p className="text-[14px] text-muted-foreground">
      这一版令牌由{" "}
      <HoverCard openDelay={openDelay}>
        <HoverCardTrigger asChild>
          <a href="#/hover-card" className="font-medium text-foreground underline underline-offset-4">
            @linyue
          </a>
        </HoverCardTrigger>
        <HoverCardContent side={side} align={align} sideOffset={sideOffset} className="w-72">
          <Profile />
        </HoverCardContent>
      </HoverCard>{" "}
      整理.
    </p>
  );
}

function usage(values: Values): string {
  const root = values.openDelay === 400 ? "<HoverCard>" : `<HoverCard openDelay={${values.openDelay}}>`;
  const attrs = [values.side === "bottom" ? "" : ` side="${values.side}"`, values.align === "center" ? "" : ` align="${values.align}"`, values.sideOffset === 6 ? "" : ` sideOffset={${values.sideOffset}}`].join("");
  const body = `${root}\n  <HoverCardTrigger asChild>\n    <a href="/u/linyue">@linyue</a>\n  </HoverCardTrigger>\n  <HoverCardContent${attrs} className="w-72">\n    <p>林悦 @linyue</p>\n    <p>设计系统负责人, 维护组件库的令牌与图标. 上海 · 2023 年 4 月加入.</p>\n  </HoverCardContent>\n</HoverCard>`;
  return demo(["HoverCard", "HoverCardContent", "HoverCardTrigger"], body);
}

export const HOVER_CARD: PageSpec = {
  id: "hover-card",
  kind: "composite",
  importName: "HoverCard",
  parts: ["HoverCardContent"],
  source: "src/primitives/hover-card.tsx",
  raw: hoverRaw,
  deps: ["radix-ui"],
  controls: [
    range("openDelay", "打开延迟", [0, 1000, 100], 400, "openDelay: 指针停留多久才打开 (毫秒); 默认 400, 扫过不会误弹."),
    select("side", "方位", ["bottom", "top", "left", "right"], "bottom", "", "HoverCardContent 的 side, 空间不够时自动翻到对侧."),
    select("align", "对齐", ["center", "start", "end"], "center", "", "HoverCardContent 的 align."),
    range("sideOffset", "间距", [0, 24, 2], 6, "HoverCardContent 的 sideOffset: 与触发器的距离 (px)."),
  ],
  propDesc: {
    children: "触发器与内容.",
    open: "受控的打开状态, 与 onOpenChange 成对使用.",
    defaultOpen: "非受控的初始打开状态.",
    onOpenChange: "打开状态变化时回调.",
    openDelay: "指针停留多久才打开 (毫秒).",
    closeDelay: "指针离开多久才关闭 (毫秒); 150 足够从触发器移进卡片.",
    "HoverCardContent.side": "优先出现的方位.",
    "HoverCardContent.sideOffset": "与触发器的距离 (px).",
    "HoverCardContent.align": "沿触发器边的对齐.",
    "HoverCardContent.alignOffset": "对齐方向上的偏移 (px).",
    "HoverCardContent.avoidCollisions": "碰到视口边缘时翻转或平移 (默认开).",
    "HoverCardContent.collisionPadding": "与视口边缘至少留出的距离.",
    "HoverCardContent.collisionBoundary": "碰撞检测的边界元素, 默认视口.",
    "HoverCardContent.arrowPadding": "箭头与内容圆角之间至少留出的距离.",
    "HoverCardContent.sticky": "滚动时贴住触发器的方式.",
    "HoverCardContent.hideWhenDetached": "触发器被裁出可视区时隐藏内容.",
    "HoverCardContent.updatePositionStrategy": "always 时每帧都重算位置.",
    "HoverCardContent.onEscapeKeyDown": "按 Esc 时回调.",
    "HoverCardContent.onPointerDownOutside": "在卡片外按下指针时回调.",
    "HoverCardContent.onFocusOutside": "焦点移到卡片外时回调.",
    "HoverCardContent.onInteractOutside": "卡片外的任何交互时回调.",
    "HoverCardContent.forceMount": "始终挂载.",
    "HoverCardContent.asChild": "把内容交给唯一的子元素渲染.",
  },
  propsNote: "触屏与纯键盘用户拿不到悬停, 卡片里的信息在别处也要能找到.",
  height: 300,
  render: (props) => <HoverDemo {...props} />,
  usage,
  examples: [
    {
      id: "instant",
      title: "立即打开, 显示在上方",
      code: `<HoverCard openDelay={0}>\n  …\n  <HoverCardContent side="top">…</HoverCardContent>\n</HoverCard>`,
      render: () => <HoverDemo openDelay={0} side="top" align="start" sideOffset={6} />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦到触发链接时同样会打开卡片." },
    { keys: ["Esc"], action: "关闭卡片." },
    { keys: ["读屏"], action: "卡片内容不进触发器的可访问名称; 重要信息要放在链接指向的页面." },
  ],
};
