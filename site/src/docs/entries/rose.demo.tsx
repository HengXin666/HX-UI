import * as React from "react";
import { Minus, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { Rose, type RoseDatum, type RoseSeries } from "@/data";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";
import { ChartCard, seeded } from "./_chart";

// 演示数据为虚构
const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const SALES_SERIES: RoseSeries[] = [
  { key: "store", name: "门店" },
  { key: "online", name: "线上" },
  { key: "live", name: "直播" },
];
function salesRow(label: string, i: number, r: () => number): RoseDatum {
  const season = 1 + 0.55 * Math.sin(((i - 2) / 12) * Math.PI * 2) + (i === 10 ? 1.1 : 0) + (i === 5 ? 0.5 : 0) - (i === 1 ? 0.35 : 0);
  return { label, store: Math.round((90 + r() * 40) * season), online: Math.round((120 + r() * 60) * season), live: Math.round((30 + r() * 50) * season * (1 + i / 14)) };
}
const DIRS = ["北", "东北偏北", "东北", "东北偏东", "东", "东南偏东", "东南", "东南偏南", "南", "西南偏南", "西南", "西南偏西", "西", "西北偏西", "西北", "西北偏北"];
const WIND_SERIES: RoseSeries[] = [
  { key: "s1", name: "0–2 m/s" },
  { key: "s2", name: "2–4 m/s" },
  { key: "s3", name: "4–6 m/s" },
  { key: "s4", name: "6 m/s 以上" },
];
function windRow(label: string, i: number, r: () => number): RoseDatum {
  // 主导风向东南 + 次主导西北
  const a = (i / 16) * Math.PI * 2;
  const w = 0.6 + 1.6 * Math.max(0, Math.cos(a - (6 / 16) * Math.PI * 2)) ** 2 + 0.9 * Math.max(0, Math.cos(a - (14 / 16) * Math.PI * 2)) ** 3;
  const k = (b: number) => Math.round(b * w * (0.8 + r() * 0.4) * 10) / 10;
  return { label, s1: k(1.6), s2: k(2.2), s3: k(1.3), s4: k(0.6) };
}
const build = (kind: string) => {
  const r = seeded(kind === "wind" ? 7 : 31);
  return kind === "wind" ? DIRS.map((d, i) => windRow(d, i, r)) : MONTHS.slice(0, 8).map((m, i) => salesRow(m, i, r));
};

export default function RoseDemo({ values }: DemoProps) {
  const kind = values.dataset === "wind" ? "wind" : "sales";
  const [data, setData] = React.useState(() => build(kind));
  const rnd = React.useRef(seeded(97));
  React.useEffect(() => { setData(build(kind)); }, [kind]);

  // 销售: 往后加一个月 / 删掉最早的月; 风向: 补回或去掉一个方位
  const add = () => setData((d) => {
    if (kind === "sales") {
      const last = MONTHS.indexOf(d[d.length - 1]?.label ?? "0月");
      const i = (last + 1) % 12;
      if (d.some((x) => x.label === MONTHS[i])) return d;
      return [...d, salesRow(MONTHS[i], i, rnd.current)];
    }
    const missing = DIRS.findIndex((x) => !d.some((y) => y.label === x));
    if (missing < 0) return d;
    const row = windRow(DIRS[missing], missing, rnd.current);
    const at = d.findIndex((y) => DIRS.indexOf(y.label) > missing);
    return at < 0 ? [...d, row] : [...d.slice(0, at), row, ...d.slice(at)];
  });
  const remove = () => setData((d) => {
    if (d.length <= 3) return d;
    if (kind === "sales") return d.slice(1);
    const at = Math.floor(rnd.current() * d.length);
    return d.filter((_, i) => i !== at);
  });
  const refresh = () => setData((d) => d.map((x) => {
    const y: RoseDatum = { ...x };
    for (const s of kind === "wind" ? WIND_SERIES : SALES_SERIES) y[s.key] = Math.max(0, Math.round(Number(x[s.key]) * (0.6 + rnd.current() * 0.8) * 10) / 10);
    return y;
  }));

  const series = kind === "wind" ? WIND_SERIES : SALES_SERIES;
  const total = data.reduce((s, d) => s + series.reduce((t, x) => t + Number(d[x.key]), 0), 0);
  return (
    <ChartCard
      title={kind === "wind" ? "全年风向频率（%）" : "各月销售额（万元）"}
      value={kind === "wind" ? `${data.length} 个方位` : `${total.toLocaleString("zh-CN")} 万`}
      delta={<span className="text-muted-foreground">{kind === "wind" ? "按风速分段堆叠" : `${data[0]?.label} – ${data[data.length - 1]?.label}`}</span>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={add}><Plus aria-hidden />{kind === "wind" ? "补回方位" : "新增月份"}</Button>
        <Button size="sm" variant="outline" onClick={remove}><Minus aria-hidden />{kind === "wind" ? "去掉方位" : "删除最早月"}</Button>
        <Button size="sm" variant="outline" onClick={refresh}><RefreshCw aria-hidden />刷新数据</Button>
        <Button size="sm" variant="ghost" onClick={() => setData(build(kind))}><RotateCcw aria-hidden />重置</Button>
      </div>
      <Rose
        data={data}
        series={series}
        scale={values.scale as "area" | "radius"}
        innerRadius={Number(values.innerRadius)}
        showLabels={!!values.showLabels}
        unit={kind === "wind" ? "%" : " 万"}
        ariaLabel={kind === "wind" ? "风向玫瑰图" : "月度销售玫瑰图"}
      />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。点图例可开关系列。</p>
    </ChartCard>
  );
}
