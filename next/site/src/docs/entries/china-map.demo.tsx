import * as React from "react";
import { Minus, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { ChinaMap, type ChinaMapDatum } from "@/data";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";
import { ChartCard, seeded } from "./_chart";

// 演示数据为虚构, 量级大致参照各省经济体量
const GMV: [string, number][] = [
  ["广东", 1380], ["江苏", 1210], ["浙江", 1105], ["山东", 860], ["上海", 820], ["北京", 790], ["四川", 610], ["福建", 590],
  ["河南", 560], ["湖北", 520], ["湖南", 470], ["安徽", 450], ["河北", 380], ["重庆", 360], ["陕西", 310], ["江西", 280],
  ["辽宁", 270], ["广西", 230], ["云南", 220], ["天津", 210], ["山西", 180], ["贵州", 170], ["内蒙古", 150], ["新疆", 130],
  ["黑龙江", 120], ["吉林", 100], ["甘肃", 80], ["海南", 70],
];
const LATER: [string, number][] = [["宁夏", 40], ["青海", 30], ["西藏", 18], ["香港", 260], ["澳门", 45], ["台湾", 380]];
const EV: [string, number][] = [
  ["广东", 98.2], ["浙江", 71.5], ["江苏", 66.8], ["山东", 58.1], ["河南", 52.4], ["上海", 41.9], ["四川", 39.6], ["北京", 33.7],
  ["湖北", 30.2], ["湖南", 28.9], ["安徽", 27.3], ["河北", 26.5], ["福建", 25.1], ["重庆", 18.4], ["广西", 17.9], ["陕西", 16.2],
  ["天津", 14.8], ["江西", 13.6], ["云南", 13.1], ["海南", 9.8], ["贵州", 9.2], ["山西", 8.7], ["辽宁", 8.1],
];
const EV_LATER: [string, number][] = [["新疆", 5.1], ["内蒙古", 4.6], ["吉林", 3.9], ["黑龙江", 3.2], ["甘肃", 3.1], ["宁夏", 1.4], ["青海", 0.9]];
const toData = (rows: [string, number][]): ChinaMapDatum[] => rows.map(([name, value]) => ({ name, value }));

export default function ChinaMapDemo({ values }: DemoProps) {
  const kind = values.dataset === "ev" ? "ev" : "gmv";
  const base = kind === "ev" ? EV : GMV;
  const later = kind === "ev" ? EV_LATER : LATER;
  const [data, setData] = React.useState(() => toData(base));
  const [picked, setPicked] = React.useState<string | null>(null);
  const rnd = React.useRef(seeded(41));
  React.useEffect(() => { setData(toData(base)); }, [base]);

  const add = () => setData((d) => {
    const next = later.find(([n]) => !d.some((x) => x.name === n)) ?? GMV.concat(EV).find(([n]) => !d.some((x) => x.name === n));
    return next ? [...d, { name: next[0], value: next[1] }] : d;
  });
  // 删掉排在中间的一个, 排行里能看到后面的补上来
  const remove = () => setData((d) => {
    if (d.length <= 3) return d;
    const sorted = [...d].sort((a, b) => b.value - a.value);
    const gone = sorted[Math.min(sorted.length - 1, 1 + Math.floor(rnd.current() * 6))].name;
    return d.filter((x) => x.name !== gone);
  });
  const update = () => setData((d) => d.map((x) => ({ ...x, value: Math.round(x.value * (0.55 + rnd.current() * 0.9) * 10) / 10 })));

  const total = data.reduce((s, x) => s + x.value, 0);
  return (
    <ChartCard wide
      title={kind === "ev" ? "新能源汽车上险量（万辆）" : "各省 GMV（亿元）"}
      value={kind === "ev" ? `${total.toLocaleString("zh-CN", { maximumFractionDigits: 1 })} 万辆` : `${total.toLocaleString("zh-CN")} 亿`}
      delta={<span className="text-muted-foreground">{picked ? `已选 ${picked}` : `${data.length} 个地区`}</span>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={add}><Plus aria-hidden />新增地区</Button>
        <Button size="sm" variant="outline" onClick={remove}><Minus aria-hidden />删除一个</Button>
        <Button size="sm" variant="outline" onClick={update}><RefreshCw aria-hidden />更新数值</Button>
        <Button size="sm" variant="ghost" onClick={() => setData(toData(base))}><RotateCcw aria-hidden />重置</Button>
      </div>
      <ChinaMap
        data={data}
        mode={values.mode as "fill" | "bubble"}
        classes={Number(values.classes)}
        showLabels={!!values.showLabels}
        southSea={!!values.southSea}
        ranking={values.ranking ? 8 : 0}
        onSelect={setPicked}
        metric={kind === "ev" ? "上险量" : "GMV"}
        unit={kind === "ev" ? " 万辆" : " 亿"}
        ariaLabel={kind === "ev" ? "各省新能源汽车上险量" : "各省 GMV"}
      />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。边界数据来自阿里云 DataV.GeoAtlas，已简化。</p>
    </ChartCard>
  );
}
