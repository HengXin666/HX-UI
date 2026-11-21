import type * as React from "react";
import { Stagger, StaggerItem } from "@/motion/reveal";
import { SpotlightCard } from "@/effects/spotlight-card";
import { cn } from "@/lib/utils";

export interface BentoFeature {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** 卡片内的视觉: 活组件 / 截图 / 图表 */
  visual?: React.ReactNode;
  /** 占几列 (6 列网格), 默认 2 */
  span?: 2 | 3 | 4 | 6;
}

const SPAN = { 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4", 6: "md:col-span-6" } as const;

/** 便当格特性区: 不等宽, 指针光斑, 交错入场. */
export function FeatureBento({ features, className }: { features: BentoFeature[]; className?: string }) {
  return (
    <Stagger className={cn("grid gap-4 md:grid-cols-6", className)}>
      {features.map((f) => (
        <StaggerItem key={f.title} className={SPAN[f.span ?? 2]}>
          <SpotlightCard className="flex h-full flex-col p-6 shadow-soft">
            {f.visual && <div className="relative -mx-2 -mt-2 mb-6 overflow-hidden rounded-lg">{f.visual}</div>}
            {f.icon && !f.visual && (
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <f.icon className="size-5" />
              </div>
            )}
            <h3 className="font-medium">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
          </SpotlightCard>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
