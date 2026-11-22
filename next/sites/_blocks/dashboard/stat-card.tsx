import type * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Sparkline } from "@/data/charts/sparkline";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: number;
  format?: Intl.NumberFormatOptions;
  /** 数值后的单位, 如 "ms" */
  suffix?: string;
  /** 环比, 0.124 = +12.4% */
  delta?: number;
  /** 越低越好的指标 (延迟 / 错误率), 颜色反转 */
  invert?: boolean;
  hint?: string;
  trend?: number[];
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

/** 指标卡: 弹簧数字 + 环比 + 迷你趋势. */
export function StatCard({ label, value, format, suffix, delta, invert, hint, trend, icon: Icon, className }: StatCardProps) {
  const good = delta === undefined ? undefined : invert ? delta <= 0 : delta >= 0;
  return (
    <div className={cn("@container group relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-xl border bg-card p-4 shadow-soft sm:gap-3 sm:p-5 transition-shadow hover:shadow-float", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm">
        <span className="inline-flex min-w-0 items-center gap-1.5 sm:gap-2">
          {Icon && <Icon className="size-4 shrink-0" />}
          {label}
        </span>
        {delta !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular", good ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive")}>
            {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta * 100).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="flex min-w-0 items-baseline gap-1">
        <AnimatedNumber value={value} format={format} className="truncate text-xl font-semibold tracking-tight @[10.5rem]:text-2xl @[15rem]:text-3xl" />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {trend && <Sparkline values={trend} color={good === false ? "var(--destructive)" : "var(--brand)"} />}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
