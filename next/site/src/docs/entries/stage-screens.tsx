import { useMemo, useState } from "react";
import { Activity, BarChart3, Bell, Box, CreditCard, Home, Search, Settings, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** 演示用的真实界面 (数据为虚构). 按 1280px 设计宽度排版, 放进 Stage 后可以直接点 */

const RANGES = { "7 天": 7, "30 天": 30, "90 天": 90 } as const;
type Range = keyof typeof RANGES;

function series(n: number, seed: number) {
  let s = seed;
  const out: number[] = [];
  let v = 40;
  for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; v = Math.max(8, v + ((s % 1000) / 1000 - 0.42) * 9); out.push(v); }
  return out;
}

function Area({ data }: { data: number[] }) {
  const max = Math.max(...data) * 1.15, w = 760, h = 220;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - (v / max) * h] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full min-h-[160px] w-full" aria-hidden="true">
      <defs>
        <linearGradient id="hx-st-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--brand)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="var(--border)" strokeDasharray="3 5" />)}
      <path d={`${line} L${w},${h} L0,${h} Z`} fill="url(#hx-st-area)" />
      <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" style={{ transition: "d 400ms ease" }} />
    </svg>
  );
}

export function DashboardScreen() {
  const [range, setRange] = useState<Range>("30 天");
  const [nav, setNav] = useState("概览");
  const [live, setLive] = useState(true);
  const data = useMemo(() => series(RANGES[range] + 1, RANGES[range] * 13 + 5), [range]);
  const total = Math.round(data.reduce((a, b) => a + b, 0) * 37);
  return (
    <div className="flex h-full text-[15px]">
      <aside className="flex w-[232px] shrink-0 flex-col gap-1 border-r bg-muted/30 p-4">
        <div className="mb-5 flex items-center gap-2.5 px-2 font-semibold"><span className="grid size-7 place-items-center rounded-lg bg-foreground text-background"><Box className="size-4" /></span>Northwind</div>
        {[["概览", Home], ["分析", BarChart3], ["客户", Users], ["账单", CreditCard], ["动态", Activity], ["设置", Settings]].map(([l, I]) => {
          const Icon = I as typeof Home;
          return (
            <button key={l as string} type="button" onClick={() => setNav(l as string)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-left text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", nav === l && "bg-background text-foreground shadow-sm ring-1 ring-border")}>
              <Icon className="size-4" />{l as string}
            </button>
          );
        })}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col p-8">
        <header className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{nav}</p>
            <p className="text-2xl font-semibold tracking-tight">营收总览</p>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground"><Search className="size-4" />搜索订单、客户…<kbd className="ml-6 rounded border px-1.5 font-mono text-xs">⌘K</kbd></div>
          <button type="button" aria-label="通知" className="grid size-10 place-items-center rounded-lg border"><Bell className="size-4" /></button>
        </header>
        <div className="mt-7 grid grid-cols-3 gap-4">
          {[["总营收", `¥${total.toLocaleString("zh-CN")}`, "+12.4%"], ["活跃客户", (total / 61).toFixed(0), "+4.1%"], ["转化率", "3.82%", "-0.3%"]].map(([k, v, d]) => (
            <div key={k} className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">{k}</p>
              <p className="mt-2 font-mono text-[28px] font-semibold tabular-nums tracking-tight">{v}</p>
              <p className={cn("mt-1 text-sm", d.startsWith("-") ? "text-rose-500" : "text-emerald-500")}>{d} 较上期</p>
            </div>
          ))}
        </div>
        <section className="mt-4 flex min-h-0 flex-1 flex-col rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <p className="font-medium">每日营收</p>
            <label className="ml-4 flex items-center gap-2 text-sm text-muted-foreground"><Switch checked={live} onCheckedChange={setLive} aria-label="实时" />实时</label>
            <div className="ml-auto flex rounded-lg border p-0.5 text-sm">
              {(Object.keys(RANGES) as Range[]).map((r) => (
                <button key={r} type="button" onClick={() => setRange(r)} className={cn("rounded-md px-3 py-1 transition-colors", range === r ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>{r}</button>
              ))}
            </div>
          </div>
          <div className="mt-4 min-h-0 flex-1"><Area data={data} /></div>
        </section>
        <p className="mt-3 text-xs text-muted-foreground">演示数据为虚构</p>
      </div>
    </div>
  );
}

export function PhoneScreen() {
  const [done, setDone] = useState<number[]>([1]);
  const items = ["复盘季度目标", "回复设计评审", "整理发布说明", "预约用户访谈", "更新路线图"];
  return (
    <div className="h-full bg-background p-7 pt-24 text-[17px]">
      <p className="text-sm text-muted-foreground">11 月 24 日 · 周二</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">今天</p>
      <div className="mt-6 space-y-2.5">
        {items.map((t, i) => {
          const on = done.includes(i);
          return (
            <button key={t} type="button" onClick={() => setDone((d) => (on ? d.filter((x) => x !== i) : [...d, i]))} className="flex w-full items-center gap-3.5 rounded-2xl border bg-card p-4 text-left">
              <span className={cn("grid size-6 place-items-center rounded-full border-2 transition-colors", on ? "border-brand bg-brand text-white" : "border-muted-foreground/40")}>{on ? "✓" : ""}</span>
              <span className={cn("transition-colors", on && "text-muted-foreground line-through")}>{t}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">已完成 {done.length} / {items.length}</p>
    </div>
  );
}

export function CodeScreen() {
  const lines = [
    ["<", "Stage"],
    ["  shot", '="hero"'],
    ["  motion", '="orbit"'],
    ["  background", '="studio"'],
    ["  reflection", "={0.4}"],
    [">", ""],
    ["  <", "StageScreen url=\"app.northwind.io\">"],
    ["    <", "Dashboard />"],
    ["  </", "StageScreen>"],
    ["</", "Stage>"],
  ];
  return (
    <div className="h-full bg-[#0d0d12] p-8 font-mono text-[19px] leading-[1.75] text-zinc-300">
      {lines.map(([a, b], i) => (
        <div key={i} className="flex gap-6">
          <span className="w-6 text-right text-zinc-600">{i + 1}</span>
          <span><span className="text-violet-400">{a}</span><span className="text-sky-300">{b}</span></span>
        </div>
      ))}
    </div>
  );
}
