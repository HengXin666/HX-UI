// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Ballpit 条目, 实现为 HX 自有.
import { DEG, seeded } from "./tokens";

export type BallpitClickEffect = "burst" | "none";

export const BALLPIT = {
  /** 规格 FOV (度) 与 CAMERA_Z: 盒子半高 = CAMERA_Z * tan(FOV / 2). */
  fov: 50,
  cameraZ: 20,
  /** 规格 MAX_ASPECT: 宽屏时世界盒宽不超过 1.5 倍原始半高, 多出的宽度靠压低盒子补. */
  maxAspect: 1.5,
  /** 规格 MAX_SPEED: 光标球速度上限 (世界单位 / 秒). */
  maxSpeed: 16,
  /** 规格 SLOP: 穿透容差, 小于它不做位置修正. */
  slop: 0.01,
  /** 规格: 帧长上限 1/20s; 本库定: 子步 1/120s. */
  dtCap: 1 / 20,
  substep: 1 / 120,
  /** 规格: 摩擦 friction^(dt * 60), 甩出后滑行期额外乘 exp(-2.2 dt). */
  glideDamp: 2.2,
  /** 规格: 抓住的球 0.02s 跟手, 手速 0.05s 平滑; 光标半径 0.12s, 位置 0.06s 跟随. */
  holdTau: 0.02,
  holdVelocityTau: 0.05,
  cursorRadiusTau: 0.12,
  cursorFollowTau: 0.06,
  /** 规格: 漂移三轴频率 0.63 / 0.47 / 0.41, z 轴减半. */
  wander: [0.63, 0.47, 0.41] as readonly number[],
  /** 本库定: gravity=1 对应的重力加速度, 光标球半径, 甩出后滑行秒数, 爆开半径与冲量, 数量上限. */
  gravityScale: 20,
  cursorRadius: 1.6,
  glideSeconds: 0.6,
  burstRadius: 6,
  burstImpulse: 22,
  driftScale: 6,
  maxCount: 600,
} as const;

/** 视野: 盒子半宽半高与相机距离 (相机距离使 z=0 平面正好铺满画布). */
export interface BallpitView {
  readonly hw: number;
  readonly hh: number;
  readonly camZ: number;
}

/**
 * 按画布宽高比定世界盒. 宽高比不超过 1.5 时半高固定为 CAMERA_Z * tan(FOV / 2), 更宽时半宽封顶, 半高随之压低.
 *
 * @param aspect 画布宽 / 高.
 */
export function ballpitView(aspect: number): BallpitView {
  const half = Math.tan((BALLPIT.fov * DEG) / 2);
  const hh0 = BALLPIT.cameraZ * half;
  const a = Math.max(0.1, aspect);
  const hh = a > BALLPIT.maxAspect ? (hh0 * BALLPIT.maxAspect) / a : hh0;
  return { hw: hh * a, hh, camZ: hh / half };
}

export interface BallpitWorld {
  readonly count: number;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly z: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly vz: Float32Array;
  readonly r: Float32Array;
  readonly phase: Float32Array;
  readonly tint: Float32Array;
  readonly entered: Uint8Array;
  readonly order: Int32Array;
}

export interface BallpitParams {
  readonly gravity: number;
  readonly friction: number;
  readonly wallBounce: number;
  readonly bounce: number;
  readonly depth: number;
  readonly drift: number;
}

/** 光标球与抓取状态. held 是被抓住的球号, -1 为空. */
export interface BallpitCursor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  held: number;
  hvx: number;
  hvy: number;
  glide: number;
}

export function makeCursor(): BallpitCursor {
  return { x: 0, y: 0, vx: 0, vy: 0, r: 0, held: -1, hvx: 0, hvy: 0, glide: 0 };
}

/**
 * 撒球: 半径在 [minSize, maxSize] 均匀取, 入场时从盒顶上方错峰落下, 否则散在盒内.
 */
export function makeBalls(count: number, view: BallpitView, minSize: number, maxSize: number, depth: number, seed: number, intro: boolean): BallpitWorld {
  const n = Math.max(0, Math.min(BALLPIT.maxCount, Math.round(count)));
  const rand = seeded(seed);
  const f = (): Float32Array => new Float32Array(n);
  const w: BallpitWorld = {
    count: n, x: f(), y: f(), z: f(), vx: f(), vy: f(), vz: f(), r: f(), phase: f(), tint: f(), entered: new Uint8Array(n), order: new Int32Array(n),
  };
  const lo = Math.max(0.05, Math.min(minSize, maxSize));
  const hi = Math.max(lo, maxSize);
  for (let i = 0; i < n; i += 1) {
    const r = lo + rand() * (hi - lo);
    w.r[i] = r;
    w.x[i] = (rand() * 2 - 1) * Math.max(0, view.hw - r);
    w.z[i] = (rand() * 2 - 1) * Math.max(0, depth - r);
    w.y[i] = intro ? view.hh + r + rand() * view.hh * 2 : (rand() * 2 - 1) * Math.max(0, view.hh - r);
    w.entered[i] = intro ? 0 : 1;
    w.phase[i] = rand() * 2 * Math.PI;
    w.tint[i] = rand();
    w.order[i] = i;
  }
  return w;
}

/** 一面墙: 越界就贴回并按 wallBounce 反弹. */
function wall(pos: Float32Array, vel: Float32Array, i: number, lo: number, hi: number, k: number): void {
  if (lo > hi) {
    pos[i] = (lo + hi) / 2;
    vel[i] = 0;
  } else if (pos[i] < lo) {
    pos[i] = lo;
    if (vel[i] < 0) vel[i] = -vel[i] * k;
  } else if (pos[i] > hi) {
    pos[i] = hi;
    if (vel[i] > 0) vel[i] = -vel[i] * k;
  }
}

/** 两球 (或球与光标) 的接触: 按质量 (r^3) 分摊穿透修正, 法向相对速度按 bounce 反弹. */
function resolve(w: BallpitWorld, i: number, j: number, bounce: number): void {
  const dx = w.x[j] - w.x[i];
  const dy = w.y[j] - w.y[i];
  const dz = w.z[j] - w.z[i];
  const sum = w.r[i] + w.r[j];
  const d2 = dx * dx + dy * dy + dz * dz;
  if (d2 >= sum * sum) return;
  const d = Math.sqrt(d2) || 1e-4;
  const [nx, ny, nz] = d2 > 0 ? [dx / d, dy / d, dz / d] : [0, 1, 0];
  const mi = w.r[i] ** 3;
  const mj = w.r[j] ** 3;
  const share = mj / (mi + mj);
  const fix = Math.max(0, sum - d - BALLPIT.slop);
  w.x[i] -= nx * fix * share; w.y[i] -= ny * fix * share; w.z[i] -= nz * fix * share;
  w.x[j] += nx * fix * (1 - share); w.y[j] += ny * fix * (1 - share); w.z[j] += nz * fix * (1 - share);
  const vn = (w.vx[j] - w.vx[i]) * nx + (w.vy[j] - w.vy[i]) * ny + (w.vz[j] - w.vz[i]) * nz;
  if (vn >= 0) return;
  const j0 = (-(1 + bounce) * vn) / (1 / mi + 1 / mj);
  w.vx[i] -= (j0 / mi) * nx; w.vy[i] -= (j0 / mi) * ny; w.vz[i] -= (j0 / mi) * nz;
  w.vx[j] += (j0 / mj) * nx; w.vy[j] += (j0 / mj) * ny; w.vz[j] += (j0 / mj) * nz;
}

/** 光标球是运动学物体: 把球整个推出去, 并带上光标速度. */
function pushByCursor(w: BallpitWorld, i: number, c: BallpitCursor, bounce: number): void {
  if (c.r <= 0 || i === c.held) return;
  const dx = w.x[i] - c.x;
  const dy = w.y[i] - c.y;
  const dz = w.z[i];
  const sum = w.r[i] + c.r;
  const d2 = dx * dx + dy * dy + dz * dz;
  if (d2 >= sum * sum) return;
  const d = Math.sqrt(d2) || 1e-4;
  const [nx, ny, nz] = d2 > 0 ? [dx / d, dy / d, dz / d] : [0, 1, 0];
  w.x[i] = c.x + nx * sum; w.y[i] = c.y + ny * sum; w.z[i] = nz * sum;
  const vn = (w.vx[i] - c.vx) * nx + (w.vy[i] - c.vy) * ny + w.vz[i] * nz;
  if (vn < 0) {
    w.vx[i] -= (1 + bounce) * vn * nx; w.vy[i] -= (1 + bounce) * vn * ny; w.vz[i] -= (1 + bounce) * vn * nz;
  }
}

/**
 * 推进一帧: 子步 1/120s, 重力, 漂移, 摩擦, 墙, 球与球 (按 x 排序扫掠), 光标球, 被抓住的球跟手.
 *
 * @param target 被抓住的球要去的位置 (世界坐标), 无抓取时忽略.
 */
export function stepBalls(w: BallpitWorld, view: BallpitView, p: BallpitParams, c: BallpitCursor, dt: number, clock: number, target: readonly [number, number]): void {
  const frame = Math.min(dt, BALLPIT.dtCap);
  if (frame <= 0) return;
  const steps = Math.max(1, Math.ceil(frame / BALLPIT.substep));
  const h = frame / steps;
  const g = p.gravity * BALLPIT.gravityScale;
  const wander = p.drift * BALLPIT.driftScale;
  const [fx, fy, fz] = BALLPIT.wander;
  for (let s = 0; s < steps; s += 1) {
    const t = clock + s * h;
    const damp = Math.pow(p.friction, h * 60) * (c.glide > 0 ? Math.exp(-BALLPIT.glideDamp * h) : 1);
    for (let i = 0; i < w.count; i += 1) {
      const ph = w.phase[i];
      w.vy[i] -= g * h;
      w.vx[i] += Math.sin(t * fx + ph) * wander * h;
      w.vy[i] += Math.cos(t * fy + ph * 1.7) * wander * h;
      w.vz[i] += Math.sin(t * fz + ph * 2.3) * wander * h * 0.5;
      w.vx[i] *= damp; w.vy[i] *= damp; w.vz[i] *= damp;
      w.x[i] += w.vx[i] * h; w.y[i] += w.vy[i] * h; w.z[i] += w.vz[i] * h;
    }
    if (c.held >= 0 && c.held < w.count) {
      const i = c.held;
      const k = 1 - Math.exp(-h / BALLPIT.holdTau);
      const nx = w.x[i] + (target[0] - w.x[i]) * k;
      const ny = w.y[i] + (target[1] - w.y[i]) * k;
      const m = 1 - Math.exp(-h / BALLPIT.holdVelocityTau);
      c.hvx += ((nx - w.x[i]) / h - c.hvx) * m;
      c.hvy += ((ny - w.y[i]) / h - c.hvy) * m;
      [w.x[i], w.y[i], w.vx[i], w.vy[i], w.vz[i]] = [nx, ny, c.hvx, c.hvy, 0];
    }
    sweep(w, p.bounce);
    for (let i = 0; i < w.count; i += 1) {
      pushByCursor(w, i, c, p.bounce);
      const r = w.r[i];
      if (!w.entered[i] && w.y[i] + r < view.hh) w.entered[i] = 1;
      wall(w.x, w.vx, i, -view.hw + r, view.hw - r, p.wallBounce);
      wall(w.z, w.vz, i, -p.depth + r, p.depth - r, p.wallBounce);
      wall(w.y, w.vy, i, -view.hh + r, w.entered[i] ? view.hh - r : Number.POSITIVE_INFINITY, p.wallBounce);
    }
  }
  c.glide = Math.max(0, c.glide - frame);
}

/** 按 x 排序 (插入排序, 帧间几乎有序) 后扫掠, 只检查 x 区间重叠的对. */
function sweep(w: BallpitWorld, bounce: number): void {
  const o = w.order;
  for (let a = 1; a < w.count; a += 1) {
    const k = o[a];
    let b = a - 1;
    while (b >= 0 && w.x[o[b]] > w.x[k]) {
      o[b + 1] = o[b];
      b -= 1;
    }
    o[b + 1] = k;
  }
  for (let a = 0; a < w.count; a += 1) {
    const i = o[a];
    for (let b = a + 1; b < w.count; b += 1) {
      const j = o[b];
      if (w.x[j] - w.x[i] > w.r[i] + w.r[j]) break;
      resolve(w, i, j, bounce);
    }
  }
}

/** 世界点在 z 处的透视倍率 (z=0 为 1). */
export function depthScale(view: BallpitView, z: number): number {
  return view.camZ / Math.max(1e-3, view.camZ - z);
}

/** 点下处 (世界 xy, z=0 平面) 命中的最前面的球号, 没有返回 -1. */
export function pickBall(w: BallpitWorld, view: BallpitView, px: number, py: number): number {
  let best = -1;
  for (let i = 0; i < w.count; i += 1) {
    const s = depthScale(view, w.z[i]);
    if (Math.hypot(w.x[i] * s - px, w.y[i] * s - py) > w.r[i] * s) continue;
    if (best < 0 || w.z[i] > w.z[best]) best = i;
  }
  return best;
}

/** 点击爆开: 半径 6 内的球按距离线性衰减地被推开, 并带一点向上. */
export function burstAt(w: BallpitWorld, x: number, y: number): void {
  for (let i = 0; i < w.count; i += 1) {
    const dx = w.x[i] - x;
    const dy = w.y[i] - y;
    const d = Math.hypot(dx, dy);
    if (d >= BALLPIT.burstRadius) continue;
    const k = BALLPIT.burstImpulse * (1 - d / BALLPIT.burstRadius);
    w.vx[i] += (d > 0 ? dx / d : 0) * k;
    w.vy[i] += (d > 0 ? dy / d : 1) * k + k * 0.3;
    w.vz[i] += (w.tint[i] - 0.5) * k * 0.5;
  }
}
