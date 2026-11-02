import type { BlockNode, Cta, LinkGroup } from "../../../../../src/blocks/_shared/types";
import type { ActivityItem, KpiItem, OnboardingStep } from "../../../../../src/blocks/dashboard";
import type { SeriesDef } from "../../../../../src/charts/Charts";

/**
 * 仪表盘整页模板 (V2-03) 的全部数据. 时间一律 ISO 串, 图表数据按范围分组, 全部可 JSON 序列化.
 * 图表种类用 kind 字符串描述, 由页面组件映射到 src/charts 的 HxAreaChart / HxBarChart.
 */

export type DashChartKind = "area" | "bar";

/** 图表的一行: 横轴取 name, 其余键对应各系列的 dataKey. */
export type DashRow = Record<string, string | number>;

/** 一块图表面板的数据: 范围切换的每一档在 data 里都有一组行. */
export interface DashChartData {
  id: string;
  kind: DashChartKind;
  title: string;
  description?: string;
  value?: string;
  footer?: string;
  height: number;
  ranges: Array<{ value: string; label: string }>;
  defaultRange: string;
  series: SeriesDef<DashRow>[];
  data: Record<string, DashRow[]>;
}

export interface DashWorkspaceData {
  brand: string;
  title: string;
  currentHref: string;
  sidebar: LinkGroup[];
  kpis: KpiItem[];
  charts: [DashChartData, DashChartData];
  activity: { title: string; items: ActivityItem[]; now: string; viewAll: Cta; max: number };
  checklist: { title: string; description: string; steps: OnboardingStep[] };
}

const HOME = "/app/overview";
const CHART_HEIGHT = 240;
const RANGE_WEEK = "7d";
const RANGE_MONTH = "30d";
const RANGES = [
  { value: RANGE_WEEK, label: "7 天" },
  { value: RANGE_MONTH, label: "30 天" },
];

const SIDEBAR: LinkGroup[] = [
  {
    title: "工作台",
    items: [
      { label: "概览", href: HOME, icon: "icon-[solar--widget-5-linear]" },
      { label: "分析", href: "/app/analytics", icon: "icon-[solar--chart-2-linear]" },
      { label: "报表", href: "/app/reports", icon: "icon-[solar--document-text-linear]", badge: "2" },
    ],
  },
  {
    title: "运营",
    items: [
      { label: "订单", href: "/app/orders", icon: "icon-[solar--cart-large-2-linear]", badge: "18" },
      { label: "客户", href: "/app/customers", icon: "icon-[solar--users-group-rounded-linear]" },
      { label: "设置", href: "/app/settings", icon: "icon-[solar--settings-linear]" },
    ],
  },
];

const KPIS: KpiItem[] = [
  { key: "mrr", label: "月度经常性收入", value: "¥ 486,200", trend: { value: 9.6, label: "较上月" }, sparkline: [31, 33, 34, 36, 38, 41, 44, 48] },
  { key: "active", label: "活跃账户", value: "12,408", trend: { value: 4.2, label: "较上周" }, sparkline: [10, 11, 11, 12, 11, 12, 12, 13] },
  { key: "churn", label: "流失率", value: "1.8%", trend: { value: -0.4, better: "down", label: "较上月" }, tone: "good" },
  { key: "nps", label: "NPS", value: "52", hint: "目标 55", trend: { value: 3, label: "较上季" } },
];

const REVENUE: DashChartData = {
  id: "dash-revenue",
  kind: "area",
  title: "收入趋势",
  description: "按日汇总, 已扣除退款",
  value: "¥ 128,400",
  footer: "数据每 15 分钟同步一次",
  height: CHART_HEIGHT,
  ranges: RANGES,
  defaultRange: RANGE_WEEK,
  series: [{ dataKey: "revenue", name: "收入" }],
  data: {
    [RANGE_WEEK]: [
      { name: "周一", revenue: 16200 },
      { name: "周二", revenue: 15400 },
      { name: "周三", revenue: 18900 },
      { name: "周四", revenue: 17600 },
      { name: "周五", revenue: 21300 },
      { name: "周六", revenue: 20100 },
      { name: "周日", revenue: 18900 },
    ],
    [RANGE_MONTH]: [
      { name: "第 1 周", revenue: 98400 },
      { name: "第 2 周", revenue: 112700 },
      { name: "第 3 周", revenue: 119300 },
      { name: "第 4 周", revenue: 128400 },
    ],
  },
};

const SIGNUPS: DashChartData = {
  id: "dash-signups",
  kind: "bar",
  title: "新增注册",
  description: "按渠道拆分",
  value: "1,946",
  footer: "付费渠道含搜索与信息流广告",
  height: CHART_HEIGHT,
  ranges: RANGES,
  defaultRange: RANGE_WEEK,
  series: [
    { dataKey: "organic", name: "自然" },
    { dataKey: "paid", name: "付费" },
  ],
  data: {
    [RANGE_WEEK]: [
      { name: "周一", organic: 182, paid: 96 },
      { name: "周二", organic: 171, paid: 104 },
      { name: "周三", organic: 205, paid: 88 },
      { name: "周四", organic: 196, paid: 112 },
      { name: "周五", organic: 224, paid: 131 },
      { name: "周六", organic: 148, paid: 77 },
      { name: "周日", organic: 139, paid: 73 },
    ],
    [RANGE_MONTH]: [
      { name: "第 1 周", organic: 1120, paid: 610 },
      { name: "第 2 周", organic: 1215, paid: 655 },
      { name: "第 3 周", organic: 1190, paid: 702 },
      { name: "第 4 周", organic: 1265, paid: 681 },
    ],
  },
};

const ACTIVITY: ActivityItem[] = [
  { id: "ev-1", actor: { name: "陈思" }, action: "发布了版本", target: { label: "v3.4.0", href: "/app/releases" }, time: "2026-11-03T16:52:00+08:00" },
  { id: "ev-2", actor: { name: "Marco Rossi" }, action: "退款了", target: { label: "订单 #8812", href: "/app/orders" }, time: "2026-11-03T15:40:00+08:00" },
  { id: "ev-3", actor: { name: "系统" }, action: "完成了每日数据备份", time: "2026-11-03T03:00:00+08:00", icon: "icon-[solar--server-square-linear]" },
  { id: "ev-4", actor: { name: "李然" }, action: "邀请了", target: { label: "4 位成员" }, time: "2026-11-02T19:15:00+08:00" },
  { id: "ev-5", actor: { name: "Priya" }, action: "关闭了工单", target: { label: "#1207", href: "/app/tickets" }, time: "2026-10-30T10:05:00+08:00" },
];

const STEPS: OnboardingStep[] = [
  { id: "workspace", title: "创建工作区", done: true },
  { id: "team", title: "邀请团队成员", description: "一起处理订单与工单.", done: true },
  { id: "source", title: "连接数据源", description: "接入店铺或数据库后图表自动出数.", done: false, cta: { label: "去连接", href: "/app/settings/sources" } },
  { id: "alerts", title: "设置告警", description: "流失率或延迟超阈值时通知你.", done: false, cta: { label: "去设置", href: "/app/settings/alerts" } },
];

export const DASH_WORKSPACE: DashWorkspaceData = {
  brand: "Northwind Admin",
  title: "概览",
  currentHref: HOME,
  sidebar: SIDEBAR,
  kpis: KPIS,
  charts: [REVENUE, SIGNUPS],
  activity: { title: "最近动态", items: ACTIVITY, now: "2026-11-03T17:00:00+08:00", viewAll: { label: "查看全部", href: "/app/activity" }, max: 5 },
  checklist: { title: "上手清单", description: "完成这几步, 仪表盘就能自动出数.", steps: STEPS },
};

/** 整页区块序列: 仪表盘外壳 (侧栏 + 顶栏) 内含 KpiRow -> ChartPanel x2 -> ActivityFeed -> OnboardingChecklist. */
export const DASH_BLOCKS: BlockNode[] = [{ type: "DashboardWorkspace", key: "dash", props: { data: DASH_WORKSPACE } }];
