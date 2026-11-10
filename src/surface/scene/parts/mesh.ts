// 行为规格参照 docs/research/catalog/animations.md 的 ElasticMesh 条目, 实现为 HX 自有.
/**
 * SpringMesh 的 JS 侧: 抓取点 (按下处) 与拉伸位移 D 的阻尼弹簧, 按压凹陷 dent 的阻尼弹簧, 入场的欠阻尼阶跃响应.
 * 坐标以宿主短边为单位, 原点在中心, y 朝上.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { MESH } from "../tokens";

export interface MeshState {
  ax: number;
  ay: number;
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  dent: number;
  dentV: number;
  grabbing: boolean;
}

export function makeMesh(): MeshState {
  return { ax: 0, ay: 0, dx: 0, dy: 0, vx: 0, vy: 0, dent: 0, dentV: 0, grabbing: false };
}

export interface MeshTuning {
  readonly stiffness: number;
  readonly wobble: number;
  readonly stretch: number;
  readonly press: number;
}

/** 欠阻尼阶跃响应 (规格入场 omega 15, zeta 0.38): 0 起, 过冲后落到 1. */
export function springStep(t: number, omega: number = MESH.omega, zeta: number = MESH.zeta): number {
  if (t <= 0) return 0;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t));
}

/** 回弹弹簧的角频率与阻尼比. */
export function meshSpring(t: MeshTuning): { omega: number; zeta: number } {
  const firm = MESH.firmBase + Math.min(1, Math.max(0, t.stiffness)) * MESH.firmGain;
  return { omega: MESH.omega * firm, zeta: Math.max(0.05, MESH.dampHi - MESH.dampSpan * Math.min(1, Math.max(0, t.wobble))) };
}

/**
 * 推进一帧. pointer 为短边单位坐标; down 为按住; within 为按下时是否落在形状框内.
 * 按住时 D 跟着指针 (钳 stretch x maxStretch), 凹陷趋向 press x dentMax; 松手后两者按弹簧回 0 并过冲.
 */
export function stepMesh(s: MeshState, dt: number, pointer: { x: number; y: number; down: boolean; within: boolean }, t: MeshTuning): MeshState {
  const step = Math.min(1 / 30, Math.max(0, dt));
  if (step <= 0) return s;
  if (pointer.down && !s.grabbing && pointer.within) {
    s.grabbing = true;
    s.ax = pointer.x - s.dx;
    s.ay = pointer.y - s.dy;
  }
  if (!pointer.down) s.grabbing = false;
  const { omega, zeta } = meshSpring(t);
  const k = omega * omega;
  const c = 2 * zeta * omega;
  const sub = Math.max(1, Math.ceil(step * 240));
  const h = step / sub;
  const cap = Math.max(0, t.stretch) * MESH.maxStretch * 2;
  for (let i = 0; i < sub; i += 1) {
    if (s.grabbing) {
      let gx = pointer.x - s.ax;
      let gy = pointer.y - s.ay;
      const len = Math.hypot(gx, gy);
      if (len > cap) {
        gx = len > 0 ? (gx / len) * cap : 0;
        gy = len > 0 ? (gy / len) * cap : 0;
      }
      s.vx = (gx - s.dx) / h;
      s.vy = (gy - s.dy) / h;
      s.dx = gx;
      s.dy = gy;
    } else {
      s.vx += (-k * s.dx - c * s.vx) * h;
      s.vy += (-k * s.dy - c * s.vy) * h;
      s.dx += s.vx * h;
      s.dy += s.vy * h;
    }
    const goal = s.grabbing ? Math.max(0, t.press) * MESH.dentMax : 0;
    s.dentV += (k * (goal - s.dent) - c * s.dentV) * h;
    s.dent = Math.min(MESH.dentMax, Math.max(MESH.dentMin, s.dent + s.dentV * h));
  }
  if (s.grabbing) {
    s.vx = Math.max(-20, Math.min(20, s.vx));
    s.vy = Math.max(-20, Math.min(20, s.vy));
  }
  return s;
}
