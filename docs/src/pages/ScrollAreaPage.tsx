import type { JSX } from "react";
import { DOC_SAMPLE, ScrollArea } from "@hx/ui";
import { H2, P, Preview } from "../components/DocKit";
import { Props } from "../components/DocSpec";

/** ScrollArea 页 */
export function ScrollAreaPage(): JSX.Element {
  return (
    <>
      <H2>ScrollArea</H2>
      <P>
        容器里要放带圆角或浮层的窄条内容时用它  原生滚动条在 Linux / Windows 上是一条
        几十像素宽的实心条, 压在圆角卡片边上会露出直角。整页滚动不需要它。
      </P>
      <Preview
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
            {Array.from({ length: DOC_SAMPLE.scrollRows }, (_, i) => (
              <div key={i}>第 {i + 1} 行</div>
            ))}
          </div>
        </ScrollArea>
      </Preview>

      <H2>属性</H2>
      <Props spec={`
ScrollArea.type ~ "hover" | "always" | "scroll" | "auto" ~ "hover" ~ 滚动条出现策略
`} />
    </>
  );
}
