import type * as React from "react";
import { Stagger, StaggerItem } from "@/motion/reveal";
import { cn } from "@/lib/utils";

export interface GridFeature {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/** 特性网格: 发丝线分隔, 小图标与标题同行, 不用彩色图标底块. */
export function FeatureGrid({ features, columns = 3, className }: { features: GridFeature[]; columns?: 2 | 3 | 4; className?: string }) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <Stagger gap={0.05} className={cn("grid gap-px overflow-hidden rounded-xl border bg-border", cols, className)}>
      {features.map((f) => (
        <StaggerItem key={f.title} className="bg-background p-6 md:p-7">
          <h3 className="flex items-center gap-2 text-[15px] font-medium">
            {f.icon && <f.icon className="size-4 text-muted-foreground" />}
            {f.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
