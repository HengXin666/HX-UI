import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/blocks/analytics/segmented";
import { AnimatedNumber } from "@/motion/animated-number";
import { BorderBeam } from "@/effects/border-beam";
import { Stagger, StaggerItem } from "@/motion/reveal";
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

/** 定价: 月 / 年切换数字滚动, 推荐档流光边框. */
export function Pricing({ plans, yearlyNote = "省 20%" }: { plans: Plan[]; yearlyNote?: string }) {
  const [cycle, setCycle] = React.useState<"m" | "y">("y");
  return (
    <div>
      <div className="mb-10 flex justify-center">
        <Segmented
          value={cycle}
          onChange={setCycle}
          options={[{ value: "m", label: "按月" }, { value: "y", label: `按年 · ${yearlyNote}` }]}
        />
      </div>
      <Stagger className={cn("grid gap-4", plans.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4")}>
        {plans.map((p) => (
          <StaggerItem key={p.name}>
            <div className={cn("relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-soft", p.featured && "shadow-float md:-my-3 md:py-9")}>
              {p.featured && <BorderBeam duration={8} width={1.5} />}
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{p.name}</h3>
                {p.featured && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">最受欢迎</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">{p.currency ?? "¥"}</span>
                <AnimatedNumber value={cycle === "m" ? p.monthly : p.yearly} from={cycle === "m" ? p.monthly : p.yearly} duration={0.5} className="text-4xl font-semibold tracking-tight" />
                <span className="text-sm text-muted-foreground">/ 月</span>
              </div>
              <Button className="mt-6" variant={p.featured ? "default" : "outline"}>{p.cta}</Button>
              <ul className="mt-6 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-brand" />{f}</li>
                ))}
              </ul>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
