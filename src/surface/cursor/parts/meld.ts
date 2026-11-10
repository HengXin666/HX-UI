// 行为规格参照 docs/research/catalog/animations.md 的 BlobCursor 条目, 实现为 HX 自有.
/**
 * MeldCursor 的模拟: 头部弹簧跟手, 尾链逐点跟随, 质量随溅出损失并回长, 溅滴受重力飞散.
 * 坐标与长度都是设备像素; 不碰画布.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import { MELD, SUBSTEP_S } from "../tokens";
import { clamp, follow, integrate, mix, type Body } from "./common";

export interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  age: number;
}

export interface MeldState {
  head: Body;
  trail: { x: number; y: number }[];
  drops: Drop[];
  mass: number;
  wait: number;
  clock: number;
  placed: boolean;
}

export interface MeldTuning {
  readonly lag: number;
  readonly trail: number;
  readonly morphSpeed: number;
  readonly regrow: number;
  readonly splashGravity: number;
}

export function makeMeld(): MeldState {
  return { head: { x: 0, y: 0, vx: 0, vy: 0 }, trail: [], drops: [], mass: 1, wait: 0, clock: 0, placed: false };
}

/** 头部弹簧: 刚度 mix(600, 60, lag), 阻尼比 0.8. */
export function meldSpring(lag: number): { readonly stiffness: number; readonly damping: number } {
  const stiffness = mix(MELD.headStiffFast, MELD.headStiffSlow, clamp(lag, 0, 1));
  return { stiffness, damping: 2 * Math.sqrt(stiffness) * MELD.headDamping };
}

/** 质量回长一步: 等待期内不动, 之后按 mix(0.9, 6, regrow) 指数回到 1. */
export function regrowMass(mass: number, wait: number, dt: number, regrow: number): { readonly mass: number; readonly wait: number } {
  if (wait > 0) return { mass, wait: wait - dt };
  return { mass: mass + (1 - mass) * (1 - Math.exp(-dt * mix(MELD.regrowSlow, MELD.regrowFast, clamp(regrow, 0, 1)))), wait: 0 };
}

/** 一次溅出后剩下的质量: max(0.2, before - clamp(lost x 2.4, 0.25, 0.7)). */
export function massAfterSplash(before: number, lost: number): number {
  return Math.max(MELD.massFloor, before - clamp(lost * MELD.massLossScale, MELD.massLossMin, MELD.massLossMax));
}

/** 推进一帧. 目标在设备像素里; scale 是每 CSS 像素的设备像素. */
export function stepMeld(s: MeldState, tx: number, ty: number, dt: number, o: MeldTuning, scale: number): void {
  if (!s.placed) {
    s.head.x = tx;
    s.head.y = ty;
    s.placed = true;
  }
  const { stiffness, damping } = meldSpring(o.lag);
  integrate(s.head, tx, ty, stiffness, damping, dt, SUBSTEP_S);
  const n = clamp(Math.round(o.trail), 0, MELD.maxTrail);
  while (s.trail.length < n) s.trail.push({ x: s.head.x, y: s.head.y });
  s.trail.length = n;
  const k = follow(dt, MELD.tailTauBase + clamp(o.lag, 0, 1) * MELD.tailTauLag);
  let px = s.head.x;
  let py = s.head.y;
  for (const p of s.trail) {
    p.x += (px - p.x) * k;
    p.y += (py - p.y) * k;
    px = p.x;
    py = p.y;
  }
  s.clock += dt * MELD.morphRate * Math.max(0, o.morphSpeed) ** MELD.morphPower;
  const grown = regrowMass(s.mass, s.wait, dt, o.regrow);
  s.mass = grown.mass;
  s.wait = grown.wait;
  const g = MELD.dropGravity * o.splashGravity * scale;
  s.drops = s.drops.filter((d) => {
    d.age += dt;
    d.vy += g * dt;
    d.vx *= Math.exp(-dt * 3);
    d.vy *= Math.exp(-dt * 3);
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    return d.age < MELD.dropLifeS;
  });
}

/** 在头部溅出 count 滴, 质量按规格扣减并等待 0.28s 再回长. */
export function splashMeld(s: MeldState, count: number, speed: number, size: number, radius: number, scale: number, rand: () => number): void {
  const n = clamp(Math.round(count), 0, MELD.maxDrops);
  if (n === 0) return;
  const lost = (size * n) / (MELD.splashCount * 4);
  s.mass = massAfterSplash(s.mass, lost);
  s.wait = MELD.massWaitS;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.6;
    const v = MELD.dropSpeed * speed * scale * (0.6 + 0.4 * rand());
    s.drops.push({ x: s.head.x, y: s.head.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: radius * size * (0.25 + 0.2 * rand()), age: 0 });
  }
  if (s.drops.length > MELD.maxDrops) s.drops.splice(0, s.drops.length - MELD.maxDrops);
}
