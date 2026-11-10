// 行为规格参照 docs/research/catalog/animations.md 的 BlobCursor, GhostCursor, SwarmCursor 条目 (自写积分, 指针换算), 实现为 HX 自有.
/**
 * cursor 族共用的小工具: 内核归一化指针换成设备像素, 弹簧一步, 平滑值噪声, 可复现随机数.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";

/** 指针在画布设备像素里的位置 (y 朝下). */
export function pointerPx(frame: Pick<BackdropFrame, "pointer" | "fit">): readonly [number, number] {
  return [frame.pointer.x * frame.fit.width, (1 - frame.pointer.y) * frame.fit.height];
}

/** 指针速度换成设备像素每秒 (y 朝下). */
export function pointerVelocityPx(frame: Pick<BackdropFrame, "pointer" | "fit">): readonly [number, number] {
  return [frame.pointer.vx * frame.fit.width, -frame.pointer.vy * frame.fit.height];
}

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** 弹簧-阻尼体朝目标积分 dt 秒 (半隐式欧拉, 子步长 step). */
export function integrate(b: Body, tx: number, ty: number, stiffness: number, damping: number, dt: number, step: number): void {
  const n = Math.max(1, Math.ceil(dt / step));
  const h = dt / n;
  for (let i = 0; i < n; i += 1) {
    b.vx += (stiffness * (tx - b.x) - damping * b.vx) * h;
    b.vy += (stiffness * (ty - b.y) - damping * b.vy) * h;
    b.x += b.vx * h;
    b.y += b.vy * h;
  }
}

/** 一阶跟随系数 1 - exp(-dt / tau). */
export function follow(dt: number, tau: number): number {
  return tau <= 0 ? 1 : 1 - Math.exp(-dt / tau);
}

function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

/** 一维平滑值噪声, 返回 -1..1. */
export function noise1(t: number): number {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return (hash(i) * (1 - u) + hash(i + 1) * u) * 2 - 1;
}

/** 可复现随机数 (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
