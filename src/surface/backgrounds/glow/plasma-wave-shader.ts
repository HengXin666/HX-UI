// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 PlasmaWave 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLOW_GLSL } from "./glow-kit";

/** 规格的泛光金字塔层数 (BLOOM_LEVELS); 本实现单通道解析光晕, 见组件头 ENGINE-GAP. */
export const PLASMA_WAVE_BLOOM_LEVELS = 4;
/** 规格的粗通道降采样比 (COARSE_RATIO). */
export const PLASMA_WAVE_COARSE_RATIO = 3;
/** 入场时长秒 (规格 INTRO_SECONDS). */
export const PLASMA_WAVE_INTRO_SECONDS = 1.8;
/** 规格的光照像素上限 (MAX_LIGHT_PIXELS). */
export const PLASMA_WAVE_MAX_LIGHT_PIXELS = 2400000;
/** 色标上限. */
export const PLASMA_WAVE_MAX_COLORS = 4;
/** 热点横向跟随速率 (规格 exp(-dt * 6)). */
export const PLASMA_WAVE_HEAT_FOLLOW_RATE = 6;
/** 热度弹簧: 刚度 120, 阻尼 19, 上限 1.15 (规格原式). */
export const PLASMA_WAVE_HEAT_SPRING = { stiffness: 120, damping: 19, max: 1.15 } as const;
/** 透镜跟随速率 (规格 exp(-dt * 8)). */
export const PLASMA_WAVE_LENS_RATE = 8;

const BODY = `
uniform vec3 u_ramp[${PLASMA_WAVE_MAX_COLORS}];
uniform float u_count;
uniform vec2 u_speeds;
uniform float u_dir2;
uniform vec2 u_bends;
uniform float u_thickness;
uniform float u_focal;
uniform float u_turn;
uniform vec2 u_offset;
uniform float u_brightness;
uniform float u_glow;
uniform float u_core;
uniform float u_presence;
uniform vec2 u_heat;
uniform vec3 u_lens;

vec3 ramp(float x) {
  float n = max(u_count - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  float i = min(floor(f), n - 1.0);
  vec3 a = u_ramp[0];
  vec3 b = u_ramp[0];
  for (int k = 0; k < ${PLASMA_WAVE_MAX_COLORS}; k++) {
    if (float(k) == i) a = u_ramp[k];
    if (float(k) == min(i + 1.0, n)) b = u_ramp[k];
  }
  return mix(a, b, smoothstep(0.0, 1.0, f - i));
}

float ribbon(vec2 p, float phase, float bend, float lift) {
  float y = 0.22 * bend * sin(p.x * 2.1 + phase) + 0.08 * bend * sin(p.x * 4.7 - phase * 1.3) + lift;
  return abs(p.y - y);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 k = u_res / min(u_res.x, u_res.y);
  vec2 p = (v_uv - 0.5) * k;
  vec2 lc = (u_lens.xy - 0.5) * k;
  vec2 ld = p - lc;
  p = lc + ld * (1.0 - 0.25 * u_lens.z * exp(-dot(ld, ld) * 10.0));
  p = hx_rot(u_turn) * (p - u_offset);
  p *= u_focal / max(u_focal - p.y * 0.5, 0.2);
  float hx = (u_heat.x - 0.5) * k.x;
  float lift = 0.12 * u_heat.y * exp(-(p.x - hx) * (p.x - hx) * 6.0);
  float t = u_time * 20.0;
  float d1 = ribbon(p, t * u_speeds.x, u_bends.x, lift);
  float d2 = ribbon(p * vec2(0.8, 1.0) + vec2(1.7, 0.0), t * u_speeds.y * u_dir2 + 2.0, u_bends.y, lift * 0.6);
  float w = 0.01 + u_thickness * 0.04;
  float peak = w / (d1 + w * 0.15) * 2.0 + w / (d2 + w * 0.15) * 1.4;
  float halo = exp(-d1 * 9.0) + 0.7 * exp(-d2 * 9.0);
  float field = 1.0 - exp(-peak * 0.06 - halo * 0.5 * u_glow);
  float soft = smoothstep(0.03, 0.36, field);
  float hot = smoothstep(0.32, 0.8, field);
  vec3 ink = ramp(v_uv.x + 0.1 * sin(t * 0.05));
  vec3 color = mix(ink, vec3(1.0), smoothstep(12.0, 26.0, peak) * u_core);
  float alpha = (soft * u_glow * 0.7 + hot) * u_presence;
  float feather = 0.1;
  float body = smoothstep(0.15 - feather, 0.15 + feather, alpha);
  o_color = glow_finish(color * u_brightness * (0.6 + 0.6 * hot), clamp(alpha * u_brightness, 0.0, 1.0) * mix(0.85, 1.0, body), frag);
}
`;

/** PlasmaWave 的上屏程序. */
export const PLASMA_WAVE_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL, GLOW_GLSL);
