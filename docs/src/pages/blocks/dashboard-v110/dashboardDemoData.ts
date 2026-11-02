import type { ActivityItem, KpiItem, LinkGroup, OnboardingStep } from "../../../../../src/blocks/dashboard";

/** V1-10 文档页演示数据. 全部可 JSON 序列化 (时间用 ISO 串), 适合 PageComposer / CMS 直接生成. */

/** 演示用的固定 "现在", 保证相对时间在 SSR 与截图回归中稳定. */
export const DASH_DEMO_NOW = Date.parse("2026-11-03T09:00:00Z");

export const DASH_DEMO_SIDEBAR: LinkGroup[] = [
  {
    title: "概览",
    items: [
      { label: "仪表盘", href: "#overview", icon: "icon-[solar--widget-5-linear]", current: true },
      { label: "分析", href: "#analytics", icon: "icon-[solar--chart-2-linear]" },
      { label: "报表", href: "#reports", icon: "icon-[solar--document-text-linear]", badge: "3" },
    ],
  },
  {
    title: "运营",
    items: [
      { label: "订单", href: "#orders", icon: "icon-[solar--cart-large-2-linear]", badge: "12" },
      { label: "客户", href: "#customers", icon: "icon-[solar--users-group-rounded-linear]" },
      { label: "设置", href: "#settings", icon: "icon-[solar--settings-linear]" },
    ],
  },
];

export const DASH_DEMO_KPIS: KpiItem[] = [
  { key: "revenue", label: "本月收入", value: "¥ 128,400", trend: { value: 12.4, label: "较上月" }, sparkline: [8, 9, 7, 11, 12, 10, 14, 15] },
  { key: "users", label: "活跃用户", value: "8,921", trend: { value: 3.1, label: "较上周" }, sparkline: [5, 6, 6, 7, 6, 8, 8, 9] },
  { key: "conversion", label: "转化率", value: "4.6%", trend: { value: -0.8, label: "较上周" }, hint: "目标 5%" },
  { key: "latency", label: "P95 延迟", value: "182 ms", trend: { value: -6.2, better: "down", label: "较昨日" }, tone: "good" },
];

/** 图表数据: 按范围分组, ChartPanel 的 chart 函数形态按当前范围取. */
export const DASH_DEMO_SERIES: Record<string, Array<{ name: string; revenue: number; orders: number }>> = {
  "7d": [
    { name: "周一", revenue: 4200, orders: 120 },
    { name: "周二", revenue: 3800, orders: 98 },
    { name: "周三", revenue: 5100, orders: 141 },
    { name: "周四", revenue: 4700, orders: 133 },
    { name: "周五", revenue: 6200, orders: 170 },
    { name: "周六", revenue: 7100, orders: 188 },
    { name: "周日", revenue: 6600, orders: 176 },
  ],
  "30d": [
    { name: "第 1 周", revenue: 26800, orders: 720 },
    { name: "第 2 周", revenue: 29100, orders: 801 },
    { name: "第 3 周", revenue: 31500, orders: 846 },
    { name: "第 4 周", revenue: 37700, orders: 1026 },
  ],
};

export const DASH_DEMO_RANGES = [
  { value: "7d", label: "7 天" },
  { value: "30d", label: "30 天" },
];

export const DASH_DEMO_ACTIVITY: ActivityItem[] = [
  { id: "a1", actor: { name: "林青" }, action: "发布了版本", target: { label: "v1.10.0", href: "#releases" }, time: "2026-11-03T08:57:00Z" },
  { id: "a2", actor: { name: "Alex Chen" }, action: "评论了", target: { label: "订单 #2041", href: "#orders" }, time: "2026-11-03T08:12:00Z" },
  { id: "a3", actor: { name: "系统" }, action: "完成了每日备份", time: "2026-11-03T03:00:00Z", icon: "icon-[solar--server-square-linear]" },
  { id: "a4", actor: { name: "王蕾" }, action: "邀请了", target: { label: "3 位成员" }, time: "2026-11-01T10:30:00Z" },
  { id: "a5", actor: { name: "Sam" }, action: "关闭了工单", target: { label: "#318", href: "#tickets" }, time: "2026-10-20T06:00:00Z" },
];

export const DASH_DEMO_STEPS: OnboardingStep[] = [
  { id: "account", title: "创建账号", done: true },
  { id: "invite", title: "邀请团队成员", description: "一起协作处理订单与工单.", done: true },
  { id: "connect", title: "连接数据源", description: "接入店铺或数据库后自动出图.", done: false, cta: { label: "去连接", href: "#connect" } },
  { id: "alert", title: "设置告警", done: false, cta: { label: "去设置", href: "#alerts" } },
];
