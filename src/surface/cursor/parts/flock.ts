// 行为规格参照 docs/research/catalog/animations.md 的 SwarmCursor 条目, 实现为 HX 自有.
/**
 * FlockCursor 的模拟: 一群粒子各自绕锚点 (指针, 或闲时的漫游点) 的一个旋转家位打转, 被拉回, 被噪声推着游走,
 * 指针快移时被抓着一起走, 点击时向外炸开. 坐标与长度都是设备像素; 每帧分两个半步推进. 不碰画布.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import { FLOCK } from "../tokens";
import { clamp, noise1, seededRandom } from "./common";

/** 每个粒子 9 个槽: x, y, vx, vy, 家位角, 家位半径 0..1, 噪声相位, 深度 0..1, 旋转速率倍数. */
export const FLOCK_STRIDE = 9;

export interface FlockState {
  data: Float32Array;
  count: number;
  ax: number;
  ay: number;
  avx: number;
  avy: number;
  lastX: number;
  lastY: number;
  presence: number;
  intro: number;
  clock: number;
  placed: boolean;
}

export function makeFlock(count: number, depth: number, seed = 1, intro = true): FlockState {
  const n = clamp(Math.round(count), 0, FLOCK.maxParticles);
  const data = new Float32Array(n * FLOCK_STRIDE);
  const rand = seededRandom(seed);
  for (let i = 0; i < n; i += 1) {
    const o = i * FLOCK_STRIDE;
    data[o + 4] = rand() * Math.PI * 2;
    data[o + 5] = Math.sqrt(rand());
    data[o + 6] = rand() * 100;
    data[o + 7] = 1 - clamp(depth, 0, 1) * rand();
    data[o + 8] = 0.6 + 0.8 * rand();
  }
  return { data, count: n, ax: 0, ay: 0, avx: 0, avy: 0, lastX: 0, lastY: 0, presence: 0, intro: intro ? 0 : 1, clock: 0, placed: false };
}

/** 入场缓动: smoothstep(introClock). */
export function flockEase(intro: number): number {
  const t = clamp(intro, 0, 1);
  return t * t * (3 - 2 * t);
}

/** 抓取系数: (1 - exp(-dt x 20)) x clamp(moving / 240, 0, 1) x presence. moving 是 CSS px/s. */
export function flockGrab(dt: number, moving: number, presence: number): number {
  return (1 - Math.exp(-dt * FLOCK.grabRate)) * clamp(moving / FLOCK.movingFull, 0, 1) * presence;
}

export interface FlockTuning {
  readonly spread: number;
  readonly speed: number;
  readonly swirl: number;
  readonly wander: number;
}

function move(s: FlockState, dt: number, o: FlockTuning, ease: number, scale: number): void {
  const d = s.data;
  const fade = Math.exp(-dt / (FLOCK.swirlFadeBase + FLOCK.swirlFadeScale * o.swirl));
  const pull = FLOCK.pull * (0.2 + 0.8 * ease);
  const gather = FLOCK.gather * (0.2 + 0.8 * ease);
  const moving = Math.hypot(s.avx, s.avy) / Math.max(scale, 1e-6);
  const grab = flockGrab(dt, moving, s.presence);
  const reach = o.spread * scale * (0.25 + 0.75 * ease);
  const shove = o.wander * FLOCK.wanderForce * scale;
  for (let i = 0; i < s.count; i += 1) {
    const k = i * FLOCK_STRIDE;
    d[k + 4] += o.swirl * o.speed * d[k + 8] * (1.5 / (0.5 + d[k + 5])) * dt;
    const tx = s.ax + Math.cos(d[k + 4]) * d[k + 5] * reach;
    const ty = s.ay + Math.sin(d[k + 4]) * d[k + 5] * reach;
    let vx = d[k + 2] + ((tx - d[k]) * pull + noise1(d[k + 6] + s.clock) * shove) * dt;
    let vy = d[k + 3] + ((ty - d[k + 1]) * pull + noise1(d[k + 6] + 40 + s.clock) * shove) * dt;
    vx += (s.ax - d[k]) * gather * dt * 0.1;
    vy += (s.ay - d[k + 1]) * gather * dt * 0.1;
    vx = (vx + (s.avx - vx) * grab) * fade;
    vy = (vy + (s.avy - vy) * grab) * fade;
    d[k + 2] = vx;
    d[k + 3] = vy;
    d[k] += vx * dt;
    d[k + 1] += vy * dt;
  }
}

/**
 * 推进一帧. 指针在区域里时锚点就是指针; 否则 roam 时锚点沿 9s / 7s 的利萨如曲线漫游, still 时原地.
 *
 * @param w 画布宽 (设备像素), 漫游用.
 */
export function stepFlock(s: FlockState, px: number, py: number, inside: boolean, idle: "roam" | "still", w: number, h: number, dt: number, o: FlockTuning, scale: number): void {
  s.clock += dt * o.speed;
  if (s.intro < 1) s.intro = Math.min(1, s.intro + dt / FLOCK.introS);
  s.presence += ((inside ? 1 : 0) - s.presence) * (1 - Math.exp(-dt / FLOCK.presenceTau));
  let gx = px;
  let gy = py;
  if (!inside && idle === "roam") {
    gx = w * (0.5 + 0.3 * Math.sin((s.clock * Math.PI * 2) / FLOCK.roamPeriodX));
    gy = h * (0.5 + 0.3 * Math.sin((s.clock * Math.PI * 2) / FLOCK.roamPeriodY));
  } else if (!inside) {
    gx = s.ax;
    gy = s.ay;
  }
  if (!s.placed) {
    s.ax = s.lastX = gx;
    s.ay = s.lastY = gy;
    for (let i = 0; i < s.count; i += 1) {
      s.data[i * FLOCK_STRIDE] = gx;
      s.data[i * FLOCK_STRIDE + 1] = gy;
    }
    s.placed = true;
  }
  s.ax = gx;
  s.ay = gy;
  if (dt > 0) {
    const cap = FLOCK.speedCap * scale;
    const mx = clamp((s.ax - s.lastX) / dt, -cap, cap);
    const my = clamp((s.ay - s.lastY) / dt, -cap, cap);
    const blend = 1 - Math.exp(-dt * FLOCK.speedBlend);
    s.avx += (mx - s.avx) * blend;
    s.avy += (my - s.avy) * blend;
  }
  s.lastX = s.ax;
  s.lastY = s.ay;
  const ease = flockEase(s.intro);
  move(s, dt / 2, o, ease, scale);
  move(s, dt / 2, o, ease, scale);
}

/** 点击处向外炸开: 冲量 900 px/s 随距离 (以 spread 为尺) 衰减. */
export function burstFlock(s: FlockState, x: number, y: number, spread: number, scale: number): void {
  const reach = Math.max(1, spread * scale * 2);
  for (let i = 0; i < s.count; i += 1) {
    const k = i * FLOCK_STRIDE;
    const dx = s.data[k] - x;
    const dy = s.data[k + 1] - y;
    const dist = Math.hypot(dx, dy) || 1;
    const push = FLOCK.burstImpulse * scale * Math.max(0, 1 - dist / reach);
    s.data[k + 2] += (dx / dist) * push;
    s.data[k + 3] += (dy / dist) * push;
  }
}
