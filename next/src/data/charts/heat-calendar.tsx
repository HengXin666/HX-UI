import { m } from "motion/react";
import { useMemo, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

interface HeatCalendarProps {
  /** key 为 YYYY-MM-DD */
  values: Record<string, number>;
  /** 结束日 (含), 默认今天 */
  end?: Date;
  /** 显示多少周, 默认 26 */
  weeks?: number;
  color?: string;
  /** 色阶档数 */
  levels?: number;
  unit?: string;
  label?: string;
  className?: string;
}

const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const WEEK = ["一", "", "三", "", "五", "", "日"];

/** 热力日历: 每天一个格子, 颜色深浅 = 数值 (提交, 订单, 活跃). 周一起, 中文月份. 悬停或聚焦格子读数. */
export function HeatCalendar({ values, end = new Date(), weeks = 26, color = "var(--chart-1)", levels = 4, unit = "", label = "每日热力", className }: HeatCalendarProps) {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<{ d: string; v: number } | null>(null);
  const { cols, max, months } = useMemo(() => {
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const dow = (last.getDay() + 6) % 7; // 周一 = 0
    const start = new Date(last); start.setDate(last.getDate() - dow - (weeks - 1) * 7);
    const cols: { d: string; v: number; future: boolean }[][] = [];
    const months: { col: number; text: string }[] = [];
    let mx = 0;
    for (let w = 0; w < weeks; w++) {
      const col = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start); d.setDate(start.getDate() + w * 7 + i);
        const k = fmt(d); const v = values[k] ?? 0; mx = Math.max(mx, v);
        if (d.getDate() === 1 || (w === 0 && i === 0)) {
          const prev = months[months.length - 1];
          if (prev && w - prev.col < 3) months.pop(); // 起始周离下个月太近, 让位给完整的月
          months.push({ col: w, text: `${d.getMonth() + 1}月` });
        }
        col.push({ d: k, v, future: d > last });
      }
      cols.push(col);
    }
    return { cols, max: mx, months };
  }, [values, end, weeks]);
  const level = (v: number) => (v <= 0 || !max ? 0 : Math.min(levels, Math.ceil((v / max) * levels)));
  const total = Object.values(values).reduce((s, v) => s + v, 0);
  return (
    <figure className={cn("w-full", className)}>
      <div className="overflow-x-auto rounded-md pb-1 outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="group" aria-label={`${label}，可左右滚动`}>
        <div role="img" aria-label={`${label}，近 ${weeks} 周共 ${total.toLocaleString("zh-CN")}${unit}，最高单日 ${max.toLocaleString("zh-CN")}${unit}`} className="inline-grid gap-1" style={{ gridTemplateColumns: `auto repeat(${weeks}, 12px)` }}>
          <span />
          {cols.map((_, w) => <span key={w} className="h-4 text-[10px] whitespace-nowrap text-muted-foreground">{months.find((x) => x.col === w)?.text ?? ""}</span>)}
          {WEEK.map((wd, i) => (
            <div key={i} className="contents">
              <span className="pr-1.5 text-[10px] leading-3 text-muted-foreground">{wd}</span>
              {cols.map((col, w) => {
                const c = col[i]; const l = level(c.v);
                if (c.future) return <span key={w} />;
                return (
                  <m.span key={w} title={`${c.d} ${c.v}${unit}`}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: reduced ? 0 : w * 0.012 }}
                    onPointerEnter={() => setHover(c)} onPointerLeave={() => setHover(null)}
                    className="size-3 rounded-[3px] ring-foreground/40 transition-shadow hover:ring-1"
                    style={{ background: l ? `color-mix(in oklch, ${color} ${25 + (l / levels) * 75}%, transparent)` : "var(--muted)" }} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span aria-live="polite" className="tabular-nums">{hover ? `${hover.d} · ${hover.v.toLocaleString("zh-CN")}${unit}` : `${label}：近 ${weeks} 周共 ${total.toLocaleString("zh-CN")}${unit}`}</span>
        <span className="flex items-center gap-1" aria-hidden>
          少
          {Array.from({ length: levels + 1 }, (_, l) => (
            <span key={l} className="size-3 rounded-[3px]" style={{ background: l ? `color-mix(in oklch, ${color} ${25 + (l / levels) * 75}%, transparent)` : "var(--muted)" }} />
          ))}
          多
        </span>
      </figcaption>
    </figure>
  );
}
