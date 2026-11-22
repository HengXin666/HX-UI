import { Check } from "lucide-react";
import { BorderBeam } from "@/effects/border-beam";
import type { DemoProps } from "../types";

export default function BorderBeamDemo({ values }: DemoProps) {
  return (
    <div className="relative w-full max-w-xs rounded-2xl border bg-background/80 p-6 backdrop-blur">
      <BorderBeam duration={Number(values.duration)} color={String(values.color)} width={Number(values.width)} />
      <p className="font-mono text-xs text-muted-foreground">专业版</p>
      <p className="mt-2 text-4xl font-medium tracking-tight">¥99<span className="text-base text-muted-foreground"> / 月</span></p>
      <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
        {["不限项目数", "团队协作", "优先支持"].map((t) => <li key={t} className="flex items-center gap-2"><Check className="size-4 text-foreground" />{t}</li>)}
      </ul>
      <button type="button" className="mt-6 h-10 w-full rounded-lg bg-foreground text-sm font-medium text-background">升级</button>
    </div>
  );
}
