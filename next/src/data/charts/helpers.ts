/**
 * 图表的纯工具 (格式化, 配置, 日期, 统计). 不写 "use client": 不碰 React / 浏览器,
 * 服务端组件 (Next.js App Router) 也能直接调用, 比如在服务端先算好数据再交给图表.
 * 各图表模块从这里引, 并照旧 re-export, 2.0.0 的导入路径不变.
 */
import type { ChartConfig } from "@/components/ui/chart";
import type { ProfileBin } from "./volume-profile";

const compact = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });
/** 紧凑数字: 12345 -> "1.2万" */
export const formatCompact = (v: number): string => compact.format(v);

export interface SeriesSpec {
  key: string;
  label: string;
  color?: string;
}

/** 系列 -> ChartContainer 的 config, 没给颜色的按 --chart-1..5 轮换 */
export function toConfig(series: SeriesSpec[]): ChartConfig {
  return Object.fromEntries(
    series.map((s, i) => [s.key, { label: s.label, color: s.color ?? `var(--chart-${(i % 5) + 1})` }]),
  );
}

/** 上千点时每帧插值会在低端机掉帧, 超过这个数自动关动画. */
export const ANIMATION_POINT_LIMIT = 800;

const DAY = 86400000;
const toDay = (s: string) => { const [y, mo, d] = s.split("-").map(Number); return Math.round(Date.UTC(y, mo - 1, d) / DAY); };
const toStr = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);
/** 甘特图的日期小工具 ("YYYY-MM-DD" <-> 天序号), 改期和顺延依赖时用 */
export const ganttDate = { toDay, toStr, add: (s: string, n: number) => toStr(toDay(s) + n) };

/** A 股一整天的分钟标签: 09:30–11:30, 13:01–15:00, 共 241 个 */
export function aShareMinutes() {
  const out: string[] = [];
  const push = (h: number, m: number) => out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  for (let k = 0; k <= 120; k++) { const t = 9 * 60 + 30 + k; push(Math.floor(t / 60), t % 60); }
  for (let k = 1; k <= 120; k++) { const t = 13 * 60 + k; push(Math.floor(t / 60), t % 60); }
  return out;
}

/** 价值区: 从量最大的档位 (POC) 向两边扩, 每次并入量更大的一侧, 直到覆盖 share */
export function valueAreaOf(bins: ProfileBin[], share = 0.7) {
  const s = [...bins].sort((a, b) => a.price - b.price);
  if (!s.length) return { poc: 0, lo: 0, hi: 0 };
  const total = s.reduce((a, b) => a + b.volume, 0);
  let p = 0; s.forEach((b, i) => { if (b.volume > s[p].volume) p = i; });
  let lo = p, hi = p, acc = s[p].volume;
  while (acc < total * share && (lo > 0 || hi < s.length - 1)) {
    const dn = lo > 0 ? s[lo - 1].volume : -1, upv = hi < s.length - 1 ? s[hi + 1].volume : -1;
    if (upv >= dn) { hi++; acc += upv; } else { lo--; acc += dn; }
  }
  return { poc: s[p].price, lo: s[lo].price, hi: s[hi].price };
}
