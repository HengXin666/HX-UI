// 行为规格参照 docs/research/catalog/animations.md 的 OrbitImages 条目, 实现为 HX 自有.

/**
 * OrbitRing 的纯函数: 轨道采样 (按弧长取位), 前后排外观, 每圈缓动.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-loop.md
 */

export type OrbitShape = "ellipse" | "circle" | "square" | "star";

export interface OrbitPathSpec {
  readonly shape: OrbitShape;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly radius: number;
  readonly starPoints: number;
  readonly starInnerRatio: number;
  /** 整条轨道的旋转 (度). */
  readonly rotation: number;
}

export interface OrbitTable {
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  /** 累计弧长, 末项是周长. */
  readonly acc: Float64Array;
  /** 原点在中心时 y 的半幅, 前后排归一用. */
  readonly halfHeight: number;
}

const TURN = Math.PI * 2;
const DEG = Math.PI / 180;

/** 多边形轮廓上第 u (0..1, 按顶点均分) 处的点. */
function polygonAt(verts: readonly (readonly [number, number])[], u: number): [number, number] {
  const n = verts.length;
  const f = (((u % 1) + 1) % 1) * n;
  const i = Math.floor(f);
  const a = verts[i % n];
  const b = verts[(i + 1) % n];
  const k = f - i;
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

/** 未旋转的轮廓点, 起点在正下方 (前排中央), 顺时针. */
export function shapePoint(spec: OrbitPathSpec, u: number): [number, number] {
  const a = u * TURN + Math.PI / 2;
  if (spec.shape === "ellipse") return [Math.cos(a) * spec.radiusX, Math.sin(a) * spec.radiusY];
  if (spec.shape === "circle") return [Math.cos(a) * spec.radius, Math.sin(a) * spec.radius];
  if (spec.shape === "square") {
    const r = spec.radius;
    return polygonAt([[0, r], [-r, r], [-r, -r], [r, -r], [r, r]], u);
  }
  const n = Math.max(2, Math.round(spec.starPoints));
  const verts = Array.from({ length: n * 2 }, (_, i) => {
    const rr = i % 2 === 0 ? spec.radius : spec.radius * spec.starInnerRatio;
    const ang = (i / (n * 2)) * TURN + Math.PI / 2;
    return [Math.cos(ang) * rr, Math.sin(ang) * rr] as const;
  });
  return polygonAt(verts, u);
}

/** 采样整条轨道并旋转, 记下累计弧长. */
export function buildOrbit(spec: OrbitPathSpec, samples: number): OrbitTable {
  const n = Math.max(8, Math.round(samples));
  const xs = new Float64Array(n + 1);
  const ys = new Float64Array(n + 1);
  const acc = new Float64Array(n + 1);
  const c = Math.cos(spec.rotation * DEG);
  const s = Math.sin(spec.rotation * DEG);
  let half = 0;
  for (let i = 0; i <= n; i += 1) {
    const [x, y] = shapePoint(spec, i / n);
    xs[i] = x * c - y * s;
    ys[i] = x * s + y * c;
    half = Math.max(half, Math.abs(ys[i]));
    if (i > 0) acc[i] = acc[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
  }
  return { xs, ys, acc, halfHeight: half };
}

/** 按弧长比例 u (任意实数, 折回 0..1) 取轨道上的点. */
export function orbitAt(table: OrbitTable, u: number): { readonly x: number; readonly y: number } {
  const n = table.acc.length - 1;
  const total = table.acc[n];
  const want = (((u % 1) + 1) % 1) * total;
  let lo = 0;
  let hi = n;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (table.acc[mid] <= want) lo = mid;
    else hi = mid;
  }
  const seg = table.acc[hi] - table.acc[lo];
  const k = seg > 0 ? (want - table.acc[lo]) / seg : 0;
  return { x: table.xs[lo] + (table.xs[hi] - table.xs[lo]) * k, y: table.ys[lo] + (table.ys[hi] - table.ys[lo]) * k };
}

/** 前后排外观: y 越靠下 (前排) 越大; 靠上 (后排) 缩小压暗. depth 在 -1 (最后) 到 1 (最前). */
export function orbitLook(y: number, halfHeight: number, grow: number, shrink: number, dim: number): { readonly depth: number; readonly scale: number; readonly opacity: number } {
  const depth = halfHeight > 0 ? Math.max(-1, Math.min(1, y / halfHeight)) : 0;
  const front = Math.max(0, depth);
  const back = Math.max(0, -depth);
  return { depth, scale: 1 + grow * front - shrink * back, opacity: 1 - dim * back };
}

/** 每圈缓动: 整圈数不变, 圈内按三次缓入缓出走 (easing ease); linear 原样. */
export function lapPhase(lap: number, easing: "linear" | "ease"): number {
  if (easing === "linear") return lap;
  const whole = Math.floor(lap);
  const t = lap - whole;
  return whole + (t < 0.5 ? 4 * t * t * t : 1 - (2 - 2 * t) ** 3 / 2);
}
