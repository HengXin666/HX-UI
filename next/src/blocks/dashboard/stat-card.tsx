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
    <div className={cn("group relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-float", className)}>
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          {Icon && <Icon className="size-4" />}
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
        <AnimatedNumber value={value} format={format} className="truncate text-3xl font-semibold tracking-tight" />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {trend && <Sparkline values={trend} color={good === false ? "var(--destructive)" : "var(--brand)"} />}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
