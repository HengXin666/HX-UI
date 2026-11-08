// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GradientASCII 条目, 实现为 HX 自有. 着色器源码与常数.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLSL_GLYPH_KIT } from "./kit";

/** 渐变形状编号: 地平线拱, 收腰, 底部升起, 日食环. */
export const ASCII_SHAPES = { horizon: 0, pinch: 1, rise: 2, eclipse: 3 } as const;
export type AsciiShape = keyof typeof ASCII_SHAPES;
/** 点击效果编号. */
export const ASCII_CLICKS = { none: 0, wave: 1, burst: 2 } as const;
export type AsciiClick = keyof typeof ASCII_CLICKS;

export const GRADIENT_ASCII = {
  /** 渐变色上限. */
  maxColors: 8,
  /** 点击效果寿命, 秒. */
  clickLife: 1.2,
  /** 指针拖尾寿命, 秒; 拖尾通道的衰减时间常数取它的一半. */
  trailLife: 0.7,
  /** 入场 (字形按随机次序显出) 时长, 秒. */
  introSeconds: 2.4,
  /** 字形格宽高比, 等宽字形约 0.6 个字高. */
  cellAspect: 0.6,
  /** 由浅到密的默认字符. */
  characters: " =+xX0S8#@",
  /** 拖尾缓冲缩放. */
  trailScale: 0.25,
} as const;

/** 上屏: 形状场 -> 色带 -> 每格按亮度挑字形, 指针与点击搅乱字形 -> 渐变底, 辉光, 颗粒. */
export const GRADIENT_ASCII_FRAGMENT = fragmentSource(`
uniform sampler2D u_atlas;
uniform sampler2D u_trail;
uniform vec2 u_atlas_grid;
uniform float u_glyph_count;
uniform float u_has_atlas;
uniform vec3 u_ramp[${GRADIENT_ASCII.maxColors}];
uniform float u_count;
uniform float u_shape;
uniform float u_cell;
uniform float u_aspect_cell;
uniform float u_density;
uniform float u_glyph_opacity;
uniform float u_glow;
uniform float u_dof;
uniform float u_flicker;
uniform float u_softness;
uniform float u_scale;
uniform float u_flow;
uniform float u_gradient_opacity;
uniform float u_grain;
uniform float u_variation;
uniform float u_scramble;
uniform float u_click;
uniform float u_click_life;
uniform float u_intro;
uniform float u_light;

float shapeField(vec2 p, float t) {
  float soft = u_softness;
  float reach = 0.18 + 0.4 * soft;
  int shape = int(u_shape + 0.5);
  float x = p.x;
  float d;
  if (shape == 0) {
    float arch = -0.17 - 0.2 * x * x + 0.02 * sin(t * 0.6);
    d = p.y - arch;
  } else if (shape == 1) {
    float breathe = 1.0 + 0.06 * sin(t * 0.8);
    float sway = 0.02 * sin(x * 1.7 + t * 0.55);
    d = abs(p.y - sway) - (0.03 + 0.3 * x * x) * breathe;
    return exp(-max(d, 0.0) / reach) * (1.0 - smoothstep(-0.2, 0.0, -d) * 0.4);
  } else if (shape == 2) {
    d = p.y + 0.55 - 0.08 * sin(x * 2.0 + t * 0.5);
    return exp(-max(d, 0.0) / (reach * 1.6)) * smoothstep(-0.05, 0.02, d) * (1.0 - 0.35 * x * x);
  } else {
    float r = 0.23 * (1.0 + 0.015 * sin(t * 0.9));
    d = length(p) - r;
  }
  return smoothstep(-0.006, 0.006 + 0.02 * soft, d) * exp(-max(d, 0.0) / reach);
}

vec4 rampColor(float t) {
  float x = smoothstep(0.3, 1.0, t) * (u_count - 1.0);
  int index = int(floor(x));
  vec3 a = u_ramp[0];
  vec3 b = u_ramp[0];
  for (int i = 0; i < ${GRADIENT_ASCII.maxColors}; i++) {
    if (i == index) a = u_ramp[i];
    if (i == min(index + 1, int(u_count) - 1)) b = u_ramp[i];
  }
  return vec4(mix(a, b, fract(x)), smoothstep(0.0, 0.38, t));
}

void main() {
  vec2 size = vec2(u_cell * u_aspect_cell, u_cell) * u_dpr;
  vec2 cell = floor(gl_FragCoord.xy / size);
  vec2 local = fract(gl_FragCoord.xy / size);
  vec2 center = (cell + 0.5) * size;
  float fit = min(u_res.x, u_res.y);
  vec2 p = (center - 0.5 * u_res) / fit / max(u_scale, 0.05);
  vec2 frag = (gl_FragCoord.xy - 0.5 * u_res) / fit / max(u_scale, 0.05);
  float t = u_time;
  vec2 warp = u_flow * 0.08 * vec2(hx_gnoise(p * 2.0 + vec2(t * 0.2, u_variation * 7.31)), hx_gnoise(p * 2.0 - vec2(u_variation * 3.7, t * 0.17)));
  float field = shapeField(p + warp, t);
  vec4 tone = rampColor(shapeField(frag + warp, t));

  float stir = texture(u_trail, center / u_res).r;
  float burst = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_tap_count || u_click < 0.5) break;
    float age = u_taps[i].z / u_click_life;
    if (age >= 1.0) continue;
    vec2 at = (u_taps[i].xy - 0.5) * u_res / fit / max(u_scale, 0.05);
    float dist = length(p - at);
    float hit = u_click < 1.5 ? 1.0 - smoothstep(0.0, 0.08, abs(dist - age * 0.9)) : 1.0 - smoothstep(0.0, 0.25 + 0.3 * age, dist);
    burst = max(burst, hit * (1.0 - age));
  }
  field = clamp(field + burst * 0.35, 0.0, 1.0);

  float order = hx_hash2(cell + 0.37);
  float shown = smoothstep(order, order + 0.15, u_intro * 1.15);
  float tick = floor(t * (4.0 + 20.0 * max(stir, burst)));
  float flick = 1.0 - u_flicker * 0.5 * hx_hash2(cell + floor(t * 6.0) * 1.7);
  float level = clamp(field * (0.4 + u_density) * flick, 0.0, 1.0);
  float count = max(u_glyph_count, 1.0);
  float index = floor(level * (count - 1.0) + 0.5);
  float chaos = max(max(stir * step(0.001, u_scramble), burst), 1.0 - shown);
  if (hx_hash2(cell + tick * 0.13) < chaos) index = floor(hx_hash2(cell * 1.31 + tick) * count);

  vec2 glyphLocal = vec2(0.5 + (local.x - 0.5) * u_aspect_cell, local.y);
  float mask = u_has_atlas > 0.5 ? hxg_glyph(u_atlas, u_atlas_grid, index, glyphLocal) : hxg_block(index, count, local);
  float dofMix = u_dof * smoothstep(0.15, 0.9, length(p));
  mask = mix(mask, 0.3 * level, dofMix) * step(0.5, index + 0.5 * step(0.5, chaos));

  vec3 ink = mix(tone.rgb, tone.rgb * 0.55, u_light);
  vec3 base = tone.rgb * tone.a * u_gradient_opacity * (1.0 - 0.5 * u_light);
  vec3 col = base * 0.35 + ink * mask * u_glyph_opacity * (0.55 + 0.45 * level);
  col += u_glow * tone.rgb * field * field * 0.35;
  col += u_grain * hx_grain(gl_FragCoord.xy, t);
  float alpha = clamp(max(tone.a * u_gradient_opacity * 0.6, mask * u_glyph_opacity), 0.0, 1.0);
  o_color = vec4(col, max(alpha, u_glow * field * 0.5));
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, GLSL_GLYPH_KIT);
