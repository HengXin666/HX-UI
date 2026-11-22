import { animate, m, useMotionValue, useTransform } from "motion/react";
import { useEffect, useId } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface GaugeBand {
  /** 到这个值为止用这个颜色 */
  to: number;
  color: string;
  label?: string;
}

interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  /** 中心数字的格式 */
  format?: (v: number) => string;
  /** 分段颜色, 不给则整条用 color */
  bands?: GaugeBand[];
  color?: string;
  /** 弧的角度, 默认 240 */
  sweep?: number;
  size?: number;
  thickness?: number;
  /** 指针 (仪表盘风格) 或进度弧 */
  variant?: "arc" | "needle";
  className?: string;
}

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
};
const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};

/** 仪表盘: 单个指标与目标的距离 (健康分, 达成率, 负载). 数值变化时弧和数字一起过渡. */
export function Gauge({ value, min = 0, max = 100, label, format = (v) => String(Math.round(v)), bands, color = "var(--chart-1)", sweep = 240, size = 220, thickness = 14, variant = "arc", className }: GaugeProps) {
  const uid = useId();
  const reduced = useReducedMotion();
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const mv = useMotionValue(min);
  useEffect(() => {
    const c = animate(mv, clamp(value), reduced ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 18 });
    return () => c.stop();
  }, [value, min, max, reduced]); // eslint-disable-line react-hooks/exhaustive-deps
  const cx = 100, cy = 100, r = 100 - thickness / 2 - 2;
  const a0 = -sweep / 2, a1 = sweep / 2;
  const angle = (v: number) => a0 + ((v - min) / (max - min)) * sweep;
  const full = arcPath(cx, cy, r, a0, a1);
  const progress = useTransform(mv, (v) => (v - min) / (max - min));
  const needle = useTransform(mv, (v) => `rotate(${angle(v)}deg)`);
  const text = useTransform(mv, (v) => format(v));
  const activeColor = bands ? (bands.find((b) => clamp(value) <= b.to) ?? bands[bands.length - 1]).color : color;
  const bottom = Math.max(...[a0, a1].map((a) => polar(cx, cy, r + thickness / 2, a)[1]), cy + 26);
  return (
    <div role="meter" aria-valuemin={min} aria-valuemax={max} aria-valuenow={clamp(value)} aria-valuetext={format(clamp(value))} aria-label={label}
      className={cn("relative mx-auto", className)} style={{ width: size }}>
      <svg viewBox={`0 0 200 ${bottom + 2}`} className="block w-full overflow-visible" aria-hidden>
        <path d={full} fill="none" stroke="var(--muted)" strokeWidth={thickness} strokeLinecap="round" />
        {bands && variant === "needle" &&
          bands.map((b, i) => {
            const from = i === 0 ? min : bands[i - 1].to;
            return <path key={i} d={arcPath(cx, cy, r, angle(from) + (i ? 1 : 0), angle(Math.min(b.to, max)))} fill="none" stroke={b.color} strokeWidth={thickness} strokeLinecap={i === 0 || i === bands.length - 1 ? "round" : "butt"} opacity={0.85} />;
          })}
        {variant === "arc" && (
          <m.path d={full} fill="none" stroke={activeColor} strokeWidth={thickness} strokeLinecap="round" style={{ pathLength: progress, transition: "stroke 250ms" }} id={uid} />
        )}
        {variant === "needle" && (
          <m.g style={{ transform: needle, transformOrigin: `${cx}px ${cy}px` }}>
            <path d={`M${cx - 3.5} ${cy} L${cx} ${cy - r + thickness} L${cx + 3.5} ${cy} Z`} fill="var(--foreground)" />
            <circle cx={cx} cy={cy} r={7} fill="var(--foreground)" />
            <circle cx={cx} cy={cy} r={3} fill="var(--background)" />
          </m.g>
        )}
      </svg>
      <div className={cn("pointer-events-none absolute inset-x-0 text-center", variant === "needle" ? "bottom-0" : "top-1/2 -translate-y-1/3")}>
        <m.p className="text-3xl font-semibold tabular-nums tracking-tight">{text}</m.p>
        {label && <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>}
      </div>
    </div>
  );
}
