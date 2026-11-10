// 行为规格参照 docs/research/catalog/animations.md 的 StarBorder 条目, 实现为 HX 自有.

/**
 * CometBorder 的纯函数: 圆角矩形按弧长取点, 加跑一圈的缓动, 折回, 火星的发射与衰减.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-edge.md
 */

/** 三次缓入缓出. */
export function lapEase(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5 ? 4 * x * x * x : 1 - (2 - 2 * x) ** 3 / 2;
}

/** 折回 [0, total). */
export function wrapPhase(value: number, total: number): number {
  if (!(total > 0)) return 0;
  const r = value % total;
  return r < 0 ? r + total : r;
}

/** 圆角矩形周长; 圆角半径钳到短边一半. */
export function roundRectLength(w: number, h: number, r: number): number {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  return 2 * (w - 2 * rr) + 2 * (h - 2 * rr) + 2 * Math.PI * rr;
}

/**
 * 圆角矩形上弧长 s 处的点 (左上角为原点, 从上边左端起顺时针).
 * 返回点与切线方向 (单位向量), 火星沿法向外飘时用.
 */
export function roundRectPoint(w: number, h: number, r: number, s: number): { readonly x: number; readonly y: number; readonly tx: number; readonly ty: number } {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  const top = w - 2 * rr;
  const side = h - 2 * rr;
  const arc = (Math.PI * rr) / 2;
  let d = wrapPhase(s, roundRectLength(w, h, r));
  const corner = (cx: number, cy: number, start: number): { x: number; y: number; tx: number; ty: number } => {
    const a = start + (rr > 0 ? d / rr : 0);
    return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr, tx: -Math.sin(a), ty: Math.cos(a) };
  };
  if (d < top) return { x: rr + d, y: 0, tx: 1, ty: 0 };
  d -= top;
  if (d < arc) return corner(w - rr, rr, -Math.PI / 2);
  d -= arc;
  if (d < side) return { x: w, y: rr + d, tx: 0, ty: 1 };
  d -= side;
  if (d < arc) return corner(w - rr, h - rr, 0);
  d -= arc;
  if (d < top) return { x: w - rr - d, y: h, tx: -1, ty: 0 };
  d -= top;
  if (d < arc) return corner(rr, h - rr, Math.PI / 2);
  d -= arc;
  if (d < side) return { x: 0, y: h - rr - d, tx: 0, ty: -1 };
  d -= side;
  return corner(rr, rr, Math.PI);
}

/** 本帧该发几颗火星: 按速度比 pace 提高发射率, 返回整数与余下的累积. */
export function emitCount(acc: number, dtS: number, pace: number, stars: number, base: number, perPace: number, cap: number): { readonly count: number; readonly acc: number } {
  const next = acc + dtS * (base + perPace * Math.min(cap, Math.max(0, pace))) * Math.max(0, stars);
  const count = Math.floor(next);
  return { count, acc: next - count };
}
