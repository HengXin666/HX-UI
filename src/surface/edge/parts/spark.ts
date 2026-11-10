// 行为规格参照 docs/research/catalog/animations.md 的 ElectricBorder 条目, 实现为 HX 自有.

/**
 * SparkEdge 的纯函数: 一维值噪声, 显现前沿, 浪涌能量, 指针能量, 像素比预算.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-edge.md
 */

function hash(n: number, seed: number): number {
  const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** 五次平滑的一维值噪声, 返回 -1..1. */
export function valueNoise(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * f * (f * (f * 6 - 15) + 10);
  const a = hash(i, seed);
  const b = hash(i + 1, seed);
  return (a + (b - a) * u) * 2 - 1;
}

/** 两层叠加的抖动, -1..1 左右. chaos 决定高频层的占比. */
export function jag(x: number, t: number, chaos: number, seed: number): number {
  const c = Math.max(0, Math.min(1, chaos));
  return valueNoise(x + t, seed) * (1 - 0.5 * c) + valueNoise(x * 3.1 - t * 1.7, seed + 7) * 0.5 * c;
}

/** 显现: 沿周长 along 处在前沿 front 之后可见, 软边 soft px 内过渡. */
export function revealShown(along: number, front: number, soft: number): number {
  if (soft <= 0) return along <= front ? 1 : 0;
  const x = Math.max(0, Math.min(1, (front - along) / soft));
  return x * x * (3 - 2 * x);
}

/** 浪涌能量: pulses 个光团沿周长匀分, 以 head 为相位行进, 半宽 half px 内钟形衰减. */
export function surgeEnergy(along: number, head: number, total: number, pulses: number, half: number): number {
  if (!(total > 0) || pulses <= 0 || half <= 0) return 0;
  let best = 0;
  for (let k = 0; k < pulses; k += 1) {
    const c = (head + (k * total) / pulses) % total;
    let d = Math.abs(along - c);
    d = Math.min(d, total - d);
    best = Math.max(best, Math.exp(-((d / half) ** 2)));
  }
  return best;
}

/** 指针能量: 距离 dist 在 radius 内平滑升到 1. */
export function pointerEnergy(dist: number, radius: number): number {
  if (radius <= 0) return 0;
  const x = Math.max(0, Math.min(1, 1 - dist / radius));
  return x * x * (3 - 2 * x);
}

/** 像素比: 设备值, 上限 2, 再按画布像素预算压. */
export function budgetRatio(device: number, width: number, height: number, budget: number): number {
  const area = Math.max(1, width * height);
  return Math.max(0.5, Math.min(device || 1, 2, Math.sqrt(budget / area)));
}
