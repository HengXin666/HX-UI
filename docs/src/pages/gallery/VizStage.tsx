import { useState, type JSX } from "react";
import { Button } from "@hx/ui";
import { TEXT_TONE } from "../../../../src/constants/typography";
import { BarChart, Compare, FlowGraph, Funnel, Metric, Process, Ring, Timeline, Trend } from "../../../../src/viz";

const STEPS = [
  { id: "capture", title: "采集", detail: "原始记录进线, 先不解释." },
  { id: "entitle", title: "命名", detail: "同一件事并成一条, 留下出处." },
  { id: "seal", title: "收束", detail: "署名, 或者明确写上还没人认." },
] as const;

const WEEK = [
  { id: "mon", label: "周一", value: 42 },
  { id: "tue", label: "周二", value: 58 },
  { id: "wed", label: "周三", value: 51 },
  { id: "thu", label: "周四", value: 66 },
  { id: "fri", label: "周五", value: 73 },
];

const SPIKE = 180;
const REWORK_SERIES = [0, 1, 1, 3, 2, 5, 4, 2];
const REWORK = REWORK_SERIES[REWORK_SERIES.length - 1];
const SEED = [31, 34, 33, 38, 41, 40, 46];

const STEP = { order: "order", pay: "pay", risk: "risk", pick: "pick", ship: "ship", sign: "sign" } as const;

const FLOW_NODES = [
  { id: STEP.order, label: "下单", detail: "用户提交订单, 库存先锁 15 分钟." },
  { id: STEP.pay, label: "支付", detail: "第三方支付回调, 失败自动重试三次." },
  { id: STEP.risk, label: "风控", detail: "与支付并行, 命中规则的订单转人工." },
  { id: STEP.pick, label: "拣货", detail: "仓内按波次拣货, 平均 22 分钟." },
  { id: STEP.ship, label: "发货", detail: "交给承运商, 生成物流单号." },
  { id: STEP.sign, label: "签收", detail: "签收后 7 天进入可结算." },
];

const FLOW_EDGES = [
  { from: STEP.order, to: STEP.pay },
  { from: STEP.order, to: STEP.risk },
  { from: STEP.pay, to: STEP.pick },
  { from: STEP.risk, to: STEP.pick },
  { from: STEP.pick, to: STEP.ship },
  { from: STEP.ship, to: STEP.sign },
];

const FUNNEL = [
  { id: "visit", label: "访问商品页", value: 48210 },
  { id: "cart", label: "加入购物车", value: 9630 },
  { id: "checkout", label: "进入结账", value: 4120 },
  { id: "paid", label: "支付成功", value: 3388 },
];

const ROADMAP = [
  { id: "alpha", when: "2026 Q1", title: "内测", detail: "二十家种子客户.", status: "done" as const },
  { id: "beta", when: "2026 Q2", title: "公测", detail: "开放注册, 免费额度.", status: "done" as const },
  { id: "ga", when: "2026 Q4", title: "正式版", detail: "SLA 与企业合同.", status: "active" as const },
  { id: "intl", when: "2027 Q2", title: "海外区", detail: "新加坡与法兰克福节点.", status: "next" as const },
];

/**
 * 数据层展示: 柱状, 坐标轴冲击, 环形, 流程图, 漏斗, 时间线, 以及原有的指标, 过程与对比.
 * "推一个尖峰" 让趋势线越过坐标轴, 看网格重标与扩散圈.
 */
export function VizStage(): JSX.Element {
  const [series, setSeries] = useState<number[]>(SEED);
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
          <Ring value={72} label="季度目标" />
          <Ring value={38} label="库存周转" />
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
