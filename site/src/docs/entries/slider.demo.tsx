import * as React from "react";
import { Slider } from "@/components/ui/slider";
import type { DemoProps } from "../types";
import { FormCard } from "./_form";

const yuan = (v: number) => `¥${v.toLocaleString("zh-CN")}`;

export default function SliderDemo({ values }: DemoProps) {
  const step = Number(values.step);
  const range = Boolean(values.range);
  const [v, setV] = React.useState<number[]>(range ? [800, 3200] : [2400]);
  React.useEffect(() => setV(range ? [800, 3200] : [2400]), [range]);
  const label = range ? `${yuan(v[0])} – ${yuan(v[1] ?? v[0])}` : `${yuan(v[0])} 以内`;
  return (
    <FormCard title="筛选商品">
      <div className="flex items-baseline justify-between">
        <p id="price-l" className="text-sm font-medium">价格</p>
        {values.showValue ? <output aria-live="polite" className="font-mono text-sm tabular-nums">{label}</output> : null}
      </div>
      <Slider
        className="mt-4"
        min={0}
        max={5000}
        step={step}
        value={v}
        onValueChange={setV}
        disabled={Boolean(values.disabled)}
        aria-labelledby="price-l"
        thumbLabels={range ? ["最低价", "最高价"] : undefined}
        formatValue={yuan}
        minStepsBetweenThumbs={1}
      />
      <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground"><span>¥0</span><span>¥5,000</span></div>
    </FormCard>
  );
}
