// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 ShapeGrid 条目, 实现为 HX 自有.
import { smoothstep } from "../../backdrop/kernel/math";
import type { Rgb } from "../../backdrop/kernel/color";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { GRID_DIRECTIONS, gridSteps, layoutCells, makeProjector, type GridCell, type GridDirection, type GridShape } from "./shape-grid-geometry";
import { hueRgb, inkOf } from "./tokens";

/** 规格常数与本库定的系数. */
export const SHAPE_GRID = {
  /** 光斑弹簧刚度与阻尼 (阻尼比 0.85). */
  spotStiffness: 220,
  spotDamping: 2 * Math.sqrt(220) * 0.85,
  /** 光斑出现 / 消散的速率 (每秒). */
  spotRiseRate: 10,
  spotFallRate: 5,
  /** 滚动速度换算: speed * 60 像素每秒. */
  pxPerSpeed: 60,
  /** 点击级联寿命 (秒) 与扩散速度 (格每秒), 本库定. */
  cascadeLife: 1.2,
  cascadeCells: 12,
  /** 入场: 由中心向外铺开的时长 (秒), 本库定. */
  introSeconds: 1.2,
  /** 底线透明度分桶数, 同桶的格子合成一条路径描边. */
  buckets: 8,
  /** 亮度低于它的格子从拖尾表里清掉. */
  epsilon: 0.01,
  /** 光晕模糊 (CSS 像素) 每单位 glow. */
  glowBlur: 18,
  /** 闪烁: 相位速率与尖锐度 (本库定). */
  twinkleRate: 1.7,
  twinkleSharp: 16,
} as const;

export interface ShapeGridOptions {
  readonly shape: GridShape;
  readonly cellSize: number;
  readonly lineWidth: number;
  readonly direction: GridDirection;
  readonly speed: number;
  readonly fillOpacity: number;
  readonly rainbow: boolean;
  readonly tiltX: number;
  readonly tiltY: number;
  readonly radius: number;
  readonly trail: number;
  readonly glow: number;
  readonly twinkle: number;
  readonly fade: number;
  readonly clickCascade: boolean;
  readonly intro: boolean;
  readonly opaqueBackground: boolean;
}

/** 跨帧状态: 滚动偏移, 光斑弹簧, 每格的拖尾亮度. */
export interface ShapeGridState {
  offsetX: number;
  offsetY: number;
  spot: { x: number; y: number; vx: number; vy: number; power: number; placed: boolean };
  glow: Map<number, number>;
}

export function makeShapeGridState(): ShapeGridState {
  return { offsetX: 0, offsetY: 0, spot: { x: 0, y: 0, vx: 0, vy: 0, power: 0, placed: false }, glow: new Map() };
}

/**
 * 推进滚动与光斑: 偏移按方向匀速走, 光斑以临界附近的弹簧追指针, 强度一阶逼近 (出现快, 消散慢).
 *
 * @param s 原地修改的状态.
 * @param dt 帧长 (秒).
 * @param o 选项.
 * @param target 指针的画布 CSS 坐标, 不在场时为 null.
 */
export function stepShapeGrid(s: ShapeGridState, dt: number, o: Pick<ShapeGridOptions, "direction" | "speed">, target: readonly [number, number] | null): void {
  const [dx, dy] = GRID_DIRECTIONS[o.direction] ?? GRID_DIRECTIONS.diagonal;
  s.offsetX -= dx * o.speed * SHAPE_GRID.pxPerSpeed * dt;
  s.offsetY -= dy * o.speed * SHAPE_GRID.pxPerSpeed * dt;
  const want = target ? 1 : 0;
  const rate = want ? SHAPE_GRID.spotRiseRate : SHAPE_GRID.spotFallRate;
  s.spot.power += (want - s.spot.power) * (1 - Math.exp(-rate * dt));
  if (!target) return;
  if (!s.spot.placed || dt <= 0) {
    Object.assign(s.spot, { x: target[0], y: target[1], vx: 0, vy: 0, placed: true });
    if (dt <= 0) s.spot.power = 1;
    return;
  }
  s.spot.vx += (SHAPE_GRID.spotStiffness * (target[0] - s.spot.x) - SHAPE_GRID.spotDamping * s.spot.vx) * dt;
  s.spot.vy += (SHAPE_GRID.spotStiffness * (target[1] - s.spot.y) - SHAPE_GRID.spotDamping * s.spot.vy) * dt;
  s.spot.x += s.spot.vx * dt;
  s.spot.y += s.spot.vy * dt;
}

/** 光斑对一个格子的照度: smoothstep(reach, reach * 0.15, 距离), reach = radius 格. */
export function spotLight(distance: number, radiusCells: number, cellSize: number): number {
  if (radiusCells <= 0) return 0;
  const reach = radiusCells * cellSize;
  return smoothstep(reach, reach * 0.15, distance);
}

/** 点击级联: 一圈以 cascadeCells 格每秒外扩的亮环, 随寿命变淡. */
export function cascadeLight(distance: number, age: number, cellSize: number): number {
  if (age < 0 || age >= SHAPE_GRID.cascadeLife) return 0;
  const ring = age * SHAPE_GRID.cascadeCells * cellSize;
  return Math.max(0, 1 - Math.abs(distance - ring) / cellSize) * (1 - age / SHAPE_GRID.cascadeLife);
}

function wrap(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function hash(i: number, j: number): number {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function tracePath(ctx: CanvasRenderingContext2D, cell: GridCell, project: (x: number, y: number) => readonly [number, number, number]): void {
  if (cell.points.length === 0) {
    const [x, y, f] = project(cell.cx, cell.cy);
    ctx.moveTo(x + cell.radius * f, y);
    ctx.arc(x, y, cell.radius * f, 0, Math.PI * 2);
    return;
  }
  cell.points.forEach(([px, py], k) => {
    const [x, y] = project(px, py);
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

/** 本帧要用的颜色: 线, 高亮描边, 高亮填充, 底色. */
export interface ShapeGridInks {
  readonly line: Rgb;
  readonly hover: Rgb;
  readonly fill: Rgb;
  readonly background: Rgb;
}

/**
 * 画一帧 (CSS 像素坐标, 调用方已按像素比设好变换). 底线按透明度分桶合并描边, 亮格逐个填充加描边, 亮度写回拖尾表.
 *
 * @param ctx 2d 上下文.
 * @param frame 内核帧.
 * @param s 跨帧状态.
 * @param o 选项.
 * @param inks 颜色.
 */
export function drawShapeGrid(ctx: CanvasRenderingContext2D, frame: BackdropFrame, s: ShapeGridState, o: ShapeGridOptions, inks: ShapeGridInks): void {
  const w = frame.fit.width / frame.fit.scale;
  const h = frame.fit.height / frame.fit.scale;
  const size = Math.max(4, o.cellSize);
  const proj = makeProjector(o.tiltX, o.tiltY, w, h);
  const [stepX, stepY] = gridSteps(o.shape, size);
  const ox = wrap(s.offsetX, stepX * 2);
  const oy = wrap(s.offsetY, stepY * 2);
  const shift = [Math.round((s.offsetX - ox) / stepX), Math.round((s.offsetY - oy) / stepY)] as const;
  const cells = layoutCells(o.shape, size, w, h, ox, oy, !proj.flat, shift);
  const decay = o.trail > 0 ? Math.exp(-frame.dt / o.trail) : 0;
  const intro = o.intro && Number.isFinite(frame.elapsed) ? (frame.elapsed / SHAPE_GRID.introSeconds) * Math.hypot(w, h) * 0.6 : Number.POSITIVE_INFINITY;
  const taps = o.clickCascade && Number.isFinite(frame.elapsed) ? frame.pointer.taps.map((t) => ({ x: t.x * w, y: (1 - t.y) * h, age: frame.elapsed - t.at })) : [];
  const buckets: GridCell[][] = Array.from({ length: SHAPE_GRID.buckets + 1 }, () => []);
  const lit: Array<{ cell: GridCell; v: number }> = [];
  const next = new Map<number, number>();
  for (const cell of cells) {
    const [px, py] = proj.project(cell.cx, cell.cy);
    const key = cell.key;
    const edge = Math.min(px, w - px, py, h - py) / (Math.min(w, h) * 0.5);
    const fade = 1 - o.fade * (1 - smoothstep(0, 0.6, edge));
    const reveal = Number.isFinite(intro) ? smoothstep(intro, intro - size * 3, Math.hypot(px - w / 2, py - h / 2)) : 1;
    const alpha = Math.max(0, fade) * reveal;
    buckets[Math.round(alpha * SHAPE_GRID.buckets)].push(cell);
    let v = (s.glow.get(key) ?? 0) * decay;
    v = Math.max(v, spotLight(Math.hypot(px - s.spot.x, py - s.spot.y), o.radius, size) * s.spot.power);
    for (const t of taps) v = Math.max(v, cascadeLight(Math.hypot(px - t.x, py - t.y), t.age, size));
    if (v > SHAPE_GRID.epsilon) next.set(key, v);
    const sparkle = o.twinkle > 0 ? o.twinkle * Math.max(0, Math.sin(frame.time * SHAPE_GRID.twinkleRate + hash(cell.i, cell.j) * 40)) ** SHAPE_GRID.twinkleSharp : 0;
    const shown = Math.min(1, Math.max(v, sparkle)) * alpha;
    if (shown > SHAPE_GRID.epsilon) lit.push({ cell, v: shown });
  }
  s.glow = next;
  ctx.setTransform(frame.fit.scale, 0, 0, frame.fit.scale, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (o.opaqueBackground) {
    ctx.fillStyle = inkOf(inks.background);
    ctx.fillRect(0, 0, w, h);
  }
  ctx.lineWidth = o.lineWidth;
  buckets.forEach((list, b) => {
    if (b === 0 || list.length === 0) return;
    ctx.strokeStyle = inkOf(inks.line, b / SHAPE_GRID.buckets);
    ctx.beginPath();
    for (const cell of list) tracePath(ctx, cell, proj.project);
    ctx.stroke();
  });
  for (const { cell, v } of lit) {
    const tone = o.rainbow ? hueRgb(frame.time * 0.1 + (cell.i + cell.j) * 0.03) : inks.hover;
    ctx.shadowBlur = o.glow * SHAPE_GRID.glowBlur * v;
    ctx.shadowColor = inkOf(tone, v);
    ctx.beginPath();
    tracePath(ctx, cell, proj.project);
    ctx.fillStyle = inkOf(o.rainbow ? tone : inks.fill, o.fillOpacity * v);
    ctx.fill();
    ctx.strokeStyle = inkOf(tone, v);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}
