// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LiquidEther 条目, 实现为 HX 自有.
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";

/** 自动演示的爬升时间 (秒). */
export const ETHER_AUTO_RAMP_SECONDS = 0.8;
/** 自动演示相位速率倍率. */
export const ETHER_AUTO_PHASE_RATE = 1.6;
/** 入场扫一笔的时长 (秒). */
export const ETHER_INTRO_SECONDS = 1.4;
/** mouseForce 的参考值, 力按 mouseForce / 20 缩放. */
export const ETHER_FORCE_REF = 20;
/** 点击外推的基础速度 (CSS 像素每秒). */
export const ETHER_BURST_PUSH = 1400;
/** 指针速度封顶 (归一化坐标每秒), 对应规格的 6000 像素每秒量级. */
export const ETHER_SPEED_CAP = 6;
/** 指针处速度向指针速度靠拢的份额上限. */
export const ETHER_SPLAT_BLEND = 0.6;
/** 每秒补入的染料量. */
export const ETHER_DYE_RATE = 9;

/**
 * 染料每帧的留存率: 半衰期 0.35 + persistence^2 * 12 秒.
 *
 * @param persistence 0..1, 越大拖得越久.
 * @param dt 帧长 (秒).
 */
export function etherKeep(persistence: number, dt: number): number {
  return 0.5 ** (dt / (0.35 + persistence * persistence * 12));
}

/**
 * 速度的粘性衰减: viscosity 0 时只有很轻的阻尼.
 *
 * @param viscosity 0..1.
 * @param dt 帧长 (秒).
 */
export function etherVelocityKeep(viscosity: number, dt: number): number {
  return Math.exp(-dt * (0.3 + viscosity * 6));
}

/**
 * 自动演示的光标路径 (归一化坐标), 一条不闭合的利萨如曲线.
 *
 * @param phase 相位.
 */
export function etherAutoPath(phase: number): readonly [number, number] {
  return [0.5 + 0.32 * Math.sin(phase * 0.9), 0.5 + 0.26 * Math.sin(phase * 1.3 + 1.1)];
}

/** 跨帧的驱动状态. */
export interface EtherDrive {
  ramp: number;
  phase: number;
  seenTap: number;
}

export function createEtherDrive(): EtherDrive {
  return { ramp: 0, phase: 0, seenTap: -1 };
}

export interface EtherSettings {
  readonly mouseForce: number;
  readonly cursorSize: number;
  readonly clickBurst: boolean;
  readonly autoDemo: boolean;
  readonly autoSpeed: number;
  readonly autoIntensity: number;
  readonly autoResumeDelay: number;
  readonly intro: boolean;
  /** 状态缓冲相对画布的缩放. */
  readonly gridScale: number;
}

/** 一帧要注入的东西: splat 是 [x, y, vx, vy] (格每秒), splatK 是 [半径格数, 份额], burst 是 [x, y, 速度, 半径格数]. */
export interface EtherForces {
  readonly splat: readonly [number, number, number, number];
  readonly splatK: readonly [number, number];
  readonly burst: readonly [number, number, number, number];
}

const IDLE: EtherForces = { splat: [0, 0, 0, 0], splatK: [1, 0], burst: [0, 0, 0, 1] };

/**
 * 推进驱动状态并给出本帧的力. 优先级: 入场一笔, 指针, 自动演示. 静态帧不注入.
 *
 * @param drive 原地推进的状态.
 * @param frame 内核的这一帧.
 * @param s 组件设置.
 */
export function stepEther(drive: EtherDrive, frame: BackdropFrame, s: EtherSettings): EtherForces {
  if (frame.still || frame.dt <= 0) return IDLE;
  const { pointer, fit, dt, elapsed } = frame;
  const gridW = fit.width * s.gridScale;
  const gridH = fit.height * s.gridScale;
  const cells = fit.scale * s.gridScale;
  const radius = Math.max(1.5, (s.cursorSize * cells) / 2);
  const force = Math.max(0, s.mouseForce) / ETHER_FORCE_REF;
  const pace = Math.min(1, dt * 60);
  let burst = IDLE.burst;
  const tap = pointer.taps[pointer.taps.length - 1];
  if (tap && tap.at > drive.seenTap) {
    drive.seenTap = tap.at;
    if (s.clickBurst) burst = [tap.x, tap.y, ETHER_BURST_PUSH * force * cells, radius * 2];
  }
  if (s.intro && elapsed < ETHER_INTRO_SECONDS) {
    const t = elapsed / ETHER_INTRO_SECONDS;
    const fade = Math.sin(Math.PI * t);
    return { splat: [0.15 + 0.7 * t, 0.5 + 0.12 * Math.sin(t * Math.PI * 2), 0.7 * gridW / ETHER_INTRO_SECONDS, 0], splatK: [radius, 0.5 * fade], burst };
  }
  const recent = pointer.inside && (elapsed - pointer.movedAt) * 1000 < s.autoResumeDelay;
  if (recent) {
    drive.ramp = 0;
    const vx = Math.max(-ETHER_SPEED_CAP, Math.min(ETHER_SPEED_CAP, pointer.vx));
    const vy = Math.max(-ETHER_SPEED_CAP, Math.min(ETHER_SPEED_CAP, pointer.vy));
    const moving = Math.hypot(vx, vy) > 1e-3 ? 1 : 0;
    return { splat: [pointer.x, pointer.y, vx * gridW * force, vy * gridH * force], splatK: [radius, Math.min(1, ETHER_SPLAT_BLEND * force) * pace * moving], burst };
  }
  if (!s.autoDemo) return { ...IDLE, burst };
  drive.ramp = Math.min(1, drive.ramp + dt / ETHER_AUTO_RAMP_SECONDS);
  const before = etherAutoPath(drive.phase);
  drive.phase += dt * s.autoSpeed * ETHER_AUTO_PHASE_RATE;
  const at = etherAutoPath(drive.phase);
  const gain = force * 0.45 * s.autoIntensity * drive.ramp * drive.ramp;
  return {
    splat: [at[0], at[1], ((at[0] - before[0]) / dt) * gridW * gain, ((at[1] - before[1]) / dt) * gridH * gain],
    splatK: [radius, Math.min(1, ETHER_SPLAT_BLEND * drive.ramp) * pace],
    burst,
  };
}
