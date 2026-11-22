import * as React from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import type { DemoProps } from "../types";
import { numberFormat } from "./_shared";

export default function AnimatedNumberDemo({ values }: DemoProps) {
  const kind = String(values.format);
  const base = Number(values.value);
  const [v, setV] = React.useState(kind === "percent" ? base / 100 : base);
  const fmt = React.useMemo(() => numberFormat(kind), [kind]);
  const bump = () => setV((x) => (kind === "percent" ? Math.max(0, Math.min(1, x + (Math.random() - 0.4) * 0.2)) : Math.max(0, Math.round(x * (0.8 + Math.random() * 0.5)))));
  return (
    <div className="flex flex-col items-center gap-6">
      <p className="font-mono text-xs tracking-wide text-muted-foreground">本月成交额</p>
      <AnimatedNumber value={v} format={fmt} duration={Number(values.duration)} from={Number(values.from)} className="text-6xl font-medium tracking-[-0.04em] sm:text-8xl" />
      <button type="button" onClick={bump} className="h-9 rounded-full border px-4 text-sm hover:bg-accent">随机变化</button>
    </div>
  );
}
