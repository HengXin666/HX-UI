// 行为规格参照 docs/research/catalog/animations.md 的 Ribbons 条目, 实现为 HX 自有.
/**
 * StreamerCursor 的模拟与几何: 每条彩带的头是弹簧-阻尼体追指针 (各自错开一点位置与手感), 身体是 50 个点逐点跟随;
 * 宽度沿身长按形状曲线变化, 可选沿法向起伏. 坐标与长度都是设备像素; 不碰画布.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import { STREAMER } from "../tokens";
import { clamp, type Body } from "./common";

export type StreamerShape = "lens" | "comet" | "even";

export interface Ribbon {
  head: Body;
  pts: { x: number; y: number }[];
  /** 拉力, 拖拽, 宽度倍数 (0.85..1.15), 相对指针的偏移角. */
  pull: number;
  drag: number;
  width: number;
  angle: number;
}

export interface StreamerState {
  ribbons: Ribbon[];
  carry: number;
  clock: number;
  placed: boolean;
}

function smoothstep(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

export function makeStreamers(count: number): StreamerState {
  const n = Math.max(1, Math.round(count));
  const span = STREAMER.spreadPull;
  const ribbons = Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    return {
      head: { x: 0, y: 0, vx: 0, vy: 0 },
      pts: Array.from({ length: STREAMER.points }, () => ({ x: 0, y: 0 })),
      pull: 1 - span + 2 * span * t,
      drag: 1 + span - 2 * span * t,
      width: 1 + span - 2 * span * ((i * 0.618) % 1),
      angle: (i / n) * Math.PI * 2,
    };
  });
  return { ribbons, carry: 0, clock: 0, placed: false };
}

/** 弹簧量 0.03 x 4^(2 x stiffness - 1). */
export function streamerSpring(stiffness: number): number {
  return STREAMER.springBase * STREAMER.springPow ** (2 * clamp(stiffness, 0, 1) - 1);
}

/** 身体逐点跟随系数 1 - 0.183^((1 / length) x dt x 60). */
export function streamerFollow(length: number, dt: number): number {
  return 1 - STREAMER.followBase ** ((1 / Math.max(0.05, length)) * dt * STREAMER.rate);
}

/** 宽度曲线: u 为 0 (头) 到 1 (尾). */
export function streamerProfile(shape: StreamerShape, u: number): number {
  if (shape === "comet") return (1 - u) ** 1.2 * Math.sqrt(smoothstep(0, 0.1, u));
  if (shape === "even") return Math.sqrt(smoothstep(0, 0.06, u) * smoothstep(0, 0.06, 1 - u));
  return Math.sqrt(clamp(4 * u * (1 - u), 0, 1));
}

export interface StreamerTuning {
  readonly stiffness: number;
  readonly bounce: number;
  readonly length: number;
  readonly spread: number;
}

/** 以 1/120 秒定步推进. */
export function stepStreamers(s: StreamerState, tx: number, ty: number, dt: number, o: StreamerTuning, scale: number): void {
  if (!s.placed) {
    for (const r of s.ribbons) {
      r.head.x = tx;
      r.head.y = ty;
      for (const p of r.pts) {
        p.x = tx;
        p.y = ty;
      }
    }
    s.placed = true;
  }
  s.clock += dt;
  s.carry = Math.min(s.carry + dt, 0.25);
  const spring = streamerSpring(o.stiffness);
  const zeta = 1 - STREAMER.bounceDamp * clamp(o.bounce, 0, 1);
  const k = streamerFollow(o.length, STREAMER.stepS);
  while (s.carry >= STREAMER.stepS) {
    s.carry -= STREAMER.stepS;
    for (const r of s.ribbons) {
      const omega = STREAMER.rate * Math.sqrt(spring * r.pull);
      const damping = 2 * zeta * STREAMER.rate * Math.sqrt(spring) * r.drag;
      const gx = tx + Math.cos(r.angle) * o.spread * scale;
      const gy = ty + Math.sin(r.angle) * o.spread * scale;
      const h = STREAMER.stepS;
      r.head.vx += (omega * omega * (gx - r.head.x) - damping * r.head.vx) * h;
      r.head.vy += (omega * omega * (gy - r.head.y) - damping * r.head.vy) * h;
      r.head.x += r.head.vx * h;
      r.head.y += r.head.vy * h;
      let px = r.head.x;
      let py = r.head.y;
      for (const p of r.pts) {
        p.x += (px - p.x) * k;
        p.y += (py - p.y) * k;
        px = p.x;
        py = p.y;
      }
    }
  }
}

/** 彩带轮廓: 左边从头到尾, 再右边从尾到头. 太短 (总长不到一个像素) 时返回空. */
export function ribbonOutline(r: Ribbon, half: number, shape: StreamerShape, wave: number, phase: number): { x: number; y: number }[] {
  const pts = [{ x: r.head.x, y: r.head.y }, ...r.pts];
  let total = 0;
  for (let i = 1; i < pts.length; i += 1) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  if (total < 1) return [];
  const body = half * r.width * smoothstep(0, half * 3, total);
  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    const u = i / (pts.length - 1);
    const w = body * streamerProfile(shape, u);
    const off = wave * body * Math.sin(u * STREAMER.waveCycles * Math.PI * 2 - phase);
    left.push({ x: p.x + nx * (off + w), y: p.y + ny * (off + w) });
    right.push({ x: p.x + nx * (off - w), y: p.y + ny * (off - w) });
  });
  return [...left, ...right.reverse()];
}
