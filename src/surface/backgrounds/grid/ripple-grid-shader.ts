// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 RippleGrid 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";

/** 规格常数与本库定的系数. */
export const RIPPLE_GRID = {
  /** 同时存在的涟漪上限. */
  maxRipples: 12,
  /** 入场: 网格由中心铺开的时长 (秒). */
  introSeconds: 1.6,
  /** 指针在场时光晕升起的速率 (每秒). */
  glowRise: 6,
  /** 指针离开后光晕退去的速率 (每秒). */
  glowFall: 2.5,
  /** 涟漪寿命 (秒, 本库定). */
  rippleLife: 3,
  /** rippleSpeed 为 1 时波前推进速度 (CSS 像素每秒, 本库定). */
  frontSpeed: 260,
  /** 指针移动时留下小涟漪的最短间隔 (秒, 本库定). */
  trailEvery: 0.16,
} as const;

/** 格面样式到着色器枚举. */
export const RIPPLE_VARIANTS = { lines: 0, dots: 1, cross: 2 } as const;
export type RippleVariant = keyof typeof RIPPLE_VARIANTS;

/**
 * 涟漪格面. 屏幕点 (CSS 像素, 以画面中心为原点) 先按 tilt 反投影到倾斜平面, 再按 rotation 转到格面坐标.
 * 每个涟漪 (xy 为屏幕归一化坐标, z 年龄, w 强度) 在格面上推一圈正弦波前, 把格线沿径向推开并提亮;
 * 样式有线, 点, 十字三种, 格子远到挤密时淡出, 指针处光晕, 入场由中心铺开.
 */
const BODY = `
uniform vec3 u_color;
uniform float u_variant;
uniform float u_cell;
uniform float u_width;
uniform float u_glow;
uniform float u_glow_on;
uniform float u_strength;
uniform float u_wave;
uniform float u_front;
uniform float u_tilt;
uniform float u_turn;
uniform float u_fade;
uniform float u_reveal;
uniform float u_light;
uniform vec4 u_ripples[${RIPPLE_GRID.maxRipples}];
uniform float u_ripple_count;
const float LIFE = ${RIPPLE_GRID.rippleLife.toFixed(2)};

// 屏幕点到格面坐标, depth 为到地平线的距离 (不倾斜时恒为焦距).
vec2 plane_of(vec2 s, out float depth) {
  float f = max(u_res.x, u_res.y) / u_dpr;
  float c = cos(u_tilt);
  float k = sin(u_tilt);
  depth = f * c - s.y * k;
  float v = s.y * f / max(depth, 1e-3);
  vec2 q = vec2(s.x * (f + v * k) / f, v);
  return hx_rot(u_turn) * q;
}

void main() {
  vec2 css = u_res / u_dpr;
  vec2 s = gl_FragCoord.xy / u_dpr - 0.5 * css;
  float depth;
  vec2 q = plane_of(s, depth);
  float horizon = u_tilt > 0.001 ? smoothstep(0.0, max(css.x, css.y) * 0.35, depth) : 1.0;

  vec2 push = vec2(0.0);
  float lift = 0.0;
  for (int i = 0; i < ${RIPPLE_GRID.maxRipples}; i++) {
    if (float(i) >= u_ripple_count) break;
    vec4 r = u_ripples[i];
    float od;
    vec2 o = plane_of((r.xy - 0.5) * css, od);
    vec2 d = q - o;
    float dist = length(d);
    float rel = dist - r.z * u_front;
    float life = 1.0 - r.z / LIFE;
    float spread = 1.0 / (1.0 + dist / (u_wave * 5.0));
    float calm = smoothstep(0.0, u_wave * 0.9, dist);
    float w = sin(rel / u_wave * HX_TAU) * exp(-rel * rel / (u_wave * u_wave * 2.25)) * life * life * spread * calm * r.w;
    lift += w;
    push += (dist > 1e-3 ? d / dist : vec2(0.0)) * w;
  }
  lift *= u_strength;
  vec2 g = (q - push * u_strength * u_cell * 0.22) / u_cell;
  vec2 fw = max(fwidth(g), vec2(1e-5));
  vec2 offset = abs(fract(g + 0.5) - 0.5);
  vec2 thin = vec2(1.0);
  float width = u_width * u_dpr;
  float shape = 0.0;
  if (u_variant > 0.5 && u_variant < 1.5) {
    float edge = length(offset / fw);
    shape = (1.0 - smoothstep(width * 1.7 - 0.5, width * 1.7 + 0.5, edge)) * 1.8;
  } else if (u_variant > 1.5) {
    float arm = 0.16;
    vec2 dist = offset / fw;
    vec2 cover = (1.0 - smoothstep(width * 0.5 - 0.5, width * 0.5 + 0.5, dist)) * thin;
    vec2 reach = 1.0 - smoothstep(arm - fw * 0.5, arm + fw * 0.5, offset.yx);
    shape = max(cover.x * reach.x, cover.y * reach.y);
  } else {
    vec2 dist = offset / fw;
    vec2 cover = (1.0 - smoothstep(width * 0.5 - 0.5, width * 0.5 + 0.5, dist)) * thin;
    shape = max(cover.x, cover.y);
  }
  float far = 1.0 - smoothstep(0.18, 0.5, max(fw.x, fw.y));
  shape *= far * horizon;

  vec2 pd = s - (u_pointer.xy - 0.5) * css;
  float halo = u_glow * u_glow_on * u_pointer.z * exp(-dot(pd, pd) / (u_cell * u_cell * 9.0));
  float bright = 0.55 + 0.45 * clamp(abs(lift), 0.0, 1.0) * 2.0 + halo;
  float radius = length(s);
  float reveal = 1.0 - smoothstep(u_reveal - u_cell * 4.0, u_reveal, radius);
  float edgeFade = 1.0 - u_fade * smoothstep(0.35, 0.75, length(s / css));
  float alpha = clamp(shape * min(bright, 1.6), 0.0, 1.0) * reveal * edgeFade;
  vec3 tint = mix(u_color * (1.0 + 0.6 * halo), u_color * (1.0 - 0.35 * halo), u_light);
  o_color = vec4(clamp(tint, 0.0, 1.0), alpha);
}
`;

/** RippleGrid 的完整片元源码. */
export const RIPPLE_GRID_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL);
