// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LetterGlitch 条目, 实现为 HX 自有. 着色器源码与常数.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLSL_GLYPH_KIT } from "./kit";

/** 点击效果编号: 无, 横向撕裂. */
export const GLITCH_CLICKS = { none: 0, tear: 1 } as const;
export type GlitchClick = keyof typeof GLITCH_CLICKS;

export const LETTER_GLITCH = {
  /** 默认字符集. */
  characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789",
  /** 闪烁色上限. */
  maxColors: 8,
  /** 入场时长, 秒. */
  introSeconds: 1.4,
  /** 静息时每格每秒换字的次数. */
  restRate: 0.2,
  /** 每格每秒的闪烁次数系数, 乘 glitchAmount ** 1.6. */
  glitchRate: 0.1,
  /** glitchAmount 的指数. */
  glitchExponent: 1.6,
  /** 指针搅动: 移动速度 (CSS 像素每秒) 除以它再钳到 0..1. */
  stirSpeed: 1400,
  /** 撕裂寿命, 秒 (本库定). */
  tearSeconds: 0.6,
  /** 字形格高 = fontSize * (1 + 0.5 * spacing), 宽 = 高 * 0.6 (本库定). */
  spacingGain: 0.5,
  cellAspect: 0.6,
} as const;

/**
 * 每格每秒的闪烁次数: 0.1 * glitchAmount ** 1.6.
 *
 * @param amount glitchAmount 0..1.
 */
export function glitchRate(amount: number): number {
  return LETTER_GLITCH.glitchRate * Math.max(0, amount) ** LETTER_GLITCH.glitchExponent;
}

/**
 * 指针搅动程度 0..1: 归一化速度换成 CSS 像素速度再除以 1400.
 *
 * @param vx 归一化 x 速度 (每秒).
 * @param vy 归一化 y 速度.
 * @param width 宿主 CSS 宽.
 * @param height 宿主 CSS 高.
 */
export function stirOf(vx: number, vy: number, width: number, height: number): number {
  return Math.min(1, Math.hypot(vx * width, vy * height) / LETTER_GLITCH.stirSpeed);
}

/** 上屏: 每格一个字形; 静息时按噪声调制的慢速换字, 闪烁事件按格哈希排在时间轴上, 指针与点击额外触发. */
export const LETTER_GLITCH_FRAGMENT = fragmentSource(`
uniform sampler2D u_atlas;
uniform vec2 u_atlas_grid;
uniform float u_glyph_count;
uniform float u_has_atlas;
uniform vec3 u_palette[${LETTER_GLITCH.maxColors}];
uniform float u_palette_count;
uniform vec3 u_base;
uniform vec3 u_back;
uniform float u_has_back;
uniform vec2 u_cell;
uniform float u_density;
uniform float u_base_opacity;
uniform float u_rate;
uniform float u_rest;
uniform float u_smooth;
uniform float u_radius;
uniform float u_stir;
uniform float u_tear;
uniform float u_tear_life;
uniform float u_flow;
uniform float u_edge_fade;
uniform float u_center_fade;
uniform float u_intro;

vec3 pick(float h) {
  int index = int(floor(h * u_palette_count));
  vec3 c = u_palette[0];
  for (int i = 0; i < ${LETTER_GLITCH.maxColors}; i++) {
    if (i == index) c = u_palette[i];
  }
  return c;
}

void main() {
  vec2 size = u_cell * u_dpr;
  vec2 frag = gl_FragCoord.xy;
  float row = floor(frag.y / size.y);
  float tear = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_tap_count || u_tear < 0.5) break;
    float age = u_taps[i].z / u_tear_life;
    if (age >= 1.0) continue;
    float band = 1.0 - smoothstep(0.0, 0.12 * (1.0 - age) + 0.01, abs(frag.y / u_res.y - u_taps[i].y));
    float rowKick = hx_hash2(vec2(row, float(i) + floor(u_taps[i].z * 20.0)));
    frag.x += band * (rowKick - 0.5) * 40.0 * size.x * (1.0 - age);
    tear = max(tear, band * (1.0 - age));
  }
  vec2 cell = floor(frag / size);
  vec2 local = fract(frag / size);
  float t = u_time;

  float luck = hx_hash2(cell + 0.71);
  float present = step(luck, u_density);
  vec2 p = cell * 0.08;
  float n = 0.65 * hx_vnoise(p + vec2(t * 0.05, t * 0.03)) + 0.35 * hx_vnoise(p * 2.03 - vec2(t * 0.04, -t * 0.06));
  float rest = u_rest * mix(1.0, 0.1 + 1.7 * smoothstep(0.25, 0.8, n), u_flow);
  float phase = hx_hash2(cell + 3.1);
  float restTick = floor(t * rest + phase);
  float index = floor(hx_hash2(cell + restTick * 1.37) * u_glyph_count);

  float period = 1.0 / max(u_rate, 1e-4);
  float slot = floor((t + phase * period) / period);
  float start = hx_hash2(cell - slot * 1.93) * period;
  float age = mod(t + phase * period, period) - start;
  float life = 0.35 + 0.65 * hx_hash2(cell + slot);
  float h = 0.0;
  if (age >= 0.0 && age < life * 2.0) h = u_smooth > 0.5 ? exp(-age * 4.0 / max(life, 0.05)) : step(age, life);

  float dist = length(gl_FragCoord.xy - u_pointer.xy * u_res) / u_dpr;
  float near = (1.0 - smoothstep(0.0, max(u_radius, 0.001), dist)) * u_pointer.z;
  float stirTick = floor(t * 12.0);
  if (hx_hash2(cell + stirTick * 0.61) < near * (0.05 + 0.6 * u_stir)) h = 1.0;
  h = max(h, tear * step(0.5, hx_hash2(cell + floor(t * 30.0))));

  float order = hx_hash2(cell + 9.4);
  float shown = step(order, u_intro * 1.1);
  h = max(h, shown * (1.0 - smoothstep(0.0, 0.15, u_intro * 1.1 - order)) * step(u_intro, 0.999));

  if (h > 0.02) index = floor(hx_hash2(cell + floor(t * 18.0) * 0.77) * u_glyph_count);
  vec2 glyphLocal = vec2(0.5 + (local.x - 0.5) * ${LETTER_GLITCH.cellAspect}, local.y);
  float mask = u_has_atlas > 0.5 ? hxg_glyph(u_atlas, u_atlas_grid, index, glyphLocal) : hxg_block(index, u_glyph_count, local);
  mask *= present * shown;

  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 edge = min(uv, 1.0 - uv);
  mask *= mix(1.0, smoothstep(0.0, 0.25, min(edge.x, edge.y)), u_edge_fade);
  mask *= mix(1.0, smoothstep(0.0, 0.5, length(hx_centered(gl_FragCoord.xy))), u_center_fade);

  vec3 glitch = pick(hx_hash2(cell + slot * 0.53));
  vec3 ink = mix(u_base, glitch, h);
  float alpha = mask * mix(u_base_opacity, 1.0, h);
  if (u_has_back > 0.5) o_color = vec4(mix(u_back, ink, alpha), 1.0);
  else o_color = vec4(ink, alpha);
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, GLSL_GLYPH_KIT);
