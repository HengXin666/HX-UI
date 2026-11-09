// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 PrismaticBurst 条目, 实现为 HX 自有.
// 光束 (BURST) 在按画质缩放的离屏通道里步进, 泛光 (DOWNSAMPLE / BLUR) 走 ../bloom.ts 的降采样金字塔.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { BLOOM_ENCODE, BLOOM_TIER_LEVELS } from "../bloom";
import { RAYS_COMPOSE } from "./field";

/** PrismaticBurst 的命名常数. 括号里是条目原名或 "本库定". */
export const PRISMATIC_BURST = {
  /** 画质档位到渲染比例 (QUALITY). */
  quality: { low: 0.35, medium: 0.5, high: 0.7 },
  /** 渲染比例下限 (MIN_SCALE). */
  minScale: 0.2,
  /** 入场时长 秒 (INTRO_SECONDS). */
  introSeconds: 2.4,
  /** 点击光环寿命 秒 (PULSE_LIFE). */
  pulseLife: 1.5,
  /** 同时存在的点击光环上限 (MAX_PULSES). */
  maxPulses: 4,
  /** 动画方式编号 (ANIMATIONS). */
  animations: { rotate: 0, rotate3d: 1, hover: 2 },
  /** 点击给相位的冲量与其衰减速率 (本库定). */
  kick: 2.5,
  kickDecay: 3,
  /** 调色板上限 (本库定). */
  maxColors: 8,
  /** 画质档到泛光级数 (BLOOM_LEVELS 为高档的 4, 低 / 中档本库定). */
  bloomLevels: BLOOM_TIER_LEVELS,
  /** 泛光亮部阈值与软膝 (本库定, 对应旧解析增益的 smoothstep(0.3, 1.5, peak) 区间). */
  bloomThreshold: 0.4,
  bloomKnee: 0.4,
  /** 泛光强度 = bloomBase + glow * bloomGain (本库定: glow 为 0 时仍留一层底泛光). */
  bloomBase: 0.3,
  bloomGain: 1.5,
} as const;

export type BurstAnimation = keyof typeof PRISMATIC_BURST.animations;
export type BurstQuality = keyof typeof PRISMATIC_BURST.quality;

/** 一步相位推进: phase += dt * speed * (1 + rush) + kick * dt. */
export function burstPhaseStep(phase: number, dt: number, speed: number, rush: number, kick: number): number {
  return phase + dt * speed * (1 + rush) + kick * dt;
}

/** 泛光强度: 底泛光加 glow 的增量, 不小于 0. */
export function burstBloomStrength(glow: number): number {
  return Math.max(0, PRISMATIC_BURST.bloomBase + glow * PRISMATIC_BURST.bloomGain);
}

/** 渲染比例: 显式 resolution 优先, 否则取画质档, 不低于 MIN_SCALE. */
export function burstScale(quality: BurstQuality, resolution?: number): number {
  const tier = PRISMATIC_BURST.quality[quality] ?? PRISMATIC_BURST.quality.high;
  return Math.max(PRISMATIC_BURST.minScale, resolution ?? tier);
}

const BODY = `
uniform vec3 u_colors[8];
uniform float u_color_count;
uniform float u_phase;
uniform float u_intensity;
uniform vec3 u_orient;
uniform float u_distort;
uniform float u_ray_count;
uniform float u_ray_width;
uniform float u_zoom;
uniform float u_twist;
uniform float u_flow;
uniform float u_center_fade;
uniform float u_grain;
uniform vec2 u_offset;
uniform float u_intro;
uniform float u_burst_on;

const int STEPS = 44;
const int TAP_SLOTS = 8;
const int MAX_PULSES = 4;
const float PULSE_LIFE = 1.5;

vec3 burst_tint(float x) {
  if (u_color_count < 0.5) return 0.5 + 0.5 * cos(HX_TAU * (x + vec3(0.0, 0.33, 0.67)));
  float f = fract(x) * u_color_count;
  float slot = floor(f);
  vec3 a = u_colors[0];
  vec3 b = u_colors[0];
  for (int i = 0; i < 8; i++) {
    if (float(i) == slot) a = u_colors[i];
    if (float(i) == mod(slot + 1.0, u_color_count)) b = u_colors[i];
  }
  return mix(a, b, smoothstep(0.0, 1.0, fract(f)));
}

float bend_angle(vec3 q, float t) {
  return (hx_vnoise3(q + vec3(0.0, 0.0, t)) - 0.5) * HX_TAU;
}

mat3 orient(vec3 e) {
  float cy = cos(e.x); float sy = sin(e.x);
  float cp = cos(e.y); float sp = sin(e.y);
  float cr = cos(e.z); float sr = sin(e.z);
  mat3 yaw = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
  mat3 pitch = mat3(1.0, 0.0, 0.0, 0.0, cp, sp, 0.0, -sp, cp);
  mat3 roll = mat3(cr, sr, 0.0, -sr, cr, 0.0, 0.0, 0.0, 1.0);
  return roll * pitch * yaw;
}

void main() {
  vec2 uv = hx_centered(v_uv * u_res) - u_offset;
  vec3 rd = normalize(vec3(uv / max(u_zoom, 0.05), 1.0));
  vec3 ro = vec3(0.0, 0.0, -3.2);
  mat3 m = orient(u_orient);
  float t = u_phase;
  float amp = clamp(u_distort, 0.0, 4.0);
  float edge = 0.5 - 0.35 * (u_ray_width - 1.0);
  float stepLen = 0.16;
  float marchT = stepLen * hx_hash2(floor(v_uv * u_res)) * (0.2 + 0.4 * u_grain);
  vec3 col = vec3(0.0);
  for (int i = 0; i < STEPS; i++) {
    vec3 pl = m * (ro + rd * marchT);
    float rad = length(pl);
    pl.xy = hx_rot(u_twist * rad) * pl.xy;
    float grow = smoothstep(0.35, 3.0, marchT);
    pl.xz = hx_rot(0.5 * amp * grow * bend_angle(pl.zyx * 0.5 + 3.1, t * 0.9)) * pl.xz;
    vec3 dir = pl / max(rad, 0.0001);
    float n = hx_vnoise3(dir * 5.5 + vec3(0.0, 0.0, t * (0.4 + u_flow)));
    n = 0.65 * n + 0.35 * hx_vnoise3(dir * 13.0 - vec3(t * 0.3));
    float rayPattern = smoothstep(edge + 0.04, edge + 0.2, n);
    float ang = atan(pl.y, pl.x);
    if (u_ray_count > 0.5) {
      float comb = 0.5 + 0.5 * cos(u_ray_count * ang);
      rayPattern *= smoothstep(0.15, 0.95, comb);
    }
    vec3 spectral = burst_tint(rad * 0.45 - t * 0.12 + n * 0.3);
    float core = mix(1.0, smoothstep(0.0, 0.9, rad), clamp(u_center_fade, 0.0, 1.0));
    col += (0.05 / (0.4 + stepLen)) * smoothstep(4.0, 0.0, rad) * smoothstep(4.0, 0.0, rad) * spectral * rayPattern * core;
    marchT += stepLen;
  }
  float unit = 0.5 * min(u_res.x, u_res.y);
  float radius = length(uv) * 2.0;
  float sang = atan(uv.y, uv.x);
  float lift = 1.0;
  if (u_intro < 1.0) {
    float streak = 0.5 + 0.22 * sin(sang * 5.0 + 1.3) + 0.16 * sin(sang * 13.0 + 4.1) + 0.12 * sin(sang * 29.0 + 2.2);
    float front = u_intro * 3.2 * (0.7 + 0.6 * streak);
    lift *= smoothstep(front, front - 0.5, radius);
  }
  for (int j = 0; j < TAP_SLOTS; j++) {
    if (float(j) >= min(u_tap_count, float(MAX_PULSES)) || u_burst_on < 0.5) break;
    float age = u_taps[j].z;
    if (age > PULSE_LIFE) continue;
    vec2 at = (u_taps[j].xy - 0.5) * u_res / min(u_res.x, u_res.y);
    float k = age / PULSE_LIFE;
    float ring = exp(-pow((length(uv - at) - k * 1.4) / (0.04 + 0.08 * k), 2.0)) * (1.0 - k) * (1.0 - k);
    col += burst_tint(length(uv - at) * 2.0 - t * 0.2) * ring * 0.9;
  }
  vec3 energy = col * u_intensity * lift;
  float peak = max(energy.r, max(energy.g, energy.b));
  energy += vec3(hx_grain(v_uv * unit, u_phase)) * u_grain * 0.05 * smoothstep(0.001, 0.32, peak);
  energy *= rays_edge(v_uv);
  o_color = bloom_encode(energy, 1.0);
}
`;

/**
 * PrismaticBurst 的离屏场景片元: 体积步进的放射光束, 沿径向光谱着色, 扭转与噪声弯折, 星形前沿揭开, 点击光环外扩.
 * 输出编码后的线性光, 上屏程序合成场景与泛光金字塔.
 */
export const PRISMATIC_BURST_SCENE = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, RAYS_COMPOSE, BLOOM_ENCODE);
