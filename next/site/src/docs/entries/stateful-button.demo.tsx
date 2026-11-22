import * as React from "react";
import { StatefulButton } from "@/interactions/stateful-button";
import type { DemoProps } from "../types";

/** 真实场景: 一张设置卡片, 改完开关再保存 */
export default function StatefulButtonDemo({ values, onEvent }: DemoProps) {
  const [on, setOn] = React.useState(true);
  const latency = Number(values.latency);
  const fail = Boolean(values.fail);
  return (
    <div className="w-full max-w-sm rounded-2xl border bg-background/80 p-5 shadow-float backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">每日对账摘要</p>
          <p className="mt-1 text-sm text-muted-foreground">每天 09:00 发到 #财务 频道。</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="每日对账摘要"
          onClick={() => setOn((v) => !v)}
          className="relative mt-0.5 h-6 w-10 shrink-0 rounded-full bg-muted transition-colors aria-checked:bg-foreground"
        >
          <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow-sm transition-transform in-aria-checked:translate-x-4" />
        </button>
      </div>
      <div className="mt-5 flex items-center justify-end gap-2 border-t pt-4">
        <span className="mr-auto font-mono text-xs text-muted-foreground">{on ? "已开启" : "已关闭"}</span>
        <StatefulButton
          size={values.size as "sm" | "default" | "lg"}
          variant={values.variant as "default" | "outline" | "secondary"}
          resetAfter={Number(values.resetAfter)}
          pendingLabel={String(values.pendingLabel)}
          successLabel={String(values.successLabel)}
          errorLabel={String(values.errorLabel)}
          action={() =>
            new Promise((ok, no) =>
              setTimeout(() => {
                if (fail) { no(new Error("网络错误")); onEvent?.("保存失败：网络错误"); }
                else ok(null);
              }, latency),
            )
          }
        >
          {String(values.label)}
        </StatefulButton>
      </div>
    </div>
  );
}
