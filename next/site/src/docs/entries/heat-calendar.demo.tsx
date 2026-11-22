import { useMemo } from "react";
import { HeatCalendar } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, seeded } from "./_chart";

const END = new Date(2026, 10, 22);

export default function HeatCalendarDemo({ values }: DemoProps) {
  const data = useMemo(() => {
    const r = seeded(11);
    const out: Record<string, number> = {};
    for (let i = 0; i < 380; i++) {
      const d = new Date(END); d.setDate(END.getDate() - i);
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      const v = r() < 0.12 ? 0 : Math.round((weekend ? 70 : 40) * (0.3 + r()) * (1 + (380 - i) / 600));
      out[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`] = v;
    }
    return out;
  }, []);
  return (
    <ChartCard title="每日订单" wide>
      <HeatCalendar key={`${values.weeks}`} values={data} end={END} weeks={Number(values.weeks)} levels={Number(values.levels)} color={String(values.color)} unit=" 单" label="每日订单" />
    </ChartCard>
  );
}
