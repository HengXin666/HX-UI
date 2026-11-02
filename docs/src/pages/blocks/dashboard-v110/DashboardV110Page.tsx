import type { JSX } from "react";
import { ActivityFeed, KpiRow, OnboardingChecklist } from "../../../../../src/blocks/dashboard";
import { DASH_DOC } from "../../../../../src/constants/blocks-dashboard-v110";
import { Callout as DocCallout, Code, CodeBlock, H2, P, Preview } from "../../../components/DocKit";
import { DashboardDemo, RevenuePanel } from "./DashboardDemo";
import { DASH_DEMO_ACTIVITY, DASH_DEMO_KPIS, DASH_DEMO_NOW, DASH_DEMO_SIDEBAR, DASH_DEMO_STEPS } from "./dashboardDemoData";

const SHELL_CODE = `<DashboardShell sidebar={sidebar} brand={<Logo />} title="仪表盘" defaultCollapsed={false}>
  <KpiRow items={kpis} pad="none" />
  <ChartPanel title="收入趋势" range={{ options, defaultValue: "7d" }} chart={(r) => <HxAreaChart data={data[r]} series={series} />} />
  <OnboardingChecklist steps={steps} />
  <ActivityFeed items={activity} viewAll={{ label: "查看全部", href: "/activity" }} />
</DashboardShell>`;

const COMPOSER_CODE = `<PageComposer
  density="compact"
  registry={{ KpiRow, ActivityFeed, OnboardingChecklist }}
  blocks={[
    { type: "KpiRow", props: { items: kpis, heading: { title: "本月概况" } } },
    { type: "OnboardingChecklist", props: { steps } },
    { type: "ActivityFeed", props: { items: activity } },
  ]}
/>`;

const JSON_EXAMPLE = JSON.stringify({ sidebar: DASH_DEMO_SIDEBAR.slice(0, 1), kpis: DASH_DEMO_KPIS.slice(0, 2), activity: DASH_DEMO_ACTIVITY.slice(0, 2), steps: DASH_DEMO_STEPS.slice(0, 3) }, null, 2);

/**
 * V1-10 仪表盘区块文档页: 完整仪表盘, 五个区块单独演示, JSON 数据示例, PageComposer 用法, 三皮肤演示.
 */
export function DashboardV110Page(): JSX.Element {
  return (
    <>
      <P>
        仪表盘区块: <Code>DashboardShell</Code>, <Code>KpiRow</Code>, <Code>ChartPanel</Code>, <Code>ActivityFeed</Code>, <Code>OnboardingChecklist</Code>.
        默认 compact 密度, 数字与时间统一走 Intl, 所有可见文案来自 props 或 labels.
      </P>
      <DocCallout title="容器查询">
        外壳容器 ≥ @4xl 显示固定侧栏 (可折叠到图标), 更窄时侧栏进左侧 Sheet. 侧栏宽度由 --dash-sidebar-width / --dash-sidebar-collapsed 控制.
      </DocCallout>

      <H2>完整仪表盘</H2>
      <Preview align="stretch" code={SHELL_CODE}>
        <div className={`${DASH_DOC.stage} ${DASH_DOC.stageTall}`}>
          <DashboardDemo idPrefix="dv-" />
        </div>
      </Preview>

      <H2>KpiRow</H2>
      <Preview align="stretch" code={`<KpiRow items={kpis} columns={4} heading={{ title: "本月概况" }} />\n<KpiRow items={[]} loading />`}>
        <div className={DASH_DOC.stack}>
          <KpiRow items={DASH_DEMO_KPIS} pad="none" heading={{ title: "本月概况" }} />
          <KpiRow items={[]} loading pad="none" />
        </div>
      </Preview>

      <H2>ChartPanel</H2>
      <Preview align="stretch" code={`<ChartPanel title="收入趋势" value="¥ 128,400" range={{ options, defaultValue: "7d" }} chart={(range) => <HxAreaChart data={data[range]} series={series} />} />`}>
        <RevenuePanel />
      </Preview>

      <H2>ActivityFeed 与 OnboardingChecklist</H2>
      <Preview align="stretch" code={`<ActivityFeed items={activity} max={4} />\n<OnboardingChecklist steps={steps} hideCompleted />`}>
        <div className={DASH_DOC.grid}>
          <ActivityFeed items={DASH_DEMO_ACTIVITY} now={DASH_DEMO_NOW} max={4} />
          <OnboardingChecklist steps={DASH_DEMO_STEPS} hideCompleted />
        </div>
      </Preview>

      <H2>JSON 数据示例</H2>
      <P>所有字段都可 JSON 序列化 (时间用 ISO 串), 适合 PageComposer 或 CMS 直接生成.</P>
      <CodeBlock code={JSON_EXAMPLE} lang="json" />

      <H2>PageComposer 用法</H2>
      <CodeBlock code={COMPOSER_CODE} />

      <H2>三皮肤演示</H2>
      <P>同一份数据在 default / mono / retail 三套皮肤下渲染, 外观差异全部来自令牌.</P>
      <div className={DASH_DOC.stack}>
        {DASH_DOC.skins.map((skin) => (
          <div key={skin} data-skin={skin} className={DASH_DOC.skinFrame}>
            <p className={DASH_DOC.skinTag}>data-skin="{skin}"</p>
            <DashboardDemo idPrefix={`dv-${skin}-`} />
          </div>
        ))}
      </div>
    </>
  );
}
