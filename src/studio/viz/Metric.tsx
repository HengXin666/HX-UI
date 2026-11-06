"use client";

import type { JSX, ReactNode } from "react";
import { TEXT_TONE, TONE_TEXT_CLASS, type TextTone } from "../../constants/typography";
import { AnimatedNumber } from "../../motion/AnimatedNumber";
import { cn } from "../../primitives/utils";
import { STUDIO_CLASS } from "../classes";
import { Spark } from "./Spark";

export interface MetricProps {
  label: string;
  value: number;
  /** 进入视口前显示的起点. 省略则首帧就是终值. */
  from?: number;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** 终值旁边的一行变化说明, 例如 "比上月少 2 天". */
  delta?: ReactNode;
  /** delta 的语义色. 不传则用次要文字色. */
  tone?: TextTone;
  series?: readonly number[];
  className?: string;
  classNames?: { root?: string; value?: string; delta?: string };
}

/**
 * 一个指标: 名字, 弹簧数字, 可选的变化说明与折线.
 * 折线是装饰, 名字由读屏读数字组件里的终值.
 *
 * .agents/notes/implemented/feature/2026-11-06-studio-shot-language.md
 */
export function Metric({
  label,
  value,
  from,
  format,
  locale,
  delta,
  tone = TEXT_TONE.neutral,
  series,
  className,
  classNames,
}: MetricProps): JSX.Element {
  return (
    <figure data-slot="metric" data-tone={tone} className={cn(STUDIO_CLASS.card, "flex flex-col gap-3 p-4", className, classNames?.root)}>
      <figcaption className={STUDIO_CLASS.label}>{label}</figcaption>
      <AnimatedNumber value={value} from={from} format={format} locale={locale} className={cn(STUDIO_CLASS.figure, classNames?.value)} />
      {delta !== undefined ? <p className={cn("text-sm", TONE_TEXT_CLASS[tone], classNames?.delta)}>{delta}</p> : null}
      {series && series.length > 1 ? <Spark values={series} label={label} /> : null}
    </figure>
  );
}
