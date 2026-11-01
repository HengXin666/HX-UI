import type { JSX } from "react";
import {
  AnimatedNumber,
  Backdrop,
  Badge,
  GlassPanel,
  HxAreaChart,
  HxBarChart,
  Progress,
  Stagger,
  StaggerItem,
  StatCard,
  TONE_VARIANT,
} from "@hx/ui";
import {
  CHART_HEIGHT,
  DASH_CLS as CLS,
  DASH_LIST_TAG,
  ERROR_BUDGET,
  HEALTH_LABEL,
  HEALTH_SURFACE,
  PERCENT,
  QUOTA,
  REGIONS,
  REGION_SERIES,
  SERVICES,
  STAT_CARDS,
  TRAFFIC,
  TRAFFIC_SERIES,
} from "../../../../src/constants/gallery";

/**
 * 展示画廊里的仪表盘: StatCard (趋势 + 迷你折线) 用 Stagger 依次入场,
 * 主图是面积图, 侧栏是压在点阵底纹上的毛玻璃面板, 底部一张柱状图配容量条.
 * 只用 @hx/ui 的公共导出与语义类名; 图表颜色不传, 按主题色序取, 亮暗两套自动跟随.
 * 演示数据, 类名与文案取自 src/constants/gallery.ts, 这里只管结构.
 */

/** 本月额度: 数字弹簧滚动, 进度条同值. */
function Quota(): JSX.Element {
  const ratio = Math.round((QUOTA.used / QUOTA.limit) * PERCENT);
  return (
    <div className={CLS.panel}>
      <div className={CLS.row}>
        <span className={CLS.title}>本月额度</span>
        <span className={CLS.muted}>
          <span className={CLS.num}>
            <AnimatedNumber value={QUOTA.used} from={0} />M
          </span>
          {` / ${QUOTA.limit}M`}
        </span>
      </div>
      <Progress value={ratio} />
      <span className={CLS.muted}>按当前速率, 月底前约用到 {ratio + QUOTA.forecastExtra}%.</span>
    </div>
  );
}

/**
 * 整块仪表盘的视觉落点: 错误预算剩余. 与第一排四宫格不同, 它占满侧栏宽度, 数值大一档且从零弹上来,
 * 趋势 + 迷你折线说明这个月在变好; 卡面半透明, 让下面的毛玻璃与点阵透出来.
 */
function ErrorBudget(): JSX.Element {
  return (
    <StatCard
      className={CLS.featureStat}
      label={ERROR_BUDGET.label}
      icon={ERROR_BUDGET.icon}
      tone={ERROR_BUDGET.tone}
      value={
        <span className={CLS.featureValue}>
          <AnimatedNumber value={ERROR_BUDGET.value} from={ERROR_BUDGET.from} />%
        </span>
      }
      trend={ERROR_BUDGET.trend}
      hint={ERROR_BUDGET.hint}
      sparkline={ERROR_BUDGET.sparkline}
    />
  );
}

/** 毛玻璃侧栏: 主指标卡在上, 服务健康列表在下, 压在点阵底纹上才看得出玻璃. */
function HealthPanel(): JSX.Element {
  return (
    <Backdrop variant={HEALTH_SURFACE.backdrop} size={HEALTH_SURFACE.size} className={CLS.healthBackdrop}>
      <GlassPanel blur={HEALTH_SURFACE.blur} tint={HEALTH_SURFACE.tint} className={CLS.healthGlass}>
        <ErrorBudget />
        <div className={CLS.row}>
          <span className={CLS.title}>服务健康</span>
          <Badge variant={TONE_VARIANT.success}>3 / 4 正常</Badge>
        </div>
        <ul className={CLS.healthList}>
          {SERVICES.map((service) => (
            <li key={service.name} className={CLS.rowItem}>
              <span className={CLS.serviceName}>{service.name}</span>
              <span className={CLS.serviceMeta}>
                <span className={CLS.mutedNum}>{service.p95}ms</span>
                <span
                  role={HEALTH_LABEL.role}
                  aria-label={service.ok ? HEALTH_LABEL.ok : HEALTH_LABEL.degraded}
                  className={service.ok ? CLS.dotOk : CLS.dotWarn}
                />
              </span>
            </li>
          ))}
        </ul>
      </GlassPanel>
    </Backdrop>
  );
}

/**
 * 仪表盘展示块. 第一排四张指标卡交错入场, 第二排面积图加毛玻璃侧栏 (侧栏顶上是错误预算主指标卡), 第三排柱状图加额度.
 */
export function DashboardShowcase(): JSX.Element {
  return (
    <div className={CLS.shell}>
      <div className={CLS.row}>
        <div className={CLS.header}>
          <span className={CLS.title}>生产环境概览</span>
          <span className={CLS.muted}>近 7 天 · 每 5 分钟刷新</span>
        </div>
        <Badge>实时</Badge>
      </div>

      <Stagger as={DASH_LIST_TAG.list} className={CLS.stats}>
        {STAT_CARDS.map(({ key, ...card }) => (
          <StaggerItem key={key} as={DASH_LIST_TAG.item}>
            <StatCard {...card} />
          </StaggerItem>
        ))}
      </Stagger>

      <div className={CLS.chartRow}>
        <div className={CLS.panelWide}>
          <div className={CLS.row}>
            <span className={CLS.title}>请求量</span>
            <span className={CLS.muted}>每小时 · 千次</span>
          </div>
          <HxAreaChart data={TRAFFIC} series={TRAFFIC_SERIES} height={CHART_HEIGHT.main} />
        </div>
        <HealthPanel />
      </div>

      <div className={CLS.chartRow}>
        <div className={CLS.panelWide}>
          <div className={CLS.row}>
            <span className={CLS.title}>区域分布</span>
            <span className={CLS.muted}>本周 · 千次</span>
          </div>
          <HxBarChart data={REGIONS} series={REGION_SERIES} height={CHART_HEIGHT.side} />
        </div>
        <Quota />
      </div>
    </div>
  );
}
