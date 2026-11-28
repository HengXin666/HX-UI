/**
 * 2D 图表 + 表格 (Recharts / d3 / TanStack Table). 不含 3D, 用不到 three 的页面从这里引.
 * 包内路径: "@hx/ui/data". 3D 图表在 "@hx/ui/data/3d" (./charts3d), 需要额外装 three + @react-three/*.
 */
// 纯工具来自服务端安全的 helpers (服务端组件里能直接调用), 组件和 hook 来自各自的客户端模块
export { formatCompact, toConfig, ANIMATION_POINT_LIMIT, ganttDate, aShareMinutes, valueAreaOf } from "./charts/helpers";
export { AreaTrend } from "./charts/area-trend";
export { useChartAnimation } from "./charts/animation";
export type { ChartAnimationOptions, MatchSpec } from "./charts/animation";
export type { SeriesSpec } from "./charts/helpers";
export { BarCompare } from "./charts/bar-compare";
export { Donut } from "./charts/donut";
export { Sparkline, type SparklineProps } from "./charts/sparkline";
export { DataTable } from "./table/data-table";
export type { ColumnDef } from "./table/data-table";
export { ComboChart } from "./charts/combo-chart";
export { RadarCompare } from "./charts/radar-compare";
export { Gauge } from "./charts/gauge";
export type { GaugeBand } from "./charts/gauge";
export { ScatterBubble } from "./charts/scatter-bubble";
export type { ScatterGroup } from "./charts/scatter-bubble";
export { ConversionFunnel } from "./charts/conversion-funnel";
export { ShareTreemap } from "./charts/share-treemap";
export type { TreemapNode, ShareTreemapProps } from "./charts/share-treemap";
export { SankeyFlow, type SankeyFlowProps } from "./charts/sankey-flow";
export { HeatCalendar } from "./charts/heat-calendar";
export { Candlestick } from "./charts/candlestick";
export { Intraday, type IntradayPoint, type IntradayProps } from "./charts/intraday";
export { DepthChart, type DepthLevel, type DepthChartProps } from "./charts/depth-chart";
export { VolumeProfile, type ProfileBin, type VolumeProfileProps } from "./charts/volume-profile";
export type { Candle } from "./charts/candlestick";
export type { CandleOverlay, CandleSub } from "./charts/candlestick";
export { ForceGraph } from "./charts/force-graph";
export type { ForceGraphProps, GraphLink, GraphNode } from "./charts/force-graph";
export { Waterfall } from "./charts/waterfall";
export type { WaterfallItem, WaterfallProps } from "./charts/waterfall";
export { Bullet } from "./charts/bullet";
export type { BulletItem, BulletProps } from "./charts/bullet";
export { Distribution } from "./charts/distribution";
export type { DistributionGroup, DistributionProps } from "./charts/distribution";
export { sma, ema, macd, boll, kdj, rsi } from "./charts/indicators";
export { Sunburst } from "./charts/sunburst";
export type { SunburstNode, SunburstProps } from "./charts/sunburst";
export { Rose } from "./charts/rose";
export type { RoseDatum, RoseProps, RoseSeries } from "./charts/rose";
export { useArcTween, type Arc } from "./charts/arc-tween";
export { Gantt } from "./charts/gantt";
export type { GanttProps, GanttTask } from "./charts/gantt";
export { ChinaMap } from "./charts/china-map";
export type { ChinaMapDatum, ChinaMapProps } from "./charts/china-map";
