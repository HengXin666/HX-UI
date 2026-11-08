"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { cn } from "../../primitives/utils";
import { linearScale, niceTicks, punchDomain, zeroDomain, type Domain } from "../scale";
import { VIZ_CLASS, VIZ_PRESS, VIZ_STATE, VIZ_TICKS } from "../tokens";
import { useShockDomain } from "../use-shock";
import { useVizStage } from "../use-stage";

export interface BarDatum {
  id: string;
  label: string;
  value: number;
}

export interface BarChartProps {
  data: readonly BarDatum[];
  /** 读屏名称, 也是图注. */
  label: string;
  /** 数值格式. 默认按当前语言分组. */
  format?: (value: number) => string;
  /** 受控的当前柱. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** 图区高度 (px). */
  height?: number;
  className?: string;
  classNames?: { root?: string; plot?: string; bar?: string; readout?: string };
}

const DEFAULT_HEIGHT = 200;
const PERCENT = 100;
const KEY_PREV = "ArrowLeft";
const KEY_NEXT = "ArrowRight";

/**
 * 柱状图, 从 0 起算, 负值按 0 画. 柱子只动 scaleY (原点在底), 首次入场按发牌错峰, 之后的数据更新从当前高度用弹簧继续.
 * 新值越过坐标轴时先按旧比例冲出画框, 停一拍, 再 200ms 重标 (video-shotcraft chart-live-moves), 柱子随之压回, 不从 0 重播.
 * 柱子是一组 roving tabindex 按钮, 左右键切换, 读数在 aria-live.
 *
 * .agents/notes/implemented/feature/2026-11-08-viz-layer.md
 */
export function BarChart({
  data,
  label,
  format,
  value,
  defaultValue,
  onValueChange,
  height = DEFAULT_HEIGHT,
  className,
  classNames,
}: BarChartProps): JSX.Element {
  const stage = useVizStage<HTMLDivElement>(data.length);
  const targetRef = useRef<Domain | null>(null);
  const values = useMemo(() => data.map((item) => item.value), [data]);
  const target = useMemo(() => {
    const next = targetRef.current ? punchDomain(targetRef.current, values, VIZ_TICKS) : zeroDomain(values, VIZ_TICKS);
    targetRef.current = next;
    return next;
  }, [values]);
  const shock = useShockDomain(target, stage.reduced);
  const domain = shock.domain;
  const ticks = useMemo(() => niceTicks(domain, VIZ_TICKS), [domain]);
  const toPct = linearScale(domain, [0, PERCENT]);
  const yOf = (scale: Domain, tick: number): number => (height * (PERCENT - linearScale(scale, [0, PERCENT])(tick))) / PERCENT;
  const lastPunch = useRef(0);
  const rescaling = shock.punch !== lastPunch.current;
  useEffect(() => {
    lastPunch.current = shock.punch;
  }, [shock.punch]);
  const show = format ?? ((input: number) => input.toLocaleString());
  const [inner, setInner] = useState(defaultValue ?? data[0]?.id ?? "");
  const current = value ?? inner;
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = Math.max(0, data.findIndex((item) => item.id === current));
  const active = data[activeIndex];

  const select = (index: number): void => {
    const item = data[index];
    if (!item) return;
    setInner(item.id);
    onValueChange?.(item.id);
    buttons.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === KEY_PREV) {
      event.preventDefault();
      select(activeIndex <= 0 ? data.length - 1 : activeIndex - 1);
    } else if (event.key === KEY_NEXT) {
      event.preventDefault();
      select(activeIndex >= data.length - 1 ? 0 : activeIndex + 1);
    }
  };

  return (
    <figure ref={stage.ref} data-slot="hx-bar-chart" className={cn(VIZ_CLASS.figure, className, classNames?.root)}>
      <figcaption className={VIZ_CLASS.caption}>{label}</figcaption>
      <div className={cn(VIZ_CLASS.plot, "pl-10", classNames?.plot)} style={{ height }}>
        <AnimatePresence initial={false}>
          {ticks.map((tick) => (
            <motion.div
              key={tick}
              aria-hidden
              className={cn(VIZ_CLASS.grid, "top-0")}
              initial={{ y: yOf(shock.previous, tick), opacity: 0 }}
              animate={{ y: yOf(domain, tick), opacity: 1 }}
              exit={{ y: yOf(domain, tick), opacity: 0 }}
              transition={stage.rescale}
            >
              <span className={cn(VIZ_CLASS.tick, "-left-10 w-10 text-right")}>{show(tick)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div role="group" aria-label={label} className="absolute inset-0 left-10 flex items-end gap-2" onKeyDown={onKeyDown}>
          {data.map((item, index) => {
            const on = item.id === current;
            const fill = Math.max(0, toPct(item.value)) / PERCENT;
            return (
              <button
                key={item.id}
                type="button"
                ref={(node) => {
                  buttons.current[index] = node;
                }}
                tabIndex={on ? 0 : -1}
                aria-pressed={on}
                aria-label={`${item.label} ${show(item.value)}`}
                data-state={on ? VIZ_STATE.on : VIZ_STATE.off}
                className={cn("group relative h-full min-w-0 flex-1 rounded-sm", VIZ_CLASS.focus)}
                onClick={() => select(index)}
              >
                <motion.span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 bottom-0 block h-full origin-bottom rounded-t-sm transition-colors duration-150",
                    on ? "bg-primary" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50",
                    classNames?.bar,
                  )}
                  initial={stage.reduced ? false : { scaleY: 0 }}
                  animate={{ scaleY: stage.shown ? fill : 0 }}
                  whileTap={stage.reduced ? undefined : { scaleX: VIZ_PRESS }}
                  transition={shock.pending ? stage.shock : rescaling ? stage.rescale : stage.at(index)}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div aria-hidden className="flex gap-2 pl-10">
        {data.map((item) => (
          <span key={item.id} className="min-w-0 flex-1 truncate text-center text-[11px] text-muted-foreground">
            {item.label}
          </span>
        ))}
      </div>
      <p aria-live="polite" className={cn(VIZ_CLASS.live, classNames?.readout)}>
        {active ? `${active.label}: ${show(active.value)}` : null}
      </p>
    </figure>
  );
}
