// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 ShapeGrid 条目, 实现为 HX 自有.
import { DEG } from "./tokens";

/** 格形. */
export const GRID_SHAPES = ["square", "hex", "circle", "triangle"] as const;
export type GridShape = (typeof GRID_SHAPES)[number];

/** 滚动方向到单位向量 (画布坐标, y 朝下). */
export const GRID_DIRECTIONS = {
  diagonal: [Math.SQRT1_2, Math.SQRT1_2],
  right: [1, 0],
  left: [-1, 0],
  up: [0, -1],
  down: [0, 1],
  none: [0, 0],
} as const;
export type GridDirection = keyof typeof GRID_DIRECTIONS;

export const SQRT3 = Math.sqrt(3);
/** 格编号平移成正数再拼键, 两轴各占 16 位. */
export const OFFSET = 32768;
const KEY_SPAN = 65536;
/** 透视相机距离, 以画布长边计. */
export const FAR = 2.5;
/** 圆格半径占格距的比例 (本库定). */
const CIRCLE_FILL = 0.42;
/** 倾斜时多铺一圈格子的比例, 透视下边缘不露底 (本库定). */
const TILT_OVERSCAN = 0.6;

/** 一个格子: 编号, 中心 (平面坐标), 顶点 (圆形时为空) 与圆半径. */
export interface GridCell {
  readonly i: number;
  readonly j: number;
  readonly key: number;
  readonly cx: number;
  readonly cy: number;
  readonly points: ReadonlyArray<readonly [number, number]>;
  readonly radius: number;
}

/** 格编号拼成数字键. */
export function cellKey(i: number, j: number): number {
  return (i + OFFSET) * KEY_SPAN + (j + OFFSET);
}

/** 正六边形 (尖顶), 外接圆半径 r. */
function hexPoints(cx: number, cy: number, r: number): Array<[number, number]> {
  return Array.from({ length: 6 }, (_, k) => {
    const a = (60 * k + 30) * DEG;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
}

/** 格形的行列步长: 三角形横向半格, 六角与三角纵向按正多边形高. */
export function gridSteps(shape: GridShape, size: number): readonly [number, number] {
  const s = Math.max(4, size);
  const stepX = shape === "triangle" ? s / 2 : s;
  const stepY = shape === "hex" ? (s * 1.5) / SQRT3 : shape === "triangle" ? (s * SQRT3) / 2 : s;
  return [stepX, stepY];
}

/**
 * 铺满 width x height 的格子, 整体按 (ox, oy) 平移 (滚动). 倾斜时 overscan 为 true, 四周多铺一圈.
 *
 * @param shape 格形.
 * @param size 格距 (CSS 像素).
 * @param width 画布 CSS 宽.
 * @param height 画布 CSS 高.
 * @param ox 横向平移.
 * @param oy 纵向平移.
 * @param overscan 是否多铺.
 * @param shift 平移掉的整周期对应的格编号偏移 (偶数), 让编号随滚动保持不变.
 */
export function layoutCells(shape: GridShape, size: number, width: number, height: number, ox: number, oy: number, overscan: boolean, shift: readonly [number, number] = [0, 0]): GridCell[] {
  const s = Math.max(4, size);
  const pad = overscan ? Math.max(width, height) * TILT_OVERSCAN : 0;
  const [stepX, stepY] = gridSteps(shape, s);
  const i0 = Math.floor((-pad - ox) / stepX) - 1;
  const i1 = Math.ceil((width + pad - ox) / stepX) + 1;
  const j0 = Math.floor((-pad - oy) / stepY) - 1;
  const j1 = Math.ceil((height + pad - oy) / stepY) + 1;
  const out: GridCell[] = [];
  for (let j = j0; j <= j1; j += 1) {
    for (let i = i0; i <= i1; i += 1) {
      const odd = ((j % 2) + 2) % 2;
      const cy = (j + 0.5) * stepY + oy;
      let cx = (i + 0.5) * stepX + ox;
      let points: Array<[number, number]> = [];
      let radius = 0;
      if (shape === "hex") {
        cx += odd * (s / 2);
        points = hexPoints(cx, cy, s / SQRT3);
      } else if (shape === "triangle") {
        const h = stepY / 2;
        const up = (((i + j) % 2) + 2) % 2 === 0;
        points = up ? [[cx - s / 2, cy + h], [cx + s / 2, cy + h], [cx, cy - h]] : [[cx - s / 2, cy - h], [cx + s / 2, cy - h], [cx, cy + h]];
      } else if (shape === "circle") {
        radius = s * CIRCLE_FILL;
      } else {
        const h = s / 2;
        points = [[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]];
      }
      out.push({ i: i + shift[0], j: j + shift[1], key: cellKey(i + shift[0], j + shift[1]), cx, cy, points, radius });
    }
  }
  return out;
}

/** 平面到屏幕的透视投影: 绕中心先转 tiltX (绕横轴) 再转 tiltY (绕纵轴), 相机距离 FAR 倍长边. */
export interface Projector {
  readonly flat: boolean;
  project(x: number, y: number): readonly [number, number, number];
}

/**
 * 建投影. 两个倾角都为 0 时是恒等投影, 缩放为 1.
 *
 * @param tiltX 绕横轴倾角 (度).
 * @param tiltY 绕纵轴倾角 (度).
 * @param width 画布 CSS 宽.
 * @param height 画布 CSS 高.
 */
export function makeProjector(tiltX: number, tiltY: number, width: number, height: number): Projector {
  const cx = width / 2;
  const cy = height / 2;
  const dist = FAR * Math.max(width, height, 1);
  const [sx, cxr] = [Math.sin(tiltX * DEG), Math.cos(tiltX * DEG)];
  const [sy, cyr] = [Math.sin(tiltY * DEG), Math.cos(tiltY * DEG)];
  const flat = tiltX === 0 && tiltY === 0;
  return {
    flat,
    project: (x, y) => {
      if (flat) return [x, y, 1];
      const px = x - cx;
      const py = (y - cy) * cxr;
      const pz0 = (y - cy) * sx;
      const qx = px * cyr + pz0 * sy;
      const qz = -px * sy + pz0 * cyr;
      const f = dist / Math.max(dist + qz, 1);
      return [cx + qx * f, cy + py * f, f];
    },
  };
}
