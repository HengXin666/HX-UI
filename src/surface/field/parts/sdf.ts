// 行为规格参照 docs/research/catalog/animations.md 的 ShapeBlur 与 ElectricLogo 条目 (FIELD / PAD / FAR 距离场), 实现为 HX 自有.
/**
 * 遮罩到有符号距离场: 两遍一维平方距离变换 (下包络抛物线), 外正内负, 单位是距离场像素.
 * 再编码进一张 RGBA8 画布 (R 高 8 位, G 低 8 位) 给着色器手动双线性解码. 纯函数部分不碰 DOM.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { SOFT } from "../tokens";
import { maskSize, type MaskCanvas } from "./mask";

/** 一维平方距离变换: f 为每格代价 (0 或 FAR), 返回到最近 0 格的平方距离. */
export function edt1d(f: Float64Array): Float64Array {
  const n = f.length;
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q += 1) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k -= 1;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k += 1;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1] < q) k += 1;
    d[q] = (q - v[k]) ** 2 + f[v[k]];
  }
  return d;
}

/** 二维: 到 target 为真的格的欧氏距离. */
function edt2d(target: (i: number) => boolean, w: number, h: number): Float32Array {
  const grid = new Float64Array(w * h);
  for (let i = 0; i < w * h; i += 1) grid[i] = target(i) ? 0 : SOFT.far;
  const col = new Float64Array(h);
  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < h; y += 1) col[y] = grid[y * w + x];
    const out = edt1d(col);
    for (let y = 0; y < h; y += 1) grid[y * w + x] = out[y];
  }
  const row = new Float64Array(w);
  const dist = new Float32Array(w * h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) row[x] = grid[y * w + x];
    const out = edt1d(row);
    for (let x = 0; x < w; x += 1) dist[y * w + x] = Math.sqrt(out[x]);
  }
  return dist;
}

/** 有符号距离: inside[i] 非零为形状内. 外正内负, 边界两侧各差半格. */
export function signedDistance(inside: Uint8Array, w: number, h: number): Float32Array {
  const out = edt2d((i) => inside[i] !== 0, w, h);
  const inn = edt2d((i) => inside[i] === 0, w, h);
  const sd = new Float32Array(w * h);
  for (let i = 0; i < w * h; i += 1) sd[i] = inside[i] ? -(inn[i] - 0.5) : out[i] - 0.5;
  return sd;
}

/** 编码: 0.5 + d / (2 range) 夹到 0..1, 拆成 16 位的高低两字节. */
export function encodeDistance(d: number, range: number): readonly [number, number] {
  const v = Math.round(Math.min(1, Math.max(0, 0.5 + d / (2 * range))) * 65535);
  return [v >> 8, v & 255];
}

export interface SdfField {
  readonly canvas: HTMLCanvasElement;
  /** 宽 / 高 (含留白). */
  readonly aspect: number;
  /** 编码范围 (距离场像素). */
  readonly range: number;
  /** 距离场宽 (像素). */
  readonly width: number;
}

/** 把遮罩画进带留白的距离场画布并编码. 拿不到 2d 上下文时返回 null. */
export function sdfCanvas(mask: MaskCanvas, size: number = SOFT.field, pad: number = SOFT.pad): SdfField | null {
  if (typeof document === "undefined") return null;
  const [w, h] = maskSize(mask.aspect, size);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const inner = 1 / (1 + 2 * pad);
  ctx.drawImage(mask.canvas, (w * (1 - inner)) / 2, (h * (1 - inner)) / 2, w * inner, h * inner);
  const data = ctx.getImageData(0, 0, w, h);
  const inside = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i += 1) inside[i] = (data.data[i * 4 + 3] ?? 0) > 127 ? 1 : 0;
  const sd = signedDistance(inside, w, h);
  const range = Math.max(w, h) * pad;
  for (let i = 0; i < w * h; i += 1) {
    const [hi, lo] = encodeDistance(sd[i], range);
    data.data.set([hi, lo, 0, 255], i * 4);
  }
  ctx.putImageData(data, 0, 0);
  return { canvas, aspect: w / h, range, width: w };
}

/** 着色器端: 手动双线性解码 (字节拆分的值不能交给硬件插值). 需要 u_field, u_field_range. 返回距离场像素. */
export const SDF_GLSL = `
uniform sampler2D u_field;
uniform float u_field_range;
float fieldTexel(ivec2 c) {
  ivec2 sz = textureSize(u_field, 0);
  vec4 t = texelFetch(u_field, clamp(c, ivec2(0), sz - 1), 0);
  return ((t.r * 255.0 * 256.0 + t.g * 255.0) / 65535.0 - 0.5) * 2.0 * u_field_range;
}
float fieldDistance(vec2 uv) {
  vec2 sz = vec2(textureSize(u_field, 0));
  vec2 inside = clamp(uv, 0.0, 1.0);
  vec2 p = inside * sz - 0.5;
  ivec2 i = ivec2(floor(p));
  vec2 f = fract(p);
  float a = mix(fieldTexel(i), fieldTexel(i + ivec2(1, 0)), f.x);
  float b = mix(fieldTexel(i + ivec2(0, 1)), fieldTexel(i + ivec2(1, 1)), f.x);
  return mix(a, b, f.y) + length((uv - inside) * sz);
}
`;
