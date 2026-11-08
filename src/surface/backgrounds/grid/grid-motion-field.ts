// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GridMotion 条目, 实现为 HX 自有.
import { clamp, smoothstep } from "../../backdrop/kernel/math";
import type { PointerState } from "../../backdrop/kernel/pointer";
import { DEG, follow, type Follower } from "./tokens";

/** 规格常数与本库定的系数. */
export const GRID_MOTION = {
  /** 入场时长 (秒). */
  introSeconds: 0.9,
  /** 瓦片亮度跟随的时间常数 (秒). */
  settleTau: 0.22,
  /** 各行视差跟随的时间常数 (秒), 行号取模循环, 行与行错开惯性. */
  inertia: [0.45, 0.7, 0.55, 0.85] as readonly number[],
  /** 光斑照度 1 - smoothstep(0.25, 1, 距离 / 半径). */
  spotInner: 0.25,
  /** 光斑半径占画面长边的比例 (本库定). */
  spotReach: 0.35,
  /** parallax 为 1 时指针在边缘带动行平移的最大像素 (本库定). */
  parallaxPixels: 160,
  /** 入场起始放大倍数 (本库定). */
  introScale: 1.06,
  /** 舞台盖住旋转后画面的余量 (本库定). */
  coverMargin: 1.12,
} as const;

/** 行的滚动方向: 全向左, 全向右, 奇偶行交替. */
export const MOTION_DIRECTIONS = { left: 0, right: 1, alternate: 2 } as const;
export type MotionDirection = keyof typeof MOTION_DIRECTIONS;

/** 一帧的布局: 舞台尺寸, 行高, 瓦片宽, 每行瓦片数, 一个循环周期的像素宽. */
export interface MotionLayout {
  readonly stageW: number;
  readonly stageH: number;
  readonly rowH: number;
  readonly tileW: number;
  /** 瓦片宽加间距. */
  readonly step: number;
  /** 行高加间距. */
  readonly pitch: number;
  readonly perRow: number;
  readonly period: number;
}

/**
 * 由画面尺寸算布局. 舞台按旋转角取能盖住画面的外接矩形, 行高平分, 瓦片按宽高比定宽,
 * 每行瓦片数保证平移任意相位都铺满 (至少舞台宽加一个周期).
 *
 * @param width 画面 CSS 宽.
 * @param height 画面 CSS 高.
 * @param o 行数, 宽高比, 间距, 旋转角 (度), 不同瓦片个数.
 */
export function motionLayout(width: number, height: number, o: { rows: number; aspectRatio: number; gap: number; angle: number; count: number }): MotionLayout {
  const c = Math.abs(Math.cos(o.angle * DEG));
  const s = Math.abs(Math.sin(o.angle * DEG));
  const stageW = (width * c + height * s) * GRID_MOTION.coverMargin;
  const stageH = (width * s + height * c) * GRID_MOTION.coverMargin;
  const rows = Math.max(1, Math.round(o.rows));
  const gap = Math.max(0, o.gap);
  const rowH = Math.max(1, (stageH - gap * (rows - 1)) / rows);
  const tileW = Math.max(1, rowH * Math.max(0.1, o.aspectRatio));
  const step = tileW + gap;
  const count = Math.max(1, o.count);
  return { stageW, stageH, rowH, tileW, step, pitch: rowH + gap, perRow: Math.ceil(stageW / step) + count + 1, period: step * count };
}

/** 第 r 行的方向, -1 向左, 1 向右. */
export function rowDirection(r: number, direction: MotionDirection): number {
  if (direction === "left") return -1;
  if (direction === "right") return 1;
  return r % 2 === 0 ? -1 : 1;
}

/** 行平移量折回 [-period, 0), 行内容从这里起铺, 任意相位都盖住舞台. */
export function wrapShift(raw: number, period: number): number {
  if (!(period > 0)) return 0;
  return (((raw % period) + period) % period) - period;
}

/** 每行视差平移与每块瓦片亮度的运行状态. */
export interface MotionState {
  shifts: Follower[];
  lights: Follower[];
}

export function makeMotionState(): MotionState {
  return { shifts: [], lights: [] };
}

export interface MotionStep {
  readonly rows: number;
  readonly layout: MotionLayout;
  readonly width: number;
  readonly height: number;
  readonly angle: number;
  readonly parallax: number;
  readonly scrollSpeed: number;
  readonly direction: MotionDirection;
}

/**
 * 推进一帧, 返回各行的平移 (像素). 视差目标按行加深, 各行用自己的惯性跟随; 瓦片中心转到屏幕系,
 * 与指针求距, 照度按 1 - smoothstep(0.25, 1, d / 半径) 乘在场程度, 亮度以 0.22 秒跟随.
 *
 * @param s 原地修改的状态.
 * @param time 场时钟 (秒).
 * @param dt 帧长 (秒), 0 时直接落到目标.
 * @param pointer 内核指针.
 * @param o 布局与参数.
 */
export function stepMotion(s: MotionState, time: number, dt: number, pointer: Pick<PointerState, "x" | "y" | "presence" | "inside">, o: MotionStep): number[] {
  const { layout: l } = o;
  const lean = pointer.inside ? clamp((pointer.x - 0.5) * 2, -1, 1) : 0;
  const cos = Math.cos(o.angle * DEG);
  const sin = Math.sin(o.angle * DEG);
  const px = (pointer.x - 0.5) * o.width;
  const py = (0.5 - pointer.y) * o.height;
  const reach = Math.max(o.width, o.height) * GRID_MOTION.spotReach;
  const out: number[] = [];
  for (let r = 0; r < o.rows; r += 1) {
    const shift = (s.shifts[r] ??= { value: 0 });
    const target = lean * o.parallax * GRID_MOTION.parallaxPixels * (1 + r / Math.max(1, o.rows));
    follow(shift, target, dt, GRID_MOTION.inertia[r % GRID_MOTION.inertia.length]);
    const x = wrapShift(rowDirection(r, o.direction) * time * o.scrollSpeed + shift.value, l.period);
    out.push(x);
    const ly = -l.stageH / 2 + r * l.pitch + l.rowH / 2;
    for (let i = 0; i < l.perRow; i += 1) {
      const lx = -l.stageW / 2 + x + i * l.step + l.tileW / 2;
      const d = Math.hypot(lx * cos - ly * sin - px, lx * sin + ly * cos - py);
      const wanted = (1 - smoothstep(GRID_MOTION.spotInner, 1, d / Math.max(reach, 1))) * pointer.presence;
      follow((s.lights[r * l.perRow + i] ??= { value: 0 }), wanted, dt, GRID_MOTION.settleTau);
    }
  }
  return out;
}

/**
 * 瓦片的 CSS filter: 指针在场时非光斑处压暗 dim, 光斑处提亮; 灰度模式下光斑处恢复彩色.
 *
 * @param light 瓦片照度 0..1.
 * @param presence 指针在场程度 0..1.
 * @param o dim, spotlight, grayscale.
 */
export function tileFilter(light: number, presence: number, o: { dim: number; spotlight: number; grayscale: boolean }): string {
  const lit = clamp(light * o.spotlight, 0, 1);
  const bright = 1 - o.dim * presence * (1 - lit) + 0.25 * lit;
  const grey = o.grayscale ? 1 - lit : 0;
  return `brightness(${bright.toFixed(3)}) grayscale(${grey.toFixed(3)})`;
}

/** 看起来像图片地址的条目按封面图铺, 其余当文字. */
export function isImageItem(item: unknown): item is string {
  return typeof item === "string" && /^(?:https?:|data:image\/|blob:|\/|\.{1,2}\/)|\.(?:png|jpe?g|webp|gif|avif|svg)(?:[?#].*)?$/i.test(item.trim());
}
