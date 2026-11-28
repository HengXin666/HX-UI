import * as React from "react";
import { ShareTreemap, type TreemapNode } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, DataOps, seeded } from "./_chart";

// 演示数据为虚构
const NESTED: TreemapNode[] = [
  { name: "数码", children: [{ name: "手机", value: 4200 }, { name: "耳机", value: 1300 }, { name: "平板", value: 1650 }, { name: "配件", value: 620 }] },
  { name: "家居", children: [{ name: "灯具", value: 980 }, { name: "床品", value: 1420 }, { name: "收纳", value: 540 }] },
  { name: "食品", children: [{ name: "零食", value: 1180 }, { name: "咖啡", value: 760 }, { name: "茶饮", value: 430 }] },
  { name: "美妆", children: [{ name: "护肤", value: 1560 }, { name: "彩妆", value: 690 }] },
  { name: "运动", children: [{ name: "跑鞋", value: 880 }, { name: "服饰", value: 520 }] },
];
const MORE: Record<string, TreemapNode[]> = {
  数码: [{ name: "手表", value: 940 }, { name: "相机", value: 720 }],
  家居: [{ name: "厨具", value: 860 }],
  食品: [{ name: "酒水", value: 640 }],
  美妆: [{ name: "香氛", value: 480 }],
  运动: [{ name: "户外", value: 760 }],
};
const flat = (d: TreemapNode[]) => d.flatMap((g) => g.children!);

export default function ShareTreemapDemo({ values }: DemoProps) {
  const [tree, setTree] = React.useState(NESTED);
  const rnd = React.useRef(seeded(19));
  const leaves = flat(tree);
  const total = leaves.reduce((s, l) => s + (l.value ?? 0), 0);
  const addable = tree.filter((g) => MORE[g.name].some((x) => !g.children!.some((c) => c.name === x.name)));
  return (
    <ChartCard title="11 月各类目 GMV" value={`¥${(total / 10000).toFixed(2)} 亿`} delta={<span className="text-muted-foreground">{leaves.length} 个子类目</span>} wide>
      <DataOps
        addLabel="新增子类目" canAdd={addable.length > 0} canRemove={leaves.length > 4}
        onAdd={() => setTree((t) => {
          const g = t.find((x) => MORE[x.name].some((m) => !x.children!.some((c) => c.name === m.name)));
          if (!g) return t;
          const pick = MORE[g.name].find((m) => !g.children!.some((c) => c.name === m.name))!;
          return t.map((x) => (x === g ? { ...x, children: [...x.children!, pick] } : x));
        })}
        onRemove={() => setTree((t) => {
          const all = t.flatMap((g) => g.children!.map((c) => [g.name, c.name] as const));
          const [gn, cn] = all[Math.floor(rnd.current() * all.length)];
          // 分组删空了就整组去掉
          return t.map((g) => (g.name === gn ? { ...g, children: g.children!.filter((c) => c.name !== cn) } : g)).filter((g) => g.children!.length);
        })}
        onUpdate={() => setTree((t) => t.map((g) => ({ ...g, children: g.children!.map((c) => ({ ...c, value: Math.round((c.value ?? 0) * (0.5 + rnd.current())) })) })))}
        onReset={() => setTree(NESTED)}
      />
      <ShareTreemap data={values.nested ? tree : flat(tree)} format={(v) => `¥${v}万`} ariaLabel="11 月各类目 GMV" />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </ChartCard>
  );
}
