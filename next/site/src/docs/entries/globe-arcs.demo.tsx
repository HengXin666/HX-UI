import { GlobeArcs, type GlobeArc } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard } from "./_chart";

const C = {
  上海: [31.23, 121.47], 深圳: [22.54, 114.06], 洛杉矶: [34.05, -118.24], 纽约: [40.71, -74.0], 伦敦: [51.5, -0.12], 法兰克福: [50.11, 8.68],
  迪拜: [25.2, 55.27], 新加坡: [1.35, 103.82], 悉尼: [-33.87, 151.21], 圣保罗: [-23.55, -46.63], 东京: [35.68, 139.69], 首尔: [37.57, 126.98],
  孟买: [19.08, 72.88], 约翰内斯堡: [-26.2, 28.05], 墨西哥城: [19.43, -99.13], 雅加达: [-6.2, 106.85],
} as Record<string, [number, number]>;
const arc = (a: string, b: string, value: number): GlobeArc => ({ from: C[a], to: C[b], fromName: a, toName: b, value });

const ORDERS = [
  arc("上海", "洛杉矶", 18200), arc("上海", "纽约", 9600), arc("深圳", "伦敦", 12400), arc("深圳", "法兰克福", 8800), arc("上海", "悉尼", 6100),
  arc("深圳", "迪拜", 7300), arc("深圳", "圣保罗", 4200), arc("上海", "东京", 10500), arc("深圳", "新加坡", 9900), arc("上海", "墨西哥城", 3600),
  arc("深圳", "约翰内斯堡", 2400), arc("深圳", "孟买", 5200),
];
const CDN = [
  arc("东京", "新加坡", 640), arc("首尔", "新加坡", 420), arc("雅加达", "新加坡", 380), arc("悉尼", "新加坡", 300), arc("孟买", "法兰克福", 260),
  arc("伦敦", "法兰克福", 720), arc("约翰内斯堡", "法兰克福", 180), arc("迪拜", "法兰克福", 240), arc("圣保罗", "纽约", 330), arc("墨西哥城", "纽约", 290),
  arc("洛杉矶", "纽约", 810),
];

export default function GlobeArcsDemo({ values }: DemoProps) {
  const cdn = values.data === "cdn";
  const arcs = cdn ? CDN : ORDERS;
  const total = arcs.reduce((s, a) => s + (a.value ?? 0), 0);
  return (
    <ChartCard wide title={cdn ? "CDN 回源流量 · 近 1 小时" : "跨境订单流向 · 本月"} value={cdn ? `${(total / 1000).toFixed(2)} TB` : `${total.toLocaleString("zh-CN")} 单`}>
      <GlobeArcs
        arcs={arcs}
        valueLabel={cdn ? "回源" : "订单"}
        format={cdn ? (v) => `${v} GB` : (v) => `${v.toLocaleString("zh-CN")} 单`}
        flow={Boolean(values.flow)}
        autoRotate={Boolean(values.autoRotate)}
        focus={cdn ? [20, 60] : [28, 118]}
        label={cdn ? "CDN 回源地球飞线" : "跨境订单地球飞线"}
      />
    </ChartCard>
  );
}
