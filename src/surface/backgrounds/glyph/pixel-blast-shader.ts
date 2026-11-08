// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 PixelBlast 条目, 实现为 HX 自有. 着色器源码与常数.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLSL_GLYPH_KIT } from "./kit";

/** 像素形状编号. */
export const PIXEL_SHAPES = { square: 0, circle: 1, triangle: 2, diamond: 3, cross: 4, ring: 5 } as const;
export type PixelShape = keyof typeof PIXEL_SHAPES;
/** 指针悬停效果编号: 无, 附近像素长大, 只在附近显影. */
export const PIXEL_HOVERS = { none: 0, grow: 1, reveal: 2 } as const;
export type PixelHover = keyof typeof PIXEL_HOVERS;

export const PIXEL_BLAST = {
  /** 规格的点击上限 10, 内核点击队列最多 8 个, 取较小者. */
  maxClicks: 8,
  /** 入场 (由中心向外显影) 时长, 秒. */
  introSeconds: 1.8,
  /** 入场缓出指数: 1 - (1 - t) ** 2.4. */
  introEase: 2.4,
  /** 点击涟漪寿命, 秒 (本库定). */
  rippleSeconds: 3,
} as const;

/**
 * 入场缓出: 1 - (1 - t) ** 2.4.
 *
 * @param t 入场进度 0..1.
 */
export function pixelIntroEase(t: number): number {
  return 1 - (1 - Math.max(0, Math.min(1, t))) ** PIXEL_BLAST.introEase;
}

/** 上屏: 分形噪声图案场 -> 涟漪与指针 -> 入场与边缘淡出 -> Bayer 8 阈值判亮 -> 按覆盖度画形状. */
export const PIXEL_BLAST_FRAGMENT = fragmentSource(`
uniform vec3 u_color;
uniform vec3 u_back;
uniform float u_opaque;
uniform float u_pixel;
uniform float u_shape;
uniform float u_scale;
uniform float u_density;
uniform float u_jitter;
uniform float u_ripples;
uniform float u_ripple_speed;
uniform float u_ripple_thickness;
uniform float u_ripple_gain;
uniform float u_ripple_life;
uniform float u_edge_fade;
uniform float u_softness;
uniform float u_hover;
uniform float u_hover_radius;
uniform float u_intro;

float pattern(vec2 p, float t) {
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  float v = 0.0;
  for (int i = 0; i < 5; i++) {
    v += amp * hx_gnoise(p * freq + vec2(t * 0.3, -t * 0.2) * freq);
    freq *= 2.0;
    amp *= 0.5;
    sum += amp;
  }
  return clamp(v / sum * 0.9 + 0.45, 0.0, 1.0);
}

float shapeMask(vec2 c, float cov, float aa) {
  int mode = int(u_shape + 0.5);
  float s = sqrt(clamp(cov, 0.0, 1.0));
  float side = 0.5 * s;
  float d;
  if (mode == 1) d = length(c) - side * 1.06;
  else if (mode == 2) {
    vec2 q = vec2(abs(c.x), c.y + side * 0.25);
    d = max(q.x * 0.866 + q.y * 0.5, -q.y) - side * 0.62;
  } else if (mode == 3) d = (abs(c.x) + abs(c.y)) * 0.7071 - side * 0.92;
  else if (mode == 4) {
    float arm = 0.42 * s;
    float bar = 0.13 * s + 0.02;
    vec2 q = abs(c);
    d = min(max(q.x - arm, q.y - bar), max(q.x - bar, q.y - arm));
  } else if (mode == 5) d = abs(length(c) - side * 0.8) - max(0.06, 0.18 * s);
  else d = max(abs(c.x), abs(c.y)) - side;
  return 1.0 - smoothstep(-aa * 0.5, aa * 0.5, d);
}

void main() {
  float size = max(1.0, u_pixel * u_dpr);
  vec2 cell = floor(gl_FragCoord.xy / size);
  vec2 local = fract(gl_FragCoord.xy / size) - 0.5;
  vec2 center = (cell + 0.5) * size;
  vec2 p = (center - 0.5 * u_res) / min(u_res.x, u_res.y);
  float cov = pattern(p * u_scale, u_time) * u_density;

  for (int i = 0; i < ${PIXEL_BLAST.maxClicks}; i++) {
    if (float(i) >= u_tap_count || u_ripples < 0.5) break;
    float age = u_taps[i].z;
    if (age >= u_ripple_life) continue;
    vec2 at = (u_taps[i].xy - 0.5) * u_res / min(u_res.x, u_res.y);
    float dist = length(p - at) - age * u_ripple_speed;
    float band = exp(-dist * dist / max(u_ripple_thickness * u_ripple_thickness, 1e-4));
    cov += band * u_ripple_gain * 0.5 * (1.0 - age / u_ripple_life);
  }

  float near = 1.0 - smoothstep(0.0, max(u_hover_radius, 1e-3), length(p - hx_pointer_centered()));
  float brush = near * u_pointer.z;
  int hover = int(u_hover + 0.5);
  if (hover == 1) cov += brush * 0.6;
  if (hover == 2) cov *= mix(1.0, brush, u_pointer.z);

  vec2 uv = center / u_res;
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  cov *= u_edge_fade > 0.0 ? smoothstep(0.0, u_edge_fade * 0.5, edge) : 1.0;
  float eased = 1.0 - pow(1.0 - u_intro, ${PIXEL_BLAST.introEase});
  float front = eased * 1.6;
  cov *= smoothstep(front + 0.04, front - 0.06, length(p));

  float margin = cov - hxg_bayer8(cell);
  float bw = u_softness > 0.0 ? smoothstep(-0.12 * u_softness, 0.12 * u_softness, margin) : step(0.0, margin);
  float h = hx_hash2(cell + 3.1);
  float jitterScale = 1.0 + (h - 0.5) * u_jitter;
  float grow = hover == 1 ? 1.0 + brush * 0.5 : 1.0;
  float ink = bw * shapeMask(local, clamp(max(cov, 0.35) * jitterScale * grow, 0.0, 1.0), 1.5 / size);
  vec3 col = mix(u_back, u_color, ink);
  float alpha = mix(ink, 1.0, u_opaque);
  o_color = vec4(u_opaque > 0.5 ? col : u_color, alpha);
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, GLSL_GLYPH_KIT);
