// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 SideRays 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { RAYS_COMPOSE } from "./field";

/** SideRays 的命名常数. 括号里是条目原名或 "本库定". */
export const SIDE_RAYS = {
  /** 像素预算 (PIXEL_BUDGET). */
  pixelBudget: 2.4e6,
  /** 揭开时长 秒 (reveal + dt / 1.6). */
  revealSeconds: 1.6,
  /** 聚光角跟手速率 (ease = 1 - exp(-dt * 6)). */
  focusRate: 6,
  /** 聚光角相对 aim 的最大偏离, 乘 spread (spread * 1.5). */
  focusReach: 1.5,
  /** 朝向弹簧刚度 (stiffness = 18), 阻尼取临界 2 * sqrt(k). */
  stiffness: 18,
} as const;

/** 临界阻尼弹簧一步 (半隐式欧拉): 返回新的 [value, velocity]. */
export function springStep(value: number, velocity: number, target: number, dt: number, stiffness: number = SIDE_RAYS.stiffness): [number, number] {
  const damping = 2 * Math.sqrt(stiffness);
  const v = velocity + ((target - value) * stiffness - velocity * damping) * dt;
  return [value + v * dt, v];
}

const BODY = `
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec2 u_origin;
uniform float u_base;
uniform float u_blend;
uniform float u_intensity;
uniform float u_spread;
uniform float u_density;
uniform float u_sharp;
uniform float u_falloff;
uniform float u_glow;
uniform float u_sat;
uniform float u_dust;
uniform vec3 u_focus;
uniform float u_reveal;

const float DUST_CELLS = 38.0;

float ray_band(float u, float t, float seed, float width) {
  float sway = 0.15 * sin(t * 0.21 + seed * 3.0);
  float n = 0.7 * hx_vnoise(vec2(u + sway + seed, t * 0.3)) + 0.3 * hx_vnoise(vec2(u * 2.4 + sway * 1.5 + seed * 1.7, t * 0.45 + 3.0));
  float aa = smoothstep(0.12, 0.45, fwidth(u));
  return mix(smoothstep(0.5 - width, 0.5 + width, n), 0.5, aa);
}

float dust_speck(vec2 p, float t) {
  vec2 cell = floor(p * DUST_CELLS);
  vec2 f = fract(p * DUST_CELLS);
  float h = hx_hash2(cell);
  if (h > u_dust * 0.35) return 0.0;
  vec2 center = 0.2 + 0.6 * hx_hash22(cell + 7.0);
  float size = 0.05 + 0.08 * h;
  float edge = 0.04;
  float twinkle = 0.55 + 0.45 * sin(t * 1.9 + h * 41.0);
  return (1.0 - smoothstep(size - edge, size + edge, length(f - center))) * twinkle;
}

void main() {
  float t = u_time;
  vec2 asp = u_res / min(u_res.x, u_res.y);
  vec2 d = (v_uv - u_origin) * asp;
  float r = length(d);
  float angle = atan(d.y, d.x) - u_base;
  angle = atan(sin(angle), cos(angle));
  float fan = exp(-pow(angle / max(u_spread * 0.55, 0.01), 2.0));
  float u = angle * u_density * 4.0;
  float width = mix(0.32, 0.03, u_sharp);
  float a = ray_band(u, t, 0.0, width);
  float b = ray_band(u * 1.3 + 5.0, t * 0.8, 11.0, width);
  float focus = 1.0 + u_focus.z * exp(-pow((angle - u_focus.x) / max(u_focus.y, 0.01), 2.0));
  float reach = 1.0 / (1.0 + pow(r / 0.4, u_falloff));
  float core = u_glow * exp(-r * 4.0) * 0.6;
  vec3 light = (u_color_a * a * (1.0 - u_blend * 0.5) + u_color_b * b * u_blend) * fan * reach * focus;
  light += mix(u_color_a, u_color_b, u_blend * 0.5) * core * fan;
  light += mix(u_color_a, u_color_b, 0.5) * dust_speck(v_uv * asp, t) * u_dust * reach * 0.8;
  light *= u_intensity * (1.0 - smoothstep(u_reveal * 2.6 - 0.45, u_reveal * 2.6, r)) * smoothstep(0.0, 0.35, u_reveal);
  light = rays_saturate(light, u_sat) * rays_edge(v_uv);
  float peak = max(light.r, max(light.g, light.b));
  float mapped = 1.0 - exp(-peak);
  vec3 tone = hx_tonemap(light);
  tone = mix(tone, vec3(mapped), smoothstep(0.7, 1.0, mapped) * 0.55);
  o_color = rays_compose(-log(max(1.0 - tone, 0.0001)));
}
`;

/** SideRays 的上屏片元: 侧向扇形双色光束, 两层值噪声成束 (0.7 / 0.3), fwidth 抗锯齿, 指针聚光, 浮尘闪烁. */
export const SIDE_RAYS_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, RAYS_COMPOSE);
