import * as React from "react";
import { AnimatePresence, m } from "motion/react";
import { AreaTrend, BarCompare, Donut, Sparkline } from "@/data";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import type { DemoProps } from "../types";
import { DataOps, seeded } from "./_chart";

// 演示数据为虚构
type Month = { id: number; m: string; rev: number; cost: number };
const monthLabel = (id: number) => `${((5 + id) % 12) + 1}月`; // id 0 = 6月
const TREND0: Month[] = [182000, 205000, 198000, 241000, 268000, 312000].map((rev, id) => ({
  id, m: monthLabel(id), rev, cost: [121000, 133000, 129000, 150000, 162000, 171000][id],
}));
type Channel = { ch: string; now: number; prev: number };
const CHANNEL0: Channel[] = [
  { ch: "官网", now: 128000, prev: 96000 },
  { ch: "小程序", now: 94000, prev: 88000 },
  { ch: "门店", now: 61000, prev: 72000 },
  { ch: "分销", now: 29000, prev: 18000 },
];
const CHANNEL_POOL: Channel[] = [
  { ch: "直播", now: 52000, prev: 31000 },
  { ch: "社群", now: 23000, prev: 20000 },
  { ch: "企业采购", now: 41000, prev: 45000 },
  { ch: "海外", now: 17000, prev: 9000 },
];
// 每个渠道固定颜色, 增删时其余扇区不换色
type Share = { key: string; label: string; value: number; color: string };
const SHARE0: Share[] = [
  { key: "web", label: "官网", value: 41, color: "var(--chart-1)" },
  { key: "mini", label: "小程序", value: 30, color: "var(--chart-2)" },
  { key: "store", label: "门店", value: 20, color: "var(--chart-3)" },
  { key: "agent", label: "分销", value: 9, color: "var(--chart-4)" },
];
const SHARE_POOL: Share[] = [
  { key: "live", label: "直播", value: 14, color: "var(--chart-5)" },
  { key: "group", label: "社群", value: 7, color: "color-mix(in oklch, var(--chart-2) 50%, var(--muted-foreground))" },
  { key: "b2b", label: "企业采购", value: 11, color: "color-mix(in oklch, var(--chart-1) 50%, var(--muted-foreground))" },
];
const SPARK0 = {
  rev: [182, 205, 198, 241, 268, 312],
  ord: [3200, 3500, 3400, 3900, 4300, 4812],
  ref: [2.6, 2.4, 2.5, 2.1, 1.9, 1.8],
};
const yuan = (n: number) => `${Math.round(n / 10000)}万`;
const wan = (n: number) => `¥${(n / 10000).toLocaleString("zh-CN", { maximumFractionDigits: 1 })} 万`;
const pct = (a: number, b: number) => `${a >= b ? "+" : ""}${(((a - b) / b) * 100).toFixed(1)}%`;

/** 真实场景: 经营看板的一张卡片. 操作条演示新增 / 删除 / 更新时的进场, 移位, 退场 */
export default function ChartsDemo({ values }: DemoProps) {
  const type = String(values.type);
  const series2 = Boolean(values.compare);
  const reduced = useReducedMotion();
  const rnd = React.useRef(seeded(7));
  const jitter = (v: number, k = 0.35) => Math.round(v * (1 - k + rnd.current() * k * 2));

  const [trend, setTrend] = React.useState(TREND0);
  const [channels, setChannels] = React.useState(CHANNEL0);
  const [share, setShare] = React.useState(SHARE0);
  const [spark, setSpark] = React.useState({ ...SPARK0, offset: 0 });

  const ops = {
    area: {
      addLabel: "追加一个月", removeLabel: "移除最早月",
      canAdd: true, canRemove: trend.length > 3,
      onAdd: () => setTrend((d) => {
        const last = d[d.length - 1];
        const id = last.id + 1;
        return [...d, { id, m: monthLabel(id), rev: jitter(last.rev * 1.04, 0.15), cost: jitter(last.cost * 1.02, 0.1) }];
      }),
      onRemove: () => setTrend((d) => d.slice(1)),
      onUpdate: () => setTrend((d) => d.map((x) => ({ ...x, rev: jitter(x.rev), cost: jitter(x.cost, 0.2) }))),
      onReset: () => setTrend(TREND0),
    },
    bar: {
      addLabel: "新增渠道", removeLabel: "删除一个",
      canAdd: channels.length < CHANNEL0.length + CHANNEL_POOL.length, canRemove: channels.length > 2,
      onAdd: () => setChannels((d) => {
        const next = [...CHANNEL0, ...CHANNEL_POOL].find((c) => !d.some((x) => x.ch === c.ch));
        if (!next) return d;
        // 插到中间, 两侧的柱子让位
        const at = Math.floor(d.length / 2);
        return [...d.slice(0, at), next, ...d.slice(at)];
      }),
      onRemove: () => setChannels((d) => { const gone = Math.floor(rnd.current() * d.length); return d.filter((_, i) => i !== gone); }),
      onUpdate: () => setChannels((d) => d.map((x) => ({ ...x, now: jitter(x.now), prev: jitter(x.prev) }))),
      onReset: () => setChannels(CHANNEL0),
    },
    donut: {
      addLabel: "新增渠道", removeLabel: "删除一个",
      canAdd: share.length < SHARE0.length + SHARE_POOL.length, canRemove: share.length > 2,
      onAdd: () => setShare((d) => {
        const next = [...SHARE0, ...SHARE_POOL].find((c) => !d.some((x) => x.key === c.key));
        return next ? [...d, next] : d;
      }),
      onRemove: () => setShare((d) => { const gone = Math.floor(rnd.current() * d.length); return d.filter((_, i) => i !== gone); }),
      onUpdate: () => setShare((d) => d.map((x) => ({ ...x, value: Math.max(2, jitter(x.value, 0.5)) }))),
      onReset: () => setShare(SHARE0),
    },
    sparkline: {
      addLabel: "推入新点", removeLabel: "删除最新点",
      canAdd: true, canRemove: spark.rev.length > 3,
      // 滑动窗口: 末尾进一个, 开头出一个, offset 加 1 让线平滑左移
      onAdd: () => setSpark((s) => {
        const push = (a: number[], k: number) => [...a.slice(1), Math.round(a[a.length - 1] * (1 + (rnd.current() - 0.45) * k) * 10) / 10];
        return { rev: push(s.rev, 0.2), ord: push(s.ord, 0.15), ref: push(s.ref, 0.15), offset: s.offset + 1 };
      }),
      onRemove: () => setSpark((s) => ({ ...s, rev: s.rev.slice(0, -1), ord: s.ord.slice(0, -1), ref: s.ref.slice(0, -1) })),
      onUpdate: () => setSpark((s) => ({ ...s, rev: s.rev.map((v) => jitter(v, 0.2)), ord: s.ord.map((v) => jitter(v, 0.2)), ref: s.ref.map((v) => Math.round(v * (0.8 + rnd.current() * 0.4) * 10) / 10) })),
      onReset: () => setSpark({ ...SPARK0, offset: 0 }),
    },
  }[type as "area" | "bar" | "donut" | "sparkline"];

  const last = trend[trend.length - 1];
  const prev = trend[trend.length - 2];
  const shareTotal = share.reduce((s, x) => s + x.value, 0);
  const sparkLast = (a: number[]) => a[a.length - 1];
  const item = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 8 } };

  return (
    <div className="w-full max-w-2xl rounded-2xl border bg-background/85 p-5 shadow-float backdrop-blur">
      {ops && <DataOps {...ops} />}
      {type === "area" && (
        <>
          <p className="text-sm text-muted-foreground">近 {trend.length} 个月营收</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            ¥{last.rev.toLocaleString("zh-CN")}{" "}
            {prev && <span className={`text-sm font-normal ${last.rev >= prev.rev ? "text-success" : "text-destructive"}`}>{pct(last.rev, prev.rev)}</span>}
          </p>
          <AreaTrend className="mt-4" data={trend} x="m" stacked={Boolean(values.stacked)} valueFormatter={yuan}
            animation={{ match: { dataKey: "id" } }}
            series={series2 ? [{ key: "rev", label: "营收" }, { key: "cost", label: "成本" }] : [{ key: "rev", label: "营收" }]} />
        </>
      )}
      {type === "bar" && (
        <>
          <p className="text-sm text-muted-foreground">各渠道营收 · 本月与上月</p>
          <BarCompare className="mt-4" data={channels} x="ch" stacked={Boolean(values.stacked)} horizontal={Boolean(values.horizontal)}
            animation={{ match: { dataKey: "ch" } }}
            series={series2 ? [{ key: "now", label: "本月" }, { key: "prev", label: "上月" }] : [{ key: "now", label: "本月" }]} />
        </>
      )}
      {type === "donut" && (
        <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
          <Donut data={share} center={wan(shareTotal * 7600)} centerLabel="本月营收" />
          <ul className="grid gap-2 text-sm" aria-label="渠道占比">
            <AnimatePresence initial={false} mode="popLayout">
              {share.map((s) => {
                return (
                  <m.li key={s.key} layout={!reduced} {...item} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="flex items-center gap-2">
                    <span aria-hidden className="size-2.5 rounded-sm" style={{ background: s.color }} />
                    <span className="flex-1">{s.label}</span>
                    <span className="tabular-nums text-muted-foreground">{((s.value / shareTotal) * 100).toFixed(0)}%</span>
                  </m.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      )}
      {type === "sparkline" && (
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ["营收", `¥${sparkLast(spark.rev)} 万`, spark.rev, "var(--chart-1)"],
            ["订单", sparkLast(spark.ord).toLocaleString("zh-CN"), spark.ord, "var(--chart-2)"],
            ["退款率", `${sparkLast(spark.ref)}%`, spark.ref, "var(--chart-3)"],
          ] as const).map(([l, v, d, c]) => (
            <div key={l} className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="mt-0.5 font-semibold tabular-nums">{v}</p>
              <div className="mt-2" role="img" aria-label={`${l} 近 ${d.length} 期走势`}><Sparkline values={[...d]} color={c} offset={spark.offset} /></div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </div>
  );
}
