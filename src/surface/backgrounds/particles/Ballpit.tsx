"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Ballpit 条目, 实现为 HX 自有.
// ENGINE-GAP: 上游是 WebGL 实例化球体带 PBR 光照, 环境反射与阴影; 内核没有实例化通道, 本件用 Canvas2D 按深度排序画透视圆, 光照以径向渐变 + 高光点 + 菲涅耳边光近似, 无球间投影.

import { useRef, type JSX } from "react";
import { BackdropShell, fallbackGradient, splitCommon, useCanvasBackdrop, type BackdropCommonProps, type BackdropFrame, type Rgb } from "../../backdrop/kernel";
import {
  BALLPIT, ballpitView, burstAt, depthScale, makeBalls, makeCursor, pickBall, stepBalls, type BallpitClickEffect, type BallpitCursor, type BallpitView, type BallpitWorld,
} from "./ballpit-field";
import { clearFrame, follow, HALF, inkOf, mixRgb, pickColor, TURN } from "./tokens";

export type BallpitMaterial = "satin" | "glossy" | "matte" | "metal";

export interface BallpitProps extends BackdropCommonProps {
  /** 球数, 默认 200, 上限 600. */
  readonly count?: number;
  /** 球色 (token 名或 CSS 颜色), 每球随机取一个. 默认 ["primary", "accent", "accent-2"]. */
  readonly colors?: readonly string[];
  /** 材质: satin 柔光 / glossy 亮面 / matte 哑光 / metal 金属边光. */
  readonly material?: BallpitMaterial;
  /** 最小 / 最大半径 (世界单位, 盒半高约 9.3), 默认 0.5 / 1. */
  readonly minSize?: number;
  readonly maxSize?: number;
  /** 重力 (1 为 20 世界单位 / 秒^2), 默认 0.5. */
  readonly gravity?: number;
  /** 每 1/60 秒保留的速度比例, 默认 0.9975. */
  readonly friction?: number;
  /** 撞墙恢复系数, 默认 0.95. */
  readonly wallBounce?: number;
  /** 球与球恢复系数, 默认 0.85. */
  readonly bounce?: number;
  /** 盒子半深 (世界单位), 默认 2. */
  readonly depth?: number;
  /** 无重力漂移强度, 默认 0. */
  readonly drift?: number;
  /** 指针处有一个推球的隐形球, 默认 true. */
  readonly followCursor?: boolean;
  /** 隐形光标球的大小倍率, 默认 1. */
  readonly cursorSize?: number;
  /** 按住拖球, 松手甩出, 默认 true. */
  readonly grab?: boolean;
  /** 点击效果: burst 把附近的球炸开. */
  readonly clickEffect?: BallpitClickEffect;
  /** 光色, 默认 foreground. */
  readonly lightColor?: string;
  /** 光强, 默认 1. */
  readonly lightIntensity?: number;
  /** 曝光倍率, 默认 1. */
  readonly exposure?: number;
  /** 背光面变暗程度 0..1, 默认 0.6. */
  readonly shadows?: number;
  /** 入场: 球从顶上错峰落下, 默认 true. */
  readonly intro?: boolean;
}

interface Core {
  world: BallpitWorld | null;
  view: BallpitView;
  key: string;
  cursor: BallpitCursor;
  wasDown: boolean;
  seen: number;
  clock: number;
}

const DEFAULT_COLORS = ["primary", "accent", "accent-2"] as const;
const LIGHT_TOKEN = "foreground";
const SEED = 9137;
/** 本库定: 各材质的高光强度 / 高光斑大小 / 菲涅耳边光 / 受光面向光色偏移. */
const MATERIALS: Record<BallpitMaterial, { spec: number; size: number; rim: number; sheen: number }> = {
  satin: { spec: 0.45, size: 0.32, rim: 0.15, sheen: 0.3 },
  glossy: { spec: 0.9, size: 0.16, rim: 0.35, sheen: 0.15 },
  matte: { spec: 0, size: 0.4, rim: 0, sheen: 0.4 },
  metal: { spec: 1, size: 0.12, rim: 0.6, sheen: 0.1 },
};
/** 光从左上来: 高光点相对球心的偏移 (半径倍数). */
const LIGHT_DIR = [-0.36, -0.42] as const;
/** 规格: 菲涅耳 F0 = 0.04; 本库定: 静帧预先沉降的秒数. */
const F0 = 0.04;
const SETTLE_SECONDS = 3;

/**
 * 球池: 一盒彩色球在重力下堆在底部互相碰撞, 指针处有一个隐形球把球拨开, 按住可抓起一个球甩出去, 点击把附近的球炸开.
 * 物理是子步 1/120s 的显式积分, 球间按质量分摊穿透并按 bounce 反弹. 减弱动效时先沉降 3 秒再画一帧.
 */
export function Ballpit(props: BallpitProps): JSX.Element {
  const {
    count = 200, colors = DEFAULT_COLORS, material = "satin", minSize = 0.5, maxSize = 1, gravity = 0.5, friction = 0.9975, wallBounce = 0.95,
    bounce = 0.85, depth = 2, drift = 0, followCursor = true, cursorSize = 1, grab = true, clickEffect = "burst", lightColor = LIGHT_TOKEN,
    lightIntensity = 1, exposure = 1, shadows = 0.6, intro = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const palette = [...colors];
  const core = useRef<Core>({ world: null, view: ballpitView(1), key: "", cursor: makeCursor(), wasDown: false, seen: -1, clock: 0 });
  const params = { gravity, friction, wallBounce, bounce, depth: Math.max(0, depth), drift };

  const draw = (ctx: CanvasRenderingContext2D, frame: BackdropFrame): void => {
    const { width, height } = frame.fit;
    clearFrame(ctx, frame.fit);
    if (width <= 0 || height <= 0) return;
    const c = core.current;
    const key = `${count}|${minSize}|${maxSize}|${params.depth}|${(width / height).toFixed(3)}`;
    if (!c.world || c.key !== key) {
      c.view = ballpitView(width / height);
      c.world = makeBalls(count, c.view, minSize, maxSize, params.depth, SEED + count, intro && !frame.reduced);
      c.key = key;
      c.cursor = makeCursor();
      if (frame.reduced) for (let t = 0; t < SETTLE_SECONDS; t += 1 / 60) stepBalls(c.world, c.view, params, c.cursor, 1 / 60, t, [0, 0]);
    }
    const w = c.world;
    const v = c.view;
    const p = frame.pointer;
    const live = !frame.reduced && frame.dt > 0;
    const px = (p.x - HALF) * 2 * v.hw;
    const py = (p.y - HALF) * 2 * v.hh;
    if (live) stepCursor(c, w, v, frame, px, py, followCursor, cursorSize, grab, clickEffect);
    if (live) {
      c.clock += frame.dt;
      stepBalls(w, v, params, c.cursor, frame.dt * (options.speed ?? 1), c.clock, [px, py]);
    }
    paint(ctx, frame, w, v, MATERIALS[material] ?? MATERIALS.satin, palette.length, { lightIntensity, exposure, shadows });
  };

  const handle = useCanvasBackdrop({ draw }, { ...options, colors: [...palette, lightColor] });
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(palette)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}

/** 光标球跟手 (位置 0.06s, 半径 0.12s, 速度钳到 MAX_SPEED), 按下抓球, 松手甩出, 点击爆开. */
function stepCursor(c: Core, w: BallpitWorld, v: BallpitView, frame: BackdropFrame, px: number, py: number, followCursor: boolean, size: number, grab: boolean, effect: BallpitClickEffect): void {
  const p = frame.pointer;
  const k = c.cursor;
  const dt = frame.dt;
  const fromX = k.x;
  const fromY = k.y;
  const f = follow(dt, BALLPIT.cursorFollowTau);
  k.x += (px - k.x) * f;
  k.y += (py - k.y) * f;
  k.vx = Math.max(-BALLPIT.maxSpeed, Math.min(BALLPIT.maxSpeed, (k.x - fromX) / Math.max(dt, 1e-3)));
  k.vy = Math.max(-BALLPIT.maxSpeed, Math.min(BALLPIT.maxSpeed, (k.y - fromY) / Math.max(dt, 1e-3)));
  const want = followCursor && p.inside && k.held < 0 ? BALLPIT.cursorRadius * size * p.presence : 0;
  k.r += (want - k.r) * follow(dt, BALLPIT.cursorRadiusTau);
  let grabbed = false;
  if (p.down && !c.wasDown && grab) {
    k.held = pickBall(w, v, px, py);
    [k.hvx, k.hvy] = [0, 0];
    grabbed = k.held >= 0;
  }
  if (!p.down && c.wasDown && k.held >= 0) {
    k.held = -1;
    k.glide = BALLPIT.glideSeconds;
  }
  c.wasDown = p.down;
  for (const tap of p.taps) {
    if (tap.at <= c.seen) continue;
    c.seen = tap.at;
    if (effect === "burst" && !grabbed) burstAt(w, (tap.x - HALF) * 2 * v.hw, (tap.y - HALF) * 2 * v.hh);
  }
}

interface Light {
  readonly lightIntensity: number;
  readonly exposure: number;
  readonly shadows: number;
}

/** 按深度从远到近画: 背光底色, 受光渐变 (拿不到渐变时退为实心), 高光点, 菲涅耳边光. */
function paint(ctx: CanvasRenderingContext2D, frame: BackdropFrame, w: BallpitWorld, v: BallpitView, mat: (typeof MATERIALS)[BallpitMaterial], tints: number, light: Light): void {
  const { width, height } = frame.fit;
  const unit = height / (2 * v.hh);
  const lamp: Rgb = pickColor(frame.colors, tints);
  const ids = Array.from({ length: w.count }, (_, i) => i).sort((a, b) => w.z[a] - w.z[b]);
  const gain = (rgb: Rgb, k: number): Rgb => [Math.min(1, rgb[0] * k), Math.min(1, rgb[1] * k), Math.min(1, rgb[2] * k)];
  const lit = light.exposure * (0.6 + 0.4 * light.lightIntensity);
  for (const i of ids) {
    const s = depthScale(v, w.z[i]);
    const x = width * HALF + w.x[i] * s * unit;
    const y = height * HALF - w.y[i] * s * unit;
    const r = w.r[i] * s * unit;
    if (r < 0.5) continue;
    const base = pickColor(frame.colors.slice(0, Math.max(1, tints)), Math.floor(w.tint[i] * tints));
    const dark = gain(base, lit * (1 - light.shadows * 0.7));
    const bright = gain(mixRgb(base, lamp, mat.sheen * light.lightIntensity), lit);
    const hx = x + LIGHT_DIR[0] * r;
    const hy = y + LIGHT_DIR[1] * r;
    ctx.globalAlpha = 1;
    const shade = ctx.createRadialGradient(hx, hy, r * 0.05, x, y, r);
    const usable = typeof (shade as Partial<CanvasGradient> | undefined)?.addColorStop === "function";
    if (usable) {
      shade.addColorStop(0, inkOf(bright));
      shade.addColorStop(1, inkOf(dark));
    }
    ctx.fillStyle = usable ? shade : inkOf(mixRgb(dark, bright, HALF));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TURN);
    ctx.fill();
    if (mat.spec > 0) {
      ctx.globalAlpha = Math.min(1, mat.spec * light.lightIntensity);
      ctx.fillStyle = inkOf(lamp);
      ctx.beginPath();
      ctx.arc(hx, hy, r * mat.size * HALF, 0, TURN);
      ctx.fill();
    }
    if (mat.rim > 0) {
      ctx.globalAlpha = Math.min(1, mat.rim * light.lightIntensity * (F0 + (1 - F0) * HALF));
      ctx.strokeStyle = inkOf(lamp);
      ctx.lineWidth = Math.max(1, r * 0.08);
      ctx.beginPath();
      ctx.arc(x, y, r * 0.96, 0, TURN);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
