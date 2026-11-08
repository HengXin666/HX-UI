// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 SoftAurora 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLOW_GLSL } from "./glow-kit";

/** 同时生效的点击脉冲上限 (规格 MAX_PULSES). */
export const SOFT_AURORA_MAX_PULSES = 4;
/** 入场 (光带展开) 时长秒 (规格 opening + dt / 2). */
export const SOFT_AURORA_INTRO_SECONDS = 2;
/** 指针跟随时间常数 (规格 dt / 0.325). */
export const SOFT_AURORA_FOLLOW_TAU = 0.325;
/** 指针在场的进场 / 离场时间常数 (规格 0.45 / 0.8). */
export const SOFT_AURORA_PRESENCE_TAU = { enter: 0.45, leave: 0.8 } as const;
/** 噪声相位每秒推进量 (规格 t = 0.4 * uFlow). */
export const SOFT_AURORA_FLOW_RATE = 0.4;

const BODY = `
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform float u_scale;
uniform float u_brightness;
uniform float u_freq;
uniform float u_amp;
uniform float u_band_height;
uniform float u_band_spread;
uniform float u_octave_decay;
uniform float u_layer_offset;
uniform float u_color_speed;
uniform float u_spectrum;
uniform float u_tilt;
uniform float u_influence;
uniform float u_pulse_on;
uniform float u_open;
uniform vec3 u_mouse;

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 p = hx_centered(frag) * hx_rot(u_tilt);
  float t = ${SOFT_AURORA_FLOW_RATE} * u_time;
  vec2 m = hx_pointer_centered();
  float bend = u_influence * u_mouse.z * exp(-(p.x - m.x) * (p.x - m.x) * 6.0);
  float energy = 0.0;
  float amp = 1.0;
  for (float i = 0.0; i < 3.0; i += 1.0) {
    float off = i * (0.9 + u_layer_offset);
    float n = hx_gnoise(vec2(p.x * u_freq / u_scale + t * (0.6 + 0.25 * i) + off, t * 0.3 + off * 1.7));
    float center = (u_band_height - 0.5) + n * u_amp * 0.28 + (m.y - (u_band_height - 0.5)) * bend;
    float width = 0.13 * u_band_spread * (1.0 + 0.6 * i);
    float d = (p.y - center) / max(width, 1e-3);
    energy += amp * exp(-d * d) * (0.75 + 0.25 * hx_gnoise(vec2(p.x * 9.0 + off, t + i)));
    amp *= max(1.0 - u_octave_decay * 3.0, 0.05) * 0.7;
  }
  float pulse = 0.0;
  for (int k = 0; k < 8; k++) {
    if (float(k) >= u_tap_count) break;
    if (float(k) < u_tap_count - ${SOFT_AURORA_MAX_PULSES}.0) continue;
    vec4 tap = u_taps[k];
    vec2 c = (tap.xy - 0.5) * u_res / min(u_res.x, u_res.y);
    float r = tap.z * 0.55;
    float ring = length(p - c) - r;
    pulse += exp(-ring * ring * 90.0) * exp(-tap.z * 1.4);
  }
  energy = energy * u_open + pulse * u_pulse_on * 0.8;
  vec3 hue = 0.5 + 0.5 * cos(HX_TAU * (p.x * 0.35 + t * 0.12 * u_color_speed + vec3(0.0, 0.33, 0.67)));
  vec3 average = mix(u_color2, u_color1, 0.35);
  float top = max(average.r, max(average.g, average.b));
  float core = smoothstep(0.55, 1.6, energy);
  float depth = 1.25 + 0.45 * core;
  vec3 tint = pow(average / max(top, 1e-4), vec3(depth + 0.6));
  vec3 body = mix(u_color2, tint * mix(vec3(1.0), hue * 1.4, 0.35 * u_spectrum), 0.5);
  vec3 ink = mix(body, u_color1, core * 0.8) * u_brightness;
  float density = 0.88 * (1.0 - exp(-1.9 * pow(max(energy, 0.0), 1.7)));
  o_color = glow_finish(ink, density, frag);
}
`;

/** SoftAurora 的上屏程序. */
export const SOFT_AURORA_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, GLOW_GLSL);
