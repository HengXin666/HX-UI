// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Dither 条目, 实现为 HX 自有. 着色器源码与常数.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLSL_GLYPH_KIT } from "./kit";

/** 抖动模式编号, 与着色器里的分支一一对应. */
export const DITHER_MODES = { bayer: 0, bayer4: 1, bayer2: 2, halftone: 3, lines: 4, crosshatch: 5, noise: 6, none: 7 } as const;
export type DitherMode = keyof typeof DITHER_MODES;
/** 指针效果编号: 擦除, 只在指针附近显影, 涟漪. */
export const DITHER_EFFECTS = { erase: 0, reveal: 1, ripple: 2 } as const;
export type DitherEffect = keyof typeof DITHER_EFFECTS;

export const DITHER = {
  /** 调色板上限. */
  maxPalette: 8,
  /** 入场 (由中心向外显影) 时长, 秒. */
  introSeconds: 1.8,
  /** 点击涟漪寿命, 秒. */
  rippleSeconds: 1.6,
  /** 拖尾衰减时间常数: 0.08 + trail * 0.7 秒. */
  trailBase: 0.08,
  trailSpan: 0.7,
  /** 指针影响半径 (短边归一化) 每单位 mouseRadius. */
  reachPerRadius: 0.18,
  /** 拖尾缓冲相对画布的缩放, 拖尾是低频场, 四分之一分辨率足够. */
  trailScale: 0.25,
} as const;

/**
 * 拖尾每帧的保留比例: exp(-dt / (0.08 + 0.7 * trail)). dt 为 0 (静态帧) 时为 1.
 *
 * @param dt 帧长 (秒).
 * @param trail 拖尾长度 0..1.
 */
export function ditherDecay(dt: number, trail: number): number {
  return Math.exp(-dt / (DITHER.trailBase + DITHER.trailSpan * Math.max(0, trail)));
}

/** 拖尾通道: 上一帧乘衰减, 再在指针处盖一个软圆, 取较大者. */
export const DITHER_TRAIL = fragmentSource(`
uniform sampler2D u_trail;
uniform float u_decay;
uniform float u_reach;
void main() {
  float prev = texture(u_trail, v_uv).r * u_decay;
  vec2 aspect = vec2(u_res.x / min(u_res.x, u_res.y), u_res.y / min(u_res.x, u_res.y));
  float d = length((v_uv - u_pointer.xy) * aspect);
  float stamp = u_pointer.z * (1.0 - smoothstep(0.0, u_reach, d));
  o_color = vec4(max(prev, stamp), 0.0, 0.0, 1.0);
}
`);

/** 上屏: 波场 -> 对比与亮度 -> 指针与点击 -> 入场 -> 有序抖动量化 -> 调色. */
export const DITHER_FRAGMENT = fragmentSource(`
uniform sampler2D u_trail;
uniform vec3 u_palette[${DITHER.maxPalette}];
uniform float u_palette_count;
uniform float u_levels;
uniform float u_pixel;
uniform float u_wave_speed;
uniform float u_wave_freq;
uniform float u_wave_amp;
uniform float u_scale;
uniform float u_contrast;
uniform float u_brightness;
uniform float u_mode;
uniform float u_effect;
uniform float u_strength;
uniform float u_reach;
uniform float u_ripple_on;
uniform float u_ripple_life;
uniform float u_intro;

float wave(vec2 p, float t) {
  p *= u_scale * u_wave_freq;
  vec2 warp = vec2(hx_gnoise(p * 0.7 + vec2(t, 0.0)), hx_gnoise(p * 0.7 - vec2(0.0, t)));
  p += u_wave_amp * 2.0 * warp;
  return hx_fbm(p + vec2(t * 0.6, -t * 0.4), 4);
}

float threshold(vec2 cell) {
  int mode = int(u_mode + 0.5);
  if (mode == 0) return hxg_bayer8(cell);
  if (mode == 1) return hxg_bayer4(cell);
  if (mode == 2) return hxg_bayer2(cell);
  if (mode == 3) return clamp(length(fract(cell / 4.0) - 0.5) * 1.414, 0.0, 1.0);
  if (mode == 4) return fract(cell.y / 4.0);
  if (mode == 5) return min(fract((cell.x + cell.y) / 4.0), fract((cell.x - cell.y) / 4.0)) * 2.0;
  if (mode == 6) return hx_hash2(cell);
  return 0.5;
}

vec3 ramp(float q) {
  if (u_palette_count < 2.5) return mix(u_palette[0], u_palette[1], q);
  int index = int(floor(q * (u_palette_count - 1.0) + 0.5));
  vec3 picked = u_palette[0];
  for (int i = 0; i < ${DITHER.maxPalette}; i++) {
    if (i == index) picked = u_palette[i];
  }
  return picked;
}

void main() {
  float size = max(1.0, u_pixel * u_dpr);
  vec2 cell = floor(gl_FragCoord.xy / size);
  vec2 center = (cell + 0.5) * size;
  vec2 uv = center / u_res;
  vec2 p = (center - 0.5 * u_res) / min(u_res.x, u_res.y);
  float t = u_time * u_wave_speed * 10.0;
  float v = wave(p, t);
  v = clamp((v - 0.5) * u_contrast + 0.5 + u_brightness, 0.0, 1.0);

  float touch = texture(u_trail, uv).r;
  int effect = int(u_effect + 0.5);
  if (effect == 0) v = mix(v, 0.0, touch * u_strength);
  if (effect == 1) v *= mix(1.0, touch, clamp(u_strength, 0.0, 1.0) * u_pointer.z);
  if (effect == 2) {
    float d = length(p - hx_pointer_centered());
    v = clamp(v + touch * u_strength * 0.35 * sin(d * 48.0 - u_time * 8.0), 0.0, 1.0);
  }

  float ring = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_tap_count || u_ripple_on < 0.5) break;
    float age = u_taps[i].z / u_ripple_life;
    if (age >= 1.0) continue;
    vec2 at = (u_taps[i].xy - 0.5) * u_res / min(u_res.x, u_res.y);
    float r = age * 1.2;
    float band = 1.0 - smoothstep(0.0, 0.06 + 0.04 * age, abs(length(p - at) - r));
    ring = max(ring, band * (1.0 - age));
  }
  v = clamp(v + ring * 0.6, 0.0, 1.0);

  float front = u_intro * 1.6;
  v *= smoothstep(front + 0.04, front - 0.12, length(p));

  float n = max(2.0, u_levels);
  float q = clamp(floor(v * (n - 1.0) + threshold(cell)), 0.0, n - 1.0) / (n - 1.0);
  o_color = vec4(ramp(q), 1.0);
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, GLSL_GLYPH_KIT);
