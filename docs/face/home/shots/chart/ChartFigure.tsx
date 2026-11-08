import type { JSX } from "react";
import { seriesColor } from "@hx/ui";
import { linePath, type Point } from "../../../../../src/viz";
import { VIZ_CLASS, VIZ_PUNCH } from "../../../../../src/viz/tokens";
import { NEW_TICKS, NEW_TOP, OLD_TICKS, OLD_TOP, SERIES, chartPose } from "./shot-chart";

/** SVG 用户单位: 横纵都是 0 到 1000, 拉伸铺满绘图区, 线宽不随缩放. */
const BOX = 1000;
const PCT = 100;
const MONTHS = SERIES.map((_, index) => `${index + 1}月`);
const LAST = SERIES.length - 1;
const NON_SCALING = "non-scaling-stroke";
const UNIT = "k";

function xOf(index: number): number {
  return (index / LAST) * BOX;
}

function tickTop(tick: number, top: number): number {
  return (1 - tick / top) * PCT;
}

/** 镜 6 的图表本体, 纯 ms 函数: 尖峰冲出天花板, 停一拍, 坐标轴重标, 线不重画. 舞台版与卡内版共用. */
export function ChartFigure({ ms, className }: { readonly ms: number; readonly className?: string }): JSX.Element {
  const pose = chartPose(ms);
  const body: Point[] = SERIES.slice(0, LAST).map((value, index) => [xOf(index), (1 - value / pose.top) * BOX] as const);
  const from = body[body.length - 1];
  const tip: Point = [from[0] + (xOf(LAST) - from[0]) * pose.reach, from[1] + (pose.lastY * BOX - from[1]) * pose.reach];
  const color = seriesColor(0);
  const shocked = pose.reach > 0;
  const ring = VIZ_PUNCH.from + (VIZ_PUNCH.to - VIZ_PUNCH.from) * pose.mark;
  const ticks = [
    ...OLD_TICKS.map((tick) => ({ tick, key: `o${tick}`, alpha: 1 - pose.relabel })),
    ...NEW_TICKS.map((tick) => ({ tick, key: `n${tick}`, alpha: pose.relabel })),
  ];
  return (
    <figure data-shot-part="axis" data-top={pose.top.toFixed(2)} className={`m-0 rounded-xl border border-border bg-card p-5 md:p-6 ${className ?? ""}`}>
      <div className="flex items-baseline gap-3 border-b border-border pb-3">
        <figcaption className={VIZ_CLASS.caption}>每月渲染帧数</figcaption>
        <p className="font-mono text-sm tabular-nums text-foreground" aria-live="polite">
          {shocked ? `12月 ${SERIES[LAST]}${UNIT}` : `11月 ${SERIES[LAST - 1]}${UNIT}`}
        </p>
      </div>
      <div className="relative ml-12 mt-16 h-52 md:mt-24 md:h-64">
        {ticks.map(({ tick, key, alpha }) => {
          const top = tickTop(tick, pose.top);
          const visible = top >= 0 && top <= PCT ? alpha : 0;
          return (
            <div key={key} aria-hidden className={VIZ_CLASS.grid} style={{ top: `${top}%`, opacity: visible }}>
              <span className={`${VIZ_CLASS.tick} -left-12 w-10 text-right`}>{tick}{UNIT}</span>
            </div>
          );
        })}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 h-px bg-[var(--warning)]" style={{ top: `${tickTop(OLD_TOP, pose.top)}%`, opacity: pose.warn }}>
          <span className="absolute -top-5 right-0 font-mono text-[0.65rem] text-[var(--warning)]">天花板 {OLD_TOP}{UNIT}</span>
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-border" />
        <svg aria-hidden viewBox={`0 0 ${BOX} ${BOX}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          <path
            data-shot-part="line"
            d={linePath(body)}
            fill="none"
            stroke={color}
            strokeWidth={1}
            vectorEffect={NON_SCALING}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - pose.draw}
          />
          {shocked ? <path data-shot-part="spike" d={linePath([from, tip])} fill="none" stroke={color} strokeWidth={1} vectorEffect={NON_SCALING} /> : null}
        </svg>
        {shocked ? (
          <span className="pointer-events-none absolute size-0" style={{ left: `${(tip[0] / BOX) * PCT}%`, top: `${(tip[1] / BOX) * PCT}%` }}>
            <span className="absolute -left-1 -top-1 size-2 rounded-full" style={{ background: color }} />
            {pose.mark > 0 && pose.mark < 1 ? (
              <span
                data-shot-part="mark"
                className="absolute rounded-full border border-foreground"
                style={{
                  width: ring * 2,
                  height: ring * 2,
                  left: -ring,
                  top: -ring,
                  opacity: VIZ_PUNCH.alpha * (1 - pose.mark),
                }}
              />
            ) : null}
          </span>
        ) : null}
        <div aria-hidden className="absolute inset-x-0 -bottom-6 flex justify-between font-mono text-[0.6rem] text-muted-foreground">
          {MONTHS.map((month) => <span key={month}>{month}</span>)}
        </div>
      </div>
      <p className="mt-10 text-xs text-muted-foreground">十二月一次活动, 冲到 {SERIES[LAST]}{UNIT}: 纵轴从 {OLD_TOP}{UNIT} 重标到 {NEW_TOP}{UNIT}.</p>
    </figure>
  );
}
