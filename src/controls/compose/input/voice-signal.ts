import { approach } from "../kinetics";
import { DICTATE, HALF, MS_PER_S } from "../tokens";

/**
 * 模拟语音的音节表: [起点秒, 长度秒, 强度], 铺在 4.8s 的循环里, 有停顿也有重音.
 * 只用来在没有麦克风时让波形像在说话, 不追求语言学真实.
 */
const SPEECH: ReadonlyArray<readonly [number, number, number]> = [
  [0.1, 0.18, 0.55],
  [0.32, 0.22, 0.9],
  [0.58, 0.14, 0.45],
  [0.9, 0.26, 0.75],
  [1.2, 0.12, 0.4],
  [1.75, 0.2, 0.85],
  [2.0, 0.3, 0.65],
  [2.36, 0.16, 0.5],
  [3.05, 0.24, 0.95],
  [3.34, 0.18, 0.6],
  [3.58, 0.28, 0.7],
  [4.2, 0.15, 0.35],
];

const SECONDS_PER_MINUTE = 60;
const CLOCK_DIGITS = 2;
const BYTE_MAX = 255;

/** 模拟输入在 t 秒时的电平 0..1. 每个音节是半个正弦拱. */
export function simulatedLevel(seconds: number): number {
  const t = ((seconds % DICTATE.loopS) + DICTATE.loopS) % DICTATE.loopS;
  for (const [start, length, strength] of SPEECH) {
    if (t >= start && t <= start + length) return strength * Math.sin((Math.PI * (t - start)) / length);
  }
  return 0;
}

/** 包络跟随: 上升用 attack, 下降用 release (毫秒). */
export function followEnvelope(env: number, target: number, dt: number, attackMs: number, releaseMs: number): number {
  const tau = (target > env ? attackMs : releaseMs) / MS_PER_S;
  return approach(env, target, dt, tau);
}

/** 条高: 不低于 floor, 灵敏度放大后钳到 1. */
export function barLevel(env: number, sensitivity: number, floor: number): number {
  return Math.min(1, floor + Math.max(0, env * sensitivity) * (1 - floor));
}

/** 左滑取消的进度 0..1. 前 SLIDE_MIN 像素不算, 防抖. */
export function slideProgress(dx: number, cancelDistance: number): number {
  const travel = -dx - DICTATE.slideMin;
  if (travel <= 0) return 0;
  return Math.min(1, travel / Math.max(1, cancelDistance - DICTATE.slideMin));
}

/** 低半段频谱的平均能量乘以 MIC_GAIN, 钳到 1. */
export function micLevel(bins: ArrayLike<number>): number {
  const count = Math.max(1, Math.floor(bins.length / HALF));
  let sum = 0;
  for (let i = 0; i < count; i += 1) sum += bins[i] ?? 0;
  return Math.min(1, (sum / count / BYTE_MAX) * DICTATE.micGain);
}

/** m:ss */
export function formatClock(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / MS_PER_S);
  const minutes = Math.floor(total / SECONDS_PER_MINUTE);
  return `${minutes}:${String(total % SECONDS_PER_MINUTE).padStart(CLOCK_DIGITS, "0")}`;
}

/** 波形历史: 每 WAVE_EVERY 帧压入一格, 最多 WAVE_MAX 格. */
export function pushWave(history: number[], level: number): number[] {
  history.push(level);
  if (history.length > DICTATE.waveMax) history.splice(0, history.length - DICTATE.waveMax);
  return history;
}
