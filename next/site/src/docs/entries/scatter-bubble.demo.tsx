import * as React from "react";
import { ScatterBubble, type ScatterGroup } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, DataOps, seeded } from "./_chart";

// 演示数据为虚构
const r = seeded(7);
type Pt = { name: string; x: number; y: number; z: number };
const make = (names: string[], px: number, py: number): Pt[] => names.map((name) => {
  const x = Math.round(px * (0.5 + r()));
  const y = Math.round(py * (1.4 - x / (px * 1.6)) * (0.6 + r() * 0.8));
  return { name, x, y, z: Math.round(x * y * (0.2 + r() * 0.3)) };
});
type Group = { key: string; label: string; points: Pt[] };
const GROUPS: Group[] = [
  { key: "food", label: "食品", points: make(["坚果礼盒", "挂耳咖啡", "燕麦片", "牛肉干", "蜂蜜", "红茶", "果干"], 60, 2400) },
  { key: "home", label: "家居", points: make(["香薰", "抱枕", "台灯", "收纳盒", "保温杯", "床品四件套"], 160, 900) },
  { key: "digital", label: "数码", points: make(["耳机", "充电宝", "数据线", "键盘", "鼠标"], 260, 700) },
];
const EXTRA: Record<string, Pt[]> = {
  food: make(["气泡水", "冻干面"], 60, 2400),
  home: make(["香薰蜡烛", "地毯"], 160, 900),
  digital: make(["智能手表", "音箱"], 260, 700),
};

export default function ScatterBubbleDemo({ values }: DemoProps) {
  const [groups, setGroups] = React.useState(GROUPS);
  const rnd = React.useRef(seeded(31));
  const count = groups.reduce((s, g) => s + g.points.length, 0);
  const shown: ScatterGroup[] = values.groups ? groups : [{ key: "all", label: "商品", points: groups.flatMap((g) => g.points) }];
  const pts = values.bubble ? shown : shown.map((g) => ({ ...g, points: g.points.map(({ z: _z, ...p }) => p) }));
  return (
    <ChartCard title="商品单价 vs 月销量" value={`${count} 个 SKU`} delta={values.bubble ? <span className="text-muted-foreground">气泡 = 毛利</span> : undefined}>
      <DataOps
        addLabel="上架新品" removeLabel="下架一个" canAdd={groups.some((g) => EXTRA[g.key].some((e) => !g.points.some((p) => p.name === e.name)))} canRemove={count > 4}
        onAdd={() => setGroups((gs) => {
          const g = gs.find((x) => EXTRA[x.key].some((e) => !x.points.some((p) => p.name === e.name)));
          if (!g) return gs;
          const pick = EXTRA[g.key].find((e) => !g.points.some((p) => p.name === e.name))!;
          return gs.map((x) => (x === g ? { ...x, points: [...x.points, pick] } : x));
        })}
        onRemove={() => setGroups((gs) => {
          const all = gs.flatMap((g) => g.points.map((p) => [g.key, p.name] as const));
          const [gk, name] = all[Math.floor(rnd.current() * all.length)];
          return gs.map((g) => (g.key === gk ? { ...g, points: g.points.filter((p) => p.name !== name) } : g));
        })}
        onUpdate={() => setGroups((gs) => gs.map((g) => ({ ...g, points: g.points.map((p) => {
          const x = Math.max(5, Math.round(p.x * (0.8 + rnd.current() * 0.4)));
          const y = Math.max(10, Math.round(p.y * (0.6 + rnd.current() * 0.8)));
          return { ...p, x, y, z: Math.round(x * y * (0.2 + rnd.current() * 0.3)) };
        }) })))}
        onReset={() => setGroups(GROUPS)}
      />
      <ScatterBubble groups={pts} xLabel="单价" yLabel="销量" zLabel={values.bubble ? "毛利" : undefined} xFormatter={(v) => `¥${v}`} />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </ChartCard>
  );
}
