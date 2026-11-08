import { useState, type JSX } from "react";
import { Button } from "@hx/ui";
import { TEXT_TONE } from "../../../../src/constants/typography";
import { BarChart, Compare, FlowGraph, Funnel, Metric, Process, Ring, Timeline, Trend } from "../../../../src/viz";
import { FLOW_EDGES, FLOW_NODES, FUNNEL, RINGS, ROADMAP, SEED, SPIKE, WEEK } from "../stage/samples";

const STEPS = [
  { id: "capture", title: "采集", detail: "原始记录进线, 先不解释." },
  { id: "entitle", title: "命名", detail: "同一件事并成一条, 留下出处." },
  { id: "seal", title: "收束", detail: "署名, 或者明确写上还没人认." },
] as const;

const REWORK_SERIES = [0, 1, 1, 3, 2, 5, 4, 2];
const REWORK = REWORK_SERIES[REWORK_SERIES.length - 1];

/**
 * 数据层展示: 柱状, 坐标轴冲击, 环形, 流程图, 漏斗, 时间线, 以及原有的指标, 过程与对比.
 * "推一个尖峰" 让趋势线越过坐标轴, 看网格重标与扩散圈. 示例数据与 #/viz 舞台共用 stage/samples.ts.
 *
 * .agents/notes/implemented/feature/2026-11-08-docs-viz-page-stage.md
 */
export function VizStage(): JSX.Element {
  const [series, setSeries] = useState<number[]>(() => [...SEED]);
  const push = (value: number): void => setSeries((list) => [...list.slice(1), value]);
  const last = series[series.length - 1] ?? 0;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-14 px-5 py-8 md:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="本周收束" value={27} from={0} delta="比上周多一些" tone={TEXT_TONE.success} series={[12, 14, 13, 18, 16, 21, 22, 27]} />
        <Metric label="仍开放" value={9} from={20} delta="没有超过两周的" tone={TEXT_TONE.neutral} series={[20, 18, 17, 15, 14, 12, 11, 9]} />
        <Metric label="返工" value={REWORK} from={0} delta="都来自未署名的条目" tone={TEXT_TONE.danger} series={REWORK_SERIES} />
      </div>
      <div className="grid gap-10 md:grid-cols-2">
        <BarChart data={WEEK} label="本周订单 (千单)" />
        <div className="flex flex-col gap-3">
          <Trend values={series} label="日活 (万)" />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => push(last + 3)}>
              再来一天
            </Button>
            <Button type="button" size="sm" onClick={() => push(SPIKE)}>
              推一个尖峰
            </Button>
          </div>
        </div>
      </div>
      <FlowGraph label="订单履约流程" nodes={FLOW_NODES} edges={FLOW_EDGES} />
      <div className="grid gap-10 md:grid-cols-2">
        <Funnel label="本月转化" rateLabel="转化" stages={FUNNEL} />
        <div className="grid grid-cols-2 place-items-center gap-6">
          {RINGS.map((ring) => (
            <Ring key={ring.label} value={ring.value} label={ring.label} />
          ))}
        </div>
      </div>
      <Timeline label="产品路线图" items={ROADMAP} />
      <Process label="一条记录的过程" steps={STEPS} defaultValue={STEPS[0].id} />
      <Compare
        caption="两本田野"
        columns={[{ id: "shore", title: "岸本", featured: true }, { id: "ledger", title: "旧记事" }]}
        rows={[
          { label: "署名", cells: { shore: "每条都有", ledger: "可选" } },
          { label: "未决", cells: { shore: "单独成列", ledger: "混在已完成里" } },
          { label: "导出", cells: { shore: "纯文本", ledger: "只有截图" } },
        ]}
      />
    </div>
  );
}
