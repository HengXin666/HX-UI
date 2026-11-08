"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Antigravity 条目, 实现为 HX 自有.
// ENGINE-GAP: 上游是 WebGL 实例化的三维小体 (胶囊 / 球 / 盒 / 四面体) 带光照; 内核没有实例化通道, 本件用 Canvas2D 画二维剪影 (圆头线 / 圆 / 方块 / 三角), 深度只体现为尺寸与雾, 无逐体光照.

import { useRef, type JSX } from "react";
import { BackdropShell, fallbackGradient, splitCommon, useCanvasBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import { ANTIGRAVITY, makeSwarm, omegaOf, ringAt, springStep, stepCharge, type AntigravityColorMode, type AntigravityShape, type Swarm } from "./antigravity-field";
import { clearFrame, HALF, inkOf, pickColor, rampColor, smooth, TURN } from "./tokens";

export interface AntigravityProps extends BackdropCommonProps {
  /** 粒子数, 默认 1500, 上限 4000. */
  readonly count?: number;
  /** 指针吸附半径 (世界单位, 画布高 31.5), 默认 9. */
  readonly magnetRadius?: number;
  /** 吸附后排成的环半径, 默认 7. */
  readonly ringRadius?: number;
  /** 环上波浪的转速 (圈 / 秒), 默认 0.4. */
  readonly waveSpeed?: number;
  /** 波浪振幅 (世界单位), 默认 1. */
  readonly waveAmplitude?: number;
  /** 环上波峰数, 默认 3. */
  readonly waveCount?: number;
  /** 粒子尺寸 (世界单位), 默认 0.9. */
  readonly particleSize?: number;
  /** 跟随快慢 0..1, 默认 0.05. */
  readonly lerpSpeed?: number;
  /** 单色, 给了就覆盖 colors. */
  readonly color?: string;
  /** 色板 (token 名或 CSS 颜色). 默认 ["primary", "accent", "accent-2"]. */
  readonly colors?: readonly string[];
  /** 取色方式: conic 按方位角 / radial 按离指针距离 / random 每粒随机. */
  readonly colorMode?: AntigravityColorMode;
  /** conic 色带转速 (圈 / 秒), 默认 0.05. */
  readonly colorSpeed?: number;
  /** 指针不在时让吸附点自己巡游, 默认 true. */
  readonly autoAnimate?: boolean;
  /** 环带厚度与脉动的个体差异 0..1, 默认 1. */
  readonly particleVariance?: number;
  /** 环整体自转 (弧度 / 秒), 默认 0. */
  readonly rotationSpeed?: number;
  /** 深度感强度, 默认 1. */
  readonly depthFactor?: number;
  /** 脉动频率, 默认 3. */
  readonly pulseSpeed?: number;
  /** 粒子形状. */
  readonly particleShape?: AntigravityShape;
  /** 吸附场强, 10 为基准. */
  readonly fieldStrength?: number;
  /** 未吸附时的漂浮幅度 (世界单位), 默认 0.25. */
  readonly ambient?: number;
  /** 响应指针, 默认 true. */
  readonly interactive?: boolean;
  /** 点击把环上的粒子弹开, 默认 true. */
  readonly clickBurst?: boolean;
  /** 入场: 粒子从下方错峰升起, 默认 true. */
  readonly intro?: boolean;
  /** 浅色底: 正常叠加而非加色发光. */
  readonly lightMode?: boolean;
}

interface Core {
  swarm: Swarm | null;
  key: string;
  cx: number;
  cy: number;
  cvx: number;
  cvy: number;
  charge: number;
  clock: number;
  seen: number;
}

const DEFAULT_COLORS = ["primary", "accent", "accent-2"] as const;
/** 本库定: 色带查表的级数. */
const RAMP_STEPS = 32;
/** 吸附范围的软边: 0.8 到 1.2 倍 magnetRadius. */
const EDGE_IN = 0.8;
const EDGE_OUT = 1.2;
/** 本库定: 无指针巡游的李萨如参数. */
const WANDER = { ax: 0.28, ay: 0.22, fx: 0.31, fy: 0.47, phase: 1 } as const;
/** 本库定: 速度到 "沿速度方向拉长" 的饱和速度 (世界单位 / 秒). */
const STREAK_SPEED = 12;
const SEED = 4271;

/**
 * 反重力粒子场: 粒子散落在画面里缓慢漂浮, 指针附近的被吸成一圈带波浪的环, 环随时间转动; 按住蓄力把环收紧, 点击弹开.
 * 每粒是阻尼 1.64 omega 的弹簧, 光标本身是刚度 49 / 阻尼 14 的弹簧. 入场时粒子从下方错峰升起. 减弱动效时只画一帧排好的画面.
 */
export function Antigravity(props: AntigravityProps): JSX.Element {
  const {
    count = 1500, magnetRadius = 9, ringRadius = 7, waveSpeed = 0.4, waveAmplitude = 1, waveCount = 3, particleSize = 0.9, lerpSpeed = 0.05,
    color, colors = DEFAULT_COLORS, colorMode = "conic", colorSpeed = 0.05, autoAnimate = true, particleVariance = 1, rotationSpeed = 0,
    depthFactor = 1, pulseSpeed = 3, particleShape = "capsule", fieldStrength = 10, ambient = 0.25, interactive = true, clickBurst = true,
    intro = true, lightMode = false, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const palette = color ? [color] : [...colors];
  const core = useRef<Core>({ swarm: null, key: "", cx: 0, cy: 0, cvx: 0, cvy: 0, charge: 0, clock: 0, seen: -1 });

  const draw = (ctx: CanvasRenderingContext2D, frame: BackdropFrame): void => {
    const { width, height } = frame.fit;
    clearFrame(ctx, frame.fit);
    const unit = height / ANTIGRAVITY.worldHeight;
    const w = width / unit;
    const h = ANTIGRAVITY.worldHeight;
    const c = core.current;
    const key = `${count}|${Math.round(w)}`;
    if (!c.swarm || c.key !== key) {
      c.swarm = makeSwarm(count, w, h, SEED + count, intro && !frame.reduced);
      c.key = key;
      c.clock = 0;
      [c.cx, c.cy] = [w * HALF, h * HALF];
    }
    const s = c.swarm;
    const t = frame.time;
    const dt = Math.min(frame.dt, ANTIGRAVITY.dtCap);
    const p = frame.pointer;
    c.clock = frame.reduced ? Number.POSITIVE_INFINITY : Math.min(ANTIGRAVITY.introSpan, c.clock + dt);
    const present = interactive && p.presence > 0.01;
    const tx = present ? p.x * w : autoAnimate ? w * (HALF + WANDER.ax * Math.sin(t * WANDER.fx)) : w * HALF;
    const ty = present ? (1 - p.y) * h : autoAnimate ? h * (HALF + WANDER.ay * Math.sin(t * WANDER.fy + WANDER.phase)) : h * HALF;
    if (frame.reduced) {
      [c.cx, c.cy, c.cvx, c.cvy] = [tx, ty, 0, 0];
    } else {
      c.cvx += ((tx - c.cx) * ANTIGRAVITY.cursorStiffness - c.cvx * ANTIGRAVITY.cursorDamping) * dt;
      c.cvy += ((ty - c.cy) * ANTIGRAVITY.cursorStiffness - c.cvy * ANTIGRAVITY.cursorDamping) * dt;
      c.cx += c.cvx * dt;
      c.cy += c.cvy * dt;
    }
    c.charge = stepCharge(c.charge, interactive && p.down, dt);
    let kick = 0;
    if (clickBurst && interactive && !frame.reduced) {
      for (const tap of p.taps) {
        if (tap.at <= c.seen) continue;
        c.seen = tap.at;
        kick = ANTIGRAVITY.burstImpulse * (HALF + c.charge);
      }
    }
    const capture = present ? p.presence : autoAnimate ? 1 : 0;
    const ring = ringRadius * (1 - ANTIGRAVITY.chargeShrink * c.charge);
    const omega0 = omegaOf(lerpSpeed) * (fieldStrength / 10);
    const spin = t * rotationSpeed;
    const ramp = Array.from({ length: RAMP_STEPS }, (_, i) => inkOf(rampColor(frame.colors, i / (RAMP_STEPS - 1))));
    const solids = palette.map((_, i) => inkOf(pickColor(frame.colors, i)));
    ctx.globalCompositeOperation = lightMode ? "source-over" : "lighter";
    ctx.lineCap = "round";
    for (let i = 0; i < s.count; i += 1) {
      const ax = s.hx[i] + Math.sin(t * HALF + s.hue[i] * TURN) * ambient;
      const ay = s.hy[i] + Math.cos(t * 0.4 + s.delay[i] * TURN) * ambient;
      const dx = ax - c.cx;
      const dy = ay - c.cy;
      const d = Math.hypot(dx, dy);
      const pull = capture * (1 - smooth(magnetRadius * EDGE_IN, magnetRadius * EDGE_OUT, d));
      const ang = Math.atan2(dy, dx);
      const r = ringAt(ang + spin, t, ring, waveAmplitude, waveCount, waveSpeed, s.band[i] * particleVariance * 0.8);
      const gx = ax + (c.cx + Math.cos(ang) * r - ax) * pull;
      const gy = ay + (c.cy + Math.sin(ang) * r - ay) * pull;
      if (frame.reduced) {
        [s.x[i], s.y[i], s.vx[i], s.vy[i]] = [gx, gy, 0, 0];
      } else {
        const omega = c.clock < s.delay[i] * ANTIGRAVITY.introLaunch ? 0 : omega0 * s.agility[i];
        [s.x[i], s.vx[i]] = springStep(s.x[i], s.vx[i], gx, omega, dt);
        [s.y[i], s.vy[i]] = springStep(s.y[i], s.vy[i], gy, omega, dt);
        if (kick > 0 && pull > 0.2) {
          s.vx[i] += Math.cos(ang) * kick * pull;
          s.vy[i] += Math.sin(ang) * kick * pull;
        }
      }
      const z = s.z[i];
      const pulse = 1 + Math.sin(t * pulseSpeed + s.delay[i] * TURN) * ANTIGRAVITY.pulseDepth * particleVariance;
      const size = particleSize * unit * (1 + z * ANTIGRAVITY.depthScale * depthFactor) * pulse;
      const fog = 1 - Math.max(-z, 0) * ANTIGRAVITY.depthFog * depthFactor;
      const tone = colorMode === "random" ? -1 : colorMode === "radial" ? Math.min(1, d / (magnetRadius * EDGE_OUT)) : (((ang / TURN + t * colorSpeed) % 1) + 1) % 1;
      ctx.fillStyle = tone < 0 ? solids[Math.floor(s.hue[i] * solids.length)] ?? solids[0] : ramp[Math.round(tone * (RAMP_STEPS - 1))];
      ctx.strokeStyle = ctx.fillStyle;
      ctx.globalAlpha = Math.max(0, fog) * (0.45 + 0.55 * pull);
      const speed = Math.hypot(s.vx[i], s.vy[i]);
      const streak = smooth(0, STREAK_SPEED, speed);
      const hx = Math.cos(ang) * (1 - streak) + (speed > 0 ? s.vx[i] / speed : 0) * streak;
      const hy = Math.sin(ang) * (1 - streak) + (speed > 0 ? s.vy[i] / speed : 0) * streak;
      drawBody(ctx, s.x[i] * unit, s.y[i] * unit, size, Math.atan2(hy, hx), particleShape);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  const handle = useCanvasBackdrop({ draw }, { ...options, colors: palette, pointer: options.pointer && interactive });
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(palette)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}

function drawBody(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, heading: number, shape: AntigravityShape): void {
  const r = size * HALF;
  const cos = Math.cos(heading);
  const sin = Math.sin(heading);
  ctx.beginPath();
  if (shape === "capsule") {
    ctx.lineWidth = Math.max(1, r * 0.9);
    ctx.moveTo(x - cos * r, y - sin * r);
    ctx.lineTo(x + cos * r, y + sin * r);
    ctx.stroke();
    return;
  }
  if (shape === "sphere") {
    ctx.arc(x, y, r * 0.7, 0, TURN);
  } else {
    const corners = shape === "box" ? 4 : 3;
    for (let k = 0; k < corners; k += 1) {
      const a = heading + (k / corners) * TURN;
      const px = x + Math.cos(a) * r * 0.8;
      const py = y + Math.sin(a) * r * 0.8;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  ctx.fill();
}
