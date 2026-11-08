import { useState, type JSX } from "react";
import { SegmentedControl } from "@hx/ui";
import { Code, P } from "../../components/DocKit";
import { BarStage, RingStage, TrendStage } from "./vizCharts";
import { FlowStage, FunnelStage, TimelineStage } from "./vizFlow";

const VIZ = { trend: "trend", bar: "bar", ring: "ring", flow: "flow", funnel: "funnel", timeline: "timeline" } as const;
type VizKey = (typeof VIZ)[keyof typeof VIZ];

const PICKS = [
  { key: VIZ.trend, label: "Trend" },
  { key: VIZ.bar, label: "BarChart" },
  { key: VIZ.ring, label: "Ring / RingRow" },
  { key: VIZ.flow, label: "FlowGraph" },
  { key: VIZ.funnel, label: "Funnel" },
  { key: VIZ.timeline, label: "Timeline" },
];

const STAGES: Record<VizKey, () => JSX.Element> = {
  trend: TrendStage,
  bar: BarStage,
  ring: RingStage,
  flow: FlowStage,
  funnel: FunnelStage,
  timeline: TimelineStage,
};

/** #/viz: 组件选择器加一个舞台. 一次只放一件, 道具台和源码都只对着它, 比六段长页更容易看清中断. */
export function VizStagePage(): JSX.Element {
  const [pick, setPick] = useState<VizKey>(VIZ.trend);
  const Stage = STAGES[pick];
  return (
    <>
      <P>
        可视化层从 <Code>@hx/ui/viz</Code> 引入. 选一件放上舞台, 在道具台拖动或切换, 值会直接作用在同一个组件实例上:
        动画从当前位置继续, 不从头重播. 想再看一次入场, 按 "重播入场".
      </P>
      <div className="mb-2 max-w-full overflow-x-auto">
        <SegmentedControl items={PICKS} value={pick} onChange={setPick} />
      </div>
      <Stage />
    </>
  );
}
