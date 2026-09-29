import type { JSX } from "react";
import { Button, Tooltip, TooltipContent, TooltipHint, TooltipProvider, TooltipTrigger } from "@hx/ui";
import { Callout, H2, P, Preview, PropsTable } from "../components/DocKit";

/**
 * Tooltip 页。
 *
 * 这一页存在的意义不只是"展示悬浮提示": 它是本库**依赖早已装好、封装却是空的那一批**
 * 的代表。package.json 里 radix-ui 是全量安装的 (55 个子包), 但在此之前只用了 6 个。
 * 换句话说 Tooltip 一直是可用的, 只是没人把它拼出来 —— 于是下游各自写
 * title= 属性顶着 (那个要等 1 秒、样式不可控、触摸设备上完全不出现)。
 */
export function TooltipPage(): JSX.Element {
  return (
    <>
      <P>
        面板用<b className="text-foreground">前景色反相</b> (bg-foreground / text-background), 不是 popover 那种卡片面。
        原因: 提示是"附在指针旁的临时标签", 不该和常驻面板抢同一层视觉重量 —— 靠反相拉开层级, 而不是靠加阴影。
      </P>

      <Callout title="Provider 的默认延迟被改成 0">
        radix 原本是 700ms。对一个工具型界面来说, 想确认某个图标按钮是什么却要等将近一秒,
        体验上等于没有提示。需要滞后的场景由使用方显式传 delayDuration。
      </Callout>

      <H2>一行式: TooltipHint</H2>
      <P>
        最常见的场景是"一个图标按钮 + 一句说明"。不用它的话, 每次都要手写
        Root / Trigger asChild / Portal / Content 四层。它把这件事收成一个 label 属性。
      </P>
      <Preview
        align="center"
        code={`<TooltipHint label="刷新">
  <Button variant="outline" size="icon" aria-label="刷新">
    <span className="icon-[solar--refresh-linear]" />
  </Button>
</TooltipHint>

<TooltipHint label="已启用" side="right">
  <span className="text-[12px] text-muted-foreground">悬停我</span>
</TooltipHint>`}
      >
        <TooltipHint label="刷新">
          <Button variant="outline" size="icon" aria-label="刷新">
            <span className="icon-[solar--refresh-linear] size-3.5 bg-current" />
          </Button>
        </TooltipHint>
        <TooltipHint label="已启用" side="right">
          <span className="cursor-default text-[12px] text-muted-foreground">悬停我</span>
        </TooltipHint>
      </Preview>

      <H2>手动拼装</H2>
      <P>
        需要自定义内容 (多行、带快捷键、放按钮) 时用原始四件套, 它们与 radix 的 API 一一对应。
      </P>
      <Preview
        align="center"
        code={`<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="sm">完整信息</Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="flex-col items-start gap-0.5">
      <span className="font-medium">按来源分组</span>
      <span className="opacity-70">同一出口的账号会排在一起</span>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm">完整信息</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex-col items-start gap-0.5">
              <span className="font-medium">按来源分组</span>
              <span className="opacity-70">同一出口的账号会排在一起</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Preview>

      <H2>几种方向</H2>
      <Preview
        align="center"
        code={`{(["top", "right", "bottom", "left"] as const).map((side) => (
  <TooltipHint key={side} label={side} side={side}>
    <Button variant="outline" size="sm">{side}</Button>
  </TooltipHint>
))}`}
      >
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <TooltipHint key={side} label={"来自 " + side} side={side}>
            <Button variant="outline" size="sm">{side}</Button>
          </TooltipHint>
        ))}
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "TooltipHint.label", type: "ReactNode", desc: "提示内容。这一项必给。" },
          { name: "TooltipHint.side", type: '"top" | "right" | "bottom" | "left"', default: '"top"', desc: "出现方向。" },
          { name: "TooltipHint.delayDuration", type: "number", default: "0", desc: "该实例单独的延迟, 覆盖 Provider。" },
          { name: "TooltipContent.showArrow", type: "boolean", default: "true", desc: "是否画小三角。" },
          { name: "TooltipContent.sideOffset", type: "number", default: "6", desc: "与触发元素的间距。" },
          { name: "TooltipProvider.delayDuration", type: "number", default: "0", desc: "全局默认延迟 (radix 原生是 700)。" },
        ]}
      />

      <H2>注意</H2>
      <P>
        触发元素必须能接收 ref。给自研组件套 TooltipTrigger asChild 时, 那个组件要转发 ref,
        否则提示不会出现 —— 而且不会有任何报错。库内所有基础件都已转发。
      </P>
    </>
  );
}
