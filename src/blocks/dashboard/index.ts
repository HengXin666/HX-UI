/**
 * 仪表盘区块桶文件 (V1-10). 名字逐个写出, 不用 export *.
 * 接入 src/blocks/index.ts 与 src/index.ts 归集成任务 (V1-Z).
 */
export { DashboardShell, type DashboardShellProps, type DashboardShellSlot, type DashboardShellState } from "./DashboardShell";
export { KpiRow, type KpiItem, type KpiRowColumns, type KpiRowProps, type KpiRowSlot, type KpiRowState } from "./KpiRow";
export { ChartPanel, type ChartPanelProps, type ChartPanelSlot, type ChartPanelState, type ChartRange, type ChartRangeOption } from "./ChartPanel";
export { ActivityFeed, type ActivityFeedProps, type ActivityFeedSlot, type ActivityFeedState, type ActivityItem } from "./ActivityFeed";
export {
  OnboardingChecklist,
  type OnboardingChecklistProps,
  type OnboardingChecklistSlot,
  type OnboardingChecklistState,
  type OnboardingStep,
} from "./OnboardingChecklist";
export type { BlockBaseProps, Cta, LinkGroup, LinkItem, Person, SectionHeadingData } from "../_shared/types";
export { DASH_DEFAULT, DASH_KPI_COLUMNS, dashText, type DashText } from "../../constants/blocks-dashboard-v110";
