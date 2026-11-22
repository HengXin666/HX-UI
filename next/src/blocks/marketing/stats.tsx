import { AnimatedNumber } from "@/motion/animated-number";
import { cn } from "@/lib/utils";

export interface Stat {
  value: number;
  unit?: string;
  label: string;
  decimals?: number;
}

/** 数据条: 发丝线分格, 大数字 + 小单位 + 说明. 数字进视口滚动一次. */
export function Stats({ items, className }: { items: Stat[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 border-t lg:grid-cols-4", className)}>
      {items.map((s, i) => (
        <div key={s.label} className={cn("border-b py-8 pr-4 lg:border-b-0 lg:py-10", i % 2 === 1 && "border-l pl-5 lg:pl-8", i >= 1 && "lg:border-l lg:pl-8")}>
          <dd className="flex items-baseline gap-1 tabular">
            <AnimatedNumber value={s.value} format={{ maximumFractionDigits: s.decimals ?? 0, minimumFractionDigits: s.decimals ?? 0 }} className="text-4xl font-semibold tracking-[-0.03em] md:text-5xl" />
            {s.unit && <span className="text-lg text-muted-foreground">{s.unit}</span>}
          </dd>
          <dt className="mt-2 text-sm text-muted-foreground">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}
