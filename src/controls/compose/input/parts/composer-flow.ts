/** ComposerField 底边流光: 打字能量与提交脉冲的逐帧模拟, 画布绘制, 行数到高度的换算. */
import { approach, decay, fitCanvas, inkOf } from "../../kinetics";
import { COMPOSER, HALF } from "../../tokens";

/** 流光段占底边宽度的比例与静止时的基础透明度. */
const GLOW_SPAN = 0.3;
const GLOW_BASE = 0.25;
const GLOW_GAIN = 0.75;
/** 流光每秒走过底边的比例 (速度为 1 时). */
const GLOW_PACE = 0.25;
const CLEAR = "transparent";

export interface Flow {
  energy: number;
  pulse: number;
  speed: number;
  phase: number;
}

export const FLOW_REST: Flow = { energy: 0, pulse: 0, speed: 1, phase: 0 };

/** 一帧流光模拟: 打字能量 0.8s 衰减, 提交脉冲 0.16s 衰减, 流速 0.15s 追向 1 + energy * 6. */
export function stepFlow(flow: Flow, dt: number): Flow {
  const energy = decay(flow.energy, dt, COMPOSER.energyTau);
  const pulse = decay(flow.pulse, dt, COMPOSER.pulseTau);
  const speed = approach(flow.speed, 1 + energy * COMPOSER.speedGain, dt, COMPOSER.speedTau);
  return { energy, pulse, speed, phase: (flow.phase + speed * GLOW_PACE * dt) % 1 };
}

/** 行数换高度: 行高 22, 上下各留 11. */
export function composerHeight(rows: number, maxRows: number): number {
  const clamped = Math.min(Math.max(rows, 1), maxRows);
  return clamped * COMPOSER.line + COMPOSER.edge * HALF;
}

/** 把当前流光画到底边画布上. 画布不可用时返回 false. */
export function drawFlow(canvas: HTMLCanvasElement | null, flow: Flow): boolean {
  if (!canvas) return false;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ctx = fitCanvas(canvas, width, height);
  if (!ctx) return false;
  const { energy, pulse, phase } = flow;
  ctx.clearRect(0, 0, width, height);
  const alpha = Math.min(1, GLOW_BASE + energy * GLOW_GAIN + pulse);
  const span = width * GLOW_SPAN;
  const x = phase * (width + span) - span;
  const gradient = ctx.createLinearGradient(x, 0, x + span, 0);
  gradient.addColorStop(0, CLEAR);
  gradient.addColorStop(1 / HALF, inkOf(canvas));
  gradient.addColorStop(1, CLEAR);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.fillRect(x, 0, span, height);
  return true;
}
