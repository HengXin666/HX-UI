import * as React from "react";
import { AnimatePresence, m, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { LiveDot } from "@/effects/live-dot";
import { cn } from "@/lib/utils";
import { yuan } from "./status";

/** 视觉容器: 统一的浅底画布, 让每个特性视觉看起来是同一套产品. */
function Canvas({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border bg-muted/40 p-4 md:p-6 dark:bg-muted/20", className)}>{children}</div>;
}

const ROW = 52;
const GAP = 8;
const mid = (i: number) => i * (ROW + GAP) + ROW / 2;

/** 智能匹配: 左流水, 右单据, 中间连线依次画出; 含一对多. */
export function MatchVisual() {
  const bank = [["顺丰速运", -12_904.5], ["北辰医疗器械", 96_880], ["阿里云计算", -8_431.27], ["HSBC FX", 70_412.6]] as const;
  const docs = [["订单 SF-2291", "运费"], ["发票 0379", "¥ 41,200.00"], ["发票 0380", "¥ 55,680.00"], ["发票 7720", "云资源"], ["结汇单 FX-31", "汇差 ¥ 12.40"]] as const;
  const links: [number, number, boolean][] = [[0, 0, true], [1, 1, true], [1, 2, true], [2, 3, true], [3, 4, false]];
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const h = docs.length * (ROW + GAP) - GAP;
  const item = "flex h-[52px] flex-col justify-center rounded-lg border bg-background px-3 text-[13px]";
  return (
    <Canvas>
      <div ref={ref} className="grid grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)]">
        <div className="space-y-2">
          <div className="mb-3 text-[11px] text-muted-foreground">银行流水</div>
          {bank.map(([n, a]) => (
            <div key={n} className={item}>
              <span className="truncate">{n}</span>
              <span className="font-mono text-[12px] text-muted-foreground tabular">{a < 0 ? "−" : ""}{yuan(Math.abs(a))}</span>
            </div>
          ))}
        </div>
        <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" className="mt-[30px] w-full overflow-visible" style={{ height: h }} aria-hidden>
          {links.map(([l, r, ok], k) => (
            <m.path
              key={k}
              d={`M0 ${mid(l)} C 50 ${mid(l)}, 50 ${mid(r)}, 100 ${mid(r)}`}
              fill="none"
              vectorEffect="non-scaling-stroke"
              className={ok ? "stroke-foreground/60" : "stroke-destructive"}
              strokeWidth={1}
              strokeDasharray={ok ? undefined : "3 3"}
              initial={reduce ? false : { pathLength: 0, opacity: 0 }}
              animate={inView || reduce ? { pathLength: 1, opacity: 1 } : undefined}
              transition={{ duration: 0.7, delay: 0.25 + k * 0.22, ease: [0.65, 0, 0.35, 1] }}
            />
          ))}
        </svg>
        <div className="space-y-2">
          <div className="mb-3 text-[11px] text-muted-foreground">发票 / 订单</div>
          {docs.map(([n, d], k) => (
            <div key={n} className={item}>
              <span className="flex items-center justify-between gap-2 truncate">{n}{k < 4 ? <Check className="size-3.5 shrink-0 text-success" /> : <span className="size-1.5 shrink-0 rounded-full bg-destructive" />}</span>
              <span className="truncate text-[12px] text-muted-foreground">{d}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 border-t pt-4 text-[12px] text-muted-foreground">
        <span>一对一 2 笔</span><span>一对多 1 笔 (2 张发票合并回款)</span><span className="text-destructive">汇差待确认 1 笔</span>
      </div>
    </Canvas>
  );
}

const Tok = ({ children, strong }: { children: React.ReactNode; strong?: boolean }) => (
  <span className={cn("inline-flex h-7 items-center rounded-md border px-2 text-[13px]", strong ? "bg-background font-medium" : "bg-muted/60 text-muted-foreground")}>{children}</span>
);

/** 规则引擎: 一条可读的规则 + 命中统计 + 其他规则列表. */
export function RulesVisual() {
  const bars = [8, 12, 9, 14, 11, 16, 13, 18, 15, 21, 17, 24, 19, 26];
  const rules: [string, number, boolean][] = [["顺丰 / 京东 运费 → 销售费用-运输", 862, true], ["阿里云 / 腾讯云 → 管理费用-IT", 214, true], ["个人报销 < ¥200 → 自动通过", 1_930, false]];
  return (
    <Canvas className="space-y-4">
      <div className="rounded-lg border bg-background p-4">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-medium">差旅餐饮 · 美团企业版</span>
          <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground"><LiveDot live={false} />启用中</span>
        </div>
        <div className="mt-4 space-y-2 text-[13px]">
          <div className="flex flex-wrap items-center gap-1.5"><span className="w-8 text-muted-foreground">当</span><Tok>对方户名</Tok><Tok>包含</Tok><Tok strong>美团</Tok></div>
          <div className="flex flex-wrap items-center gap-1.5"><span className="w-8 text-muted-foreground">且</span><Tok>金额</Tok><Tok>小于</Tok><Tok strong>¥ 500.00</Tok></div>
          <div className="flex flex-wrap items-center gap-1.5"><span className="w-8 text-muted-foreground">则</span><Tok>记入科目</Tok><Tok strong>6602.03 差旅费-餐饮</Tok></div>
        </div>
        <div className="mt-5 flex items-end justify-between gap-6 border-t pt-4">
          <div className="text-[12px] text-muted-foreground">近 30 天命中 <b className="font-mono text-[15px] font-medium text-foreground tabular">1,284</b> 笔 · 人工改判 5 笔</div>
          <div className="flex h-8 items-end gap-[3px]" aria-hidden>
            {bars.map((b, i) => <span key={i} className="w-1.5 rounded-sm bg-foreground/25 last:bg-foreground/70" style={{ height: `${(b / 26) * 100}%` }} />)}
          </div>
        </div>
      </div>
      <div className="divide-y rounded-lg border bg-background text-[13px]">
        {rules.map(([n, c, on]) => (
          <div key={n} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1 truncate">{n}</span>
            <span className="font-mono text-[12px] text-muted-foreground tabular">{c.toLocaleString()}</span>
            <span className={cn("relative h-4 w-7 rounded-full", on ? "bg-foreground" : "bg-muted")}><span className={cn("absolute top-0.5 size-3 rounded-full bg-background", on ? "left-3.5" : "left-0.5")} /></span>
          </div>
        ))}
      </div>
    </Canvas>
  );
}

const EVENTS = [
  ["回写核销", "记-0381", "上海青禾供应链"],
  ["生成凭证", "记-0382", "顺丰速运"],
  ["回写核销", "记-0383", "阿里云计算"],
  ["同步汇率", "USD/CNY", "7.1342"],
  ["回写核销", "记-0384", "北辰医疗器械"],
  ["生成凭证", "记-0385", "美团企业版"],
];

/** ERP 回写: 两端系统 + 实时事件流 (新事件从顶部插入). */
export function ErpVisual() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const [n, setN] = React.useState(4);
  React.useEffect(() => {
    if (reduce || !inView) return;
    const t = window.setInterval(() => setN((v) => v + 1), 1800);
    return () => window.clearInterval(t);
  }, [reduce, inView]);
  const list = Array.from({ length: 5 }, (_, k) => {
    const id = n - k;
    const e = EVENTS[((id % EVENTS.length) + EVENTS.length) % EVENTS.length];
    const sec = 11 + id * 2;
    return { id, e, time: `14:${String(2 + Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}` };
  });
  return (
    <Canvas>
      <div ref={ref} className="flex items-center gap-3 text-[13px]">
        <div className="flex-1 rounded-lg border bg-background px-3 py-2.5"><div className="text-[11px] text-muted-foreground">来源</div><div className="font-medium">Tally 对账</div></div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 rounded-lg border bg-background px-3 py-2.5"><div className="text-[11px] text-muted-foreground">目标</div><div className="flex items-center gap-2 font-medium">金蝶云 · 星空 <LiveDot className="ml-auto" /></div></div>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border bg-background">
        <div className="flex border-b px-4 py-2 text-[11px] text-muted-foreground"><span className="w-20">时间</span><span className="w-20">动作</span><span className="flex-1">对象</span><span>结果</span></div>
        <ul className="font-mono text-[12px]">
          <AnimatePresence initial={false}>
            {list.map(({ id, e, time }) => (
              <m.li
                key={id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center border-b px-4 py-2.5 last:border-0"
              >
                <span className="w-20 text-muted-foreground">{time}</span>
                <span className="w-20 font-sans">{e[0]}</span>
                <span className="min-w-0 flex-1 truncate font-sans text-muted-foreground">{e[1]} · {e[2]}</span>
                <span className="text-success">200</span>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
      <div className="mt-4 text-[12px] text-muted-foreground">金蝶、用友、SAP、Oracle NetSuite 官方接口 · 不改 ERP 一行配置</div>
    </Canvas>
  );
}

/** 收尾区的结果卡: 一个月结完成后的样子, 让 CTA 有可感知的终点. */
export function CloseResult() {
  const rows: [string, string][] = [["流水", "1,241 笔"], ["自动核销", "1,197 笔 · 96.4%"], ["人工确认", "40 笔"], ["差异", "4 笔 · ¥ 12.40 汇差已入账"]];
  return (
    <div className="rounded-xl border bg-card p-6 shadow-[0_1px_1px_oklch(0_0_0/0.04),0_24px_48px_-16px_oklch(0_0_0/0.12)] lg:ml-auto lg:w-[420px]">
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <span className="grid size-5 place-items-center rounded-full bg-success text-background"><Check className="size-3" strokeWidth={3} /></span>
        2026 年 3 月 · 月结完成
      </div>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-5xl font-semibold tracking-[-0.03em] tabular">18</span>
        <span className="text-muted-foreground">分钟</span>
        <span className="ml-auto text-[13px] text-muted-foreground">上月 2 天 6 小时</span>
      </div>
      <dl className="mt-6 divide-y border-t text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-2.5"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium tabular">{v}</dd></div>
        ))}
      </dl>
    </div>
  );
}
