import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@sites/_blocks/analytics/segmented";
import { AnimatedNumber } from "@/motion/animated-number";
import { Reveal } from "@/motion/reveal";
import { cn } from "@/lib/utils";

export interface Plan {
  name: string;
  description: string;
  monthly: number;
  /** 按年时的月均价 */
  yearly: number;
  features: string[];
  cta: string;
  featured?: boolean;
  currency?: string;
}

/** 定价: 一整块分栏 (发丝线分隔), 推荐档用浅底区分, 月 / 年切换数字滚动. */
export function Pricing({ plans, yearlyNote = "省 20%" }: { plans: Plan[]; yearlyNote?: string }) {
  const [cycle, setCycle] = React.useState<"m" | "y">("y");
  const cols = plans.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4";
  return (
    <div>
      <div className="mb-8 flex">
        <Segmented value={cycle} onChange={setCycle} options={[{ value: "m", label: "按月" }, { value: "y", label: `按年 · ${yearlyNote}` }]} />
      </div>
      <Reveal className={cn("grid gap-px overflow-hidden rounded-xl border bg-border", cols)}>
        {plans.map((p) => (
          <div key={p.name} className={cn("flex flex-col p-7 md:p-8", p.featured ? "bg-muted/30 dark:bg-muted/20" : "bg-background")}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{p.name}</h3>
              {p.featured && <span className="text-xs text-muted-foreground">最多团队选择</span>}
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{p.description}</p>
            <div className="mt-8 flex items-baseline gap-1 tabular">
              <span className="text-muted-foreground">{p.currency ?? "¥"}</span>
              <AnimatedNumber value={cycle === "m" ? p.monthly : p.yearly} from={cycle === "m" ? p.monthly : p.yearly} duration={0.5} className="text-[2.75rem] font-semibold leading-none tracking-[-0.03em]" />
              <span className="text-sm text-muted-foreground">/ 月</span>
            </div>
            <Button className="mt-8 h-10" variant={p.featured ? "default" : "outline"}>{p.cta}</Button>
            <ul className="mt-8 space-y-3 border-t pt-6 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </Reveal>
    </div>
  );
}
