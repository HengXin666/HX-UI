// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 MoltenMetal 条目, 实现为 HX 自有.
// 指针拖尾的 Canvas2D 预烘: 一张低分辨率画布按帧淡出, 再沿指针路径盖高斯热斑, 片元只读它的 alpha.
//
// 每帧上传的做法: 内核按对象身份缓存纹理 (同一张画布不会再传), 所以拖尾用两张画布轮换 (乒乓).
// 每次更新把上一张按淡出系数整张拷进另一张 (globalCompositeOperation copy 加 globalAlpha), 再盖热斑, 然后让 image 指向新的一张,
// 身份每次都变, 内核就在这一帧重新上传. 冷却之后停止轮换, 不再上传. 更新在 uniforms 回调里做, 内核在同一帧随后取 textures.
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { MOLTEN_SAMPLE_SECONDS, MOLTEN_TRAIL_FLOOR, MOLTEN_TRAIL_SECONDS } from "./molten-metal-shader";
import { bakeBytes, bakeSurface, paintBytes, type BakeSurface } from "./prebake";

/** 拖尾画布的短边像素, 长边按比例但不超过 MOLTEN_TRAIL_LONG_MAX. */
export const MOLTEN_TRAIL_SHORT = 96;
export const MOLTEN_TRAIL_LONG_MAX = 256;
/** 热斑高斯 exp(-d^2 / 0.006), d 以画布短边为 1. */
export const MOLTEN_SPLAT_SPREAD = 0.006;
/** 每个热斑盖上去的不透明度. */
export const MOLTEN_SPLAT_ALPHA = 0.45;
/** 淡出最短的结算间隔 (秒): 高刷屏上攒够再淡, 免得 8 位取整把淡出卡住. */
export const MOLTEN_FADE_STEP = 1 / 60;

/**
 * 拖尾画布尺寸: 短边 96, 长边按画布比例, 封顶 256.
 *
 * @param width 画布宽 (设备像素).
 * @param height 画布高 (设备像素).
 */
export function moltenTrailSize(width: number, height: number): readonly [number, number] {
  const short = Math.max(1, Math.min(width, height));
  const k = MOLTEN_TRAIL_SHORT / short;
  const w = Math.min(MOLTEN_TRAIL_LONG_MAX, Math.max(1, Math.round(width * k)));
  const h = Math.min(MOLTEN_TRAIL_LONG_MAX, Math.max(1, Math.round(height * k)));
  return [w, h];
}

/**
 * 一段时间后留下的份额: 拖尾寿命 0.9 秒内降到 exp(-3), 约 5%.
 *
 * @param dt 距上次淡出的秒数.
 */
export function moltenTrailKeep(dt: number): number {
  return Math.exp((-Math.max(0, dt) * 3) / MOLTEN_TRAIL_SECONDS);
}

/** 热斑半径 (像素): 高斯在 3 个标准差处截断. */
export function moltenSplatRadius(): number {
  return Math.ceil(MOLTEN_TRAIL_SHORT * Math.sqrt(MOLTEN_SPLAT_SPREAD / 2) * 3);
}

/** 热斑贴图字节: 颜色通道为 0, alpha 为高斯. 边长 2 * 半径 + 1. */
export function moltenSplatBytes(): Uint8ClampedArray {
  const r = moltenSplatRadius();
  const size = r * 2 + 1;
  return bakeBytes(size, size, (u, v) => {
    const dx = ((u - 0.5) * size) / MOLTEN_TRAIL_SHORT;
    const dy = ((v - 0.5) * size) / MOLTEN_TRAIL_SHORT;
    return [0, 0, 0, Math.exp(-(dx * dx + dy * dy) / MOLTEN_SPLAT_SPREAD)];
  });
}

/**
 * 两次采样之间沿直线补的落点, 不含起点, 含终点; 没有起点时只落终点.
 *
 * @param from 上一个采样点 (拖尾画布像素), 指针刚进来时为 null.
 * @param to 本次采样点.
 * @param spacing 落点间距 (像素).
 */
export function moltenTrailStamps(from: readonly [number, number] | null, to: readonly [number, number], spacing: number): Array<[number, number]> {
  if (!from) return [[to[0], to[1]]];
  const n = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / Math.max(spacing, 1e-3)));
  const out: Array<[number, number]> = [];
  for (let i = 1; i <= n; i += 1) out.push([from[0] + ((to[0] - from[0]) * i) / n, from[1] + ((to[1] - from[1]) * i) / n]);
  return out;
}

type TrailFrame = Pick<BackdropFrame, "fit" | "dt" | "elapsed" | "reduced" | "pointer">;

/** 指针拖尾的乒乓画布. 拿不到 2D 上下文时 image 为 null, 片元就不读拖尾. */
export class MoltenTrail {
  private pages: readonly [BakeSurface, BakeSurface] | null = null;
  private splat: HTMLCanvasElement | null = null;
  private failed = false;
  private front = 0;
  private size: readonly [number, number] = [0, 0];
  private last: readonly [number, number] | null = null;
  private sampledAt = Number.NEGATIVE_INFINITY;
  private pending = 0;
  private warmth = 0;

  /** 本帧该上传的画布. */
  get image(): HTMLCanvasElement | null {
    return this.pages?.[this.front]?.canvas ?? null;
  }

  /** 推进一帧: 按指针采样补落点, 淡出旧的, 有变化才换页. */
  step(frame: TrailFrame): void {
    const [w, h] = moltenTrailSize(frame.fit.width, frame.fit.height);
    if (!this.ensure(w, h)) return;
    if (frame.reduced) {
      if (this.warmth > 0) this.flip(0, []);
      this.warmth = 0;
      this.last = null;
      return;
    }
    const { pointer } = frame;
    let stamps: Array<[number, number]> = [];
    if (!pointer.inside) {
      this.last = null;
    } else if (frame.elapsed - this.sampledAt >= MOLTEN_SAMPLE_SECONDS) {
      this.sampledAt = frame.elapsed;
      const to: readonly [number, number] = [pointer.x * w, (1 - pointer.y) * h];
      stamps = moltenTrailStamps(this.last, to, moltenSplatRadius() * 0.5);
      this.last = to;
    }
    this.pending += frame.dt;
    if (stamps.length === 0 && (this.warmth <= 0 || this.pending < MOLTEN_FADE_STEP)) return;
    const keep = moltenTrailKeep(this.pending);
    this.pending = 0;
    const warm = stamps.length > 0 ? 1 : this.warmth * keep;
    this.flip(warm < MOLTEN_TRAIL_FLOOR ? 0 : keep, stamps);
    this.warmth = warm < MOLTEN_TRAIL_FLOOR ? 0 : warm;
  }

  private ensure(w: number, h: number): boolean {
    if (this.failed) return false;
    if (this.pages && this.size[0] === w && this.size[1] === h) return true;
    const a = bakeSurface(w, h);
    const b = bakeSurface(w, h);
    const r = moltenSplatRadius();
    this.splat = this.splat ?? paintBytes(r * 2 + 1, r * 2 + 1, moltenSplatBytes());
    if (!a || !b || !this.splat) {
      this.failed = true;
      this.pages = null;
      return false;
    }
    this.pages = [a, b];
    this.size = [w, h];
    this.front = 0;
    this.warmth = 0;
    this.last = null;
    return true;
  }

  /** 把当前页乘 keep 拷进另一页, 盖上落点, 再换页. keep 为 0 时清空. */
  private flip(keep: number, stamps: ReadonlyArray<readonly [number, number]>): void {
    const pages = this.pages;
    const splat = this.splat;
    if (!pages || !splat) return;
    const next = pages[1 - this.front];
    const prev = pages[this.front];
    if (!next || !prev) return;
    const { ctx, canvas } = next;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (keep > 0) {
      ctx.globalCompositeOperation = "copy";
      ctx.globalAlpha = keep;
      ctx.drawImage(prev.canvas, 0, 0);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = MOLTEN_SPLAT_ALPHA;
    const r = (splat.width - 1) / 2;
    for (const [x, y] of stamps) ctx.drawImage(splat, x - r, y - r);
    ctx.globalAlpha = 1;
    this.front = 1 - this.front;
  }
}
