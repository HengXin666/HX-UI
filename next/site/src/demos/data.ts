/** 示例数据: 真实量级, 非整数. 固定种子, 每次渲染一致. */
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const r = rng(42);
const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export const revenue = MONTHS.map((m, i) => ({
  month: m,
  订阅: Math.round(182_000 + i * 21_400 + r() * 26_000),
  增购: Math.round(46_000 + i * 8_300 + r() * 14_000),
}));

export const daily = Array.from({ length: 30 }, (_, i) => ({
  day: `11/${String(i + 1).padStart(2, "0")}`,
  访问: Math.round(12_400 + Math.sin(i / 3) * 2_100 + r() * 1_800 + i * 140),
  访客: Math.round(7_620 + Math.sin(i / 3.4) * 1_300 + r() * 1_100 + i * 82),
}));

export const channels = [
  { key: "search", label: "搜索", value: 41_286 },
  { key: "direct", label: "直接访问", value: 28_913 },
  { key: "social", label: "社交", value: 17_402 },
  { key: "email", label: "邮件", value: 9_871 },
  { key: "ads", label: "广告", value: 6_315 },
];

export const regions = [
  { region: "华东", 本月: 1_284, 上月: 1_102 },
  { region: "华南", 本月: 986, 上月: 1_031 },
  { region: "华北", 本月: 872, 上月: 744 },
  { region: "西南", 本月: 531, 上月: 468 },
  { region: "海外", 本月: 402, 上月: 355 },
];

export const spark = (base: number, n = 16) => Array.from({ length: n }, (_, i) => base + Math.sin(i / 2) * base * 0.08 + r() * base * 0.1 + i * base * 0.01);

export interface Order {
  id: string;
  customer: string;
  plan: "团队版" | "专业版" | "企业版";
  amount: number;
  status: "已支付" | "待支付" | "已退款";
  date: string;
}
const NAMES = ["林知远", "陈默", "周屿", "苏晚", "顾行舟", "许南星", "沈清禾", "江屿白", "叶知秋", "宋鹤", "唐果", "白芷", "陆川", "温言", "秦朗", "夏槿"];
const PLANS: Order["plan"][] = ["团队版", "专业版", "企业版"];
const ST: Order["status"][] = ["已支付", "已支付", "已支付", "待支付", "已退款"];
export const orders: Order[] = Array.from({ length: 64 }, (_, i) => ({
  id: `TL-${(20_481 + i * 37).toString()}`,
  customer: NAMES[i % NAMES.length],
  plan: PLANS[Math.floor(r() * 3)],
  amount: Math.round((290 + r() * 4_800) * 100) / 100,
  status: ST[Math.floor(r() * ST.length)],
  date: `2026-11-${String(21 - (i % 20)).padStart(2, "0")}`,
}));
