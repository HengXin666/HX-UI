/**
 * OrbitViewer 的规格常数与转台状态: 拖拽转速, 惯性, 自转, 转台俯仰, 缩放, 指针视差, 双击复位, 入场.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stage3d.md
 */
import { clamp, decayToward } from "../tokens";

/** 视场 30 度, 入场 1.3s, 拖拽 0.0065 rad/px (ModelViewer.jsx:10-12). */
export const ORBIT_FOV_DEG = 30;
export const ORBIT_INTRO_S = 1.3;
export const ORBIT_DRAG_SPEED = 0.0065;
/** 各趋近速率 1/s: 复位 7, 惯性衰减 4.5, 转台俯仰 4, 自转速度 2, 缩放 8, 指针视差 6 (ModelViewer.jsx:272-290). */
export const ORBIT_RATES = { reset: 7, inertia: 4.5, turntable: 4, spin: 2, zoom: 8, tilt: 6 } as const;
/** 单帧上限 0.05s (规格同). 俯仰上限 1.2 rad, 指针视差最大 0.08 rad, 滚轮每 100 单位缩放 10% (规格 PITCH_LIMIT 未摘录数值, 以上 HX 自定). */
export const ORBIT_MAX_DT = 0.05;
export const ORBIT_PITCH_LIMIT = 1.2;
export const ORBIT_PARALLAX = 0.08;
export const ORBIT_WHEEL_STEP = 0.001;
/** 入场淡入 0.6s ease (ModelViewer.jsx:466). */
export const ORBIT_FADE_MS = 600;

export interface OrbitState {
  yaw: number;
  pitch: number;
  vyaw: number;
  vpitch: number;
  spin: number;
  zoom: number;
  zoomGoal: number;
  tiltX: number;
  tiltY: number;
  tiltGoalX: number;
  tiltGoalY: number;
  intro: number;
  resetting: boolean;
  dragging: boolean;
}

export interface OrbitOptions {
  readonly autoRotate: boolean;
  readonly autoRotateSpeed: number;
  readonly turntable: boolean;
  readonly tiltDeg: number;
  readonly initialYaw: number;
  readonly initialPitch: number;
  readonly reduced: boolean;
}

export function createOrbit(o: OrbitOptions, intro: boolean): OrbitState {
  return { yaw: o.initialYaw, pitch: o.initialPitch, vyaw: 0, vpitch: 0, spin: 0, zoom: 1, zoomGoal: 1, tiltX: 0, tiltY: 0, tiltGoalX: 0, tiltGoalY: 0, intro: intro && !o.reduced ? 0 : 1, resetting: false, dragging: false };
}

/** 视场换 CSS perspective: 半高 / tan(半视场). */
export function orbitPerspective(height: number, fovDeg: number = ORBIT_FOV_DEG): number {
  return height / 2 / Math.tan(((fovDeg / 2) * Math.PI) / 180);
}

export function clampPitch(p: number): number {
  return clamp(p, 0 - ORBIT_PITCH_LIMIT, ORBIT_PITCH_LIMIT);
}

/** 拖拽 dx, dy px: 立即转, 并记下角速度 (rad/s) 给松手后的惯性. */
export function orbitDrag(s: OrbitState, dx: number, dy: number, dtS: number): void {
  const ay = dx * ORBIT_DRAG_SPEED;
  const ap = dy * ORBIT_DRAG_SPEED;
  s.yaw += ay;
  s.pitch = clampPitch(s.pitch + ap);
  const dt = Math.max(dtS, 1 / 240);
  s.vyaw = ay / dt;
  s.vpitch = ap / dt;
  s.resetting = false;
}

/** 推进一帧. 返回是否还在动. */
export function stepOrbit(s: OrbitState, o: OrbitOptions, dtIn: number): boolean {
  const dt = Math.min(Math.max(0, dtIn), ORBIT_MAX_DT);
  if (s.intro < 1) s.intro = o.reduced ? 1 : Math.min(1, s.intro + dt / ORBIT_INTRO_S);
  const before = s.yaw + s.pitch * 7 + s.zoom * 13 + s.tiltX * 17 + s.tiltY * 19;
  if (s.resetting) {
    s.vyaw = 0;
    s.vpitch = 0;
    s.yaw = decayToward(s.yaw, o.initialYaw, ORBIT_RATES.reset, dt);
    s.pitch = decayToward(s.pitch, o.initialPitch, ORBIT_RATES.reset, dt);
    s.zoomGoal = 1;
    if (s.yaw === o.initialYaw && s.pitch === o.initialPitch) s.resetting = false;
  } else if (!s.dragging) {
    const k = Math.exp(0 - dt * ORBIT_RATES.inertia);
    s.vyaw = o.reduced ? 0 : s.vyaw * k;
    s.vpitch = o.reduced ? 0 : s.vpitch * k;
    if (Math.abs(s.vyaw) < 1e-3) s.vyaw = 0;
    if (Math.abs(s.vpitch) < 1e-3) s.vpitch = 0;
    s.yaw += s.vyaw * dt;
    s.pitch = clampPitch(s.pitch + s.vpitch * dt);
    if (o.turntable) s.pitch = decayToward(s.pitch, (o.tiltDeg * Math.PI) / 180, ORBIT_RATES.turntable, dt);
  }
  const spinning = o.autoRotate && !o.reduced && !s.dragging && !s.resetting;
  s.spin = decayToward(s.spin, spinning ? o.autoRotateSpeed : 0, ORBIT_RATES.spin, dt);
  s.yaw += s.spin * dt;
  s.zoom = o.reduced ? s.zoomGoal : decayToward(s.zoom, s.zoomGoal, ORBIT_RATES.zoom, dt);
  s.tiltX = o.reduced ? 0 : decayToward(s.tiltX, s.tiltGoalX, ORBIT_RATES.tilt, dt);
  s.tiltY = o.reduced ? 0 : decayToward(s.tiltY, s.tiltGoalY, ORBIT_RATES.tilt, dt);
  const after = s.yaw + s.pitch * 7 + s.zoom * 13 + s.tiltX * 17 + s.tiltY * 19;
  return s.intro < 1 || s.spin !== 0 || s.vyaw !== 0 || s.vpitch !== 0 || s.resetting || Math.abs(after - before) > 1e-6;
}

/** 舞台变换串 (弧度换度). */
export function orbitTransform(s: OrbitState): string {
  const deg = (r: number): string => ((r * 180) / Math.PI).toFixed(2);
  return `scale(${s.zoom.toFixed(4)}) rotateX(${deg(0 - s.pitch - s.tiltY)}deg) rotateY(${deg(s.yaw + s.tiltX)}deg)`;
}
