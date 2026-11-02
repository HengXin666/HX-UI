import type { JSX } from "react";
import { ActivityFeed, ChartPanel, DashboardShell, KpiRow, OnboardingChecklist } from "../../../../../src/blocks/dashboard";
import { HxAreaChart } from "../../../../../src/charts/Charts";
import { DASH_DOC } from "../../../../../src/constants/blocks-dashboard-v110";
import {
  DASH_DEMO_ACTIVITY,
  DASH_DEMO_KPIS,
  DASH_DEMO_NOW,
  DASH_DEMO_RANGES,
  DASH_DEMO_SERIES,
  DASH_DEMO_SIDEBAR,
  DASH_DEMO_STEPS,
} from "./dashboardDemoData";

const SERIES = [{ dataKey: "revenue", name: "收入" }];

/** 收入面积图面板: chart 用函数形态, 按当前范围取数. */
export function RevenuePanel(): JSX.Element {
  return (
    <ChartPanel
      title="收入趋势"
      description="按日汇总, 含退款冲减"
      value="¥ 128,400"
      range={{ options: DASH_DEMO_RANGES, defaultValue: "7d" }}
      chart={(range) => <HxAreaChart data={DASH_DEMO_SERIES[range ?? "7d"]} series={SERIES} height={240} />}
      footer="数据每 15 分钟更新"
    />
  );
}

/** 完整仪表盘页: 外壳 + 指标行 + 图表 + 动态 + 上手清单. idPrefix 避免多实例锚点冲突. */
export function DashboardDemo({ idPrefix = "" }: { idPrefix?: string }): JSX.Element {
  return (
    <DashboardShell
      sidebar={DASH_DEMO_SIDEBAR}
      brand={<span className={DASH_DOC.brand}>HX Admin</span>}
      title="仪表盘"
      mainId={`${idPrefix}v110-main`}
    >
      <KpiRow items={DASH_DEMO_KPIS} pad="none" />
      <div className={DASH_DOC.grid}>
        <RevenuePanel />
        <OnboardingChecklist steps={DASH_DEMO_STEPS} description="完成这几步, 仪表盘就能自动出数." />
      </div>
      <ActivityFeed items={DASH_DEMO_ACTIVITY} now={DASH_DEMO_NOW} viewAll={{ label: "查看全部", href: "#activity" }} />
    </DashboardShell>
  );
}
