import * as React from "react";
import { HeatCalendar } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, DataOps, seeded } from "./_chart";

// 演示数据为虚构
const END = new Date(2026, 10, 22);
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(d.getDate() + n); return x; };
const dayValue = (d: Date, r: () => number, trend = 1) => {
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  return r() < 0.12 ? 0 : Math.round((weekend ? 70 : 40) * (0.3 + r()) * trend);
};
function initial() {
  const r = seeded(11);
  const out: Record<string, number> = {};
  for (let i = 0; i < 380; i++) { const d = addDays(END, -i); out[key(d)] = dayValue(d, r, 1 + (380 - i) / 600); }
  return out;
}

export default function HeatCalendarDemo({ values }: DemoProps) {
  const [state, setState] = React.useState(() => ({ end: END, data: initial() }));
  const rnd = React.useRef(seeded(29));
  return (
    <ChartCard title="每日订单" value={`截至 ${state.end.getMonth() + 1}月${state.end.getDate()}日`} wide>
      <DataOps
        addLabel="推进一天" removeLabel="撤回最新一天" canRemove={state.end > addDays(END, -14)}
        onAdd={() => setState((s) => { const end = addDays(s.end, 1); return { end, data: { ...s.data, [key(end)]: dayValue(end, rnd.current, 1.6) } }; })}
        onRemove={() => setState((s) => { const data = { ...s.data }; delete data[key(s.end)]; return { end: addDays(s.end, -1), data }; })}
        // 只改最近两周, 看颜色过渡
        onUpdate={() => setState((s) => {
          const data = { ...s.data };
          for (let i = 0; i < 14; i++) { const d = addDays(s.end, -i); data[key(d)] = dayValue(d, rnd.current, 1.4 + rnd.current()); }
          return { ...s, data };
        })}
        onReset={() => setState({ end: END, data: initial() })}
      />
      <HeatCalendar key={`${values.weeks}`} values={state.data} end={state.end} weeks={Number(values.weeks)} levels={Number(values.levels)} color={String(values.color)} unit=" 单" label="每日订单" />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </ChartCard>
  );
}
