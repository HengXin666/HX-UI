import { ScrollStack, ScrollStackItem } from "@/scroll/scroll-stack";
import type { DemoProps } from "../types";

const CARDS = [
  { no: "01", title: "设计令牌", body: "颜色、圆角、阴影都从令牌来，亮暗主题一处切换。", bg: "oklch(0.43 0.23 264)" },
  { no: "02", title: "动效系统", body: "150–250ms，只动 transform 与 opacity，减少动态效果时只淡入。", bg: "oklch(0.45 0.23 305)" },
  { no: "03", title: "图表", body: "新增、删除、更新都有过渡，二维三维同一套数据接口。", bg: "oklch(0.47 0.17 38)" },
  { no: "04", title: "视觉组件", body: "撑得起首屏的效果，每一层都能改。", bg: "oklch(0.45 0.13 165)" },
  { no: "05", title: "落地页", body: "整页拿走，改文案就能上线。", bg: "oklch(0.32 0.02 270)" },
];

export default function ScrollStackDemo({ values: v, onEvent }: DemoProps) {
  return (
    <ScrollStack
      itemDistance={Number(v.itemDistance)}
      itemStackDistance={Number(v.itemStackDistance)}
      stackPosition={`${v.stackPosition}%`}
      itemScale={Number(v.itemScale)}
      baseScale={Number(v.baseScale)}
      dimAmount={Number(v.dimAmount)}
      blurAmount={Number(v.blurAmount)}
      tiltAmount={Number(v.tiltAmount)}
      rotationAmount={Number(v.rotationAmount)}
      holdDistance={Number(v.holdDistance)}
      smoothScroll={Boolean(v.smoothScroll)}
      snap={Boolean(v.snap)}
      onStackComplete={v.toast ? () => onEvent?.("最后一张叠好了") : undefined}
      className="absolute inset-0"
      innerClassName="max-w-[560px] pt-24"
    >
      <p className="pointer-events-none absolute inset-x-0 top-8 text-center text-xs text-muted-foreground">在这个框里往下滚 ↓</p>
      {CARDS.map((c) => (
        <ScrollStackItem key={c.no} itemClassName="h-64 p-8 text-white shadow-[0_12px_40px_-12px_rgb(0_0_0/0.5)] sm:h-72 sm:p-10" style={{ background: c.bg }}>
          <p className="font-mono text-xs tracking-[0.2em] text-white/85">{c.no}</p>
          <p className="mt-6 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{c.title}</p>
          <p className="mt-3 max-w-[30ch] text-sm leading-relaxed text-white/85">{c.body}</p>
        </ScrollStackItem>
      ))}
    </ScrollStack>
  );
}
