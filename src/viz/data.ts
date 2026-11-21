/**
 * `@hx/ui/data` 入口: 数据内核的比例尺, 坐标轴, 格式化. 与 `@hx/ui/viz` 分开发布, 只要数学不要组件的使用方不必拉图种.
 * .agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md
 */
export { scaleBand, scaleLinear, scaleLog, scalePoint, scaleSqrt, scaleTime, timeInterval, timeTicks, type BandOptions, type BandScale, type ContinuousScale, type Scale, type ScaleKind } from "./kernel-scale";
export { axisRescale, axisTicks, thinTicks, type AxisOptions, type AxisTick, type Rescale } from "./kernel-axis";
export { formatNumber, formatTime, type NumberFormatOptions } from "./kernel-format";
export type { NumberStyle, TimeUnit } from "../constants/data-scale";
export type { Domain } from "./scale";
export { DataStage, stageInner, stageRenderer, type DataStageProps, type StageInner, type StagePadding, type StageSize } from "./kernel-stage";
export { Line, seriesGeometry, seriesPath, type LineProps, type LineSeries, type SeriesGeometry } from "./charts/Line";
export { Bar, barFill, stackSegments, type BarProps, type BarRow, type StackSegment } from "./charts/Bar";
export type { BarMode, BarOrientation, StageRenderer } from "../constants/data-stage";
export { Scatter, placePoints, radiusScale, type PlacedPoint, type ScatterDatum, type ScatterProps } from "./charts/Scatter";
export { Area, bandPath, stackSeries, type AreaProps, type StackBand } from "./charts/Area";
export { Heatmap, heatOpacity, heatPeak, type HeatCell, type HeatmapProps } from "./charts/Heatmap";
export type { StackOffset } from "../constants/data-stage";
