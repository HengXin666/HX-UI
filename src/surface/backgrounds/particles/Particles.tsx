"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Particles 条目, 实现为 HX 自有.
// ENGINE-GAP: 内核只有全屏片元与 Canvas2D, 没有点精灵 / 实例化顶点通道; 本件用 Canvas2D 逐点透视投影, 数量上限 4000 (规格 20000), 景深以放大加变淡近似, 不做真模糊.

import { useMemo, useRef, type JSX } from "react";
import { BackdropShell, glowFallback, splitCommon, useCanvasBackdrop, type BackdropCommonProps, type BackdropFrame, type Rgb } from "../../backdrop/kernel";
import {
  burstPush, hoverShift, linkAlpha, makeParticles, PARTICLES, pointSize, project, twinkleOf, wrapSpan,
  type ParticleDrift, type ParticleHover, type ParticleShape,
} from "./particles-field";
import { clearFrame, HALF, inkOf, introProgress, pickColor, smooth, TURN } from "./tokens";

export interface ParticlesProps extends BackdropCommonProps {
  /** 点数, 默认 200, 上限 4000. */
  readonly particleCount?: number;
  /** 点云半径 (世界单位), 默认 10. */
  readonly particleSpread?: number;
  /** 点的颜色 (token 名或 CSS 颜色), 每点随机取一色. 默认 ["foreground"]. */
  readonly particleColors?: readonly string[];
  /** 是否响应悬停, 默认 true. */
  readonly moveParticlesOnHover?: boolean;
  /** 悬停效果强度倍率, 默认 1. */
  readonly particleHoverFactor?: number;
  /** 打开后每点带随机半透明. */
  readonly alphaParticles?: boolean;
  /** 点的基准尺寸, 屏幕直径 = base * (1 + 随机) / 深度. 默认 100. */
  readonly particleBaseSize?: number;
  /** 尺寸随机幅度 0..1, 默认 1. */
  readonly sizeRandomness?: number;
  /** 相机离点云中心的距离, 默认 20. */
  readonly cameraDistance?: number;
  /** 关掉整体旋转. */
  readonly disableRotation?: boolean;
  /** 点形: circle / square / ring / sparkle. */
  readonly shape?: ParticleShape;
  /** 光晕强度 0..1, 默认 0.5. */
  readonly glow?: number;
  /** 闪烁强度 0..1, 默认 0.3. */
  readonly twinkle?: number;
  /** 景深 0..1: 离焦点越远越大越淡. 默认 0. */
  readonly depthOfField?: number;
  /** 近点之间连线. */
  readonly connections?: boolean;
  /** 连线最大距离 (CSS px), 默认 110. */
  readonly connectionDistance?: number;
  /** 悬停效果: parallax 整体视差 / repel 推开 / attract 吸引. */
  readonly hoverEffect?: ParticleHover;
  /** repel / attract 的作用半径 (CSS px), 默认 140. */
  readonly hoverRadius?: number;
  /** 点击放一圈冲击波. 默认 true. */
  readonly clickBurst?: boolean;
  /** 整体漂移: none / up / down / forward. */
  readonly drift?: ParticleDrift;
  /** 漂移速度倍率, 默认 1. */
  readonly driftSpeed?: number;
  /** 每点尺寸与摆幅的个体差异 0..1, 默认 0. */
  readonly variation?: number;
}

interface Burst {
  readonly x: number;
  readonly y: number;
  readonly at: number;
}

interface Dot {
  x: number;
  y: number;
  size: number;
  alpha: number;
  color: number;
  ahead: number;
  flash: number;
}

/** 本库定: 绕 x 轴的转速是绕 y 轴的这一比例, 让点云有一点翻滚. */
const TILT_RATIO = 0.3;
/** 本库定: 入场时每点按随机数错开的比例. */
const INTRO_STAGGER = 0.5;
const INTRO_GAIN = 1.5;
/** 景深: 每离焦 spread 个单位尺寸放大 1 倍, 透明度最多降 0.6. */
const DOF_FADE = 0.6;
/** alphaParticles 下每点不透明度的下限. */
const ALPHA_FLOOR = 0.35;
/** 光晕半径倍数与不透明度系数. */
const GLOW_SCALE = 2.2;
const GLOW_ALPHA = 0.35;
/** ring 的线宽占半径比例, sparkle 十字的臂宽占直径比例. */
const RING_WIDTH = 0.25;
const SPARK_ARM = 0.14;
const SEED_SALT = 7919;

function drawDot(ctx: CanvasRenderingContext2D, d: Dot, shape: ParticleShape, glow: number): void {
  const r = d.size * HALF;
  if (glow > 0) {
    ctx.globalAlpha = d.alpha * glow * GLOW_ALPHA;
    ctx.beginPath();
    ctx.arc(d.x, d.y, r * GLOW_SCALE, 0, TURN);
    ctx.fill();
  }
  ctx.globalAlpha = Math.min(1, d.alpha * (1 + d.flash));
  ctx.beginPath();
  if (shape === "square") {
    ctx.fillRect(d.x - r, d.y - r, d.size, d.size);
  } else if (shape === "ring") {
    ctx.lineWidth = Math.max(1, r * RING_WIDTH);
    ctx.arc(d.x, d.y, r * (1 - RING_WIDTH * HALF), 0, TURN);
    ctx.stroke();
  } else if (shape === "sparkle") {
    const arm = Math.max(1, d.size * SPARK_ARM);
    ctx.fillRect(d.x - r, d.y - arm * HALF, d.size, arm);
    ctx.fillRect(d.x - arm * HALF, d.y - r, arm, d.size);
  } else {
    ctx.arc(d.x, d.y, r, 0, TURN);
    ctx.fill();
  }
}

/**
 * 三维点云背景: 单位球内的点缓慢旋转并逐点摆动, 透视投影到画布; 悬停视差 / 推开 / 吸引, 点击放冲击波推开点并闪亮,
 * 可选闪烁, 景深, 近点连线与整体漂移. 入场 1.8s 逐点错峰淡入; 减弱动效时只画一帧静止点云.
 */
export function Particles(props: ParticlesProps): JSX.Element {
  const {
    particleCount = 200, particleSpread = 10, particleColors = ["foreground"], moveParticlesOnHover = true, particleHoverFactor = 1,
    alphaParticles = false, particleBaseSize = 100, sizeRandomness = 1, cameraDistance = 20, disableRotation = false, shape = "circle",
    glow = 0.5, twinkle = 0.3, depthOfField = 0, connections = false, connectionDistance = 110, hoverEffect = "parallax", hoverRadius = 140,
    clickBurst = true, drift = "none", driftSpeed = 1, variation = 0, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const seeds = useMemo(() => makeParticles(particleCount, particleCount * SEED_SALT), [particleCount]);
  const bursts = useRef<Burst[]>([]);
  const seen = useRef(-1);

  const draw = (ctx: CanvasRenderingContext2D, frame: BackdropFrame): void => {
    const { width, height, scale } = frame.fit;
    clearFrame(ctx, frame.fit);
    const unit = height * HALF;
    const t = frame.time;
    const p = frame.pointer;
    const [px, py] = [p.x * width, (1 - p.y) * height];
    if (clickBurst && !frame.reduced) {
      for (const tap of p.taps) {
        if (tap.at <= seen.current) continue;
        seen.current = tap.at;
        bursts.current = [...bursts.current, { x: tap.x * width, y: (1 - tap.y) * height, at: tap.at }].slice(-PARTICLES.maxBursts);
      }
    }
    bursts.current = bursts.current.filter((b) => frame.elapsed - b.at <= PARTICLES.burstSeconds);
    const hover = moveParticlesOnHover ? p.presence * particleHoverFactor : 0;
    const shiftX = hoverEffect === "parallax" ? -(p.x - HALF) * 2 * PARTICLES.parallax * hover : 0;
    const shiftY = hoverEffect === "parallax" ? -(p.y - HALF) * 2 * PARTICLES.parallax * hover : 0;
    const yaw = disableRotation ? 0 : t * PARTICLES.spin;
    const pitch = yaw * TILT_RATIO;
    const intro = introProgress(frame.elapsed, PARTICLES.introSeconds, true);
    const flow = t * PARTICLES.driftRate * driftSpeed;
    const dots: Dot[] = [];
    for (const s of seeds) {
      const [r0, r1, r2, r3] = s.r;
      const amp = PARTICLES.wobble * (1 + variation * (r1 - HALF));
      let x = s.x * particleSpread + Math.sin(t * PARTICLES.wobbleRate + r0 * TURN) * amp;
      let y = s.y * particleSpread + Math.cos(t * PARTICLES.wobbleRate * (1 + r1) + r2 * TURN) * amp;
      let z = s.z * particleSpread + Math.sin(t * PARTICLES.wobbleRate * (1 + r2) + r3 * TURN) * amp;
      if (drift === "up") y = wrapSpan(y + flow, particleSpread);
      if (drift === "down") y = wrapSpan(y - flow, particleSpread);
      if (drift === "forward") z = wrapSpan(z + flow, particleSpread);
      const x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
      const z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
      const y1 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
      z = y * Math.sin(pitch) + z1 * Math.cos(pitch);
      x = x1 + shiftX;
      y = y1 + shiftY;
      const proj = project(x, y, z, cameraDistance);
      if (!proj) continue;
      const d: Dot = { x: width * HALF + proj.sx * unit, y: height * HALF - proj.sy * unit, size: 0, alpha: 1, color: Math.floor(r3 * particleColors.length), ahead: proj.ahead, flash: 0 };
      if (hover > 0 && hoverEffect !== "parallax") {
        const dist = Math.hypot(d.x - px, d.y - py) / scale;
        const push = hoverShift(dist, hoverRadius, hoverEffect) * hover;
        if (dist > 0) {
          d.x += ((d.x - px) / (dist * scale)) * push * scale;
          d.y += ((d.y - py) / (dist * scale)) * push * scale;
        }
      }
      for (const b of bursts.current) {
        const dist = Math.hypot(d.x - b.x, d.y - b.y) / scale;
        const push = burstPush(dist, frame.elapsed - b.at);
        if (dist <= 0 || push <= 0) continue;
        d.x += ((d.x - b.x) / dist) * push;
        d.y += ((d.y - b.y) / dist) * push;
        d.flash += push / PARTICLES.burstPush;
      }
      const blur = depthOfField * Math.min(1, Math.abs(proj.ahead - cameraDistance) / Math.max(particleSpread, 1));
      d.size = pointSize(particleBaseSize, sizeRandomness, r2, proj.ahead) * scale * (1 + variation * (r0 - HALF)) * (1 + blur);
      d.alpha = twinkleOf(twinkle, t, r1, r3) * smooth(PARTICLES.nearFadeFrom, PARTICLES.nearFadeTo, proj.ahead) * smooth(PARTICLES.far, PARTICLES.far * 0.9, proj.ahead);
      d.alpha *= smooth(0, 1, intro * INTRO_GAIN - r0 * INTRO_STAGGER) * (1 - DOF_FADE * blur) * (alphaParticles ? ALPHA_FLOOR + (1 - ALPHA_FLOOR) * r1 : 1);
      if (d.alpha > 0 && d.size > 0) dots.push(d);
    }
    dots.sort((a, b) => b.ahead - a.ahead);
    const colors: readonly Rgb[] = frame.colors;
    const inks = particleColors.map((_, i) => inkOf(pickColor(colors, i)));
    if (connections) drawLinks(ctx, dots, connectionDistance, scale, inks[0] ?? inkOf(undefined));
    for (const d of dots) {
      ctx.fillStyle = inks[d.color] ?? inks[0];
      ctx.strokeStyle = ctx.fillStyle;
      drawDot(ctx, d, shape, glow);
    }
    ctx.globalAlpha = 1;
  };

  const handle = useCanvasBackdrop({ draw }, { ...options, colors: particleColors, pointer: options.pointer && (moveParticlesOnHover || clickBurst) });
  return (
    <BackdropShell handle={handle} fallback={glowFallback("background", particleColors[0] ?? "foreground")} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}

function drawLinks(ctx: CanvasRenderingContext2D, dots: readonly Dot[], maxDist: number, scale: number, ink: string): void {
  const linked = dots.slice(-PARTICLES.maxLinked);
  ctx.strokeStyle = ink;
  ctx.lineWidth = scale;
  let lines = 0;
  for (let i = 0; i < linked.length && lines < PARTICLES.maxLines; i += 1) {
    for (let j = i + 1; j < linked.length && lines < PARTICLES.maxLines; j += 1) {
      const a = linkAlpha(Math.hypot(linked[i].x - linked[j].x, linked[i].y - linked[j].y) / scale, maxDist);
      if (a <= 0) continue;
      ctx.globalAlpha = a * Math.min(linked[i].alpha, linked[j].alpha);
      ctx.beginPath();
      ctx.moveTo(linked[i].x, linked[i].y);
      ctx.lineTo(linked[j].x, linked[j].y);
      ctx.stroke();
      lines += 1;
    }
  }
}
