// 行为规格参照 docs/research/catalog/animations.md 的 Noise 条目, 实现为 HX 自有.

/**
 * GrainLayer 的纯函数: 种子随机数, 颗粒灰度, 一帧贴片的像素, 帧节拍.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-texture.md
 */

const MID = 128;
const FULL = 255;
const CHANNELS = 4;

/** 32 位种子随机数, 返回 0..1. 同一种子同一序列, 测试可复现. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 一粒颗粒的灰度: 以中灰为心, 对比度决定摆幅. */
export function grainValue(r: number, contrast: number): number {
  const c = Math.max(0, Math.min(1, contrast));
  return Math.round(MID + (r - 0.5) * FULL * c);
}

export interface GrainFrameOptions {
  readonly contrast: number;
  readonly colored: boolean;
  readonly dust: number;
  readonly scratches: number;
  readonly scanlines: number;
  readonly dustMax: number;
  readonly dustPx: number;
  readonly scratchChance: number;
  readonly scratchPx: number;
  readonly scanPeriodPx: number;
  readonly scanDim: number;
}

function paint(buf: Uint8ClampedArray, i: number, v: number): void {
  buf[i] = v;
  buf[i + 1] = v;
  buf[i + 2] = v;
}

/** 往 w x h 的 RGBA 缓冲写一帧: 颗粒, 尘点, 竖向划痕, 扫描线. */
export function fillGrain(buf: Uint8ClampedArray, w: number, h: number, o: GrainFrameOptions, rand: () => number): void {
  for (let p = 0; p < w * h; p += 1) {
    const i = p * CHANNELS;
    if (o.colored) {
      buf[i] = grainValue(rand(), o.contrast);
      buf[i + 1] = grainValue(rand(), o.contrast);
      buf[i + 2] = grainValue(rand(), o.contrast);
    } else paint(buf, i, grainValue(rand(), o.contrast));
    buf[i + 3] = FULL;
  }
  const specks = Math.round(Math.max(0, o.dust) * o.dustMax);
  for (let k = 0; k < specks; k += 1) {
    const x0 = Math.floor(rand() * w);
    const y0 = Math.floor(rand() * h);
    const v = rand() < 0.5 ? 0 : FULL;
    for (let y = y0; y < Math.min(h, y0 + o.dustPx); y += 1) for (let x = x0; x < Math.min(w, x0 + o.dustPx); x += 1) paint(buf, (y * w + x) * CHANNELS, v);
  }
  if (rand() < Math.max(0, Math.min(1, o.scratches)) * o.scratchChance) {
    const x0 = Math.floor(rand() * w);
    const v = rand() < 0.5 ? 0 : FULL;
    for (let y = 0; y < h; y += 1) for (let x = x0; x < Math.min(w, x0 + o.scratchPx); x += 1) paint(buf, (y * w + x) * CHANNELS, v);
  }
  const dim = Math.max(0, Math.min(1, o.scanlines)) * o.scanDim;
  if (dim > 0) {
    for (let y = 0; y < h; y += o.scanPeriodPx) {
      for (let x = 0; x < w; x += 1) {
        const i = (y * w + x) * CHANNELS;
        buf[i] *= 1 - dim;
        buf[i + 1] *= 1 - dim;
        buf[i + 2] *= 1 - dim;
      }
    }
  }
}

/** 帧节拍: 累加时间, 够一帧就出帧. fps <= 0 时永不出帧 (静止). */
export function frameDue(acc: number, dtS: number, fps: number): { readonly due: boolean; readonly acc: number } {
  if (!(fps > 0)) return { due: false, acc: 0 };
  const next = acc + dtS;
  const step = 1 / fps;
  return next >= step ? { due: true, acc: next % step } : { due: false, acc: next };
}
