// 行为规格参照 docs/research/catalog/animations.md 的 SplashCursor 条目, 实现为 HX 自有.
/**
 * InkSplash 的驱动: 每帧决定往流体里打哪些溅点 (位置, 速度, 颜色, 半径, 种类). 纯函数, 不碰 GL.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import type { Rgb } from "../../backdrop/kernel/color";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { INK } from "../tokens";

/** 一个溅点. kind 0 是拖动 (速度沿指针方向), 1 是点击 (沿花瓣向外推). 速度单位: 模拟格每秒. */
export interface InkSplat {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly color: Rgb;
  readonly radius: number;
  readonly kind: 0 | 1;
  readonly seed: number;
}

export interface InkDrive {
  hue: number;
  seenTap: number;
  seed: number;
  lastIntro: number;
}

export function createInkDrive(): InkDrive {
  return { hue: 0, seenTap: -1, seed: 1, lastIntro: 0 };
}

export interface InkSettings {
  readonly size: number;
  readonly force: number;
  readonly intensity: number;
  readonly colorSpeed: number;
  readonly rainbow: boolean;
  readonly clickSplash: boolean;
  readonly intro: boolean;
  /** 模拟网格相对画布的比例. */
  readonly simScale: number;
}

/** 色相 (圈) 转 sRGB, 饱和度 1, 明度 1. */
export function hueRgb(h: number): Rgb {
  const f = (n: number): number => {
    const k = (n + h * 6) % 6;
    return 1 - Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5), f(3), f(1)];
}

/** 花瓣形溅点的半径倍率 (与着色器同式). */
export function inkPetals(angle: number, seed: number): number {
  return INK.petalBase + INK.petalAmp * Math.sin(angle * 5 + seed) * Math.sin(angle * 3 - seed * 1.7);
}

/** 补色量与推力随溅点大小缩放: 大溅点每处少给一点, 总量不随 size 暴涨. */
export function inkSpread(size: number): number {
  return Math.sqrt(Math.max(0.1, size));
}

function nextSeed(d: InkDrive): number {
  d.seed = (Math.imul(d.seed, 1664525) + 1013904223) >>> 0;
  return (d.seed / 4294967296) * 6.2832;
}

function paint(d: InkDrive, s: InkSettings, palette: readonly Rgb[], time: number, gain: number): Rgb {
  const base = s.rainbow || palette.length === 0 ? hueRgb(d.hue) : palette[Math.floor(time * Math.max(0, s.colorSpeed) * 0.5) % palette.length];
  return [base[0] * gain, base[1] * gain, base[2] * gain];
}

/**
 * 推进一帧, 给出本帧的溅点 (最多 INK.maxSplats 个). 静态帧不打.
 *
 * @param d 原地推进的驱动状态.
 * @param frame 内核的这一帧.
 * @param s 组件设置.
 * @param palette 非彩虹模式的调色板 (已解析的 token 色).
 */
export function stepInk(d: InkDrive, frame: BackdropFrame, s: InkSettings, palette: readonly Rgb[]): InkSplat[] {
  if (frame.still || frame.dt <= 0) return [];
  const dt = Math.min(frame.dt, INK.maxDt);
  const { pointer, fit, elapsed, time } = frame;
  d.hue = (d.hue + dt * INK.hueRate * Math.max(0, s.colorSpeed)) % 1;
  const spread = inkSpread(s.size);
  const radius = INK.radius * Math.max(0.1, s.size);
  const gridW = fit.width * s.simScale;
  const gridH = fit.height * s.simScale;
  const push = (INK.push * Math.max(0, s.force)) / spread;
  const amount = (INK.dye * Math.max(0, s.intensity) * Math.min(dt * 60, 1)) / spread;
  const out: InkSplat[] = [];
  if (s.intro && elapsed < INK.introS) {
    const t = elapsed / INK.introS;
    const x = 0.2 + 0.6 * t;
    const y = 0.5 + 0.18 * Math.sin(t * Math.PI * 2);
    const dx = (0.6 / INK.introS) * dt;
    const dy = 0.18 * Math.PI * 2 * Math.cos(t * Math.PI * 2) * (dt / INK.introS);
    out.push({ x, y, vx: dx * push * (gridW / Math.max(1, gridH)), vy: dy * push, color: paint(d, s, palette, time, amount * 1.5), radius, kind: 0, seed: 0 });
  }
  const tap = pointer.taps[pointer.taps.length - 1];
  if (tap && tap.at > d.seenTap) {
    d.seenTap = tap.at;
    if (s.clickSplash) out.push({ x: tap.x, y: tap.y, vx: INK.click * Math.max(0, s.force), vy: 0, color: paint(d, s, palette, time, amount * 10), radius: radius * 1.6, kind: 1, seed: nextSeed(d) });
  }
  const moving = Math.hypot(pointer.vx, pointer.vy) > 1e-3;
  if (pointer.inside && moving) {
    const aspect = gridW / Math.max(1, gridH);
    out.push({ x: pointer.x, y: pointer.y, vx: pointer.vx * dt * push * aspect, vy: pointer.vy * dt * push, color: paint(d, s, palette, time, amount), radius, kind: 0, seed: 0 });
  }
  return out.slice(-INK.maxSplats);
}

/** 溅点打包成着色器数组: 位置速度 (x, y, vx, vy), 颜色半径 (r, g, b, radius), 种类与种子 (kind, seed). */
export function packInk(splats: readonly InkSplat[]): { at: Float32Array; paint: Float32Array; meta: Float32Array; count: number } {
  const at = new Float32Array(INK.maxSplats * 4);
  const paint = new Float32Array(INK.maxSplats * 4);
  const meta = new Float32Array(INK.maxSplats * 2);
  splats.slice(0, INK.maxSplats).forEach((s, i) => {
    at.set([s.x, s.y, s.vx, s.vy], i * 4);
    paint.set([s.color[0], s.color[1], s.color[2], s.radius], i * 4);
    meta.set([s.kind, s.seed], i * 2);
  });
  return { at, paint, meta, count: Math.min(splats.length, INK.maxSplats) };
}
