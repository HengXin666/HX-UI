"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, type JSX } from "react";
import { useResizeObserver } from "../../hooks/dom/useResizeObserver";
import { cn } from "../../primitives/utils";
import { areaPath, extent, linePath, linearScale, niceDomain, niceTicks, project, punchDomain, type Domain } from "../scale";
import { VIZ_BOX, VIZ_CLASS, VIZ_PUNCH, VIZ_TICKS } from "../tokens";
import { useShockDomain } from "../use-shock";
import { useVizStage } from "../use-stage";

export interface TrendProps {
  /** 至少两个点. 少于此数只显示读数. */
  values: readonly number[];
  /** 读屏名称, 也是图注. */
  label: string;
  format?: (value: number) => string;
  /** 是否画面积. 默认画, 面积用前景色的低透明度. */
  area?: boolean;
  /** 图区高度 (px). */
  height?: number;
  className?: string;
  classNames?: { root?: string; plot?: string; readout?: string };
}

const DEFAULT_HEIGHT = 160;
const SVG_FILL_NONE = "none";
const NON_SCALING = "non-scaling-stroke";

/**
 * 趋势线, 带坐标轴冲击 (video-shotcraft chart-live-moves 的 axis-rescale-shock):
 * 末值冲出当前 domain 时, 先按旧比例冲出画框 (约 470ms), 停一拍 (600ms) 让人看见轴坏了,
 * 再 200ms 重标: 旧刻度滑到新位置淡出, 新刻度从旧位置滑进来, 线被压回框内, 末点放一圈 1px 扩散标记.
 * 未越界的更新只移动线, 不动网格. 首次进入视口用 pathLength 描线. 读屏只读最新值.
 */
export function Trend({ values, label, format, area = true, height = DEFAULT_HEIGHT, className, classNames }: TrendProps): JSX.Element {
  const stage = useVizStage<HTMLDivElement>(1);
  const targetRef = useRef<Domain | null>(null);
  const target = useMemo(() => {
    const previous = targetRef.current;
    const next = previous ? punchDomain(previous, values, VIZ_TICKS) : niceDomain(extent(values), VIZ_TICKS);
    targetRef.current = next;
    return next;
  }, [values]);
  const shock = useShockDomain(target, stage.reduced);
  const ticks = useMemo(() => niceTicks(shock.domain, VIZ_TICKS), [shock.domain]);
  const points = project(values, shock.domain, VIZ_BOX);
  const line = linePath(points);
  const fill = area ? areaPath(points, VIZ_BOX.height - VIZ_BOX.pad) : "";
  const range: Domain = [VIZ_BOX.height - VIZ_BOX.pad, VIZ_BOX.pad];
  const yOf = (domain: Domain, tick: number): number => (linearScale(domain, range)(tick) / VIZ_BOX.height) * height;
  const show = format ?? ((input: number) => input.toLocaleString());
  const last = points[points.length - 1];
  const latest = values[values.length - 1];
  const ring = VIZ_PUNCH.to + VIZ_PUNCH.to;
  const [plotRef, rect] = useResizeObserver<HTMLDivElement>();
  const lastPunch = useRef(0);
  const rescaling = shock.punch !== lastPunch.current;
  useEffect(() => {
    lastPunch.current = shock.punch;
  }, [shock.punch]);
  const move = shock.pending ? stage.shock : rescaling ? stage.rescale : stage.update;

  return (
    <figure ref={stage.ref} data-slot="hx-trend" data-state={shock.pending ? "shock" : undefined} className={cn(VIZ_CLASS.figure, className, classNames?.root)}>
      <figcaption className={VIZ_CLASS.caption}>{label}</figcaption>
      <div ref={plotRef} className={cn(VIZ_CLASS.plot, classNames?.plot)} style={{ height }}>
        <AnimatePresence initial={false}>
          {ticks.map((tick) => (
            <motion.div
              key={tick}
              aria-hidden
              className={cn(VIZ_CLASS.grid, "top-0")}
              initial={{ y: yOf(shock.previous, tick), opacity: 0 }}
              animate={{ y: yOf(shock.domain, tick), opacity: 1 }}
              exit={{ y: yOf(shock.domain, tick), opacity: 0 }}
              transition={stage.rescale}
            >
              <span className={cn(VIZ_CLASS.tick, "right-0 bg-background pl-1")}>{show(tick)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <svg
          aria-hidden
          viewBox={`0 0 ${VIZ_BOX.width} ${VIZ_BOX.height}`}
          preserveAspectRatio={SVG_FILL_NONE}
          className="absolute inset-0 size-full overflow-visible text-foreground"
        >
          {fill ? <motion.path d={fill} className="fill-current opacity-[0.06]" initial={false} animate={{ d: fill }} transition={move} /> : null}
          {line ? (
            <motion.path
              fill={SVG_FILL_NONE}
              stroke="currentColor"
              strokeWidth={1}
              vectorEffect={NON_SCALING}
              initial={stage.reduced ? false : { pathLength: 0, d: line }}
              animate={{ pathLength: stage.shown ? 1 : 0, d: line }}
              transition={{ pathLength: stage.draw, d: move }}
            />
          ) : null}
        </svg>
        {last ? (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 size-0"
            initial={false}
            animate={{ x: (last[0] / VIZ_BOX.width) * rect.width, y: (last[1] / VIZ_BOX.height) * height }}
            transition={move}
          >
            <span className="absolute -left-1 -top-1 size-2 rounded-full bg-foreground" />
            <AnimatePresence>
              {shock.punch > 0 && !stage.reduced ? (
                <motion.span
                  key={shock.punch}
                  className="absolute rounded-full border border-foreground"
                  style={{ width: ring, height: ring, left: -VIZ_PUNCH.to, top: -VIZ_PUNCH.to }}
                  initial={{ opacity: VIZ_PUNCH.alpha, scale: VIZ_PUNCH.from / VIZ_PUNCH.to }}
                  animate={{ opacity: 0, scale: 1 }}
                  transition={stage.ring}
                />
              ) : null}
            </AnimatePresence>
          </motion.span>
        ) : null}
      </div>
      <p aria-live="polite" className={cn(VIZ_CLASS.live, classNames?.readout)}>
        {latest !== undefined ? show(latest) : null}
      </p>
    </figure>
  );
}
