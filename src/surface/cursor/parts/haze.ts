// 行为规格参照 docs/research/catalog/animations.md 的 GhostCursor 条目, 实现为 HX 自有.
/**
 * HazeCursor 的模拟: 头部弹簧跟手 (inertia 越大越飘), 沿路径按间距放烟团, 烟团受拖拽减速, 向上漂移, 被噪声扰动,
 * 浓度按 trailLength 指数衰减并随之胀大. 坐标与长度都是设备像素; 不碰画布.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import { HAZE, SUBSTEP_S } from "../tokens";
import { clamp, follow, integrate, noise1, type Body } from "./common";

export interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 浓度 1 到 0. */
  amount: number;
  r: number;
  seed: number;
}

export interface HazeState {
  head: Body;
  puffs: Puff[];
  presence: number;
  intro: number;
  clock: number;
  lastX: number;
  lastY: number;
  placed: boolean;
  seq: number;
}

export function makeHaze(intro: boolean): HazeState {
  return { head: { x: 0, y: 0, vx: 0, vy: 0 }, puffs: [], presence: 0, intro: intro ? 0 : 1, clock: 0, lastX: 0, lastY: 0, placed: false, seq: 0 };
}

/** 弹簧: 刚度 520 x (1 - inertia)^2 + 26, 阻尼 2 sqrt(k) x 0.92. */
export function hazeSpring(inertia: number): { readonly stiffness: number; readonly damping: number } {
  const stiffness = HAZE.stiffScale * (1 - clamp(inertia, 0, 1)) ** 2 + HAZE.stiffBase;
  return { stiffness, damping: 2 * Math.sqrt(stiffness) * HAZE.dampingRatio };
}

/** 每帧浓度保留率 exp(-dt / (0.12 + trailLength x 0.022)). */
export function hazeDecay(dt: number, trailLength: number): number {
  return Math.exp(-dt / (HAZE.decayBase + Math.max(0, trailLength) * HAZE.decayPerTrail));
}

export interface HazeTuning {
  readonly inertia: number;
  readonly trailLength: number;
  readonly turbulence: number;
  readonly drift: number;
  readonly radius: number;
}

function emit(s: HazeState, x: number, y: number, vx: number, vy: number, r: number): void {
  s.seq += 1;
  s.puffs.push({ x, y, vx, vy, amount: 1, r, seed: s.seq * 7.31 });
  if (s.puffs.length > HAZE.maxPuffs) s.puffs.splice(0, s.puffs.length - HAZE.maxPuffs);
}

/** 推进一帧. inside 为指针是否在区域内; scale 是每 CSS 像素的设备像素. */
export function stepHaze(s: HazeState, tx: number, ty: number, inside: boolean, dt: number, o: HazeTuning, scale: number): void {
  if (!s.placed) {
    s.head.x = s.lastX = tx;
    s.head.y = s.lastY = ty;
    s.placed = true;
  }
  const goal = inside ? 1 : 0;
  s.presence += (goal - s.presence) * follow(dt, goal > s.presence ? HAZE.presenceIn : HAZE.presenceOut);
  if (s.intro < 1) s.intro = Math.min(1, s.intro + dt / HAZE.introS);
  s.clock += dt;
  const { stiffness, damping } = hazeSpring(o.inertia);
  integrate(s.head, tx, ty, stiffness, damping, dt, SUBSTEP_S);
  const gap = HAZE.puffGap * scale;
  let dist = Math.hypot(s.head.x - s.lastX, s.head.y - s.lastY);
  while (dist >= gap && s.presence > 0.01) {
    const k = gap / dist;
    s.lastX += (s.head.x - s.lastX) * k;
    s.lastY += (s.head.y - s.lastY) * k;
    emit(s, s.lastX, s.lastY, s.head.vx * 0.15, s.head.vy * 0.15, o.radius);
    dist -= gap;
  }
  const keep = hazeDecay(dt, o.trailLength);
  const drag = Math.exp(-dt * HAZE.dragRate);
  const lift = o.drift * HAZE.driftPx * scale * dt;
  const swirl = o.turbulence * HAZE.turbulencePx * scale;
  for (const p of s.puffs) {
    p.amount *= keep;
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx * dt + noise1(p.seed + s.clock * 1.3) * swirl * dt;
    p.y += p.vy * dt - lift + noise1(p.seed + 50 + s.clock * 1.1) * swirl * dt;
  }
  s.puffs = s.puffs.filter((p) => p.amount > 0.02);
}

/** 点击喷一圈烟团. */
export function puffHaze(s: HazeState, count: number, radius: number, scale: number): void {
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    emit(s, s.head.x, s.head.y, Math.cos(a) * 260 * scale, Math.sin(a) * 260 * scale, radius * 0.7);
  }
}

/** 烟团当前半径: 浓度越低越大, 最多 2.2 倍. */
export function puffRadius(p: Pick<Puff, "r" | "amount">): number {
  return p.r * (1 + (HAZE.puffGrow - 1) * (1 - p.amount));
}
