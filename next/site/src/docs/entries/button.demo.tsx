import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatefulButton } from "@/interactions/stateful-button";
import type { DemoProps } from "../types";

type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "shimmer";
type Size = "sm" | "default" | "lg";

/** 真实场景: 一张设置卡片底部的操作区. 提交流程打开时主按钮换成 StatefulButton */
export default function ButtonDemo({ values, onEvent }: DemoProps) {
  const [on, setOn] = React.useState(true);
  const variant = values.variant as Variant;
  const size = values.size as Size;
  const flow = String(values.flow);
  const label = String(values.label);
  const latency = Number(values.latency);
  const main = flow === "none" ? (
    <Button variant={variant} size={size}>
      {label}{values.icon ? <ArrowRight /> : null}
    </Button>
  ) : (
    <StatefulButton
      variant={variant}
      size={size}
      pendingLabel={String(values.pendingLabel)}
      successLabel={String(values.successLabel)}
      resetAfter={Number(values.resetAfter)}
      action={() => new Promise((ok, no) => setTimeout(() => {
        if (flow === "error") { no(new Error("网络错误")); onEvent?.("保存失败：网络错误"); } else ok(null);
      }, latency))}
    >
      {label}
    </StatefulButton>
  );
  return (
    <div className="w-full max-w-md rounded-2xl border bg-background/80 p-5 shadow-float backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">每日对账摘要</p>
          <p className="mt-1 text-sm text-muted-foreground">每天 09:00 发到 #财务 频道。</p>
        </div>
        <button type="button" role="switch" aria-checked={on} aria-label="每日对账摘要" onClick={() => setOn((v) => !v)} className="relative mt-0.5 h-6 w-10 shrink-0 rounded-full bg-muted transition-colors aria-checked:bg-foreground">
          <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow-sm transition-transform in-aria-checked:translate-x-4" />
        </button>
      </div>
      <div className="mt-5 flex items-center justify-end gap-2 border-t pt-4">
        <Button variant="ghost" size={size}>取消</Button>
        {main}
      </div>
    </div>
  );
}
