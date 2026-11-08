// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 DotGrid 条目, 实现为 HX 自有.

/** 规格常数与本库定的系数. */
export const DOT_GRID = {
  /** 子步上限. */
  maxSteps: 24,
  /** 子步最长 (秒). */
  minStep: 1 / 120,
  /** 稳定性系数: 子步不超过 1.2 / limit. */
  stability: 1.2,
  /** 指针推力折算到位移的系数. */
  pushGain: 0.35,
  /** 邻点速度拉普拉斯的粘滞系数 (本库定). */
  viscosity: 2,
  /** 冲击波寿命 (秒, 本库定). */
  shockLife: 0.6,
  /** 冲击波环带宽, 以格距计 (本库定). */
  shockBand: 1.5,
  /** 冲击波冲量系数 (本库定). */
  shockGain: 0.6,
  /** 打包到 8 位纹理时位移与速度的量程, 以格距计 (本库定). */
  offsetRange: 2,
  velocityRange: 40,
  /** 8 位通道的零点. */
  zero: 127,
} as const;

/** 弹簧格点的全部状态. 位移与速度单位是 CSS 像素与像素每秒. */
export interface DotLattice {
  cols: number;
  rows: number;
  gap: number;
  marginX: number;
  marginY: number;
  offset: Float32Array;
  velocity: Float32Array;
  scratch: Float32Array;
}

/** 按容器 CSS 尺寸建格点, 格点整体居中. */
export function makeLattice(width: number, height: number, gap: number): DotLattice {
  const g = Math.max(2, gap);
  const cols = Math.max(1, Math.floor(width / g));
  const rows = Math.max(1, Math.floor(height / g));
  const n = cols * rows * 2;
  return { cols, rows, gap: g, marginX: (width - cols * g) / 2, marginY: (height - rows * g) / 2, offset: new Float32Array(n), velocity: new Float32Array(n), scratch: new Float32Array(n) };
}

/** 弹簧参数: returnDuration 定固有角频率, bounce 定阻尼比, tension 定邻点耦合. */
export interface SpringParams {
  readonly stiffness: number;
  readonly damping: number;
  readonly coupling: number;
}

/**
 * 由 props 求弹簧参数. 角频率 2pi / returnDuration, 阻尼比 1 - bounce (下限 0.05), 耦合 tension * stiffness / 2.
 *
 * @param bounce 回弹 0..1.
 * @param tension 邻点牵连 0..1.
 * @param returnDuration 回位周期 (秒).
 */
export function springParams(bounce: number, tension: number, returnDuration: number): SpringParams {
  const omega = (2 * Math.PI) / Math.max(0.05, returnDuration);
  const zeta = Math.min(1, Math.max(0.05, 1 - bounce));
  const stiffness = omega * omega;
  return { stiffness, damping: 2 * zeta * omega, coupling: (tension * stiffness) / 2 };
}

/** 本帧的子步数: 与上游同样按 sqrt(k + 8c) + d + 8v 估稳定上限. */
export function substeps(dt: number, p: SpringParams): number {
  const limit = Math.sqrt(p.stiffness + 8 * p.coupling) + p.damping + 8 * DOT_GRID.viscosity;
  return Math.min(DOT_GRID.maxSteps, Math.max(1, Math.ceil(dt / Math.min(DOT_GRID.minStep, DOT_GRID.stability / limit))));
}

/** 一帧的外力输入: 指针 (CSS 像素, 无指针时 null) 与仍在扩散的冲击波. */
export interface LatticeInput {
  readonly pointer: readonly [number, number] | null;
  readonly proximity: number;
  readonly strength: number;
  readonly shocks: ReadonlyArray<{ readonly x: number; readonly y: number; readonly age: number }>;
  readonly shockRadius: number;
  readonly shockStrength: number;
}

function neighbourSum(field: Float32Array, l: DotLattice, i: number, j: number, axis: number): number {
  const at = (j * l.cols + i) * 2 + axis;
  let sum = -4 * field[at];
  sum += i > 0 ? field[at - 2] : field[at];
  sum += i < l.cols - 1 ? field[at + 2] : field[at];
  sum += j > 0 ? field[at - l.cols * 2] : field[at];
  sum += j < l.rows - 1 ? field[at + l.cols * 2] : field[at];
  return sum;
}

function externalForce(l: DotLattice, x: number, y: number, input: LatticeInput, p: SpringParams): readonly [number, number] {
  let ax = 0;
  let ay = 0;
  if (input.pointer && input.proximity > 0) {
    const dx = x - input.pointer[0];
    const dy = y - input.pointer[1];
    const d = Math.hypot(dx, dy);
    if (d < input.proximity && d > 1e-3) {
      const falloff = 1 - d / input.proximity;
      const push = input.strength * falloff * falloff * input.proximity;
      ax += (dx / d) * push * p.stiffness * DOT_GRID.pushGain;
      ay += (dy / d) * push * p.stiffness * DOT_GRID.pushGain;
    }
  }
  for (const s of input.shocks) {
    const life = s.age / DOT_GRID.shockLife;
    if (life >= 1) continue;
    const dx = x - s.x;
    const dy = y - s.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-3) continue;
    const band = (d - input.shockRadius * life) / (l.gap * DOT_GRID.shockBand);
    const w = Math.exp(-band * band) * (1 - life) * input.shockStrength * p.stiffness * DOT_GRID.shockGain;
    ax += (dx / d) * w;
    ay += (dy / d) * w;
  }
  return [ax, ay];
}

/**
 * 推进格点一帧: 回位弹簧, 阻尼, 邻点位移耦合与速度粘滞, 指针推力与冲击波. 半隐式欧拉, 按稳定上限分子步.
 *
 * @param l 原地修改的格点.
 * @param dt 帧长 (秒), 0 时不动.
 * @param p 弹簧参数.
 * @param input 外力输入.
 */
export function stepLattice(l: DotLattice, dt: number, p: SpringParams, input: LatticeInput): void {
  if (dt <= 0) return;
  const steps = substeps(dt, p);
  const h = dt / steps;
  for (let s = 0; s < steps; s += 1) {
    for (let j = 0; j < l.rows; j += 1) {
      for (let i = 0; i < l.cols; i += 1) {
        const at = (j * l.cols + i) * 2;
        const [fx, fy] = externalForce(l, l.marginX + (i + 0.5) * l.gap + l.offset[at], l.marginY + (j + 0.5) * l.gap + l.offset[at + 1], input, p);
        const ax = fx - p.stiffness * l.offset[at] - p.damping * l.velocity[at] + p.coupling * neighbourSum(l.offset, l, i, j, 0) + DOT_GRID.viscosity * neighbourSum(l.velocity, l, i, j, 0);
        const ay = fy - p.stiffness * l.offset[at + 1] - p.damping * l.velocity[at + 1] + p.coupling * neighbourSum(l.offset, l, i, j, 1) + DOT_GRID.viscosity * neighbourSum(l.velocity, l, i, j, 1);
        l.scratch[at] = l.velocity[at] + ax * h;
        l.scratch[at + 1] = l.velocity[at + 1] + ay * h;
      }
    }
    l.velocity.set(l.scratch);
    for (let k = 0; k < l.offset.length; k += 1) l.offset[k] += l.velocity[k] * h;
  }
}

function toByte(value: number, range: number): number {
  return Math.round(DOT_GRID.zero + Math.max(-1, Math.min(1, value / range)) * DOT_GRID.zero);
}

/**
 * 格点打包成 RGBA8: R G 为位移, B A 为速度, 各以格距为单位按量程映射到 0..254 (零点 127).
 * 行序自上而下写, 内核上传时翻转 Y, 着色器里 texelFetch 的行号即自下而上的格行.
 *
 * @param l 格点.
 * @param out 目标字节, 长度 cols * rows * 4.
 */
export function packLattice(l: DotLattice, out: Uint8ClampedArray): void {
  for (let j = 0; j < l.rows; j += 1) {
    const row = (l.rows - 1 - j) * l.cols;
    for (let i = 0; i < l.cols; i += 1) {
      const at = (j * l.cols + i) * 2;
      const o = (row + i) * 4;
      out[o] = toByte(l.offset[at] / l.gap, DOT_GRID.offsetRange);
      out[o + 1] = toByte(l.offset[at + 1] / l.gap, DOT_GRID.offsetRange);
      out[o + 2] = toByte(l.velocity[at] / l.gap, DOT_GRID.velocityRange);
      out[o + 3] = toByte(l.velocity[at + 1] / l.gap, DOT_GRID.velocityRange);
    }
  }
}
