import { ComboChart } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard } from "./_chart";

const DAYS = ["11/16", "11/17", "11/18", "11/19", "11/20", "11/21", "11/22"];
const NEW = [312, 288, 341, 402, 377, 520, 611];
const OLD = [198, 210, 187, 236, 244, 301, 352];
const CVR = [2.8, 2.6, 3.0, 3.4, 3.2, 4.1, 4.6];
const ROWS = DAYS.map((day, i) => ({ day, new: NEW[i], old: OLD[i], cvr: CVR[i] }));

export default function ComboChartDemo({ values }: DemoProps) {
  return (
    <ChartCard title="近 7 天订单与转化率" value="963 单" delta={<span className="text-success">转化 4.6%</span>}>
      <ComboChart data={ROWS} x="day" stacked={Boolean(values.stacked)} dualAxis={Boolean(values.dualAxis)}
        bars={values.twoBars ? [{ key: "new", label: "新客订单" }, { key: "old", label: "老客订单" }] : [{ key: "new", label: "订单" }]}
        lines={[{ key: "cvr", label: "转化率" }]} lineFormatter={(v) => `${v}%`} />
    </ChartCard>
  );
}
