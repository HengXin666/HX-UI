"use client";

import { AnimatePresence, m } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";
import { ganttDate } from "./helpers";

export interface GanttTask {
  id: string;
  name: string;
  /** "YYYY-MM-DD", 含当天 */
  start: string;
  /** "YYYY-MM-DD", 含当天; 里程碑可以不写 */
  end?: string;
  /** 0–1 */
  progress?: number;
  /** 分组 (负责人/阶段), 决定颜色 */
  group?: string;
  /** 前置任务 id, 画依赖箭头 */
  deps?: string[];
  milestone?: boolean;
}

export interface GanttProps {
  tasks: GanttTask[];
  /** 刻度: 日 / 周 / 月 */
  unit?: "day" | "week" | "month";
  /** 今天 "YYYY-MM-DD", 画一条竖线 */
  today?: string;
  /** 依赖箭头 */
  showDeps?: boolean;
  /** 给了就能拖动条形 / 拖两端改工期 / 键盘 ←→ 移动、Shift+←→ 改结束日 */
  onChange?: (id: string, next: { start: string; end: string }) => void;
  density?: "comfortable" | "compact";
  /** 可视区高度上限, 超出纵向滚动 */
  maxHeight?: number;
  ariaLabel?: string;
  className?: string;
}

const DAY = 86400000;
const { toDay, toStr } = ganttDate;
const md = (n: number) => { const d = new Date(n * DAY); return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`; };
const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
// 每天最少多少像素; 放得下时铺满宽度, 放不下就横向滚动
const MIN_PX = { day: 24, week: 5, month: 1.1 } as const;
const NAME_W = 168;

/**
 * 甘特图: 任务条 + 进度 + 依赖箭头 + 里程碑 + 今天线.
 * 增删任务时其他行滑到新位置, 新条从起点向右长出来, 删除的条收回起点再淡出; 改期时条形平移/伸缩, 箭头跟着走.
 * 传 onChange 后可拖动 (整体 / 左右边缘) 和键盘改期, 按天吸附.
 */
export function Gantt({
  tasks, unit = "day", today, showDeps = true, onChange, density = "comfortable", maxHeight = 420, ariaLabel = "甘特图", className,
}: GanttProps) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const narrow = width > 0 && width < 520;
  const nameW = narrow ? 104 : NAME_W;
  const rowH = density === "compact" ? 28 : 36;
  const barH = density === "compact" ? 14 : 18;
  const headH = 44;

  // 拖动中的预览 (只改本地, 松手才回调)
  const [draft, setDraft] = useState<{ id: string; s: number; e: number } | null>(null);
  const rows = useMemo(() => tasks.map((t) => {
    const s = toDay(t.start), e = t.end ? toDay(t.end) : s;
    const d = draft && draft.id === t.id ? draft : null;
    return { t, s: d ? d.s : s, e: Math.max(d ? d.e : e, d ? d.s : s) };
  }), [tasks, draft]);
  const index = new Map(rows.map((r, i) => [r.t.id, i]));

  const groups = [...new Set(tasks.map((t) => t.group ?? ""))];
  const colorOf = (g?: string) => PALETTE[Math.max(0, groups.indexOf(g ?? "")) % PALETTE.length];

  // 时间范围: 任务首尾各留一点, 按刻度对齐
  const t0 = rows.length ? Math.min(...rows.map((r) => r.s)) : toDay(today ?? "2026-01-01");
  const t1 = rows.length ? Math.max(...rows.map((r) => r.e)) : t0 + 14;
  const padDays = unit === "day" ? 2 : unit === "week" ? 7 : 20;
  // 范围只在任务变化时重算, 拖动时不跟着抖
  const [range, setRange] = useState<[number, number]>([t0 - padDays, t1 + padDays + 1]);
  const want: [number, number] = [t0 - padDays, t1 + padDays + 1];
  if (!draft && (want[0] !== range[0] || want[1] !== range[1])) setRange(want);
  let [d0, d1] = range;
  if (unit === "week") { const w = (new Date(d0 * DAY).getUTCDay() + 6) % 7; d0 -= w; }
  const avail = Math.max(0, width - nameW - 2);
  const px = Math.max(MIN_PX[unit], avail / Math.max(1, d1 - d0));
  const plotW = Math.max((d1 - d0) * px, avail);
  d1 = d0 + Math.ceil(plotW / px);
  const x = (day: number) => (day - d0) * px;
  const H = rows.length * rowH;

  // 刻度
  const ticks = useMemo(() => {
    const top: { x: number; w: number; label: string }[] = [];
    const bottom: { x: number; label: string; weekend?: boolean }[] = [];
    let cur = d0;
    while (cur < d1) {
      const d = new Date(cur * DAY);
      const next = Math.round(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) / DAY);
      const end = Math.min(next, d1);
      top.push({ x: x(cur), w: x(end) - x(cur), label: unit === "month" ? `${d.getUTCFullYear()}` : `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月` });
      cur = next;
    }
    for (let day = d0; day < d1; day++) {
      const d = new Date(day * DAY), wd = d.getUTCDay();
      if (unit === "day") bottom.push({ x: x(day), label: String(d.getUTCDate()), weekend: wd === 0 || wd === 6 });
      else if (unit === "week" && wd === 1) bottom.push({ x: x(day), label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}` });
      else if (unit === "month" && d.getUTCDate() === 1) bottom.push({ x: x(day), label: `${d.getUTCMonth() + 1}月` });
    }
    // 月刻度时顶层按年合并
    if (unit === "month") {
      const merged: typeof top = [];
      for (const t of top) { const last = merged[merged.length - 1]; if (last && last.label === t.label) last.w += t.w; else merged.push({ ...t }); }
      return { top: merged, bottom };
    }
    return { top, bottom };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d0, d1, unit, px]);

  // 交互状态
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const active = hover ?? focus;
  const tabId = focus && index.has(focus) ? focus : rows[0]?.t.id;
  const svgRef = useRef<SVGSVGElement>(null);
  const [live, setLive] = useState("");
  const related = useMemo(() => {
    if (!active) return null;
    const s = new Set([active]);
    const t = tasks.find((x) => x.id === active);
    t?.deps?.forEach((d) => s.add(d));
    tasks.forEach((x) => x.deps?.includes(active) && s.add(x.id));
    return s;
  }, [active, tasks]);

  const dur = (r: { s: number; e: number }) => r.e - r.s + 1;
  const describe = (r: (typeof rows)[number]) =>
    r.t.milestone
      ? `${r.t.name}，里程碑，${md(r.s)}`
      : `${r.t.name}，${md(r.s)} 至 ${md(r.e)}，${dur(r)} 天${r.t.progress != null ? `，完成 ${Math.round(r.t.progress * 100)}%` : ""}${r.t.deps?.length ? `，前置：${r.t.deps.map((d) => tasks.find((x) => x.id === d)?.name ?? d).join("、")}` : ""}`;

  const commit = (id: string, s: number, e: number) => {
    onChange?.(id, { start: toStr(s), end: toStr(e) });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = rows.findIndex((r) => r.t.id === tabId);
    if (i < 0) return;
    const r = rows[i];
    let j = -1;
    if (e.key === "ArrowDown") j = Math.min(rows.length - 1, i + 1);
    else if (e.key === "ArrowUp") j = Math.max(0, i - 1);
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = rows.length - 1;
    else if (onChange && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      const dd = e.key === "ArrowRight" ? 1 : -1;
      if (e.shiftKey && !r.t.milestone) {
        const ne = Math.max(r.s, r.e + dd);
        commit(r.t.id, r.s, ne); setLive(`${r.t.name} 结束改为 ${md(ne)}，${ne - r.s + 1} 天`);
      } else {
        commit(r.t.id, r.s + dd, r.e + dd); setLive(`${r.t.name} 移到 ${md(r.s + dd)} 至 ${md(r.e + dd)}`);
      }
      return;
    }
    if (j < 0) return;
    e.preventDefault();
    const k = rows[j].t.id; setFocus(k);
    svgRef.current?.querySelector<SVGGElement>(`g[data-k="${CSS.escape(k)}"]`)?.focus();
  };

  // 拖动: 整条平移, 或拖左右 6px 边缘改起止
  const drag = useRef<{ id: string; mode: "move" | "l" | "r"; x0: number; s: number; e: number; moved: boolean } | null>(null);
  const onPointerDown = (ev: React.PointerEvent, r: (typeof rows)[number]) => {
    if (!onChange || ev.button !== 0) return;
    const g = ev.currentTarget as SVGGElement;
    const box = g.querySelector("[data-bar]")?.getBoundingClientRect();
    const edge = Math.min(8, (box?.width ?? 0) / 4);
    const mode = r.t.milestone || !box ? "move" : ev.clientX - box.left < edge ? "l" : box.right - ev.clientX < edge ? "r" : "move";
    drag.current = { id: r.t.id, mode, x0: ev.clientX, s: r.s, e: r.e, moved: false };
    g.setPointerCapture(ev.pointerId);
  };
  const onPointerMove = (ev: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dd = Math.round((ev.clientX - d.x0) / px);
    if (dd === 0 && !d.moved) return;
    d.moved = true;
    const s = d.mode === "r" ? d.s : d.mode === "l" ? Math.min(d.e, d.s + dd) : d.s + dd;
    const e = d.mode === "l" ? d.e : d.mode === "r" ? Math.max(d.s, d.e + dd) : d.e + dd;
    setDraft({ id: d.id, s, e });
  };
  const onPointerUp = () => {
    const d = drag.current; drag.current = null;
    if (d?.moved && draft) { commit(d.id, draft.s, draft.e); setLive(`${tasks.find((t) => t.id === d.id)?.name} 改为 ${md(draft.s)} 至 ${md(draft.e)}`); }
    setDraft(null);
  };

  const tr = (dur = 0.32) => (reduced ? { duration: 0 } : { duration: dur, ease: [0.22, 1, 0.36, 1] as const });
  const fade = { duration: 0.2 };
  const dragging = !!draft;

  // 依赖箭头: 前置的结束 → 本任务的开始, 走直角
  const deps = showDeps ? rows.flatMap((r) => (r.t.deps ?? []).filter((d) => index.has(d)).map((d) => {
    const p = rows[index.get(d)!];
    const x1 = x(p.e + 1) + (p.t.milestone ? -px / 2 + 6 : 0), y1 = index.get(d)! * rowH + rowH / 2;
    const x2 = x(r.s) + (r.t.milestone ? px / 2 - 6 : 0), y2 = index.get(r.t.id)! * rowH + rowH / 2;
    const bend = Math.max(x1 + 6, Math.min(x2 - 6, x1 + 10));
    const late = x2 < x1; // 开始早于前置结束: 冲突
    return { key: `${d}>${r.t.id}`, d: `M${x1},${y1} H${bend} V${y2} H${x2 - 2}`, late, on: related ? related.has(d) && related.has(r.t.id) && (d === active || r.t.id === active) : false };
  })) : [];

  const todayX = today ? x(toDay(today)) + px / 2 : null;
  // 放不下时, 首次显示和换刻度时把今天滚到左侧三分之一处
  const scroller = useRef<HTMLDivElement>(null);
  const scrolledFor = useRef("");
  const [scrollX, setScrollX] = useState(0);
  useLayoutEffect(() => {
    const el = scroller.current; if (!el || !width) return;
    const key = `${unit}|${tasks.length ? tasks[0].id : ""}`;
    if (scrolledFor.current === key) return;
    scrolledFor.current = key;
    const target = todayX ?? (rows.length ? x(Math.min(...rows.map((r) => r.s))) : 0);
    el.scrollLeft = Math.max(0, target - avail * 0.3);
  });
  const tip = active && index.has(active) ? rows[index.get(active)!] : null;

  return (
    <div ref={box} className={cn("relative w-full", className)}>
      {width > 0 && (
        <div ref={scroller} onScroll={(e) => setScrollX(e.currentTarget.scrollLeft)} className="relative overflow-auto rounded-lg border scrollbar-thin" style={{ maxHeight: maxHeight + headH }}>
          <div className="relative" style={{ width: nameW + plotW, height: headH + H }}>
            {/* 表头 */}
            <div className="sticky top-0 z-20 flex border-b bg-background/95 backdrop-blur" style={{ height: headH, width: nameW + plotW }}>
              <div className="sticky left-0 z-10 flex items-end border-r bg-background px-3 pb-1.5 text-xs text-muted-foreground" style={{ width: nameW, minWidth: nameW }}>任务</div>
              <svg width={plotW} height={headH} aria-hidden className="block">
                {ticks.top.map((t) => (
                  <g key={t.x}>
                    <line x1={t.x} x2={t.x} y1={0} y2={headH / 2} stroke="var(--border)" />
                    {/* 月份名贴住可视区左边, 滚动时不跟着消失 */}
                    {(() => { const lx = Math.min(Math.max(t.x, scrollX), t.x + t.w - 70); return t.w > 60 && <text x={lx + 6} y={15} className="fill-foreground text-[11px] font-medium">{t.label}</text>; })()}
                  </g>
                ))}
                {ticks.bottom.map((t) => (
                  <text key={t.x} x={unit === "day" ? t.x + px / 2 : t.x + 3} y={headH - 9} textAnchor={unit === "day" ? "middle" : "start"} className={cn("font-mono text-[10px] tabular-nums", t.weekend ? "fill-muted-foreground/60" : "fill-muted-foreground")}>{t.label}</text>
                ))}
                <line x1={0} x2={plotW} y1={headH / 2} y2={headH / 2} stroke="var(--border)" strokeOpacity={0.5} />
              </svg>
            </div>

            {/* 任务名列 */}
            <div className="flex">
            <div className="sticky left-0 z-10 shrink-0 border-r bg-background" style={{ width: nameW, height: H }} aria-hidden>
              <AnimatePresence initial={false}>
                {rows.map((r, i) => (
                  <m.div key={r.t.id} initial={{ opacity: 0 }} animate={{ opacity: 1, y: i * rowH }} exit={{ opacity: 0 }}
                    transition={{ y: tr(), opacity: fade }}
                    className={cn("absolute inset-x-0 top-0 flex items-center gap-2 px-3 text-xs transition-colors duration-150", r.t.id === active ? "bg-accent text-foreground" : "text-muted-foreground")}
                    style={{ height: rowH }}>
                    <span className={cn("size-2 shrink-0", r.t.milestone ? "rotate-45 rounded-[1px]" : "rounded-full")} style={{ background: colorOf(r.t.group) }} />
                    <span className="truncate">{r.t.name}</span>
                  </m.div>
                ))}
              </AnimatePresence>
            </div>

            {/* 图区 */}
            <svg ref={svgRef} width={plotW} height={Math.max(H, 1)} className={cn("block shrink-0 select-none", onChange && "touch-pan-y")}
              role="group" aria-roledescription="甘特图"
              aria-label={`${ariaLabel}，${rows.length} 个任务。上下键切换任务${onChange ? "，左右键移动一天，Shift 加左右键改结束日" : ""}`}
              onKeyDown={onKeyDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
              <defs>
                <marker id="hx-gantt-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="context-stroke" /></marker>
              </defs>
              {/* 周末 + 网格 */}
              <g aria-hidden>
                {unit === "day" && ticks.bottom.filter((t) => t.weekend).map((t) => <rect key={t.x} x={t.x} y={0} width={px} height={H} fill="var(--muted)" fillOpacity={0.45} />)}
                {ticks.bottom.map((t) => <line key={t.x} x1={t.x} x2={t.x} y1={0} y2={H} stroke="var(--border)" strokeOpacity={unit === "day" ? 0.35 : 0.6} />)}
                <AnimatePresence initial={false}>
                  {rows.map((r, i) => (
                    <m.line key={r.t.id} x1={0} x2={plotW} y1={0} y2={0} initial={{ opacity: 0 }} animate={{ opacity: 1, y: (i + 1) * rowH }} exit={{ opacity: 0 }} transition={{ y: tr(), opacity: fade }} stroke="var(--border)" strokeOpacity={0.5} />
                  ))}
                </AnimatePresence>
                {active && index.has(active) && <rect x={0} y={index.get(active)! * rowH} width={plotW} height={rowH} fill="var(--accent)" fillOpacity={0.5} />}
              </g>

              {/* 依赖 */}
              <g aria-hidden fill="none">
                <AnimatePresence initial={false}>
                  {deps.map((d) => (
                    <m.path key={d.key} initial={{ opacity: 0 }} animate={{ opacity: related && !d.on ? 0.15 : 1, d: d.d }} exit={{ opacity: 0 }}
                      transition={{ d: dragging ? { duration: 0 } : tr(), opacity: fade }}
                      stroke={d.late ? "var(--destructive)" : d.on ? "var(--foreground)" : "var(--muted-foreground)"} strokeWidth={d.on ? 1.5 : 1}
                      strokeDasharray={d.late ? "3 2" : undefined} markerEnd="url(#hx-gantt-arrow)" />
                  ))}
                </AnimatePresence>
              </g>

              {/* 今天 */}
              {todayX != null && todayX >= 0 && todayX <= plotW && (
                <g aria-hidden>
                  <line x1={todayX} x2={todayX} y1={0} y2={H} stroke="var(--destructive)" strokeWidth={1.5} />
                </g>
              )}

              {/* 任务条 */}
              <AnimatePresence initial={false}>
                {rows.map((r, i) => {
                  const bx = x(r.s), bw = Math.max(px * 0.6, x(r.e + 1) - bx);
                  const y = i * rowH + (rowH - barH) / 2;
                  const c = colorOf(r.t.group);
                  const dim = related ? !related.has(r.t.id) : false;
                  const mx = x(r.s) + px / 2;
                  return (
                    <m.g key={r.t.id} data-k={r.t.id} role="img" tabIndex={r.t.id === tabId ? 0 : -1} aria-label={describe(r)}
                      initial={{ opacity: 0, y }} animate={{ opacity: dim ? 0.4 : 1, y }} exit={{ opacity: 0, transition: fade }}
                      transition={{ y: tr(), opacity: fade }}
                      onPointerEnter={() => !drag.current && setHover(r.t.id)} onPointerLeave={() => !drag.current && setHover((h) => (h === r.t.id ? null : h))}
                      onFocus={() => setFocus(r.t.id)} onBlur={() => setFocus((f) => (f === r.t.id ? null : f))}
                      onPointerDown={(e) => onPointerDown(e, r)}
                      className={cn("outline-none [&:focus-visible_[data-bar]]:stroke-[var(--ring)] [&:focus-visible_[data-bar]]:stroke-2", onChange && "cursor-grab active:cursor-grabbing")}>
                      {r.t.milestone ? (
                        <m.rect data-bar initial={{ x: mx - barH / 2, scale: reduced ? 1 : 0 }} animate={{ x: mx - barH / 2, scale: 1 }} exit={reduced ? undefined : { scale: 0 }}
                          transition={{ x: dragging ? { duration: 0 } : tr(), scale: tr(0.28) }}
                          y={0} width={barH} height={barH} rx={2} fill={c} stroke="var(--background)" strokeWidth={1}
                          style={{ transformBox: "fill-box", transformOrigin: "center", rotate: 45 }} />
                      ) : (
                        <>
                          {/* 新条从起点向右长出来, 删掉的收回起点 */}
                          <m.rect data-bar initial={{ x: bx, width: reduced ? bw : 0 }} animate={{ x: bx, width: bw }} exit={reduced ? undefined : { width: 0 }}
                            transition={dragging ? { duration: 0 } : tr(0.36)}
                            y={0} height={barH} rx={4} fill={c} fillOpacity={0.28} stroke={c} strokeOpacity={0.7} />
                          {r.t.progress != null && (
                            <m.rect initial={{ x: bx, width: 0 }} animate={{ x: bx, width: bw * Math.max(0, Math.min(1, r.t.progress)) }} exit={reduced ? undefined : { width: 0 }}
                              transition={dragging ? { duration: 0 } : tr(0.42)}
                              y={0} height={barH} rx={4} fill={c} fillOpacity={0.9} className="pointer-events-none" />
                          )}
                          {onChange && <rect x={bx + bw - 3} y={3} width={2} height={barH - 6} rx={1} fill="var(--background)" fillOpacity={0.7} className="pointer-events-none opacity-0 transition-opacity duration-150 [g:hover>&]:opacity-100" />}
                          {/* 条内或条后写名字/天数 */}
                          {!narrow && (
                            <m.text initial={false} animate={{ x: bw > 90 ? bx + 8 : bx + bw + 6 }} transition={dragging ? { duration: 0 } : tr()}
                              y={barH / 2} dy="0.34em" className={cn("pointer-events-none text-[11px]", bw > 90 ? "fill-foreground font-medium" : "fill-muted-foreground")}>
                              {bw > 90 ? `${dur(r)} 天${r.t.progress != null ? ` · ${Math.round(r.t.progress * 100)}%` : ""}` : `${dur(r)} 天`}
                            </m.text>
                          )}
                        </>
                      )}
                    </m.g>
                  );
                })}
              </AnimatePresence>
            </svg>
            </div>
          </div>
        </div>
      )}

      {/* 提示: 悬停/聚焦时显示任务详情, 平时显示操作提示 */}
      <div aria-hidden className="pointer-events-none relative mt-2 h-5 text-xs">
        <div className={cn("absolute inset-0 flex items-center gap-x-3 truncate transition-opacity duration-150", tip ? "opacity-100" : "opacity-0")}>
          {tip && (
            <>
              <span className="font-medium text-foreground">{tip.t.name}</span>
              <span className="font-mono text-muted-foreground tabular-nums">{tip.t.milestone ? md(tip.s) : `${md(tip.s)} → ${md(tip.e)} · ${dur(tip)} 天`}</span>
              {tip.t.progress != null && <span className="text-muted-foreground">完成 <span className="font-mono text-foreground tabular-nums">{Math.round(tip.t.progress * 100)}%</span></span>}
              {tip.t.group && <span className="text-muted-foreground max-sm:hidden">{tip.t.group}</span>}
            </>
          )}
        </div>
        {onChange && <p className={cn("absolute inset-0 flex items-center text-[11px] text-muted-foreground transition-opacity duration-150", tip ? "opacity-0" : "opacity-100")}>{narrow ? "按住条形左右拖动改期" : "拖动条形改期 · 拖两端改工期 · 聚焦后 ←→ 移动、Shift+←→ 改结束日"}</p>}
      </div>

      <p className="sr-only" aria-live="polite">{live}</p>
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead><tr><th scope="col">任务</th><th scope="col">开始</th><th scope="col">结束</th><th scope="col">天数</th><th scope="col">进度</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.t.id}><td>{r.t.name}</td><td>{toStr(r.s)}</td><td>{toStr(r.e)}</td><td>{dur(r)}</td><td>{r.t.progress != null ? `${Math.round(r.t.progress * 100)}%` : "—"}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export { ganttDate };
