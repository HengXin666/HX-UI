import type { JSX } from "react";
import { Grid } from "../../../../../src/box/Grid";
import { PageComposer } from "../../../../../src/blocks/_shared";
import type { BlockRegistry } from "../../../../../src/blocks/_shared/types";
import { ActivityFeed, ChartPanel, DashboardShell, KpiRow, OnboardingChecklist } from "../../../../../src/blocks/dashboard";
import { HxAreaChart, HxBarChart } from "../../../../../src/charts/Charts";
import { BLOCK_DENSITY, BLOCK_PAD } from "../../../../../src/constants/blocks";
import { SkinSwitcher, type TemplateSkin } from "../shared/template-skins";
import { DASH_BLOCKS, type DashChartData, type DashChartKind, type DashRow, type DashWorkspaceData } from "./data";

/** data.ts 的 kind -> 图表渲染. 只在这里把字符串映射成组件, 数据保持可序列化. */
const CHART_BY_KIND: Record<DashChartKind, (panel: DashChartData, rows: DashRow[]) => JSX.Element> = {
  area: (panel, rows) => <HxAreaChart data={rows} series={panel.series} height={panel.height} />,
  bar: (panel, rows) => <HxBarChart data={rows} series={panel.series} height={panel.height} />,
};

/** 两块图表面板并排: 窄屏一列, lg 起两列. 列数与间距都走 Grid 的档位, 不写类名. */
const CHART_COLS = { base: 1, lg: 2 } as const;

function DashChart({ panel }: { panel: DashChartData }): JSX.Element {
  const render = CHART_BY_KIND[panel.kind];
  return (
    <ChartPanel
      id={panel.id}
      title={panel.title}
      description={panel.description}
      value={panel.value}
      footer={panel.footer}
      height={panel.height}
      range={{ options: panel.ranges, defaultValue: panel.defaultRange }}
      chart={(range) => render(panel, panel.data[range ?? panel.defaultRange] ?? [])}
    />
  );
}

/**
 * 仪表盘一屏: DashboardShell (侧栏 + 内置顶栏) -> KpiRow -> ChartPanel x2 -> ActivityFeed -> OnboardingChecklist.
 * 作为 PageComposer 的 registry 项使用, 只收 data.ts 里的 DashWorkspaceData.
 */
export function DashboardWorkspace({ id, data }: { id?: string; data: DashWorkspaceData }): JSX.Element {
  const [first, second] = data.charts;
  return (
    <DashboardShell
      id={id}
      brand={data.brand}
      title={data.title}
      sidebar={data.sidebar}
      currentHref={data.currentHref}
      mainId={id === undefined ? undefined : `${id}-main`}
    >
      <KpiRow items={data.kpis} pad={BLOCK_PAD.none} />
      <Grid cols={CHART_COLS} gap="md">
        <DashChart panel={first} />
        <DashChart panel={second} />
      </Grid>
      <ActivityFeed
        title={data.activity.title}
        items={data.activity.items}
        now={Date.parse(data.activity.now)}
        max={data.activity.max}
        viewAll={data.activity.viewAll}
      />
      <OnboardingChecklist title={data.checklist.title} description={data.checklist.description} steps={data.checklist.steps} />
    </DashboardShell>
  );
}

const DASH_REGISTRY: BlockRegistry = { DashboardWorkspace };

/** 仪表盘整页: compact 密度; 根标签用 div, DashboardShell 自带 main 地标. */
export function DashboardPage({ skin }: { skin?: TemplateSkin }): JSX.Element {
  return <PageComposer as="div" density={BLOCK_DENSITY.compact} blocks={DASH_BLOCKS} registry={DASH_REGISTRY} skin={skin} />;
}

/** 文档站用的模板页: 皮肤切换条 (default / mono / linear) + 整页. */
export function TemplateDashboardBlocksPage(): JSX.Element {
  return <SkinSwitcher>{(skin) => <DashboardPage skin={skin} />}</SkinSwitcher>;
}
