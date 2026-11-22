import * as React from "react";
import { Spin, type SpinVariant } from "@/components/ui/spin";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";

/** 三个常见位置: 按钮里, 行内, 整块区域 */
export default function SpinDemo({ values }: DemoProps) {
  const [busy, setBusy] = React.useState(false);
  const v = values.variant as SpinVariant;
  const mode = values.mode as "fixed" | "rotate";
  const speed = Number(values.speed);
  return (
    <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
      <div className="grid place-items-center gap-3 rounded-2xl border bg-background/85 p-6 shadow-float backdrop-blur sm:row-span-2">
        <span className="text-brand"><Spin size={Number(values.size)} variant={v} mode={mode} speed={speed} label="正在生成报表" /></span>
        <p className="text-sm text-muted-foreground">正在生成报表…</p>
      </div>
      <div className="flex items-center justify-center rounded-2xl border bg-background/85 p-5 shadow-float backdrop-blur">
        <Button disabled={busy} onClick={() => { setBusy(true); setTimeout(() => setBusy(false), 1800); }}>
          {busy && <Spin size="sm" variant="ring2" speed={speed} />}{busy ? "保存中" : "保存"}
        </Button>
      </div>
      <div className="flex items-center justify-center gap-2 rounded-2xl border bg-background/85 p-5 text-sm text-muted-foreground shadow-float backdrop-blur">
        <Spin size="sm" variant={v} speed={speed} /> 同步中 3/12
      </div>
    </div>
  );
}
