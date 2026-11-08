// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Aurora 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLOW_GLSL } from "./glow-kit";

/** 色标上限 (规格 MAX_STOPS). */
export const AURORA_MAX_STOPS = 5;
/** 光幕层数上限 (规格 MAX_LAYERS). */
export const AURORA_MAX_LAYERS = 3;
/** 入场时长秒 (规格 INTRO_SECONDS). */
export const AURORA_INTRO_SECONDS = 2.4;
/** 指针横向跟随的时间常数 (规格 dt / 0.6). */
export const AURORA_FOLLOW_TAU = 0.6;
/** 指针抬起光幕的进场 / 离场时间常数 (规格 0.9 / 1.4). */
export const AURORA_REACH_TAU = { enter: 0.9, leave: 1.4 } as const;

const BODY = `
uniform vec3 u_stops[${AURORA_MAX_STOPS}];
uniform float u_stop_count;
uniform float u_amplitude;
uniform float u_blend;
uniform float u_height;
uniform float u_scale;
uniform float u_glow;
uniform float u_brightness;
uniform float u_layers;
uniform float u_flip;
uniform float u_reveal;
uniform vec3 u_reach;

float sq(float v) { return v * v; }
vec3 ramp(float x) {
  float n = max(u_stop_count - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  int i = int(floor(f));
  vec3 a = u_stops[0];
  vec3 b = u_stops[0];
  for (int k = 0; k < ${AURORA_MAX_STOPS}; k++) {
    if (k == i) a = u_stops[k];
    if (k == min(i + 1, int(n))) b = u_stops[k];
  }
  return mix(a, b, smoothstep(0.0, 1.0, fract(f)));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float X = frag.x / u_res.y;
  float yTop = 1.0 - frag.y / u_res.y;
  float y = mix(yTop, 1.0 - yTop, u_flip);
  float aspect = u_res.x / u_res.y;
  float pace = u_time;
  float cover = 0.0;
  float halo = 0.0;
  for (int l = 0; l < ${AURORA_MAX_LAYERS}; l++) {
    if (float(l) >= u_layers) break;
    float seed = float(l) * 3.17;
    float wave = hx_gnoise(vec2(X * 1.4 * u_scale + pace * 0.08 + seed, seed));
    float soft = 0.5 + 0.5 * hx_gnoise(vec2(X * 0.6 * u_scale - pace * 0.05, seed + 7.0));
    float high = 0.26 + soft * 0.6;
    float lobes = 0.86 + 0.14 * hx_gnoise(vec2(X * 0.9 * u_scale - pace * 0.025 + seed, y * 0.3 + pace * 0.04));
    float lift = u_reach.z * 0.18 * exp(-sq((frag.x / u_res.x - u_reach.x) * aspect) * 9.0);
    float h = u_height * high * 1.6 * (1.0 + u_amplitude * 0.6 * wave) * lobes * u_reveal + lift;
    float d = y - h;
    float body = 1.0 - smoothstep(-u_blend * h, u_blend * 0.25 + 0.02, d);
    float rays = 0.78 + 0.22 * hx_gnoise(vec2(X * 26.0 * u_scale + seed, pace * 0.3 + seed));
    float layer = body * rays * mix(0.5, 1.0, smoothstep(0.0, h, y)) * smoothstep(0.0, 0.12, y + 0.02) * (1.0 - float(l) * 0.22);
    cover = max(cover, layer);
    halo += exp(-abs(d) * 10.0) * (1.0 - float(l) * 0.3);
  }
  float flare = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_tap_count) break;
    vec4 tap = u_taps[i];
    float dx = (frag.x / u_res.x - tap.x) * aspect;
    flare += exp(-dx * dx * 24.0) * exp(-tap.z * 1.6) * smoothstep(0.0, 0.08, tap.z);
  }
  float density = clamp(cover * u_brightness + halo * u_glow * 0.18 + flare * 0.35 * cover, 0.0, 1.0);
  vec3 ink = ramp(frag.x / u_res.x) * (1.0 + u_glow * halo * 0.35 + flare * 0.5);
  o_color = glow_finish(ink * u_brightness, density * u_reveal, frag);
}
`;

/** Aurora 的上屏程序. */
export const AURORA_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, GLOW_GLSL);
