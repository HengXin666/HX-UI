// 行为规格参照 docs/research/catalog/animations.md 的 CursorGrid 条目, 实现为 HX 自有.
/**
 * NudgeGrid 的模拟: 每格一个亮度, 指针附近按衰减曲线点亮 (起亮 tau 0.045), 离开后保持 holdTime 再按 fadeDuration 线性熄灭;
 * 点击放一圈按 pulseSpeed 扩散的波, 波经过的格被点亮; 可选环境随机闪格. 坐标与长度都是设备像素; 不碰画布.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import { NUDGE } from "../tokens";
import { clamp, follow } from "./common";

export type NudgeFalloff = "smooth" | "linear" | "sharp";
export type NudgeHighlight = "area" | "cell";

export interface NudgeState {
  cols: number;
  rows: number;
  cell: number;
  level: Float32Array;
  hold: Float32Array;
  x: number;
  y: number;
  presence: number;
  intro: number;
  pulses: { x: number; y: number; age: number }[];
  placed: boolean;
}

export function makeNudge(intro: boolean): NudgeState {
  return { cols: 0, rows: 0, cell: 0, level: new Float32Array(0), hold: new Float32Array(0), x: 0, y: 0, presence: 0, intro: intro ? 0 : 1, pulses: [], placed: false };
}

/** 衰减曲线, t 为 1 - 距离 / 半径. */
export function nudgeEase(falloff: NudgeFalloff, t: number): number {
  const v = clamp(t, 0, 1);
  if (falloff === "linear") return v;
  if (falloff === "sharp") return v * v * v;
  return v * v * (3 - 2 * v);
}

/** 格数随画布与格宽变化时重建数组. */
export function fitNudge(s: NudgeState, width: number, height: number, cell: number): void {
  const cols = cell > 0 ? Math.ceil(width / cell) : 0;
  const rows = cell > 0 ? Math.ceil(height / cell) : 0;
  if (cols === s.cols && rows === s.rows && cell === s.cell) return;
  s.cols = cols;
  s.rows = rows;
  s.cell = cell;
  s.level = new Float32Array(cols * rows);
  s.hold = new Float32Array(cols * rows);
}

export interface NudgeTuning {
  readonly radius: number;
  readonly falloff: NudgeFalloff;
  readonly highlight: NudgeHighlight;
  readonly holdTime: number;
  readonly fadeDuration: number;
  readonly ambient: number;
  readonly pulseSpeed: number;
  /** 波最远走多远 (设备像素). */
  readonly pulseReach: number;
}

/** 推进一帧. radius, pulseSpeed, pulseReach 已换成设备像素. rand 用于环境闪格. */
export function stepNudge(s: NudgeState, px: number, py: number, inside: boolean, dt: number, o: NudgeTuning, rand: () => number): void {
  if (!s.placed) {
    s.x = px;
    s.y = py;
    s.placed = true;
  }
  if (s.intro < 1) s.intro = Math.min(1, s.intro + dt / NUDGE.introS);
  const k = follow(dt, NUDGE.followTau);
  s.x += (px - s.x) * k;
  s.y += (py - s.y) * k;
  s.presence += ((inside ? 1 : 0) - s.presence) * follow(dt, NUDGE.presenceTau);
  const attack = follow(dt, NUDGE.attackTau);
  const fadeStep = dt / Math.max(0.001, o.fadeDuration / 1000);
  const hc = Math.floor(s.x / Math.max(1, s.cell));
  const hr = Math.floor(s.y / Math.max(1, s.cell));
  for (const p of s.pulses) p.age += dt;
  s.pulses = s.pulses.filter((p) => p.age * o.pulseSpeed < o.pulseReach);
  for (let r = 0; r < s.rows; r += 1) {
    for (let c = 0; c < s.cols; c += 1) {
      const i = r * s.cols + c;
      const cx = (c + 0.5) * s.cell;
      const cy = (r + 0.5) * s.cell;
      let target = 0;
      if (o.highlight === "cell") target = c === hc && r === hr ? s.presence : 0;
      else target = nudgeEase(o.falloff, 1 - Math.hypot(cx - s.x, cy - s.y) / Math.max(1, o.radius)) * s.presence;
      for (const p of s.pulses) {
        const ring = p.age * o.pulseSpeed;
        const d = Math.abs(Math.hypot(cx - p.x, cy - p.y) - ring);
        if (d < s.cell * NUDGE.pulseWidthCells) target = Math.max(target, (1 - d / (s.cell * NUDGE.pulseWidthCells)) * (1 - ring / o.pulseReach));
      }
      if (target > 0.01 && target >= s.level[i]) {
        s.level[i] += (target - s.level[i]) * attack;
        s.hold[i] = o.holdTime;
      } else if (s.hold[i] > 0) s.hold[i] -= dt * 1000;
      else s.level[i] = Math.max(target, s.level[i] - fadeStep);
    }
  }
  const chance = o.ambient * dt * s.level.length * NUDGE.ambientRate;
  for (let n = chance; n > 0; n -= 1) {
    if (rand() >= Math.min(1, n)) continue;
    const i = Math.floor(rand() * s.level.length);
    if (i < s.level.length) {
      s.level[i] = Math.max(s.level[i], 0.6);
      s.hold[i] = o.holdTime;
    }
  }
}

/** 边缘渐隐: 格中心到画布边的距离在 edgeFade x 短边一半以内时线性压暗. */
export function edgeAlpha(cx: number, cy: number, width: number, height: number, edgeFade: number): number {
  const span = edgeFade * Math.min(width, height) * 0.5;
  if (span <= 0) return 1;
  const d = Math.min(cx, cy, width - cx, height - cy);
  return clamp(d / span, 0, 1);
}
