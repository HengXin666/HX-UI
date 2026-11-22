import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { SpeedCounter } from "@/interactions/speed-counter";
import type { DemoProps } from "../types";
import { numberFormat } from "./_shared";

export default function SpeedCounterDemo({ values }: DemoProps) {
  const kind = String(values.format);
  const step = Number(values.step);
  const [v, setV] = React.useState(Number(values.value));
  const fmt = React.useMemo(() => numberFormat(kind), [kind]);
  const shown = kind === "percent" ? v / 100 : v;
  return (
    <div className="flex flex-col items-center gap-6">
      <p className="font-mono text-xs tracking-wide text-muted-foreground">库存</p>
      <SpeedCounter value={shown} format={fmt} duration={Number(values.duration)} className="text-6xl font-medium tracking-[-0.03em] sm:text-8xl" />
      <div className="flex gap-2">
        <button type="button" aria-label={`减少 ${step}`} onClick={() => setV((x) => Math.max(0, x - step))} className="grid size-10 place-items-center rounded-full border hover:bg-accent"><Minus className="size-4" /></button>
        <button type="button" aria-label={`增加 ${step}`} onClick={() => setV((x) => x + step)} className="grid size-10 place-items-center rounded-full border hover:bg-accent"><Plus className="size-4" /></button>
      </div>
    </div>
  );
}
