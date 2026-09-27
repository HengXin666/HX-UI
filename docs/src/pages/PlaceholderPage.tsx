import type { JSX } from "react";
import { H2, P } from "../components/DocKit";

/** 还没写文档的组件占位。页面结构与真实页一致, 免得点进来像坏了。 */
export function PlaceholderPage({ label, desc }: { label: string; desc: string }): JSX.Element {
  return (
    <>
      <P>{desc}</P>
      <H2>示例</H2>
      <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-8 text-center text-[12.5px] text-muted-foreground">
        这一页的示例还没写。
      </div>
      <P>该组件已可从 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">@hx/ui</code> 导入使用。</P>
    </>
  );
}
