// 行为规格参照 docs/research/catalog/animations.md 的 Cubes 条目, 实现为 HX 自有.
/**
 * CubeField 的 JS 侧模拟: 平滑光标 (位置, 速度, 在场权重), 每块方块绕 x / y 的倾角弹簧, 光标扫过的角动量, 点击涟漪的踢动与发亮.
 * 坐标以格为单位, 原点在网格中心, y 朝上; 角度为度.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { CUBE } from "../tokens";

export interface CubeRipple {
  readonly x: number;
  readonly y: number;
  readonly at: number;
}

export interface CubeState {
  n: number;
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  weight: number;
  placed: boolean;
  /** 每块: 倾角 ax / ay, 角速度 wx / wy, 发亮 glow. */
  ax: Float32Array;
  ay: Float32Array;
  wx: Float32Array;
  wy: Float32Array;
  glow: Float32Array;
  ripples: CubeRipple[];
  seen: Set<number>;
  intro: number;
}

export function cubeGrid(gridSize: number): number {
  return Math.max(1, Math.min(CUBE.maxGrid, Math.round(gridSize)));
}

export function makeCubes(gridSize: number): CubeState {
  const n = cubeGrid(gridSize);
  const count = n * n;
  return {
    n, cx: 0, cy: 0, vx: 0, vy: 0, weight: 0, placed: false,
    ax: new Float32Array(count), ay: new Float32Array(count), wx: new Float32Array(count), wy: new Float32Array(count), glow: new Float32Array(count),
    ripples: [], seen: new Set(), intro: 0,
  };
}

/** 第 i 块方块中心 (格). */
export function cubeCenter(n: number, i: number): { x: number; y: number } {
  return { x: (i % n) - (n - 1) / 2, y: (n - 1) / 2 - Math.floor(i / n) };
}

export interface CubeInput {
  /** 光标 (格), 不在场时为 null. */
  readonly pointer: { x: number; y: number } | null;
  readonly taps: readonly CubeRipple[];
}

export interface CubeTuning {
  readonly maxAngle: number;
  readonly radius: number;
  readonly speed: number;
  readonly bounce: number;
  readonly brush: number;
  readonly autoAnimate: boolean;
  readonly rippleOnClick: boolean;
  readonly rippleSpeed: number;
}

/** 推进一帧. now 为内核 elapsed (秒). */
export function stepCubes(s: CubeState, dt: number, now: number, input: CubeInput, t: CubeTuning): CubeState {
  const step = Math.min(CUBE.maxDt, Math.max(0, dt));
  if (step <= 0) return s;
  s.intro += step;
  const roam = !input.pointer && t.autoAnimate;
  const half = s.n / 2;
  const goal = input.pointer ?? (roam ? { x: half * 0.8 * Math.sin(now * CUBE.wander.fx * Math.PI * 2), y: half * 0.8 * Math.sin(now * CUBE.wander.fy * Math.PI * 2 + 1) } : null);
  const engaged = goal !== null;
  const prevX = s.cx;
  const prevY = s.cy;
  if (goal) {
    if (!s.placed) {
      s.cx = goal.x;
      s.cy = goal.y;
      s.placed = true;
    }
    const follow = 1 - Math.exp(-step * CUBE.follow);
    s.cx += (goal.x - s.cx) * follow;
    s.cy += (goal.y - s.cy) * follow;
  }
  const blend = 1 - Math.exp(-step * CUBE.velocityBlend);
  s.vx += ((s.cx - prevX) / Math.max(step, 0.001) - s.vx) * blend;
  s.vy += ((s.cy - prevY) / Math.max(step, 0.001) - s.vy) * blend;
  const target = engaged ? (roam ? CUBE.wander.weight : 1) : 0;
  s.weight += (target - s.weight) * (1 - Math.exp(-step * (engaged ? CUBE.attack : CUBE.release)));
  if (t.rippleOnClick) {
    for (const tap of input.taps) {
      if (s.seen.has(tap.at)) continue;
      s.seen.add(tap.at);
      s.ripples.push(tap);
    }
  }
  const travel = CUBE.rippleCells * t.rippleSpeed;
  const k = CUBE.stiffness * t.speed * t.speed;
  const c = 2 * (1 - CUBE.bounceDamp * t.bounce) * Math.sqrt(k);
  const fade = Math.exp(-step * CUBE.glowFade);
  const reachCells = Math.max(0.5, t.radius * t.brush);
  const sweep = Math.hypot(s.vx, s.vy) * CUBE.sweepNorm;
  for (let i = 0; i < s.n * s.n; i += 1) {
    const { x, y } = cubeCenter(s.n, i);
    const dx = s.cx - x;
    const dy = s.cy - y;
    const dist = Math.hypot(dx, dy);
    const falloff = Math.max(0, 1 - dist / reachCells) ** 2 * s.weight;
    const ux = dist > 1e-4 ? dx / dist : 0;
    const uy = dist > 1e-4 ? dy / dist : 0;
    const tx = -uy * t.maxAngle * falloff;
    const ty = ux * t.maxAngle * falloff;
    s.wx[i] = (s.wx[i] ?? 0) - s.vy * sweep * falloff * step * CUBE.sweepGain;
    s.wy[i] = (s.wy[i] ?? 0) + s.vx * sweep * falloff * step * CUBE.sweepGain;
    for (const r of s.ripples) {
      const reach = (now - r.at) * travel;
      const d = Math.hypot(x - r.x, y - r.y);
      if (d > reach || d <= reach - travel * step || reach < 0.0001) continue;
      const rx = d > 1e-4 ? (x - r.x) / d : 0;
      const ry = d > 1e-4 ? (y - r.y) / d : 0;
      s.wx[i] = (s.wx[i] ?? 0) - ry * CUBE.rippleKick;
      s.wy[i] = (s.wy[i] ?? 0) + rx * CUBE.rippleKick;
      s.glow[i] = 1;
    }
    const ax = s.ax[i] ?? 0;
    const ay = s.ay[i] ?? 0;
    s.wx[i] = (s.wx[i] ?? 0) + (k * (tx - ax) - c * (s.wx[i] ?? 0)) * step;
    s.wy[i] = (s.wy[i] ?? 0) + (k * (ty - ay) - c * (s.wy[i] ?? 0)) * step;
    s.ax[i] = Math.max(-89, Math.min(89, ax + (s.wx[i] ?? 0) * step));
    s.ay[i] = Math.max(-89, Math.min(89, ay + (s.wy[i] ?? 0) * step));
    s.glow[i] = (s.glow[i] ?? 0) * fade;
  }
  const diag = Math.SQRT2 * s.n;
  s.ripples = s.ripples.filter((r) => (now - r.at) * travel < diag);
  for (const at of s.seen) if (!s.ripples.some((r) => r.at === at) && now - at > diag / Math.max(travel, 1e-3) + 1) s.seen.delete(at);
  return s;
}

/** 入场: 由中心向外, 每块的缩放 0..1. */
export function cubeIntro(clock: number, x: number, y: number, n: number): number {
  const order = Math.hypot(x, y) / Math.max(1, (n / 2) * Math.SQRT2);
  const t = Math.min(1, Math.max(0, (clock / CUBE.introSeconds) * 1.6 - order * 0.6));
  return t * t * (3 - 2 * t);
}

/** 打包成 vec4[n x n]: 倾角 x / y (弧度), 发亮, 入场缩放. */
export function packCubes(s: CubeState, intro: boolean): Float32Array {
  const out = new Float32Array(CUBE.maxGrid * CUBE.maxGrid * 4);
  const rad = Math.PI / 180;
  for (let i = 0; i < s.n * s.n; i += 1) {
    const { x, y } = cubeCenter(s.n, i);
    out.set([(s.ax[i] ?? 0) * rad, (s.ay[i] ?? 0) * rad, s.glow[i] ?? 0, intro ? cubeIntro(s.intro, x, y, s.n) : 1], i * 4);
  }
  return out;
}
