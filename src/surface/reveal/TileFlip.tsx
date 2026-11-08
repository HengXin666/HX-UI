"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 PixelSwap 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type CSSProperties, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../motion/frame/use-frame-loop";
import { springFromDuration } from "../../motion/spring/fit";
import { stepSpringExact } from "../../motion/spring/step";
import { cn } from "../../primitives/utils";
import { tileClip, tileGrid, tileHalf, tileOrders, type TileGrid, type TilePattern } from "./tile-math";
import { HALF, MAX_DT_MS, MS_PER_S, TILE } from "./tokens";

export type TileTrigger = "hover" | "click" | "manual";

export interface TileFlipProps {
  readonly firstContent: ReactNode;
  readonly secondContent: ReactNode;
  readonly pattern?: TilePattern;
  /** 期望格宽 (px), 总数超 600 时放大. */
  readonly pixelSize?: number;
  /** 0..1, 格间留白比例. */
  readonly gap?: number;
  /** 每格翻起时的最大旋转角 (deg). */
  readonly pixelSpin?: number;
  /** 起步顺序铺开的总时长 (ms). */
  readonly duration?: number;
  /** 单格弹簧的落定时长 (ms). */
  readonly pixelDuration?: number;
  readonly randomness?: number;
  readonly bounce?: number;
  readonly trigger?: TileTrigger;
  /** 挂载时从第一面翻到初始态. */
  readonly intro?: boolean;
  readonly initialActive?: boolean;
  /** 受控: 给了就由它决定显示哪一面. */
  readonly active?: boolean;
  readonly onActiveChange?: (active: boolean) => void;
  readonly onComplete?: (active: boolean) => void;
  readonly aspectRatio?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}

interface Engine {
  grid: TileGrid;
  x: Float32Array;
  v: Float32Array;
  startAt: Float32Array;
  goal: number;
  clock: number;
}

/**
 * 方块翻面: 第二面盖在第一面上, 由一组方块的并集剪出来. 每格是一路解析弹簧, 起步时刻按图案 (默认从指针进入处)
 * 加随机错开; 中途反向时各格从当前位置与速度接着走, 不跳. 减弱动效时直接切到终态.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-reveal.md
 */
export function TileFlip({
  firstContent,
  secondContent,
  pattern = "pointer",
  pixelSize = TILE.pixelSize,
  gap = 0,
  pixelSpin = 0,
  duration = TILE.duration,
  pixelDuration = TILE.pixelDuration,
  randomness = TILE.randomness,
  bounce = TILE.bounce,
  trigger = "hover",
  intro = true,
  initialActive = false,
  active,
  onActiveChange,
  onComplete,
  aspectRatio = TILE.aspectRatio,
  className,
  style,
}: TileFlipProps): JSX.Element {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement | null>(null);
  const top = useRef<HTMLDivElement | null>(null);
  const engine = useRef<Engine | null>(null);
  const origin = useRef<[number, number]>([HALF, HALF]);
  const [own, setOwn] = useState(intro ? false : initialActive);
  const on = active ?? own;
  const spec = springFromDuration(Math.max(Number.EPSILON, pixelDuration / MS_PER_S), bounce);

  const paint = (e: Engine): void => {
    const el = top.current;
    if (!el) return;
    const halves = new Float32Array(e.x.length);
    const spins = pixelSpin ? new Float32Array(e.x.length) : undefined;
    for (let i = 0; i < e.x.length; i += 1) {
      halves[i] = tileHalf(e.x[i], gap);
      if (spins) spins[i] = pixelSpin * (1 - Math.min(1, e.x[i]));
    }
    const full = e.goal === 1 && e.x.every((x) => Math.abs(x - 1) < 1e-3);
    el.style.clipPath = full ? "none" : tileClip(e.grid, halves, spins);
  };

  const loop = useFrameLoop((dtMs) => {
    const e = engine.current;
    if (!e) return false;
    e.clock += dtMs;
    let busy = false;
    for (let i = 0; i < e.x.length; i += 1) {
      if (e.clock < e.startAt[i]) {
        busy = true;
        continue;
      }
      const s = stepSpringExact(e.x[i], e.v[i], e.goal, spec, dtMs);
      e.x[i] = s.current;
      e.v[i] = s.velocity;
      if (!s.resting) busy = true;
    }
    paint(e);
    if (!busy) onComplete?.(e.goal === 1);
    return busy;
  }, { maxDtMs: MAX_DT_MS });

  const build = (): Engine | null => {
    const el = host.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const grid = tileGrid(r.width, r.height, pixelSize);
    const prev = engine.current;
    const n = grid.cols * grid.rows;
    if (prev && prev.x.length === n && prev.grid.cols === grid.cols) return prev;
    const start = prev?.goal ?? (on && !intro ? 1 : 0);
    const e: Engine = { grid, x: new Float32Array(n).fill(start), v: new Float32Array(n), startAt: new Float32Array(n), goal: start, clock: 0 };
    engine.current = e;
    return e;
  };

  useEffect(() => {
    const e = build();
    if (!e) return;
    const goal = on ? 1 : 0;
    if (e.goal === goal && e.clock > 0) return;
    e.goal = goal;
    if (reduced) {
      e.x.fill(goal);
      e.v.fill(0);
      paint(e);
      onComplete?.(on);
      return;
    }
    const orders = tileOrders(e.grid, pattern, randomness, origin.current);
    const first = Math.min(...orders);
    for (let i = 0; i < orders.length; i += 1) e.startAt[i] = e.clock + Math.max(0, orders[i] - first) * duration;
    loop.wake();
  }, [on, reduced]);

  useEffect(() => {
    if (intro && initialActive && active === undefined) setOwn(true);
  }, []);

  const set = (next: boolean): void => {
    if (active === undefined) setOwn(next);
    onActiveChange?.(next);
  };
  const aimFrom = (clientX: number, clientY: number): void => {
    const r = host.current?.getBoundingClientRect();
    if (r && r.width > 0 && r.height > 0) origin.current = [(clientX - r.left) / r.width, (clientY - r.top) / r.height];
  };

  return (
    <div
      ref={host}
      data-slot="tile-flip"
      data-active={on || undefined}
      className={cn("relative overflow-hidden", className)}
      style={{ aspectRatio, ...style }}
      onPointerEnter={(e) => {
        aimFrom(e.clientX, e.clientY);
        if (trigger === "hover") set(true);
      }}
      onPointerLeave={(e) => {
        aimFrom(e.clientX, e.clientY);
        if (trigger === "hover") set(false);
      }}
      onClick={(e) => {
        aimFrom(e.clientX, e.clientY);
        if (trigger === "click") set(!on);
      }}
    >
      <div className="absolute inset-0" aria-hidden={on || undefined}>
        {firstContent}
      </div>
      <div
        ref={(el) => {
          top.current = el;
          if (el && !el.style.clipPath) el.style.clipPath = on && (reduced || !intro) ? "none" : "inset(50%)";
        }}
        className="absolute inset-0"
        aria-hidden={!on || undefined}
      >
        {secondContent}
      </div>
    </div>
  );
}
