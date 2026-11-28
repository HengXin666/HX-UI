"use client";

import { AnimatePresence, m } from "motion/react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

interface FunnelStep {
  label: string;
  value: number;
}

interface ConversionFunnelProps {
  steps: FunnelStep[];
  /** 横向 (条形) 或纵向 (漏斗形) */
  layout?: "bars" | "funnel";
  color?: string;
  format?: (v: number) => string;
  /** 显示相邻两步转化率 */
  showRate?: boolean;
  className?: string;
}

const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "—");

/** 转化漏斗: 每一步的人数, 相对首步的占比, 和上一步到这一步的流失. 宽度变化时平滑过渡, 步骤增删时进出场并让位. */
export function ConversionFunnel({ steps, layout = "bars", color = "var(--chart-1)", format = (v) => v.toLocaleString("zh-CN"), showRate = true, className }: ConversionFunnelProps) {
  const reduced = useReducedMotion();
  const top = steps[0]?.value || 1;
  const t = reduced ? { duration: 0.2 } : { type: "spring" as const, stiffness: 160, damping: 24 };
  // 步骤增删: 新步骤淡入下落, 删掉的淡出, 其余步骤用 layout 滑到新位置. 减弱动效时只淡入淡出
  const item = {
    layout: reduced ? false : ("position" as const),
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 },
    transition: reduced ? { duration: 0.2 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
  };
  if (layout === "funnel") {
    return (
      <ol className={cn("mx-auto grid w-full max-w-md gap-1", className)} aria-label="转化漏斗">
        <AnimatePresence initial={false} mode="popLayout">
        {steps.map((s, i) => {
          const w = Math.max(18, (s.value / top) * 100);
          return (
            <m.li key={s.label} data-k={s.label} {...item} className="relative grid justify-items-center">
              <m.div initial={false} animate={{ width: `${w}%`, opacity: 1 - i * 0.12 }} transition={t}
                className="flex h-11 items-center justify-center rounded-md text-sm font-medium text-white" style={{ background: color }}>
                <span className="truncate px-2 tabular-nums">{format(s.value)}</span>
              </m.div>
              <span className="mt-0.5 text-xs text-muted-foreground">{s.label}{showRate && i > 0 ? ` · 转化 ${pct(s.value, steps[i - 1].value)}` : ""}</span>
            </m.li>
          );
        })}
        </AnimatePresence>
      </ol>
    );
  }
  return (
    <ol className={cn("grid w-full gap-3", className)} aria-label="转化漏斗">
      <AnimatePresence initial={false} mode="popLayout">
      {steps.map((s, i) => (
        <m.li key={s.label} data-k={s.label} {...item}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">{s.label}</span>
            <span className="tabular-nums"><span className="font-semibold">{format(s.value)}</span><span className="ml-2 text-xs text-muted-foreground">{pct(s.value, top)}</span></span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <m.div initial={false} animate={{ scaleX: s.value / top }} transition={t} className="h-full origin-left rounded-full" style={{ background: color }} />
          </div>
          {showRate && i < steps.length - 1 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              ↓ 下一步转化 <span className="tabular-nums text-foreground">{pct(steps[i + 1].value, s.value)}</span>
              <span className="ml-2 tabular-nums text-destructive">流失 {format(s.value - steps[i + 1].value)}</span>
            </p>
          )}
        </m.li>
      ))}
      </AnimatePresence>
    </ol>
  );
}
