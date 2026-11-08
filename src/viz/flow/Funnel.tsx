"use client";

import { motion } from "motion/react";
import { useState, type JSX } from "react";
import { NumberRoll } from "../../craft/NumberRoll";
import { cn } from "../../primitives/utils";
import { ratio } from "../scale";
import { VIZ_CLASS } from "../tokens";
import { useVizStage } from "../use-stage";

export interface FunnelStage {
  id: string;
  label: string;
  value: number;
}

export interface FunnelProps {
  stages: readonly FunnelStage[];
  /** 读屏名称, 也是图注. */
  label: string;
  /** 级间转化率的格式. 默认保留一位小数的百分比. */
  formatRate?: (rate: number) => string;
  /** 级间转化率前面的说明, 例如 "转化". */
  rateLabel?: string;
  className?: string;
  classNames?: { root?: string; bar?: string; rate?: string };
}

const PERCENT = 100;
const RATE_DIGITS = 1;

/**
 * 转化漏斗. 每级一条条, 宽度按首级比例, 只动 scaleX, 首次入场按发牌错峰.
 * 条落定那一刻数值才开始按位滚动, 转化率随之淡入: 先亮量程再报数 (video-shotcraft gauge-readout-moves 的落定报数).
 * 结构是有序列表, 读屏按顺序读级名, 数值和转化率.
 */
export function Funnel({ stages, label, formatRate, rateLabel, className, classNames }: FunnelProps): JSX.Element {
  const stage = useVizStage<HTMLOListElement>(stages.length);
  const top = stages[0]?.value ?? 0;
  const [landed, setLanded] = useState<ReadonlySet<string>>(() => new Set());
  const land = (id: string): void => {
    if (!stage.shown || landed.has(id)) return;
    setLanded((current) => new Set(current).add(id));
  };
  const rate = formatRate ?? ((input: number) => `${(input * PERCENT).toFixed(RATE_DIGITS)}%`);
  return (
    <figure data-slot="hx-funnel" className={cn(VIZ_CLASS.figure, className, classNames?.root)}>
      <figcaption className={VIZ_CLASS.caption}>{label}</figcaption>
      <ol ref={stage.ref} className="flex flex-col gap-1">
        {stages.map((item, index) => {
          const share = Math.min(1, Math.max(0, ratio(item.value, top)));
          const previous = stages[index - 1];
          const done = stage.reduced || landed.has(item.id);
          return (
            <li key={item.id} className="flex flex-col gap-1">
              {previous ? (
                <p
                  className={cn("text-center text-xs tabular-nums text-muted-foreground transition-opacity duration-200", done ? "opacity-100" : "opacity-0", classNames?.rate)}
                >
                  {rateLabel ? `${rateLabel} ` : null}
                  {rate(ratio(item.value, previous.value))}
                </p>
              ) : null}
              <div className="relative flex h-10 items-center justify-between gap-3 px-3">
                <motion.span
                  aria-hidden
                  className={cn("absolute inset-y-0 left-0 right-0 rounded-md border border-border bg-muted", classNames?.bar)}
                  initial={stage.reduced ? false : { scaleX: 0 }}
                  animate={{ scaleX: stage.shown ? share : 0 }}
                  transition={stage.at(index)}
                  onAnimationComplete={() => land(item.id)}
                />
                <span className="relative truncate text-sm font-medium text-foreground">{item.label}</span>
                <span aria-hidden className="relative text-sm font-semibold text-foreground">
                  <NumberRoll value={done ? item.value : 0} />
                </span>
                <span className="sr-only">{item.value}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
