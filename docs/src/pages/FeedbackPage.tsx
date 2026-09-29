import type { JSX } from "react";
import { useState } from "react";
import { Progress, ProgressMeter, ScrollArea, Separator, Skeleton, SkeletonText } from "@hx/ui";
import { Callout, H2, P, Preview, PropsTable } from "../components/DocKit";

/** Progress / Skeleton / ScrollArea / Separator 页。 */
export function FeedbackPage(): JSX.Element {
  const [pct, setPct] = useState(37);

  return (
    <>
      <H2>Progress</H2>
      <P>
        用 radix 的 Root 而不是一个 div, 因为它把 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">role="progressbar"</code> 与
        aria-valuenow / min / max 一起给齐了。手写 div 的进度条在读屏软件里是<b className="text-foreground">静默</b>的 ——
        视觉上有条, 无障碍上什么都没有, 而且不写 aria 不会有任何报错提示。
      </P>
      <Preview
        align="start"
        code={`<Progress value={37} className="w-64" />
<Progress value={100} tone="success" className="w-64" />
<Progress value={62} tone="warning" className="w-64" />
<Progress value={18} tone="destructive" className="w-64" />

{/* 不定长: radix 在 value=null 时不给宽度, 由关键帧自己扫 */}
<Progress indeterminate className="w-64" />`}
      >
        <Progress value={37} className="w-64" aria-label="常规" />
        <Progress value={100} tone="success" className="w-64" aria-label="完成" />
        <Progress value={62} tone="warning" className="w-64" aria-label="警告" />
        <Progress value={18} tone="destructive" className="w-64" aria-label="失败" />
        <Progress indeterminate className="w-64" aria-label="进行中" />
      </Preview>

      <H2>ProgressMeter</H2>
      <P>
        抓取 / 导出这类"跑起来要盯着"的场景, 三样缺一都别扭: 光有条不知道在跑什么,
        只有条没有数值不知道还差多少。
      </P>
      <Preview
        align="start"
        code={`const [pct, setPct] = useState(37);

<ProgressMeter
  label="抓取账号"
  value={pct}
  max={100}
  hint={"已处理 " + pct + " / 100"}
  className="w-72"
/>
<button onClick={() => setPct((p) => Math.min(100, p + 13))}>推进 13%</button>`}
      >
        <ProgressMeter
          label="抓取账号"
          value={pct}
          max={100}
          hint={"已处理 " + pct + " / 100"}
          className="w-72"
        />
        <button
          type="button"
          onClick={() => setPct((p) => Math.min(100, p + 13))}
          className="self-end rounded-lg border border-border px-2.5 py-1 text-[11.5px] text-foreground transition-colors hover:bg-accent/50"
        >
          推进 13%
        </button>
      </Preview>

      <H2>Skeleton</H2>
      <P>
        只做一件事: 占住位置。不要用它模拟真实内容的形状细节 —— 那会变成一份要跟着真实布局
        同步维护的赝品, 界面一改就对不上。宽度用比例 (w-2/3) 而不是像素, 嵌进任何宽度的容器都不会溢出。
      </P>
      <Preview
        align="start"
        code={`<Skeleton className="h-3 w-64" />
<Skeleton className="h-3 w-40" />
<SkeletonText lines={3} className="w-64" />`}
      >
        <div className="flex w-64 flex-col gap-2">
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-3 w-40" />
          <SkeletonText lines={3} />
        </div>
      </Preview>

      <H2>ScrollArea</H2>
      <P>
        容器里要放带圆角或浮层的窄条内容时用它 —— 原生滚动条在 Linux / Windows 上是一条
        几十像素宽的实心条, 压在圆角卡片边上会露出直角。整页滚动不需要它。
      </P>
      <Preview
        align="start"
        code={`<ScrollArea className="h-32 w-64 rounded-lg border border-border/60">
  <div className="p-3 text-[12px]">
    {Array.from({ length: 20 }, (_, i) => (
      <div key={i}>第 {i + 1} 行</div>
    ))}
  </div>
</ScrollArea>`}
      >
        <ScrollArea className="h-32 w-64 rounded-lg border border-border/60">
          <div className="flex flex-col gap-1 p-3 text-[12px] text-muted-foreground">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i}>第 {i + 1} 行</div>
            ))}
          </div>
        </ScrollArea>
      </Preview>

      <H2>Separator</H2>
      <P>
        decorative 默认 true: 绝大多数分隔线只是排版留白, 让它进无障碍树反而会给读屏软件
        多播报一堆无意义的 "separator"。只有真正在切分两个语义区时才传 false。
      </P>
      <Preview
        align="start"
        code={`<div className="w-64">
  <div className="text-[12px]">上面</div>
  <Separator className="my-2" />
  <div className="text-[12px]">下面</div>
  <div className="mt-2 flex h-8 items-center gap-2 text-[12px]">
    <span>左</span>
    <Separator orientation="vertical" />
    <span>右</span>
  </div>
</div>`}
      >
        <div className="w-64">
          <div className="text-[12px] text-muted-foreground">上面</div>
          <Separator className="my-2" />
          <div className="text-[12px] text-muted-foreground">下面</div>
          <div className="mt-2 flex h-8 items-center gap-2 text-[12px] text-muted-foreground">
            <span>左</span>
            <Separator orientation="vertical" />
            <span>右</span>
          </div>
        </div>
      </Preview>

      <Callout title="不定长进度只改 transform">
        关键帧只动 translateX, 走合成器不触发重排。进度条是高频更新的组件
        (抓取进度可能每秒几十次), 用 width 表达会让整页反复重排。
      </Callout>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "Progress.value", type: "number", default: "0", desc: "0-100, 越界会被夹紧。" },
          { name: "Progress.indeterminate", type: "boolean", default: "false", desc: "不定长滚动, 此时 radix 收到 value=null。" },
          { name: "Progress.tone", type: '"primary" | "success" | "warning" | "destructive"', default: '"primary"', desc: "语义色。" },
          { name: "ProgressMeter.label / hint", type: "ReactNode", desc: "标题与下方补充。" },
          { name: "ProgressMeter.max", type: "number", default: "100", desc: "分母, 内部换算成百分比。" },
          { name: "SkeletonText.lines", type: "number", default: "3", desc: "行数, 末行自动短一截。" },
          { name: "ScrollArea.type", type: '"hover" | "always" | "scroll" | "auto"', default: '"hover"', desc: "滚动条出现策略。" },
          { name: "Separator.orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', desc: "方向。" },
          { name: "Separator.decorative", type: "boolean", default: "true", desc: "false 时进入无障碍树并带 role=separator。" },
        ]}
      />
    </>
  );
}
