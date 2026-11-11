import { Button, Tooltip, TooltipContent, TooltipHint, TooltipProvider, TooltipTrigger } from "@hx/ui";
import tooltipRaw from "../../../../../../src/primitives/tooltip.tsx?raw";
import { range, select, text, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 悬浮提示. 图标按钮旁的一句说明, 面板用前景色反相; 主演示是编辑器工具条的三个图标按钮.
 */

type Side = "top" | "bottom" | "left" | "right";
const TOOLS = [
  { label: "复制链接", icon: "icon-[solar--link-linear]" },
  { label: "下载 PDF", icon: "icon-[solar--download-minimalistic-linear]" },
  { label: "移到回收站", icon: "icon-[solar--trash-bin-trash-linear]" },
];

function TooltipDemo(props: Record<string, unknown>) {
  const { label, side, showArrow, delay } = props as { label: string; side: Side; showArrow: boolean; delay: number };
  return (
    <TooltipProvider delayDuration={delay}>
      <div className="flex gap-2">
        {TOOLS.map((tool, index) => (
          <Tooltip key={tool.label}>
            <TooltipTrigger asChild>
              <Button size="icon" variant="outline" aria-label={tool.label}>
                <span aria-hidden className={`${tool.icon} size-4 bg-current`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side} showArrow={showArrow}>
              {index === 0 ? label : tool.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

function usage(values: Values): string {
  const provider = values.delay === 400 ? "<TooltipProvider>" : `<TooltipProvider delayDuration={${values.delay}}>`;
  const attrs = [values.side === "top" ? "" : ` side="${values.side}"`, values.showArrow ? "" : " showArrow={false}"].join("");
  const body = `${provider}\n  <Tooltip>\n    <TooltipTrigger asChild>\n      <Button size="icon" variant="outline" aria-label="复制链接">\n        <span aria-hidden className="icon-[solar--link-linear] size-4" />\n      </Button>\n    </TooltipTrigger>\n    <TooltipContent${attrs}>${String(values.label)}</TooltipContent>\n  </Tooltip>\n</TooltipProvider>`;
  return demo(["Button", "Tooltip", "TooltipContent", "TooltipProvider", "TooltipTrigger"], body);
}

export const TOOLTIP: PageSpec = {
  id: "tooltip",
  kind: "composite",
  importName: "Tooltip",
  parts: ["TooltipContent", "TooltipProvider", "TooltipHint"],
  source: "src/primitives/tooltip.tsx",
  raw: tooltipRaw,
  deps: ["radix-ui"],
  controls: [
    text("label", "提示文字", "复制链接", "第一个按钮的 TooltipContent 内容; 其余两个是固定文字."),
    select("side", "方位", ["top", "bottom", "left", "right"], "top", "", "TooltipContent 的 side, 空间不够时自动翻到对侧."),
    toggle("showArrow", "箭头", true, "TooltipContent 的 showArrow: 指向触发器的小箭头."),
    range("delay", "打开延迟", [0, 1000, 100], 400, "TooltipProvider 的 delayDuration (毫秒); 一个提示刚关时移到相邻按钮会立即打开."),
  ],
  propDesc: {
    children: "触发器与内容.",
    open: "受控的打开状态, 与 onOpenChange 成对使用.",
    defaultOpen: "非受控的初始打开状态.",
    onOpenChange: "打开状态变化时回调.",
    delayDuration: "单独覆盖这一个提示的打开延迟 (毫秒).",
    disableHoverableContent: "指针移进提示面板时不保持打开.",
    "TooltipContent.showArrow": "是否带指向触发器的小箭头.",
    "TooltipContent.side": "优先出现的方位, 默认 top.",
    "TooltipContent.sideOffset": "与触发器的距离 (px).",
    "TooltipContent.align": "沿触发器边的对齐.",
    "TooltipContent.alignOffset": "对齐方向上的偏移 (px).",
    "TooltipContent.avoidCollisions": "碰到视口边缘时翻转或平移 (默认开).",
    "TooltipContent.collisionPadding": "与视口边缘至少留出的距离.",
    "TooltipContent.collisionBoundary": "碰撞检测的边界元素, 默认视口.",
    "TooltipContent.arrowPadding": "箭头与面板圆角之间至少留出的距离.",
    "TooltipContent.sticky": "滚动时贴住触发器的方式.",
    "TooltipContent.hideWhenDetached": "触发器被裁出可视区时隐藏.",
    "TooltipContent.updatePositionStrategy": "always 时每帧都重算位置.",
    "TooltipContent.aria-label": "比可见文字更完整的读屏文本.",
    "TooltipContent.onEscapeKeyDown": "按 Esc 时回调, preventDefault 可阻止关闭.",
    "TooltipContent.onPointerDownOutside": "在提示外按下指针时回调, preventDefault 可阻止关闭.",
    "TooltipContent.forceMount": "始终挂载, 由外部动画库控制进出场.",
    "TooltipContent.asChild": "把面板交给唯一的子元素渲染.",
    "TooltipProvider.delayDuration": "组内提示的打开延迟 (毫秒).",
    "TooltipProvider.skipDelayDuration": "一个提示关掉后多久内移到另一个触发器可以跳过延迟 (毫秒).",
    "TooltipProvider.disableHoverableContent": "组内提示在指针移进面板时都不保持打开.",
    "TooltipHint.label": "提示文字. 必填.",
    "TooltipHint.side": "优先出现的方位.",
    "TooltipHint.delayDuration": "打开延迟 (毫秒), 默认 0.",
    "TooltipHint.contentClassName": "提示面板的类名.",
    "TooltipHint.children": "触发元素, 必须能接 ref (按钮等). 必填.",
  },
  propsNote: "Tooltip 必须在 TooltipProvider 里; 只是给一个图标按钮配一句话时用 TooltipHint, 它自带 Provider.",
  height: 300,
  render: (props) => <TooltipDemo {...props} />,
  usage,
  examples: [
    {
      id: "hint",
      title: "TooltipHint: 一个按钮一句话",
      desc: "省掉 Provider, Root, Trigger asChild 三层, 默认立即打开.",
      code: `<TooltipHint label="通知设置" side="bottom">\n  <Button size="icon" variant="ghost" aria-label="通知设置">\n    <span aria-hidden className="icon-[solar--bell-linear] size-4" />\n  </Button>\n</TooltipHint>`,
      render: () => (
        <TooltipHint label="通知设置" side="bottom">
          <Button size="icon" variant="ghost" aria-label="通知设置">
            <span aria-hidden className="icon-[solar--bell-linear] size-4 bg-current" />
          </Button>
        </TooltipHint>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦触发器时立即显示提示 (不等延迟)." },
    { keys: ["Esc"], action: "关闭提示, 焦点留在触发器上." },
    { keys: ["读屏"], action: "提示内容作为触发器的描述读出; 只有图标的按钮仍要自己的 aria-label." },
  ],
};
