"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 ClickSpark 条目, 实现为 HX 自有.

import { useRef, type JSX, type ReactNode } from "react";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useCanvasBackdrop } from "../backdrop/kernel/use-surfaces";
import { inkOf, toPixels } from "./ink";
import { SurfaceLayer } from "./SurfaceLayer";
import { TONE_TOKEN, type SurfaceTone } from "./tone";
import { DOUBLE, HALF, MS_PER_S, SPARK, SPARK_EASINGS, clamp, seeded, smoothstep, type SparkEasing } from "./tokens";

export type SparkShape = "line" | "dot";
const TURN = Math.PI * DOUBLE;

/** 一次点击: 设备像素位置, 起始时刻 (内核 elapsed 秒), 每根火花的错峰系数. */
export interface SparkBurst {
  readonly x: number;
  readonly y: number;
  readonly start: number;
  readonly jitter: readonly number[];
}

/** 某根火花的寿命 (ms): 错峰上限是 duration * (1 + 0.25 * randomness), 时长下限 60. */
export function sparkLife(duration: number, randomness: number, jitter: number): number {
  return Math.max(SPARK.minDurationMs, duration) * (1 + SPARK.staggerSpan * randomness * jitter);
}

/** 整个爆点最长活多久 (ms), 用来回收. */
export function burstLongest(duration: number, randomness: number): number {
  return sparkLife(duration, randomness, 1);
}

/** 火花外飞距离: radius * (1 + 0.35 * randomness * jitter), spring 曲线再多 15%. */
export function sparkReach(radius: number, randomness: number, jitter: number, easing: SparkEasing): number {
  return radius * (1 + SPARK.reachSpan * randomness * jitter) * (easing === "spring" ? SPARK.springReach : 1);
}

/** 压入新爆点, 超出上限 (32) 时丢最早的. */
export function pushBurst(list: readonly SparkBurst[], burst: SparkBurst, max: number = SPARK.maxBursts): SparkBurst[] {
  const next = [...list, burst];
  return next.length > max ? next.slice(next.length - max) : next;
}

export interface TapSparksProps {
  readonly children?: ReactNode;
  readonly sparkCount?: number;
  readonly sparkRadius?: number;
  readonly sparkSize?: number;
  /** 单根火花寿命 ms, 下限 60. */
  readonly duration?: number;
  readonly easing?: SparkEasing;
  readonly shape?: SparkShape;
  /** 0..1, 角度, 距离与寿命的错峰幅度. */
  readonly randomness?: number;
  /** 打开后火花受重力下坠. */
  readonly gravity?: boolean;
  readonly tone?: SurfaceTone;
  readonly className?: string;
}

interface SparkOptions {
  readonly duration: number;
  readonly radius: number;
  readonly size: number;
  readonly randomness: number;
  readonly easing: SparkEasing;
  readonly shape: SparkShape;
  readonly gravity: boolean;
}

/** 画一个爆点 (设备像素, scale 为每 CSS 像素的设备像素). 返回是否还活着. */
export function drawBurst(ctx: CanvasRenderingContext2D, b: SparkBurst, now: number, scale: number, o: SparkOptions): boolean {
  const elapsed = (now - b.start) * MS_PER_S;
  const life = Math.max(SPARK.minDurationMs, o.duration);
  const rp = clamp(elapsed / (life * SPARK.ringLife), 0, 1);
  if (rp < 1) {
    ctx.globalAlpha = 1 - rp;
    ctx.beginPath();
    ctx.arc(b.x, b.y, (SPARK.ringBase + o.radius * SPARK.ringReach * SPARK_EASINGS["ease-out"](rp)) * scale, 0, TURN);
    ctx.stroke();
  }
  const curve = SPARK_EASINGS[o.easing] ?? SPARK_EASINGS["ease-out"];
  b.jitter.forEach((j, i) => {
    const own = sparkLife(life, o.randomness, j);
    const p = clamp(elapsed / own, 0, 1);
    if (p >= 1) return;
    const angle = (i / b.jitter.length) * TURN + (j - HALF) * o.randomness * (TURN / b.jitter.length);
    const reach = sparkReach(o.radius, o.randomness, j, o.easing) * scale;
    const head = curve(p) * reach;
    const fall = o.gravity ? HALF * SPARK.gravity * scale * (elapsed / MS_PER_S) ** DOUBLE : 0;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    ctx.globalAlpha = 1 - smoothstep(o.shape === "line" ? SPARK.lineFadeFrom : SPARK.dotFadeFrom, 1, p);
    ctx.beginPath();
    if (o.shape === "dot") {
      ctx.arc(b.x + cos * head, b.y + sin * head + fall, Math.max(HALF, (o.size * scale * (1 - p)) / (DOUBLE * DOUBLE)), 0, TURN);
      ctx.fill();
      return;
    }
    const tail = curve(clamp((elapsed - own * SPARK.tailLag) / own, 0, 1)) * reach;
    const from = Math.max(tail, head - o.size * scale);
    ctx.moveTo(b.x + cos * from, b.y + sin * from + fall);
    ctx.lineTo(b.x + cos * head, b.y + sin * head + fall);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  return elapsed < burstLongest(life, o.randomness);
}

/**
 * 点击火花: 子内容上盖一层画布 (backdrop 内核的 Canvas2D 渲染器), 在按下处爆一圈火花. 每根火花的寿命与距离按
 * randomness 错峰, 中心带一圈扩散的测量环. 线宽 1px. 减弱动效时内核只画一帧静止画面, 不出火花.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-pointer.md
 */
export function TapSparks({
  children,
  sparkCount = SPARK.sparkCount,
  sparkRadius = SPARK.sparkRadius,
  sparkSize = SPARK.sparkSize,
  duration = SPARK.duration,
  easing = "ease-out",
  shape = "line",
  randomness = SPARK.randomness,
  gravity = false,
  tone = "primary",
  className,
}: TapSparksProps): JSX.Element {
  const bursts = useRef<SparkBurst[]>([]);
  const seen = useRef(-1);
  const rand = useRef(seeded(sparkCount + sparkRadius));
  const options: SparkOptions = { duration, radius: sparkRadius, size: sparkSize, randomness, easing, shape, gravity };

  const draw = (ctx: CanvasRenderingContext2D, frame: BackdropFrame): void => {
    ctx.clearRect(0, 0, frame.fit.width, frame.fit.height);
    if (frame.reduced) return;
    for (const tap of frame.pointer.taps) {
      if (tap.at <= seen.current) continue;
      seen.current = tap.at;
      const [x, y] = toPixels(tap.x, tap.y, frame.fit);
      const jitter = Array.from({ length: Math.max(1, Math.round(sparkCount)) }, () => rand.current());
      bursts.current = pushBurst(bursts.current, { x, y, start: tap.at, jitter });
    }
    ctx.strokeStyle = inkOf(frame.colors[0]);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = frame.fit.scale;
    bursts.current = bursts.current.filter((b) => drawBurst(ctx, b, frame.elapsed, frame.fit.scale, options));
  };

  const handle = useCanvasBackdrop({ draw }, { colors: [TONE_TOKEN[tone]] });
  return (
    <SurfaceLayer handle={handle} slot="tap-sparks" className={className}>
      {children}
    </SurfaceLayer>
  );
}
