import type * as React from "react";
import { BorderBeam } from "@/effects/border-beam";

/** 浏览器外框: 把活组件当产品截图放进首屏. */
export function BrowserFrame({ url = "app.tally.cn", children }: { url?: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border bg-card/80 p-1.5 shadow-float backdrop-blur">
      <BorderBeam duration={10} />
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="mx-auto rounded-md bg-muted px-3 py-0.5 text-xs text-muted-foreground">{url}</span>
      </div>
      <div className="overflow-hidden rounded-xl border bg-background text-left">{children}</div>
    </div>
  );
}
