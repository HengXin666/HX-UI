// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LightPillar 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { RAYS_COMPOSE } from "./field";

/** LightPillar 的命名常数. 括号里是条目原名或 "本库定". */
export const LIGHT_PILLAR = {
  /** 画质档位到渲染比例 (QUALITY). */
  quality: { low: 0.35, medium: 0.5, high: 0.6 },
  /** 入场时长 秒 (INTRO_SECONDS). */
  introSeconds: 2.1,
  /** 点击脉冲寿命 秒 (PULSE_LIFE). */
  pulseLife: 1.4,
  /** 渲染比例下限 (MIN_SCALE). */
  minScale: 0.25,
  /** 自转时钟系数 (clock += dt * 0.96 * rotationSpeed). */
  spin: 0.96,
  /** 视角跟手速率 (follow = 1 - exp(-dt * 2.4)). */
  followRate: 2.4,
  /** 指针在场程度的速率 (touch, 1 - exp(-dt * 3)). */
  touchRate: 3,
} as const;

export type PillarQuality = keyof typeof LIGHT_PILLAR.quality;

/** 五次平滑曲线 t^3 (t (6t - 15) + 10), 入场用. */
export function quintic(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

const BODY = `
uniform vec3 u_top;
uniform vec3 u_bottom;
uniform float u_clock;
uniform float u_intensity;
uniform float u_flow;
uniform float u_glow;
uniform float u_bloom;
uniform float u_width;
uniform float u_height;
uniform float u_tilt;
uniform float u_twist;
uniform float u_detail;
uniform float u_noise;
uniform vec3 u_view;
uniform float u_reveal;
uniform float u_pulse_on;

const int STEPS = 56;
const int MAX_DETAIL = 6;
const int TAP_SLOTS = 8;
const float PULSE_LIFE = 1.4;
const float MIN_STEP = 0.04;

vec3 pillar_space(vec3 p) {
  p.xy = hx_rot(u_tilt) * p.xy;
  p.xz = hx_rot(p.y * u_twist + u_clock) * p.xz;
  float freq = 1.0;
  float amp = 1.0;
  for (int k = 0; k < MAX_DETAIL; k++) {
    if (float(k) >= u_detail) break;
    float n = hx_vnoise(vec2(p.y * freq + float(k) * 7.3, u_time * u_flow * 0.5 + float(k)));
    p.x += (n - 0.5) * amp * u_noise * 0.6;
    p.z += sin(p.y * freq * 1.7 + u_time * u_flow + float(k)) * amp * u_noise * 0.25;
    freq *= 2.0;
    amp *= 0.5;
  }
  return p;
}

void main() {
  vec2 uv = hx_centered(v_uv * u_res);
  vec3 ro = vec3(0.0, 0.0, -6.0);
  vec3 rd = normalize(vec3(uv, 1.6));
  rd.yz = hx_rot(u_view.y) * rd.yz;
  rd.xz = hx_rot(u_view.x) * rd.xz;
  float radius = 0.1 * u_width;
  float span = 1.2 / max(u_height, 0.05);
  vec3 glow = vec3(0.0);
  float t = 0.1;
  for (int i = 0; i < STEPS; i++) {
    vec3 p = ro + rd * t;
    vec3 q = pillar_space(p);
    float d = max(length(q.xz) - radius, 0.0) * 0.6 + 0.015;
    float along = clamp(q.y / span * 0.5 + 0.5, 0.0, 1.0);
    float height = exp(-pow(q.y / span, 2.0) * 2.0);
    float weight = 1.0 / d;
    vec3 tint = mix(u_bottom, u_top, smoothstep(0.0, 1.0, along));
    float mask = 1.0 - smoothstep(u_reveal - 0.9, u_reveal, 1.0 - along);
    float pulse = 0.0;
    for (int j = 0; j < TAP_SLOTS; j++) {
      if (float(j) >= u_tap_count || u_pulse_on < 0.5) break;
      float age = u_taps[j].z;
      if (age > PULSE_LIFE) continue;
      pulse += exp(-pow((along - age / PULSE_LIFE) * 6.0, 2.0)) * (1.0 - age / PULSE_LIFE);
    }
    glow += tint * weight * height * mask * u_glow * (1.0 + pulse * 2.0);
    t += max(d * 0.6, MIN_STEP);
    if (t > 14.0) break;
  }
  vec3 energy = glow * 1.4 * u_intensity * (1.0 + u_view.z * 0.15);
  float peak = max(energy.r, max(energy.g, energy.b));
  energy += energy * u_bloom * smoothstep(0.4, 2.0, peak);
  energy *= smoothstep(0.0, 0.05, peak) * rays_edge(v_uv);
  o_color = rays_compose(energy);
}
`;

/** LightPillar 的上屏片元: 单通道射线步进, 沿扭转噪声柱累积 1 / d 辉光, 自下而上揭开, 点击脉冲沿柱上行. */
export const LIGHT_PILLAR_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, RAYS_COMPOSE);
