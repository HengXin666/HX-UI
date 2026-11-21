import { useMemo, useState, type JSX } from "react";
import { SegmentedControl } from "@hx/ui";
import { DIRECTIONS, Page, type DirectionName } from "../../../../src/page";
import { sampleSaas, saasTemplate } from "../../../../src/page/templates";
import { CodeBlock, H2, P } from "../../components/DocKit";

/** 方向切换项: 由 DIRECTIONS 表生成, 新增方向不用改这里. */
const DIRECTION_ITEMS = Object.values(DIRECTIONS).map((d) => ({ key: d.name, label: d.name }));

/** 流水状态. */
const ROW = { pending: "pending", matched: "matched", diff: "diff" } as const;
type RowState = (typeof ROW)[keyof typeof ROW];

/** 演示按钮都是普通按钮, 不提交表单. */
const BUTTON = "button";

/** 对账工作台的演示流水. 三笔会配上, 一笔差手续费. */
const ROWS = [
  { id: "t1", date: "11-03", payee: "华东物流", amount: "12,480.00", result: ROW.matched },
  { id: "t2", date: "11-07", payee: "栖木家居", amount: "3,906.50", result: ROW.matched },
  { id: "t3", date: "11-12", payee: "跨境收款 USD", amount: "8,215.37", result: ROW.diff },
  { id: "t4", date: "11-18", payee: "办公租金", amount: "26,000.00", result: ROW.matched },
] as const;

const STATE_LABEL: Record<RowState, string> = { [ROW.pending]: "待配对", [ROW.matched]: "已配对", [ROW.diff]: "差 ¥15.00 手续费" };

const BTN = "rounded-(--radius-md) border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50";

/**
 * 导览要讲的真实界面: 一个能点的迷你对账工作台. 光标飞到哪, 哪个按钮就真的能按,
 * 这是 "活组件" 媒体位, 不是截图.
 */
function Workbench(): JSX.Element {
  const [imported, setImported] = useState(false);
  const [states, setStates] = useState<Record<string, RowState>>({});
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [closed, setClosed] = useState(false);
  const rows = ROWS.filter((r) => imported && (!onlyDiff || states[r.id] === ROW.diff));
  return (
    <div className="flex flex-col gap-3 p-4 text-sm">
      <div className="flex flex-wrap gap-2">
        <button type={BUTTON} data-tour="import" className={BTN} onClick={() => setImported(true)}>导入流水</button>
        <button type={BUTTON} data-tour="match" className={BTN} disabled={!imported} onClick={() => setStates(Object.fromEntries(ROWS.map((r) => [r.id, r.result])))}>自动配对</button>
        <button type={BUTTON} data-tour="diff" className={BTN} disabled={!imported} aria-pressed={onlyDiff} onClick={() => setOnlyDiff((v) => !v)}>只看对不上的</button>
        <button type={BUTTON} data-tour="close" className={BTN} disabled={!imported || closed} onClick={() => setClosed(true)}>{closed ? "本期已锁定" : "一键结账"}</button>
      </div>
      <table className="w-full text-start tabular-nums">
        <thead className="text-muted-foreground">
          <tr><th className="py-1 text-start font-normal">日期</th><th className="text-start font-normal">对方</th><th className="text-end font-normal">金额</th><th className="text-end font-normal">状态</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">{imported ? "没有对不上的流水" : "还没有导入流水"}</td></tr>
          ) : rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="py-1.5">{r.date}</td>
              <td>{r.payee}</td>
              <td className="text-end">{r.amount}</td>
              <td className="text-end">{STATE_LABEL[states[r.id] ?? ROW.pending]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const USAGE = `import { saasTemplate } from "@hx/ui/templates";
import { Page } from "@hx/ui/page";

const { spec, issues } = saasTemplate({
  product: {
    name, title, lead, currency: "CNY",
    ctas: [{ label: "免费试用 14 天" }, { label: "预约演示", variant: "secondary" }],
    tour: { stops, screen: <YourRealApp /> },   // 光标飞在真实界面上
    features, metrics, plans, matrix, testimonials, security,
  },
  direction: "industrial",
});

<Page spec={spec} />`;

/**
 * 标杆页 C: 软件产品页. 一份产品数据 (示例: 团队对账工具 Tally) 由 saasTemplate 出整页:
 * 开场, 活界面上的光标导览, 功能, 实测, 定价 + 计算器 + 对比矩阵, 口碑与合规, 收尾. 上方切美术方向.
 */
export function SoftwarePage(): JSX.Element {
  const [direction, setDirection] = useState<DirectionName>("industrial");
  const product = useMemo(() => sampleSaas(<Workbench />), []);
  const { spec, issues } = useMemo(() => saasTemplate({ product, direction }), [product, direction]);
  return (
    <>
      <P>一份产品数据进, 整页出. 导览里的工作台是活的: 光标停在哪个按钮上, 你就可以真的去按它; 悬停或聚焦时导览暂停. 定价区拖人数, 每档月价按位滚到新值, 最划算的那档描边.</P>
      <SegmentedControl items={DIRECTION_ITEMS} value={direction} onChange={setDirection} />
      {issues.length > 0 ? <P>{`产品数据有 ${issues.length} 个问题: ${issues.map((i) => i.code).join(", ")}`}</P> : null}
      <Page key={direction} spec={spec} />
      <H2 id="usage">接入</H2>
      <CodeBlock code={USAGE} />
    </>
  );
}
