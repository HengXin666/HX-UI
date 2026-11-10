// 行为规格参照 docs/research/catalog/animations.md 的 MetaBalls 条目, 实现为 HX 自有.
/**
 * MergeBlobs 的模拟: 球沿各自的轨道回弹, 球间近推远吸 (等值面因此粘连), 光标球同样推吸, 点击向外冲开.
 * 世界单位: 画布短边 = animationSize 单位, 原点在中心, y 朝上. 纯函数, 不碰 GL.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { MERGE } from "../tokens";

export type MergeMotion = "orbit" | "drift" | "still";

export interface MergeBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly r: number;
  readonly delay: number;
  readonly fx: number;
  readonly fy: number;
  readonly px: number;
  readonly py: number;
}

export interface MergeState {
  balls: MergeBall[];
  cursor: { x: number; y: number; vx: number; vy: number; power: number; placed: boolean };
  seenTap: number;
}

function hash(i: number, k: number): number {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** 缓入缓出 (立方). */
export function mergeEase(t: number): number {
  const v = Math.min(1, Math.max(0, t));
  return v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2;
}

export function smooth(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** gooeyness 到等值面参数: gamma, 阈值 1.3^gamma, 影响范围 2^(0.5 / gamma). */
export function mergeLook(gooeyness: number): { gamma: number; threshold: number; reach: number } {
  const g = Math.min(1, Math.max(0, gooeyness));
  const gamma = MERGE.gammaHard + (MERGE.gammaSoft - MERGE.gammaHard) * g;
  return { gamma, threshold: MERGE.thresholdBase ** gamma, reach: 2 ** (0.5 / gamma) };
}

/** 建 count 个球 (上限 50), 半径与轨道频率相位按序号哈希, 结果可复现. */
export function makeMerge(count: number): MergeState {
  const n = Math.max(0, Math.min(MERGE.maxBalls, Math.round(count)));
  const balls = Array.from({ length: n }, (_, i): MergeBall => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    r: MERGE.radiusMin + (MERGE.radiusMax - MERGE.radiusMin) * hash(i, 1),
    delay: MERGE.introDelay + hash(i, 2) * MERGE.introSpread,
    fx: 0.4 + hash(i, 3) * 0.9,
    fy: 0.4 + hash(i, 4) * 0.9,
    px: hash(i, 5) * Math.PI * 2,
    py: hash(i, 6) * Math.PI * 2,
  }));
  return { balls, cursor: { x: 0, y: 0, vx: 0, vy: 0, power: 0, placed: false }, seenTap: -1 };
}

/** 球的归位点: orbit 绕中心的利萨如轨道, drift 慢得多的同一轨道, still 不动的轨道起点. */
export function mergeHome(b: MergeBall, time: number, motion: MergeMotion, amp: number): readonly [number, number] {
  const t = motion === "still" ? 0 : motion === "drift" ? time * 0.25 : time;
  return [Math.sin(t * b.fx + b.px) * amp, Math.cos(t * b.fy + b.py) * amp];
}

export interface MergeTuning {
  readonly speed: number;
  readonly motion: MergeMotion;
  readonly animationSize: number;
  readonly clumpFactor: number;
  readonly stickiness: number;
  readonly hoverSmoothness: number;
  readonly cursorBallSize: number;
  readonly interactive: boolean;
  readonly clickBurst: boolean;
  readonly intro: boolean;
}

/** 两球之间的力 (沿 p 指向 q 为正): 贴近推开, 窗内吸引, 窗外为 0. */
export function pairForce(distance: number, rp: number, rq: number, pull: number, repel: number = MERGE.repel): number {
  const core = MERGE.coreRatio * (rp + rq);
  const range = MERGE.rangeRatio * (rp + rq);
  if (distance < core) return -repel * (core - distance);
  if (distance >= range) return 0;
  const t = (distance - core) / (range - core);
  return pull * Math.min(rp, rq) * smooth(0, 0.6, t) * (1 - smooth(0.82, 1, t));
}

/**
 * 推进一帧.
 *
 * @param s 原地推进的状态.
 * @param dt 帧长 (秒).
 * @param time 场时钟 (秒, 已乘 speed 之外的内核倍率).
 * @param elapsed 出帧以来的真实秒数, 入场用.
 * @param pointer 指针世界坐标与是否在场; taps 为本帧新点击的世界坐标.
 */
export function stepMerge(s: MergeState, dt: number, time: number, elapsed: number, o: MergeTuning, pointer: { x: number; y: number; inside: boolean }, taps: readonly { x: number; y: number; at: number }[]): void {
  const amp = MERGE.orbitRatio * o.animationSize * o.clumpFactor;
  const pull = MERGE.pullScale * Math.max(0, o.stickiness);
  const t = time * o.speed;
  for (const b of s.balls) {
    const [hx, hy] = mergeHome(b, t, o.motion, amp);
    const release = !o.intro || !Number.isFinite(elapsed) ? 1 : mergeEase((elapsed - b.delay) / MERGE.introS);
    b.vx += ((hx - b.x) * MERGE.homeSpring - b.vx * MERGE.homeDamping) * dt * release;
    b.vy += ((hy - b.y) * MERGE.homeSpring - b.vy * MERGE.homeDamping) * dt * release;
  }
  for (let i = 0; i < s.balls.length; i += 1) {
    for (let j = i + 1; j < s.balls.length; j += 1) {
      const p = s.balls[i];
      const q = s.balls[j];
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const d = Math.max(1e-4, Math.hypot(dx, dy));
      const f = pairForce(d, p.r, q.r, pull);
      const nx = dx / d;
      const ny = dy / d;
      p.vx += ((nx * f) / (p.r * p.r)) * dt;
      p.vy += ((ny * f) / (p.r * p.r)) * dt;
      q.vx -= ((nx * f) / (q.r * q.r)) * dt;
      q.vy -= ((ny * f) / (q.r * q.r)) * dt;
    }
  }
  const c = s.cursor;
  const engaged = o.interactive && pointer.inside;
  if (!c.placed || !engaged) {
    c.x = pointer.x;
    c.y = pointer.y;
    c.placed = true;
  }
  const follow = 1 - (1 - Math.min(1, Math.max(0.001, o.hoverSmoothness))) ** (dt * 60);
  const nx = c.x + (pointer.x - c.x) * follow;
  const ny = c.y + (pointer.y - c.y) * follow;
  const blend = 1 - Math.exp(-dt / MERGE.cursorVelocityTau);
  c.vx += ((nx - c.x) / Math.max(dt, 1e-4) - c.vx) * blend;
  c.vy += ((ny - c.y) / Math.max(dt, 1e-4) - c.vy) * blend;
  c.x = nx;
  c.y = ny;
  c.power += ((engaged ? 1 : 0) - c.power) * (1 - Math.exp(-dt / 0.2));
  if (c.power > 0.01) {
    const rc = o.cursorBallSize * c.power;
    for (const p of s.balls) {
      const dx = c.x - p.x;
      const dy = c.y - p.y;
      const d = Math.max(1e-4, Math.hypot(dx, dy));
      const f = pairForce(d, p.r, rc, pull * MERGE.cursorPull, MERGE.cursorRepel);
      p.vx += ((dx / d) * f) / (p.r * p.r + 0.05) * dt;
      p.vy += ((dy / d) * f) / (p.r * p.r + 0.05) * dt;
    }
  }
  for (const tap of taps) {
    if (tap.at <= s.seenTap) continue;
    s.seenTap = tap.at;
    if (!o.clickBurst) continue;
    for (const p of s.balls) {
      const dx = p.x - tap.x;
      const dy = p.y - tap.y;
      const d = Math.max(1e-4, Math.hypot(dx, dy));
      const k = Math.max(0, 1 - d / MERGE.burstReach);
      p.vx += (dx / d) * MERGE.burst * k;
      p.vy += (dy / d) * MERGE.burst * k;
    }
  }
  for (const b of s.balls) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
}

/** 直接把球放到归位点 (静态帧用). */
export function settleMerge(s: MergeState, time: number, o: Pick<MergeTuning, "speed" | "motion" | "animationSize" | "clumpFactor">): void {
  const amp = MERGE.orbitRatio * o.animationSize * o.clumpFactor;
  for (const b of s.balls) {
    const [x, y] = mergeHome(b, time * o.speed, o.motion, amp);
    b.x = x;
    b.y = y;
    b.vx = 0;
    b.vy = 0;
  }
}

/**
 * 打包: 球 (x, y, r, 光标色占比) 与形变 (速度方向 x 拉伸量, 晃动相位). 光标球在最后一格, 不在场时半径为 0.
 * 晃动让半径按 1 + 0.1 x wobble x sin(3t + 相位) 起伏.
 */
export function packMerge(s: MergeState, o: { cursorBallSize: number; stretch: number; wobble: number }, time: number): { balls: Float32Array; shapes: Float32Array; count: number } {
  const balls = new Float32Array(MERGE.maxBalls * 4);
  const shapes = new Float32Array(MERGE.maxBalls * 4);
  const list = s.balls.slice(0, MERGE.maxBalls - 1);
  list.forEach((b, i) => {
    const sp = Math.hypot(b.vx, b.vy);
    const stretch = Math.min(1.5, (sp / 12) * o.stretch);
    const wob = 1 + 0.1 * o.wobble * Math.sin(time * 3 + b.px);
    balls.set([b.x, b.y, b.r * wob, 0], i * 4);
    shapes.set([sp > 1e-4 ? b.vx / sp : 1, sp > 1e-4 ? b.vy / sp : 0, stretch, 0], i * 4);
  });
  const c = s.cursor;
  const k = list.length;
  balls.set([c.x, c.y, o.cursorBallSize * c.power, 1], k * 4);
  shapes.set([1, 0, 0, 0], k * 4);
  return { balls, shapes, count: k + 1 };
}
