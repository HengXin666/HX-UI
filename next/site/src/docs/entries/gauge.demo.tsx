import { Gauge } from "@/data";
import type { DemoProps } from "../types";

const BANDS = [
  { to: 40, color: "var(--destructive)" },
  { to: 70, color: "var(--warning)" },
  { to: 100, color: "var(--success)" },
];

export default function GaugeDemo({ values }: DemoProps) {
  const v = Number(values.value);
  const needle = values.variant === "needle";
  return (
    <div className="grid w-full max-w-md justify-items-center rounded-2xl border bg-background/85 p-6 shadow-float backdrop-blur">
      <p className="justify-self-start text-sm text-muted-foreground">{needle ? "集群 CPU 负载" : "11 月营收目标"}</p>
      <Gauge className="mt-4" value={v} label={needle ? "当前负载" : "目标达成"} variant={values.variant as "arc" | "needle"}
        sweep={Number(values.sweep)} bands={values.bands ? (needle ? [...BANDS].reverse().map((b, i) => ({ ...b, to: [60, 85, 100][i] })) : BANDS) : undefined}
        format={(n) => `${Math.round(n)}%`} />
      <p className="mt-4 text-xs text-muted-foreground tabular-nums">{needle ? `${Math.round(v * 0.64)} / 64 核` : `¥${(v * 0.5).toFixed(1)} 万 / ¥50 万`}</p>
    </div>
  );
}
