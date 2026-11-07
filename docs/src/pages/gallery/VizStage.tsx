import type { JSX } from "react";
import { TEXT_TONE } from "../../../../src/constants/typography";
import { Compare, Metric, Process } from "../../../../src/studio";
import { N11, N12, N13, N14, N15, N16, N17, N18, N2, N20, N21, N22, N27, N3, N4, N9 } from "../../../../src/studio/figures";

const STEPS = [
  { id: "capture", title: "采集", detail: "原始记录进线, 先不解释." },
  { id: "entitle", title: "命名", detail: "同一件事并成一条, 留下出处." },
  { id: "seal", title: "收束", detail: "署名, 或者明确写上还没人认." },
] as const;

/** 指标, 过程与对比. 数字用弹簧, 连接线只缩放, 表是原生 table. */
export function VizStage(): JSX.Element {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-5 py-8 md:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="本周收束" value={N27} from={0} delta="比上周多一些" tone={TEXT_TONE.success} series={[N12, N14, N13, N18, N16, N21, N22, N27]} />
        <Metric label="仍开放" value={N9} from={N20} delta="没有超过两周的" tone={TEXT_TONE.neutral} series={[N20, N18, N17, N15, N14, N12, N11, N9]} />
        <Metric label="返工" value={N2} from={0} delta="都来自未署名的条目" tone={TEXT_TONE.danger} series={[0, 1, 1, N3, N2, N2, N4, N2]} />
      </div>
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
