import * as React from "react";
import { CalendarClock, Minus, Plus, RotateCcw } from "lucide-react";
import { Gantt, ganttDate, type GanttTask } from "@/data";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";
import { ChartCard, seeded } from "./_chart";

// 演示数据为虚构
const { add, toDay } = ganttDate;
const LAUNCH: GanttTask[] = [
  { id: "prd", name: "需求评审", start: "2026-11-16", end: "2026-11-18", progress: 1, group: "产品" },
  { id: "ux", name: "交互与视觉", start: "2026-11-19", end: "2026-11-27", progress: 0.8, group: "设计", deps: ["prd"] },
  { id: "api", name: "接口开发", start: "2026-11-19", end: "2026-12-02", progress: 0.55, group: "研发", deps: ["prd"] },
  { id: "fe", name: "前端开发", start: "2026-11-30", end: "2026-12-09", progress: 0.1, group: "研发", deps: ["ux"] },
  { id: "qa", name: "联调测试", start: "2026-12-10", end: "2026-12-15", progress: 0, group: "测试", deps: ["fe", "api"] },
  { id: "mkt", name: "预热物料", start: "2026-12-01", end: "2026-12-11", progress: 0.2, group: "市场", deps: ["ux"] },
  { id: "go", name: "正式发布", start: "2026-12-16", milestone: true, group: "产品", deps: ["qa", "mkt"] },
];
const ROADMAP: GanttTask[] = [
  { id: "q1", name: "会员体系 2.0", start: "2026-01-05", end: "2026-03-27", progress: 1, group: "增长" },
  { id: "pay", name: "支付通道切换", start: "2026-02-09", end: "2026-05-15", progress: 1, group: "平台" },
  { id: "app", name: "App 重构", start: "2026-04-06", end: "2026-08-28", progress: 0.9, group: "客户端", deps: ["q1"] },
  { id: "rec", name: "推荐模型上线", start: "2026-06-01", end: "2026-09-30", progress: 0.7, group: "算法" },
  { id: "intl", name: "海外站点", start: "2026-08-03", end: "2026-12-18", progress: 0.35, group: "增长", deps: ["pay"] },
  { id: "d11", name: "双十一", start: "2026-11-11", milestone: true, group: "增长", deps: ["app", "rec"] },
  { id: "dw", name: "数仓迁移", start: "2026-09-14", end: "2027-02-26", progress: 0.2, group: "平台" },
];
const NEW_NAMES = ["埋点方案", "灰度策略", "客服培训", "性能压测", "法务审核", "数据看板", "应急预案", "渠道对接"];
const GROUPS = ["研发", "测试", "市场", "产品", "设计"];

/** 把依赖方顺延到前置结束之后 (前置的后继递归跟着走) */
function cascade(list: GanttTask[]): GanttTask[] {
  const byId = new Map(list.map((t) => [t.id, { ...t }]));
  for (let pass = 0; pass < list.length; pass++) {
    let changed = false;
    for (const t of byId.values()) {
      const need = Math.max(-Infinity, ...(t.deps ?? []).map((d) => byId.get(d)).filter(Boolean).map((p) => toDay(p!.end ?? p!.start) + (p!.milestone ? 0 : 1)));
      if (need > toDay(t.start)) {
        const shift = need - toDay(t.start);
        t.start = add(t.start, shift); if (t.end) t.end = add(t.end, shift); changed = true;
      }
    }
    if (!changed) break;
  }
  return list.map((t) => byId.get(t.id)!);
}

export default function GanttDemo({ values }: DemoProps) {
  const kind = values.dataset === "roadmap" ? "roadmap" : "launch";
  const base = kind === "roadmap" ? ROADMAP : LAUNCH;
  const [tasks, setTasks] = React.useState(base);
  const rnd = React.useRef(seeded(23));
  const n = React.useRef(0);
  React.useEffect(() => { setTasks(base); }, [base]);
  const autoShift = !!values.cascade;
  const apply = (next: GanttTask[]) => (autoShift ? cascade(next) : next);

  const addTask = () => setTasks((ts) => {
    const work = ts.filter((t) => !t.milestone);
    const after = work[Math.floor(rnd.current() * work.length)];
    const len = kind === "roadmap" ? 30 + Math.floor(rnd.current() * 60) : 2 + Math.floor(rnd.current() * 5);
    const start = add(after.end ?? after.start, 1);
    const id = `n${++n.current}`;
    const t: GanttTask = { id, name: NEW_NAMES[(n.current - 1) % NEW_NAMES.length], start, end: add(start, len - 1), progress: 0, group: GROUPS[n.current % GROUPS.length], deps: [after.id] };
    const at = ts.indexOf(after) + 1;
    return apply([...ts.slice(0, at), t, ...ts.slice(at)]);
  });
  const removeTask = () => setTasks((ts) => {
    const cand = ts.filter((t) => !t.milestone);
    if (cand.length <= 2) return ts;
    const gone = cand[cand.length - 1].id;
    return ts.filter((t) => t.id !== gone).map((t) => (t.deps?.includes(gone) ? { ...t, deps: t.deps.filter((d) => d !== gone) } : t));
  });
  const delay = () => setTasks((ts) => {
    const cand = ts.filter((t) => !t.milestone && (t.progress ?? 0) < 1);
    const t = cand[Math.floor(rnd.current() * cand.length)];
    if (!t) return ts;
    const by = kind === "roadmap" ? 21 : 3;
    return apply(ts.map((x) => (x.id === t.id ? { ...x, end: add(x.end!, by), progress: Math.min(1, (x.progress ?? 0) + 0.15) } : x)));
  });

  const go = tasks.find((t) => t.milestone);
  return (
    <ChartCard wide
      title={kind === "roadmap" ? "2026 产品路线图" : "新品发布排期"}
      value={go ? `${go.name} ${go.start.slice(5).replace("-", "月")}日` : `${tasks.length} 项任务`}
      delta={<span className="text-muted-foreground">{tasks.length} 项任务</span>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={addTask}><Plus aria-hidden />新增任务</Button>
        <Button size="sm" variant="outline" onClick={removeTask}><Minus aria-hidden />删除任务</Button>
        <Button size="sm" variant="outline" onClick={delay}><CalendarClock aria-hidden />随机延期</Button>
        <Button size="sm" variant="ghost" onClick={() => setTasks(base)}><RotateCcw aria-hidden />重置</Button>
      </div>
      <Gantt
        tasks={tasks}
        unit={values.unit as "day" | "week" | "month"}
        today={kind === "roadmap" ? "2026-11-22" : "2026-11-24"}
        showDeps={!!values.showDeps}
        density={values.density as "comfortable" | "compact"}
        onChange={values.editable ? (id, next) => setTasks((ts) => apply(ts.map((t) => (t.id === id ? { ...t, start: next.start, end: t.milestone ? undefined : next.end } : t)))) : undefined}
        ariaLabel={kind === "roadmap" ? "产品路线图" : "新品发布排期"}
      />
      <p className="mt-2 text-[11px] text-muted-foreground">演示数据为虚构。{autoShift ? "改期后依赖它的任务自动顺延；" : "关掉了自动顺延，冲突的依赖会标成红色虚线；"}红线是今天。</p>
    </ChartCard>
  );
}
