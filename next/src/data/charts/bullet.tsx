import { AnimatePresence, m } from "motion/react";
import { useMemo, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { ease } from "@/motion/presets";
import { cn } from "@/lib/utils";

export interface BulletItem {
  label: string;
  /** 副标题, 如单位或口径 */
  sub?: string;
  value: number;
  target: number;
  /** 去年同期等对比值, 画成细线 */
  prior?: number;
  /** 区间分界 (由差到好), 如 [60, 80] 把刻度分成 差 / 中 / 好 三段; 不给按目标的 60% / 90% */
  ranges?: number[];
  /** 刻度上限; 不给取 max(value, target, ranges) 的 1.15 倍 */
  max?: number;
  /** lower: 越低越好 (退款率, 耗时) */
  better?: "higher" | "lower";
  format?: (v: number) => string;
}

export interface BulletProps {
  items: BulletItem[];
  /** 区间名, 由差到好 */
  rangeLabels?: string[];
  /** 达标的柱子变绿 */
  statusColor?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const pct = (v: number, max: number) => Math.max(0, Math.min(1, v / max));

/**
 * 子弹图: KPI 对目标. 一行一个指标: 底色是差 / 中 / 好区间, 粗条是实际值, 竖线是目标, 细线是去年同期.
 * 数值变化时条和目标线平滑移动 (只动 transform); 指标增删时整行展开 / 收起.
 */
export function Bullet({ items, rangeLabels = ["差", "中", "好"], statusColor = true, size = "md", className }: BulletProps) {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const t = { duration: reduced ? 0 : 0.42, ease: ease.out };
  const rows = useMemo(() => items.map((it) => {
    const lower = it.better === "lower";
    const ranges = it.ranges ?? (lower ? [it.target * 1.4, it.target * 1.1] : [it.target * 0.6, it.target * 0.9]);
    const max = it.max ?? Math.max(it.value, it.target, it.prior ?? 0, ...ranges) * 1.15;
    const met = lower ? it.value <= it.target : it.value >= it.target;
    // 区间由差到好; 越低越好时差在右边
    const edges = [0, ...[...ranges].sort((a, b) => a - b), max];
    const bands = edges.slice(0, -1).map((a, i) => ({ a, b: edges[i + 1], level: lower ? edges.length - 2 - i : i }));
    const fmt = it.format ?? ((v: number) => v.toLocaleString("zh-CN", { maximumFractionDigits: 1 }));
    const rate = lower ? it.target / Math.max(1e-9, it.value) : it.value / Math.max(1e-9, it.target);
    const level = bands.find((b) => it.value >= b.a && it.value <= b.b)?.level ?? 0;
    return { ...it, lower, max, met, bands, fmt, rate, level };
  }), [items]);
  const nLevels = Math.max(...rows.map((r) => r.bands.length), 1);
  const shade = (lv: number) => `color-mix(in oklch, var(--muted-foreground) ${10 + (lv / Math.max(1, nLevels - 1)) * 26}%, transparent)`;
  const barH = size === "sm" ? "h-2.5" : "h-3.5";
  const trackH = size === "sm" ? "h-5" : "h-7";

  return (
    <div className={cn("w-full", className)}>
      <ul className="divide-y">
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <m.li
              key={r.label}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ height: t, opacity: { duration: 0.2 } }}
              className="overflow-hidden"
              onPointerEnter={() => setHover(r.label)}
              onPointerLeave={() => setHover((h) => (h === r.label ? null : h))}
            >
              <div className={cn("grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_6.5rem] items-center gap-x-4 max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:gap-y-2", size === "sm" ? "py-2.5" : "py-3.5")}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.label}</p>
                  {r.sub && <p className="truncate text-xs text-muted-foreground">{r.sub}</p>}
                </div>
                {/* 刻度条 */}
                <div
                  role="meter"
                  aria-label={r.label}
                  aria-valuemin={0}
                  aria-valuemax={Math.round(r.max)}
                  aria-valuenow={r.value}
                  aria-valuetext={`${r.fmt(r.value)}，目标 ${r.fmt(r.target)}，${r.met ? "已达标" : "未达标"}，处于「${rangeLabels[r.level] ?? ""}」区间${r.prior != null ? `，去年同期 ${r.fmt(r.prior)}` : ""}`}
                  className={cn("relative w-full overflow-hidden rounded-sm max-sm:col-span-2 max-sm:row-start-2", trackH)}
                >
                  {r.bands.map((b, i) => (
                    <m.div key={i} aria-hidden className="absolute inset-y-0 left-0 w-full origin-left" style={{ background: shade(b.level) }}
                      initial={false} animate={{ x: `${pct(b.a, r.max) * 100}%`, scaleX: pct(b.b - b.a, r.max) }} transition={t} />
                  ))}
                  {/* 实际值 */}
                  <m.div aria-hidden className={cn("absolute top-1/2 left-0 w-full origin-left -translate-y-1/2 rounded-[2px]", barH)}
                    style={{ background: statusColor && r.met ? "var(--success)" : "color-mix(in oklch, var(--foreground) 88%, transparent)" }}
                    initial={{ scaleX: 0 }} animate={{ scaleX: pct(r.value, r.max) }} transition={t} />
                  {/* 去年同期 / 目标: 整宽的层按百分比平移, 里面一根细线 (只动 transform) */}
                  {r.prior != null && (
                    <m.div aria-hidden className="absolute inset-y-[28%] left-0 w-full" initial={false} animate={{ x: `${pct(r.prior, r.max) * 100}%` }} transition={t}>
                      <span className="absolute inset-y-0 -left-px w-0.5 rounded-full bg-[var(--chart-1)] shadow-[0_0_0_1px_var(--background)]" />
                    </m.div>
                  )}
                  <m.div aria-hidden className="absolute inset-y-1 left-0 w-full" initial={false} animate={{ x: `${pct(r.target, r.max) * 100}%` }} transition={t}>
                    <span className="absolute inset-y-0 -left-px w-0.5 rounded-full bg-foreground shadow-[0_0_0_1.5px_var(--background)]" />
                  </m.div>
                </div>
                <div className="text-right tabular-nums max-sm:row-start-1 max-sm:col-start-2">
                  <p className="font-mono text-sm font-semibold">{r.fmt(r.value)}</p>
                  <p className={cn("font-mono text-xs", r.met ? "text-success" : "text-muted-foreground")}>
                    {r.met ? "达标" : `${(r.rate * 100).toFixed(0)}%`}<span className="text-muted-foreground"> / {r.fmt(r.target)}</span>
                  </p>
                </div>
              </div>
              {/* 悬停时展开区间说明 */}
              <div className={cn("grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none", hover === r.label ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")} aria-hidden>
                <div className="min-h-0 overflow-hidden">
                  <p className="flex flex-wrap gap-x-3 gap-y-1 pb-3 text-[11px] text-muted-foreground sm:pl-[calc(7.5rem+1rem)]">
                    {[...r.bands].sort((a, b) => a.level - b.level).map((b) => (
                      <span key={b.level} className="inline-flex items-center gap-1"><span className="size-2 rounded-[2px]" style={{ background: shade(b.level) }} />{rangeLabels[b.level]} {r.fmt(b.a)}–{r.fmt(b.b)}</span>
                    ))}
                    <span className="inline-flex items-center gap-1"><span className="h-2.5 w-0.5 bg-foreground" />目标 {r.fmt(r.target)}</span>
                    {r.prior != null && <span className="inline-flex items-center gap-1"><span className="h-2 w-0.5 bg-[var(--chart-1)]" />去年同期 {r.fmt(r.prior)}</span>}
                    {r.lower && <span>越低越好</span>}
                  </p>
                </div>
              </div>
            </m.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
