// 行为规格参照 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 的 Backgrounds 条目, 实现为 HX 自有. glyph 路共用的纯函数与 GLSL 片段.

import type { GlyphAtlas } from "../../backdrop/kernel/atlas";
import type { Rgb } from "../../backdrop/kernel/color";
import { clamp } from "../../backdrop/kernel/math";

/** 颜色没解析出来时的中灰, 着色器拿到的永远是三个分量. */
const MID = 0.5;
const GREY: Rgb = [MID, MID, MID];
/** vec3 的分量数. */
const VEC3 = 3;
/** 字形图集每格边长 (像素): 够大才能在缩放采样后保持笔画清楚. */
export const ATLAS_CELL = 64;
/** 默认等宽字体 token, 解析不到时退到通用等宽族. */
export const MONO_TOKEN = "--font-mono";
const MONO_FALLBACK = "monospace";

/**
 * 入场进度 0..1: 关掉入场或减弱动效 (elapsed 为 Infinity) 时直接为 1.
 *
 * @param elapsed 内核的出帧秒数.
 * @param seconds 入场时长 (秒).
 * @param enabled 是否播放入场.
 */
export function introProgress(elapsed: number, seconds: number, enabled: boolean): number {
  if (!enabled || !Number.isFinite(elapsed) || seconds <= 0) return 1;
  return clamp(elapsed / seconds, 0, 1);
}

/**
 * 取第 i 个解析色, 缺了用中灰.
 *
 * @param colors 内核解析出的颜色.
 * @param index 下标.
 */
export function colorAt(colors: readonly Rgb[], index: number): Rgb {
  return colors[index] ?? GREY;
}

/**
 * 把若干解析色平铺成 vec3 数组 uniform, 不足 max 个时重复最后一个.
 *
 * @param colors 内核解析出的颜色.
 * @param max 数组长度 (着色器里的上限).
 */
export function colorList(colors: readonly Rgb[], max: number): { list: Float32Array; size: typeof VEC3 } {
  const list = new Float32Array(max * VEC3);
  const last = colors.length - 1;
  for (let i = 0; i < max; i += 1) list.set(colorAt(colors, Math.min(i, Math.max(0, last))), i * VEC3);
  return { list, size: VEC3 };
}

/**
 * 具名选项换成着色器里的整数编号, 不认识的名字落到 fallback.
 *
 * @param table 名字到编号.
 * @param key 用户给的名字.
 * @param fallback 兜底名字.
 */
export function modeOf<K extends string>(table: Readonly<Record<K, number>>, key: string, fallback: K): number {
  return key in table ? table[key as K] : table[fallback];
}

/** 字体族写法换成 Canvas2D 能用的串: 以 -- 开头的按 CSS 变量在根元素上读. */
export function fontOf(family: string): string {
  if (!family.startsWith("--")) return family;
  if (typeof document === "undefined") return MONO_FALLBACK;
  const value = getComputedStyle(document.documentElement).getPropertyValue(family).trim();
  return value || MONO_FALLBACK;
}

/** 图集描述换成 uniform: 行列, 字数, 是否可用. */
export function atlasUniforms(atlas: GlyphAtlas | null, characters: string): { u_atlas_grid: readonly number[]; u_glyph_count: number; u_has_atlas: number } {
  return {
    u_atlas_grid: atlas ? [atlas.columns, atlas.rows] : [1, 1],
    u_glyph_count: atlas ? atlas.count : Math.max(1, Array.from(characters).length),
    u_has_atlas: atlas ? 1 : 0,
  };
}

/**
 * 有序抖动阈值: Bayer 8x8 / 4x4 / 2x2 递归构造, 返回 0..1 的阈值. 依赖无.
 * 字形采样: 第 index 个字形在格内 local (0..1, y 朝上) 处的覆盖度, 图集按 FLIP_Y 上传, 第 0 行在纹理顶端.
 */
export const GLSL_GLYPH_KIT = `
float hxg_bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float hxg_bayer4(vec2 a) { return hxg_bayer2(0.5 * a) * 0.25 + hxg_bayer2(a); }
float hxg_bayer8(vec2 a) { return hxg_bayer4(0.5 * a) * 0.25 + hxg_bayer2(a); }
float hxg_glyph(sampler2D atlas, vec2 grid, float index, vec2 local) {
  float col = mod(index, grid.x);
  float row = floor(index / grid.x);
  vec2 inset = clamp(local, 0.02, 0.98);
  vec2 uv = vec2((col + inset.x) / grid.x, (grid.y - 1.0 - row + inset.y) / grid.y);
  return texture(atlas, uv).a;
}
float hxg_block(float index, float count, vec2 local) {
  float fill = (index + 1.0) / max(count, 1.0);
  vec2 d = abs(local - 0.5);
  return step(max(d.x, d.y), 0.5 * sqrt(fill) * 0.9);
}
`;
