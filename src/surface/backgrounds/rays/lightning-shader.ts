// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Lightning 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { RAYS_COMPOSE } from "./field";

/** Lightning 的命名常数. 括号里是条目原名或 "本库定". */
export const LIGHTNING = {
  /** 常驻电光条数上限 (MAX_BOLTS). */
  maxBolts: 4,
  /** 同时存在的点击落雷上限 (MAX_STRIKES). */
  maxStrikes: 4,
  /** 落雷先导下行时长 秒 (LEADER). */
  leader: 0.11,
  /** 落雷寿命 秒 (LIFE). */
  life: 1.3,
  /** 入场时长 秒 (本库定). */
  introSeconds: 1.2,
  /** 电光底部偏向指针的跟随速率 (本库定). */
  leanRate: 5,
} as const;

/** 揭开线: uv.y 高于 1.1 - 2.4 * intro 的部分可见, intro 为 1 时全开. */
export function revealLine(intro: number): number {
  return 1.1 - 2.4 * intro;
}

const BODY = `
uniform vec3 u_color;
uniform float u_phase;
uniform float u_intensity;
uniform float u_size;
uniform float u_thickness;
uniform float u_glow;
uniform float u_flicker;
uniform float u_bolts;
uniform float u_spread;
uniform float u_branches;
uniform float u_xoff;
uniform float u_angle;
uniform vec2 u_lean;
uniform float u_intro;
uniform float u_strike_on;

const int MAX_BOLTS = 4;
const int MAX_BRANCHES = 3;
const int TAP_SLOTS = 8;
const int MAX_STRIKES = 4;
const float LEADER = 0.11;
const float LIFE = 1.3;
const float PERIOD = 8.0;
const float WARP = 2.1;

// 电光横向偏移: 先做一次域扭曲, 再叠 5 层值噪声, 高频层幅度递减, 成锯齿状折线.
float bolt_shift(float y, float seed) {
  float drift = u_phase * 0.15;
  float w = (hx_vnoise(vec2(y * 1.3 + seed, drift + seed * 3.1)) - 0.5) * WARP;
  float value = 0.0;
  float amplitude = 0.5;
  float freq = 2.4 / max(u_size, 0.2);
  for (int i = 0; i < 5; i++) {
    value += (hx_vnoise(vec2(y * freq + w, seed * 7.0 + float(i) * 3.7 + drift)) - 0.5) * amplitude;
    freq *= 2.1;
    amplitude *= 0.5;
  }
  return value * 0.55 * u_size;
}

// 到一条电光的横向距离, 按斜率修正成近似法向距离.
float bolt_dist(vec2 p, float x0, float seed) {
  float eps = 0.004;
  float x = x0 + bolt_shift(p.y, seed);
  float slope = (bolt_shift(p.y + eps, seed) - bolt_shift(p.y - eps, seed)) / (2.0 * eps);
  return abs(p.x - x) / sqrt(1.0 + min(slope * slope, 3.0));
}

void add_glow(float d, float strength, float gCore, float gPixel, inout float e, inout float core, inout float line) {
  core += (1.0 - smoothstep(gCore - gPixel, gCore + gPixel, d)) * min(strength, 1.6);
  e += strength * u_glow * (gCore * 1.5 / (d + gPixel) + 9.0 * exp(-d / (gCore * 3.5)));
  line += strength * 3.0 * exp(-d / (gCore * 2.0));
}

void main() {
  vec2 p = hx_centered(v_uv * u_res);
  float top = 0.5 * u_res.y / min(u_res.x, u_res.y);
  vec2 pivot = vec2(u_xoff, top);
  p = pivot + hx_rot(u_angle) * (p - pivot);
  float span = 2.0 * top;
  float along = clamp((top - p.y) / span, 0.0, 1.0);
  float gPixel = 1.0 / min(u_res.x, u_res.y);
  float gCore = max(0.0016 * u_thickness, gPixel * 0.6);
  float energy = 0.0;
  float core = 0.0;
  float line = 0.0;
  float flash = 0.0;
  for (int i = 0; i < MAX_BOLTS; i++) {
    if (float(i) >= u_bolts) break;
    float seed = hx_hash1(float(i) + 0.5);
    float cyc = mod(u_phase, PERIOD * 64.0) / (PERIOD * 0.25) + seed;
    float shape = floor(cyc) + float(i) * 31.0;
    float window = fract(cyc);
    float shown = smoothstep(0.0, 0.03, window) * (1.0 - smoothstep(0.3, 0.42, window));
    float steady = 0.82 + 0.18 * sin(HX_TAU * (u_phase * 13.0 + seed)) * sin(HX_TAU * (u_phase * 7.0 + seed * 1.7));
    float burst = exp(-window * 28.0) * 1.2;
    float strength = shown * mix(1.0, steady, u_flicker) + burst * u_flicker;
    flash += burst * u_flicker;
    float x0 = u_xoff + (float(i) - (u_bolts - 1.0) * 0.5) * u_spread * 0.6;
    x0 += (u_lean.x - x0) * along * u_lean.y * 0.35;
    float reach = 0.35 * u_size + 0.1;
    float estimate = abs(p.x - x0);
    float weight = 1.0 - smoothstep(reach * 0.6, reach, estimate);
    if (weight <= 0.0 || strength <= 0.0) continue;
    add_glow(bolt_dist(p, x0, shape), strength * weight, gCore, gPixel, energy, core, line);
    for (int b = 0; b < MAX_BRANCHES; b++) {
      if (float(b) >= u_branches * 3.0) break;
      float hb = hx_hash2(vec2(shape, float(b)));
      float startAlong = 0.2 + 0.22 * float(b) + 0.15 * hb;
      float sy = top - startAlong * span;
      float len = span * (0.12 + 0.18 * hx_hash1(hb + 2.0));
      float front = sy - len;
      float sx = x0 + bolt_shift(sy, shape);
      float side = hb > 0.5 ? 1.0 : -1.0;
      float bAlong = clamp((sy - p.y) / len, 0.0, 1.0);
      float bx = sx + side * (sy - p.y) * 0.55 + bolt_shift(p.y, shape + 11.0 + float(b)) * 0.5;
      float bd = abs(p.x - bx) * 0.87;
      float taper = pow(1.0 - bAlong, 1.6) * smoothstep(0.0, 0.2, bAlong) * smoothstep(front, front + 0.08, p.y) * step(p.y, sy);
      core += (1.0 - smoothstep(gCore * 0.6 - gPixel, gCore * 0.6 + gPixel, bd)) * taper * min(strength, 1.0) * 0.8;
      energy += strength * taper * u_glow * 8.0 * exp(-bd / (gCore * 4.0));
      line += strength * taper * 1.8 * exp(-bd / (gCore * 1.2));
    }
  }
  for (int j = 0; j < TAP_SLOTS; j++) {
    if (float(j) >= min(u_tap_count, float(MAX_STRIKES)) || u_strike_on < 0.5) break;
    vec4 tap = u_taps[j];
    float age = tap.z;
    if (age > LIFE) continue;
    vec2 target = (tap.xy - 0.5) * u_res / min(u_res.x, u_res.y);
    float front = mix(top, target.y, min(age / LEADER, 1.0));
    float strength = age < LEADER ? 0.7 : 1.8 * exp(-(age - LEADER) * 3.2);
    flash += strength * 0.6 * step(LEADER, age);
    if (p.y < front - 0.01) continue;
    float t = clamp((top - p.y) / max(top - target.y, 0.01), 0.0, 1.0);
    float x = target.x + bolt_shift(p.y, float(j) * 5.3 + 40.0) * sin(t * HX_PI) * 1.3;
    add_glow(abs(p.x - x), strength * smoothstep(front - 0.01, front + 0.03, p.y), gCore, gPixel, energy, core, line);
  }
  float hot = clamp(core + smoothstep(6.0, 20.0, energy) * 0.55, 0.0, 1.0);
  float stroke = smoothstep(1.0, 3.6, line * u_intensity);
  float halo = 1.0 - exp(-energy * 0.35);
  vec3 light = u_color * halo * 1.1 * u_intensity;
  light += mix(u_color, vec3(1.0), hot * 0.85) * stroke * 1.6;
  light += u_color * flash * 0.08 * (0.4 + 0.6 * v_uv.y) * u_intensity;
  float reveal = u_intro >= 1.0 ? 1.0 : smoothstep(0.0, 0.08, v_uv.y - (1.1 - 2.4 * u_intro));
  light *= reveal * rays_edge(v_uv);
  o_color = rays_compose(light);
}
`;

/** Lightning 的上屏片元: 域扭曲分形折线电光, 分叉渐细, 周期闪现加稳态抖闪, 点击落雷先导下行后爆闪. */
export const LIGHTNING_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, RAYS_COMPOSE);
