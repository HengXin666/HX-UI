// 行为规格参照 docs/research/catalog/animations.md 的 StickerPeel 条目, 实现为 HX 自有.

/**
 * PeelSticker 的纯函数: 折线几何, 半平面裁剪, 镜像矩阵, 阻尼弹簧一步.
 * 规格用 96 x 96 网格在顶点着色器里卷曲; 这里退化为沿一条直线对折 (见 note 的 ENGINE-GAP).
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-sticker.md
 */

export type Pt = readonly [number, number];

/**
 * 折线: 法向 n 指向被揭起的那一边, 位于离中心 fold 处 (沿 n 的投影).
 *
 * @param angleDeg 揭起方向, 0 为从右边揭, 90 为从下边揭.
 * @param amount 揭起量, 占沿 n 方向总长的比例 0..1.
 */
export function foldLine(w: number, h: number, angleDeg: number, amount: number): { readonly nx: number; readonly ny: number; readonly fold: number; readonly extent: number } {
  const a = (angleDeg * Math.PI) / 180;
  const nx = Math.cos(a);
  const ny = Math.sin(a);
  const extent = (Math.abs(nx) * w + Math.abs(ny) * h) / 2;
  const k = Math.max(0, Math.min(1, amount));
  return { nx, ny, fold: extent - k * 2 * extent, extent };
}

/** 半平面裁剪 (Sutherland-Hodgman): 留下 (p - c) . n 在 fold 这一侧的部分. keep "near" 留 <= fold, "far" 留 >= fold. */
export function clipHalfPlane(poly: readonly Pt[], cx: number, cy: number, nx: number, ny: number, fold: number, keep: "near" | "far"): Pt[] {
  const side = (p: Pt): number => ((p[0] - cx) * nx + (p[1] - cy) * ny - fold) * (keep === "near" ? -1 : 1);
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = side(a);
    const sb = side(b);
    if (sa >= 0) out.push(a);
    if ((sa >= 0) !== (sb >= 0)) {
      const t = sa / (sa - sb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

/** 多边形换成 clip-path 的百分比写法; 空多边形返回全裁掉. */
export function polygonCss(poly: readonly Pt[], w: number, h: number): string {
  if (poly.length < 3 || w <= 0 || h <= 0) return "polygon(0 0, 0 0, 0 0)";
  return `polygon(${poly.map(([x, y]) => `${((x / w) * 100).toFixed(3)}% ${((y / h) * 100).toFixed(3)}%`).join(", ")})`;
}

/** 以中心为原点, 关于折线的镜像: x' = (I - 2 n n^T) x + 2 fold n. 返回 CSS matrix() 的六个数. */
export function mirrorMatrix(nx: number, ny: number, fold: number): readonly [number, number, number, number, number, number] {
  return [1 - 2 * nx * nx, -2 * nx * ny, -2 * nx * ny, 1 - 2 * ny * ny, 2 * fold * nx, 2 * fold * ny];
}

/** 阻尼弹簧半隐式一步: 频率 hz, 阻尼比 damping. */
export function springStep(x: number, v: number, target: number, hz: number, damping: number, dt: number): { readonly x: number; readonly v: number } {
  const w = 2 * Math.PI * hz;
  const nv = v + (w * w * (target - x) - 2 * damping * w * v) * dt;
  return { x: x + nv * dt, v: nv };
}
