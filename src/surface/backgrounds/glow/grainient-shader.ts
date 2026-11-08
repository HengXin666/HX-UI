// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Grainient 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLOW_GLSL } from "./glow-kit";

/** 色标上限 (规格 MAX_COLORS). */
export const GRAINIENT_MAX_COLORS = 8;
/** 搅动轨迹点上限 (规格 MAX_STIRS). */
export const GRAINIENT_MAX_STIRS = 24;
/** 同时生效的点击旋涡上限 (规格 MAX_TWIRLS). */
export const GRAINIENT_MAX_TWIRLS = 4;
/** 搅动点寿命秒 (规格 STIR_LIFE). */
export const GRAINIENT_STIR_LIFE = 1.3;
/** 搅动点的落点间隔与长成时间秒 (规格 STIR_STEP). */
export const GRAINIENT_STIR_STEP = 0.06;
/** 点击旋涡寿命秒 (规格 TWIRL_LIFE). */
export const GRAINIENT_TWIRL_LIFE = 2.6;
/** 入场时长秒 (规格 INTRO_SECONDS). */
export const GRAINIENT_INTRO_SECONDS = 1.6;
/** 渐变类型编号 (规格 TYPES). */
export const GRAINIENT_TYPES = { linear: 0, radial: 1 } as const;
/** 亮底模式的提亮量 (规格 LIFT). */
export const GRAINIENT_LIFT = 0.2;
/** 指针跟随时间常数 (规格 exp(-dt / 0.06)). */
export const GRAINIENT_FOLLOW_TAU = 0.06;
/** 时钟换流动相位 (规格 time += dt * speed * 0.16). */
export const GRAINIENT_TIME_RATE = 0.16;

/** sRGB 与 Oklab 互转: 色标在 Oklab 里插值, 中段不发灰. */
const OKLAB_GLSL = `
vec3 to_lin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 to_srgb(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
vec3 to_lab(vec3 c) {
  vec3 l = to_lin(c);
  vec3 lms = vec3(dot(l, vec3(0.4122, 0.5363, 0.0514)), dot(l, vec3(0.2119, 0.6807, 0.1074)), dot(l, vec3(0.0883, 0.2817, 0.6300)));
  lms = pow(max(lms, 0.0), vec3(1.0 / 3.0));
  return vec3(dot(lms, vec3(0.2105, 0.7936, -0.0041)), dot(lms, vec3(1.9780, -2.4286, 0.4506)), dot(lms, vec3(0.0259, 0.7828, -0.8087)));
}
vec3 from_lab(vec3 c) {
  vec3 lms = vec3(c.x + 0.3963 * c.y + 0.2158 * c.z, c.x - 0.1056 * c.y - 0.0639 * c.z, c.x - 0.0895 * c.y - 1.2915 * c.z);
  lms = lms * lms * lms;
  return to_srgb(vec3(dot(lms, vec3(4.0767, -3.3077, 0.2310)), dot(lms, vec3(-1.2684, 2.6098, -0.3413)), dot(lms, vec3(-0.0042, -0.7034, 1.7076))));
}
`;

const BODY = `
uniform vec3 u_ramp[${GRAINIENT_MAX_COLORS}];
uniform float u_count;
uniform float u_type;
uniform vec2 u_dir;
uniform float u_bands;
uniform float u_flow;
uniform float u_scale;
uniform float u_softness;
uniform float u_silk;
uniform float u_grain_amount;
uniform float u_grain_size;
uniform float u_grain_live;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_seed;
uniform float u_stir;
uniform float u_twirl_on;
uniform float u_reveal;
uniform float u_lift;
uniform vec4 u_stirs[${GRAINIENT_MAX_STIRS}];
uniform float u_stir_count;

vec3 rampLab(float f) {
  float n = max(u_count - 1.0, 1.0);
  float x = clamp(f, 0.0, 1.0) * n;
  float i = min(floor(x), n - 1.0);
  float edge = 0.5 * clamp(u_softness, 0.0, 1.0);
  float shaped = smoothstep(0.5 - edge, 0.5 + edge, x - i);
  vec3 a = u_ramp[0];
  vec3 b = u_ramp[0];
  for (int k = 0; k < ${GRAINIENT_MAX_COLORS}; k++) {
    if (float(k) == i) a = u_ramp[k];
    if (float(k) == min(i + 1.0, n)) b = u_ramp[k];
  }
  return mix(to_lab(a), to_lab(b), shaped);
}

vec2 swirl(vec2 p, vec2 c, float angle) { return c + hx_rot(angle) * (p - c); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 k = u_res / min(u_res.x, u_res.y);
  vec2 p = (v_uv - 0.5) * k;
  for (int i = 0; i < ${GRAINIENT_MAX_STIRS}; i++) {
    if (float(i) >= u_stir_count) break;
    vec4 s = u_stirs[i];
    vec2 c = (s.xy - 0.5) * k;
    float life = 1.0 - s.z;
    p = swirl(p, c, u_stir * 1.6 * s.w * life * life * exp(-dot(p - c, p - c) * 28.0));
  }
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_tap_count) break;
    if (float(i) < u_tap_count - ${GRAINIENT_MAX_TWIRLS}.0) continue;
    vec4 tap = u_taps[i];
    if (tap.z > ${GRAINIENT_TWIRL_LIFE}) continue;
    vec2 c = (tap.xy - 0.5) * k;
    float ease = exp(-tap.z * 1.35) - exp(-tap.z * 9.0);
    p = swirl(p, c, u_twirl_on * 5.0 * ease * exp(-dot(p - c, p - c) * 7.0));
  }
  float t = u_time * ${GRAINIENT_TIME_RATE};
  vec2 q = p / max(u_scale, 0.01);
  vec2 warp = vec2(hx_fbm(q * 1.3 + vec2(t, u_seed), 4), hx_fbm(q * 1.3 + vec2(u_seed + 4.7, -t), 4)) - 0.5;
  q += warp * u_flow * 0.9;
  float f = u_type > 0.5 ? length(q) * 1.25 : dot(q, u_dir) / max(k.x, k.y) + 0.5;
  f += u_silk * 0.06 * sin(dot(q, vec2(11.0, 7.0)) + 6.0 * warp.x + t * 3.0);
  float band = f * max(u_bands, 1.0);
  f = abs(fract(band * 0.5) * 2.0 - 1.0);
  f = u_bands <= 1.0 ? clamp(band, 0.0, 1.0) : f;
  vec3 lab = rampLab(f);
  lab = mix(to_lab(u_ramp[0]), lab, smoothstep(0.0, 1.0, u_reveal * 1.5 - length(v_uv - 0.5) * 0.6));
  lab.x = 0.5 + (lab.x - 0.5) * u_contrast;
  lab.yz *= u_saturation;
  lab.x = mix(lab.x, 1.0, u_lift);
  vec2 cell = floor(frag / max(u_grain_size * u_dpr, 1.0));
  float grain = hx_hash2(cell + floor(u_time * 24.0 * u_grain_live) * 7.13) - 0.5;
  vec3 ink = from_lab(lab) + grain * u_grain_amount;
  o_color = glow_finish(ink, 1.0, frag);
}
`;

/** Grainient 的上屏程序. */
export const GRAINIENT_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, GLOW_GLSL, OKLAB_GLSL);
