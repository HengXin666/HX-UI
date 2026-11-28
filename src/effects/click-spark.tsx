"use client";

import * as React from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export type SparkShape = "line" | "streak" | "dot" | "star";
export type SparkEasing = "ease-out" | "ease-in-out" | "ease-in" | "linear" | "spring";

export interface ClickSparkHandle {
  /** 从代码放一次火花. x / y 是相对包裹层左上角的 px, 不给就在中心 */
  spark: (x?: number, y?: number) => void;
}

export interface ClickSparkProps {
  /** 火花颜色, 传数组时每簇轮着用. 支持 var(--token) */
  sparkColor?: string | string[];
  /** line 短划线; streak 带拖尾的彗星; dot 圆点; star 闪烁的星 */
  shape?: SparkShape;
  /** 每簇几根 */
  sparkCount?: number;
  /** 每根长度, px */
  sparkSize?: number;
  /** 每根粗细, px */
  sparkWidth?: number;
  /** 飞多远, px */
  sparkRadius?: number;
  /** 一簇的时长, ms */
  duration?: number;
  easing?: SparkEasing;
  /** 角度、长度、速度的随机程度, 0 是完美的星形 */
  randomness?: number;
  /** 往下坠的力, 0-2 */
  gravity?: number;
  /** 扇形张角, 度. 360 是一整圈 */
  spread?: number;
  /** 扇形朝向, 度. 0 朝上, 90 朝右 */
  direction?: number;
  /** 火花周围的柔光, 0-1 */
  glow?: number;
  /** 再加一圈从点击处扩散的细环 */
  ring?: boolean;
  /** front 画在内容上方; back 画在内容后面, 火花从按钮或卡片边缘迸出来 */
  layer?: "front" | "back";
  /** 飞行距离倍数 */
  extraScale?: number;
  /** 停止响应点击 */
  disabled?: boolean;
  className?: string;
  /** 画布上的 class (混合模式等) */
  canvasClassName?: string;
  style?: React.CSSProperties;
  /** 被包裹的内容, 点在里面任何地方都会迸火花, 火花可以溢出边界 */
  children?: React.ReactNode;
}

interface Spark { x: number; y: number; a: number; len: number; dist: number; born: number; col: string; tw: number }
interface Ring { x: number; y: number; born: number; col: string }

const EASE: Record<SparkEasing, (t: number) => number> = {
  linear: (t) => t,
  "ease-in": (t) => t * t,
  "ease-out": (t) => t * (2 - t),
  "ease-in-out": (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  spring: (t) => 1 - Math.cos(t * Math.PI * 2.2) * Math.exp(-t * 5.2),
};

export const ClickSpark = React.forwardRef<ClickSparkHandle, ClickSparkProps>(function ClickSpark(
  {
    sparkColor = "#fff",
    shape = "line",
    sparkCount = 8,
    sparkSize = 14,
    sparkWidth = 2,
    sparkRadius = 30,
    duration = 500,
    easing = "ease-out",
    randomness = 0.2,
    gravity = 0,
    spread = 360,
    direction = 0,
    glow = 0,
    ring = false,
    layer = "front",
    extraScale = 1,
    disabled = false,
    className,
    canvasClassName,
    style,
    children,
  },
  ref,
) {
  const reduce = useReducedMotion();
  const wrap = React.useRef<HTMLDivElement>(null);
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const sparks = React.useRef<Spark[]>([]);
  const rings = React.useRef<Ring[]>([]);
  const raf = React.useRef(0);
  const turn = React.useRef(0);
  const reach = sparkRadius * extraScale;
  const pad = Math.ceil(reach * (1 + randomness) + sparkSize + 24 + gravity * 40);

  const colors = React.useMemo(() => (Array.isArray(sparkColor) ? sparkColor : [sparkColor]), [sparkColor]);
  // css 变量要在元素上解析成真正的颜色
  const resolved = React.useRef<string[]>(colors);
  React.useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    resolved.current = colors.map((c) => {
      if (!c.includes("var(")) return c;
      const probe = document.createElement("span");
      probe.style.color = c; el.appendChild(probe);
      const v = getComputedStyle(probe).color; probe.remove();
      return v;
    });
  }, [colors]);

  const opts = React.useRef({ shape, sparkSize, sparkWidth, duration, easing, gravity, glow });
  opts.current = { shape, sparkSize, sparkWidth, duration, easing, gravity, glow };

  const loop = React.useCallback(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const now = performance.now();
    const d = Math.min(2, window.devicePixelRatio || 1);
    const { width, height } = cv.getBoundingClientRect();
    if (cv.width !== Math.round(width * d)) { cv.width = Math.round(width * d); cv.height = Math.round(height * d); }
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const o = opts.current;
    const ease = EASE[o.easing];
    ctx.lineCap = "round";
    sparks.current = sparks.current.filter((s) => {
      const t = (now - s.born) / o.duration;
      if (t >= 1) return false;
      const e = ease(t);
      const fall = o.gravity * 60 * t * t;
      const r0 = s.dist * e;
      const L = s.len * (1 - t);
      const cx = Math.sin(s.a), cy = -Math.cos(s.a);
      const x1 = s.x + cx * r0, y1 = s.y + cy * r0 + fall;
      ctx.strokeStyle = ctx.fillStyle = s.col;
      ctx.shadowColor = s.col;
      ctx.shadowBlur = o.glow * 12;
      ctx.lineWidth = o.sparkWidth;
      if (o.shape === "dot") {
        ctx.globalAlpha = 1 - t * t;
        ctx.beginPath(); ctx.arc(x1, y1, Math.max(0.5, (o.sparkWidth * 1.2) * (1 - t * 0.6)), 0, Math.PI * 2); ctx.fill();
      } else if (o.shape === "star") {
        const tw = 0.6 + 0.4 * Math.sin(t * 22 + s.tw);
        const R = Math.max(1, o.sparkSize * 0.28 * (1 - t * 0.7) * tw), q = R * 0.32;
        ctx.globalAlpha = 1 - t;
        ctx.beginPath();
        ctx.moveTo(x1, y1 - R); ctx.lineTo(x1 + q, y1 - q); ctx.lineTo(x1 + R, y1); ctx.lineTo(x1 + q, y1 + q);
        ctx.lineTo(x1, y1 + R); ctx.lineTo(x1 - q, y1 + q); ctx.lineTo(x1 - R, y1); ctx.lineTo(x1 - q, y1 - q); ctx.closePath(); ctx.fill();
      } else if (o.shape === "streak") {
        const tail = s.len * 1.8 * (1 - t * 0.5);
        const x0 = x1 - cx * tail, y0 = y1 - cy * tail - fall * 0.4;
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, s.col);
        ctx.strokeStyle = g; ctx.globalAlpha = 1 - t * 0.8;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      } else {
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + cx * L, y1 + cy * L + fall * 0.2); ctx.stroke();
      }
      return true;
    });
    rings.current = rings.current.filter((r) => {
      const t = (now - r.born) / (o.duration * 1.1);
      if (t >= 1) return false;
      ctx.globalAlpha = (1 - t) * 0.7; ctx.strokeStyle = r.col; ctx.lineWidth = Math.max(0.75, o.sparkWidth * 0.6 * (1 - t));
      ctx.shadowBlur = o.glow * 10;
      ctx.beginPath(); ctx.arc(r.x, r.y, reachRef.current * 1.15 * EASE["ease-out"](t), 0, Math.PI * 2); ctx.stroke();
      return true;
    });
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    raf.current = sparks.current.length || rings.current.length ? requestAnimationFrame(loop) : 0;
  }, []);
  const reachRef = React.useRef(reach);
  reachRef.current = reach;
  React.useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const fire = React.useCallback((x: number, y: number) => {
    if (reduce) return;
    const now = performance.now();
    const cols = resolved.current;
    const n = Math.max(1, Math.round(sparkCount));
    const span = (Math.min(360, Math.max(0, spread)) * Math.PI) / 180;
    const base = (direction * Math.PI) / 180;
    const full = spread >= 360;
    for (let i = 0; i < n; i++) {
      const f = full ? i / n : n === 1 ? 0.5 : i / (n - 1);
      const jitter = (Math.random() - 0.5) * randomness * (span / n) * 1.6;
      const a = (full ? f * Math.PI * 2 : base - span / 2 + f * span) + jitter;
      sparks.current.push({
        x: x + pad, y: y + pad, a,
        len: sparkSize * (1 + (Math.random() - 0.5) * randomness * 1.4),
        dist: reach * (1 + (Math.random() - 0.5) * randomness * 1.4),
        born: now, col: cols[(turn.current + i) % cols.length], tw: Math.random() * 6,
      });
    }
    if (ring) rings.current.push({ x: x + pad, y: y + pad, born: now, col: cols[turn.current % cols.length] });
    turn.current += 1;
    if (!raf.current) raf.current = requestAnimationFrame(loop);
  }, [direction, loop, pad, randomness, reach, reduce, ring, sparkCount, sparkSize, spread]);

  React.useImperativeHandle(ref, () => ({
    spark: (x, y) => {
      const r = wrap.current?.getBoundingClientRect();
      fire(x ?? (r ? r.width / 2 : 0), y ?? (r ? r.height / 2 : 0));
    },
  }), [fire]);

  return (
    <div
      ref={wrap}
      className={cn("relative isolate", className)}
      style={style}
      onPointerDown={disabled ? undefined : (e) => {
        if (e.button !== 0) return;
        const r = e.currentTarget.getBoundingClientRect();
        fire(e.clientX - r.left, e.clientY - r.top);
      }}
      onClick={disabled ? undefined : (e) => {
        // 键盘触发的点击 (detail 为 0) 从被触发元素的中心迸出
        if (e.detail !== 0) return;
        const r = e.currentTarget.getBoundingClientRect(), t = (e.target as HTMLElement).getBoundingClientRect();
        fire(t.left + t.width / 2 - r.left, t.top + t.height / 2 - r.top);
      }}
    >
      <canvas
        ref={canvas}
        aria-hidden="true"
        className={cn("pointer-events-none absolute", layer === "back" ? "-z-10" : "z-10", canvasClassName)}
        style={{ inset: -pad, width: `calc(100% + ${pad * 2}px)`, height: `calc(100% + ${pad * 2}px)` }}
      />
      {children}
    </div>
  );
});
