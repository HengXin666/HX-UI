import type { JSX } from "react";
import { Badge, Button, DataTable, Progress, SIDE, StatCard, StatGrid, TONE_VARIANT, UI_CLASSES, VARIANT } from "@hx/ui";
import { H2, P, Preview } from "../../components/DocKit";
import { ApplySteps, TemplateFiles, TemplateFrame } from "../../components/TemplateKit";
import { DASHBOARD, TEMPLATE_PAGE } from "../../constants/templates";

interface ServiceRow {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly calls: string;
  readonly p95: string;
  readonly state: string;
}

const ROWS: readonly ServiceRow[] = [
  { id: "api", name: "api-gateway", region: "ap-east-1", calls: "1.24M", p95: "182ms", state: DASHBOARD.stateOk },
  { id: DASHBOARD.authId, name: "auth-service", region: "ap-east-1", calls: "684K", p95: "96ms", state: DASHBOARD.stateOk },
  { id: DASHBOARD.searchId, name: "search-index", region: "ap-southeast-1", calls: "312K", p95: "410ms", state: "降级" },
];

const CODE = `import { DataTable, StatCard, StatGrid } from "@hx/ui";

const columns = [
  { key: "name", header: "服务" },
  { key: "calls", header: "调用量", align: SIDE.right, numeric: true },
  { key: "p95", header: "P95", align: SIDE.right, numeric: true },
];

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <StatGrid>
        <StatCard label="今日调用" value="2.24M" hint="+8.2% 环比" />
        <StatCard label="错误率" value="0.42%" hint="低于阈值 1%" tone="good" />
      </StatGrid>
      <DataTable title="服务健康" columns={columns} rows={rows} maxHeight="420px" />
    </div>
  );
}`;

/** 数据看板模板: 指标卡 + 服务表 + 一条分布条. */
export function TemplateDashboardPage(): JSX.Element {
  return (
    <>
      <P>整页骨架: 顶部指标卡, 中间服务表 (粘性表头 + 右对齐数字), 底部容量条。指标卡数字等宽, 刷新时不抖。</P>
      <ApplySteps steps={[
        TEMPLATE_PAGE.installStep,
        "复制下面这段进 src/pages/DashboardPage.tsx, 把 ROWS 换成你的接口返回",
        "表格超过一屏时给 maxHeight, 表头会粘住",
      ]} />
      <H2>整页预览</H2>
      <TemplateFrame height={TEMPLATE_PAGE.frameHeight}>
        <div className={TEMPLATE_PAGE.body}>
          <StatGrid>
            <StatCard label="今日调用" value="2.24M" hint="+8.2% 环比" />
            <StatCard label="错误率" value="0.42%" hint="低于阈值 1%" tone="good" />
            <StatCard label="平均延迟" value="142ms" hint="P95 182ms" tone="bad" />
            <StatCard label="活跃副本" value="18" hint="上限 32" />
          </StatGrid>

          <DataTable<ServiceRow>
            title="服务健康"
            actions={<Button size={VARIANT.sm} variant={VARIANT.ghost}>刷新</Button>}
            columns={[
              { key: DASHBOARD.nameKey, header: "服务", render: (row) => <span className="font-mono text-[12px]">{row.name}</span> },
              { key: "region", header: "区域", render: (row) => <span className={UI_CLASSES.muted}>{row.region}</span> },
              { key: "calls", header: "调用量", align: SIDE.right, numeric: true },
              { key: "p95", header: "P95", align: SIDE.right, numeric: true },
              {
                key: "state",
                header: "状态",
                align: SIDE.right,
                render: (row) => (
                  <Badge variant={row.state === DASHBOARD.stateOk ? TONE_VARIANT.success : VARIANT.warning}>{row.state}</Badge>
                ),
              },
            ]}
            rows={ROWS}
          />

          <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between text-[12.5px]">
              <span className={UI_CLASSES.muted}>本月额度</span>
              <span className={DASHBOARD.tabularNums}>68% , 6.8M / 10M</span>
            </div>
            <Progress value={68} />
          </div>
        </div>
      </TemplateFrame>
      <H2>完整代码</H2>
      <TemplateFiles files={["src/pages/DashboardPage.tsx"]} />
      <Preview code={CODE} lang={TEMPLATE_PAGE.lang}>
        <div className={UI_CLASSES.mutedHalf}>表格列定义与真实渲染一致, 直接改数据源即可。</div>
      </Preview>
    </>
  );
}
