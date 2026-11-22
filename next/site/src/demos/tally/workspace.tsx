import * as React from "react";
import { useInView, useReducedMotion } from "motion/react";
import { BarChart3, ChevronDown, FileText, Inbox, Landmark, Link2, Search, SlidersHorizontal, Upload, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusTag, yuan, type Status } from "./status";

interface Row {
  date: string;
  payee: string;
  memo: string;
  amount: number;
  doc: string;
  status: Status;
  /** 这行在演示里会从 "匹配中" 变成 "已匹配" */
  auto?: boolean;
}

const ROWS: Row[] = [
  { date: "03-14", payee: "上海青禾供应链", memo: "货款 INV-0381", amount: 48_260, doc: "发票 0381", status: "matched" },
  { date: "03-14", payee: "顺丰速运", memo: "运费 3 月上", amount: -12_904.5, doc: "订单 SF-2291", status: "matched", auto: true },
  { date: "03-13", payee: "极光电器", memo: "预付款", amount: 120_000, doc: "合同 C-118", status: "review" },
  { date: "03-13", payee: "阿里云计算", memo: "云资源 2 月", amount: -8_431.27, doc: "发票 7720", status: "matched", auto: true },
  { date: "03-12", payee: "北辰医疗器械", memo: "回款 3 笔合并", amount: 96_880, doc: "3 张发票", status: "matched", auto: true },
  { date: "03-12", payee: "美团企业版", memo: "差旅餐饮", amount: -1_286, doc: "规则 · 差旅", status: "matched", auto: true },
  { date: "03-11", payee: "HSBC FX", memo: "USD 结汇", amount: 70_412.6, doc: "汇差 ¥ 12.40", status: "diff" },
  { date: "03-11", payee: "云栖科技", memo: "服务费", amount: 23_500, doc: "发票 0377", status: "matched", auto: true },
  { date: "03-10", payee: "国家税务总局", memo: "增值税", amount: -31_208.44, doc: "凭证 记-0372", status: "matched" },
];

const NAV = [
  { icon: Inbox, label: "待处理", count: 37 },
  { icon: Landmark, label: "银行流水", active: true },
  { icon: FileText, label: "发票" },
  { icon: Workflow, label: "对账规则" },
  { icon: BarChart3, label: "报表" },
];

const ACCOUNTS = [["招商银行", "8821"], ["工商银行", "0417"], ["HSBC USD", "3390"]];

/** 自动核销演示: 进视口后, 标了 auto 的行依次从 "匹配中" 变 "已匹配", 播完停几秒再来一轮. */
function useMatchLoop(ref: React.RefObject<HTMLElement | null>) {
  const autos = React.useMemo(() => ROWS.flatMap((r, i) => (r.auto ? [i] : [])), []);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { margin: "-10% 0px" });
  const [done, setDone] = React.useState(reduce ? autos.length : 0);
  React.useEffect(() => {
    if (reduce || !inView) return;
    const wait = done >= autos.length ? 4000 : done === 0 ? 1200 : 900;
    const t = window.setTimeout(() => setDone((d) => (d >= autos.length ? 0 : d + 1)), wait);
    return () => window.clearTimeout(t);
  }, [done, inView, reduce, autos.length]);
  return (i: number): Status => {
    const k = autos.indexOf(i);
    return k === -1 ? ROWS[i].status : k < done ? "matched" : "matching";
  };
}

function Sidebar() {
  return (
    <aside className="hidden flex-col gap-6 border-r bg-muted/30 p-3 text-[13px] md:flex">
      <div className="flex items-center gap-2 px-1.5 pt-1">
        <span className="grid size-5 place-items-center rounded bg-foreground text-[10px] font-bold text-background">蓝</span>
        <span className="font-medium">蓝鲸物流</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-muted-foreground">
        <Search className="size-3.5" /> 搜索
        <kbd className="ml-auto font-mono text-[10px]">⌘K</kbd>
      </div>
      <nav className="space-y-0.5">
        {NAV.map((n) => (
          <div key={n.label} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5", n.active ? "bg-accent font-medium text-foreground" : "text-muted-foreground")}>
            <n.icon className="size-3.5" />{n.label}
            {n.count && <span className="ml-auto font-mono text-[11px] tabular">{n.count}</span>}
          </div>
        ))}
      </nav>
      <div>
        <div className="mb-1.5 px-2 text-[11px] text-muted-foreground">银行账户</div>
        {ACCOUNTS.map(([b, n]) => (
          <div key={n} className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />{b}<span className="ml-auto font-mono text-[11px]">··{n}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Inspector() {
  const factors: [string, string, number][] = [["金额", "完全一致", 100], ["日期", "相差 1 天", 92], ["户名", "相似度 0.97", 97], ["摘要", "含发票号", 100]];
  return (
    <aside className="hidden flex-col border-l p-4 text-[13px] xl:flex">
      <div className="flex items-center justify-between">
        <span className="font-medium">匹配详情</span>
        <span className="font-mono text-[11px] text-muted-foreground">#TX-20314-01</span>
      </div>
      <div className="mt-4 space-y-2">
        {[["招商银行 ··8821", "上海青禾供应链", "03-14"], ["发票 No.0381 2297", "上海青禾供应链有限公司", "03-13"]].map(([a, b, d], k) => (
          <React.Fragment key={a}>
            {k === 1 && <div className="flex justify-center text-muted-foreground"><Link2 className="size-3.5" /></div>}
            <div className="rounded-lg border bg-background p-3">
              <div className="flex justify-between text-[11px] text-muted-foreground"><span>{a}</span><span className="font-mono">{d}</span></div>
              <div className="mt-1 truncate">{b}</div>
              <div className="mt-1 font-mono text-[15px] font-medium tabular">¥ {yuan(48_260)}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="mt-5 flex items-baseline justify-between">
        <span className="text-muted-foreground">置信度</span>
        <span className="font-mono text-2xl font-semibold tabular tracking-tight">98.6</span>
      </div>
      <div className="mt-3 space-y-2.5">
        {factors.map(([k, v, p]) => (
          <div key={k}>
            <div className="flex justify-between text-[12px]"><span>{k}</span><span className="text-muted-foreground">{v}</span></div>
            <div className="mt-1 h-1 rounded-full bg-muted"><div className="h-full rounded-full bg-foreground/70" style={{ width: `${p}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="mt-auto flex gap-2 pt-5">
        <button type="button" className="h-8 flex-1 rounded-md bg-primary text-[13px] font-medium text-primary-foreground">确认匹配</button>
        <button type="button" className="h-8 rounded-md border px-3 text-[13px]">拆分</button>
      </div>
    </aside>
  );
}

/** Tally 对账工作台: 发布页首屏的产品界面 (活组件, 非截图). */
export function TallyWorkspace() {
  const ref = React.useRef<HTMLDivElement>(null);
  const statusOf = useMatchLoop(ref);
  const matched = ROWS.reduce((n, _, i) => n + (statusOf(i) === "matched" ? 1 : 0), 0);
  const total = 1_241;
  const auto = 1_197 + matched;
  return (
    <div ref={ref} className="overflow-hidden rounded-xl border bg-card text-left shadow-[0_1px_1px_oklch(0_0_0/0.04),0_8px_24px_-6px_oklch(0_0_0/0.08),0_40px_80px_-20px_oklch(0_0_0/0.14)] dark:shadow-[0_0_0_1px_oklch(1_0_0/0.04),0_40px_80px_-20px_oklch(0_0_0/0.7)]">
      <div className="grid min-h-[520px] md:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_280px]">
        <Sidebar />
        <main className="min-w-0">
          <div className="flex items-center gap-3 border-b px-4 py-3 text-[13px]">
            <span className="font-medium">银行流水</span>
            <span className="text-muted-foreground">/ 2026 年 3 月</span>
            <div className="ml-auto hidden items-center gap-1 sm:flex">
              <span className="inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-muted-foreground"><SlidersHorizontal className="size-3.5" />筛选</span>
              <span className="inline-flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 font-medium text-primary-foreground"><Upload className="size-3.5" />导入</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-4 py-3 text-[12px] text-muted-foreground">
            <span>自动核销 <b className="font-mono font-medium text-foreground tabular">{auto.toLocaleString()}</b> / {total.toLocaleString()}</span>
            <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
              <div className="h-full origin-left rounded-full bg-success transition-transform duration-500" style={{ transform: `scaleX(${auto / total})` }} />
            </div>
            <span className="font-mono tabular">{((auto / total) * 100).toFixed(1)}%</span>
            <span className="ml-auto hidden sm:inline">待确认 37 · 差异 4</span>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b text-left text-[11px] text-muted-foreground">
                <th className="hidden px-4 py-2 font-normal sm:table-cell">日期</th>
                <th className="px-4 py-2 font-normal">对方 / 摘要</th>
                <th className="px-4 py-2 text-right font-normal">金额</th>
                <th className="hidden px-4 py-2 font-normal lg:table-cell">匹配凭证</th>
                <th className="px-4 py-2 font-normal">状态</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => {
                const s = statusOf(i);
                return (
                  <tr key={i} className={cn("border-b last:border-0", i === 0 && "bg-accent/60")}>
                    <td className="hidden px-4 py-2.5 font-mono text-[12px] text-muted-foreground sm:table-cell">{r.date}</td>
                    <td className="max-w-0 px-4 py-2.5">
                      <div className="truncate">{r.payee}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{r.memo}</div>
                    </td>
                    <td className={cn("whitespace-nowrap px-4 py-2.5 text-right font-mono tabular", r.amount < 0 && "text-muted-foreground")}>{r.amount < 0 ? "−" : ""}{yuan(Math.abs(r.amount))}</td>
                    <td className={cn("hidden px-4 py-2.5 text-muted-foreground transition-opacity duration-300 lg:table-cell", s === "matching" && "opacity-0")}>{r.doc}</td>
                    <td className="px-4 py-2.5"><StatusTag status={s} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </main>
        <Inspector />
      </div>
    </div>
  );
}
