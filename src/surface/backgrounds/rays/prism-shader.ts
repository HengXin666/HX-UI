// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Prism 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { RAYS_COMPOSE } from "./field";

/** Prism 的命名常数. 括号里是条目原名或 "本库定". */
export const PRISM = {
  /** 入场时长 秒 (INTRO_SECONDS). */
  introSeconds: 1.4,
  /** 调色板上限 (规格 PALETTE_SIZE 64 是烘焙后的取样数, 本库直接在片元里插值, 上限 8 色). */
  maxColors: 8,
  /** 帧率归一的参考帧率 (follow = 1 - (1 - inertia)^(dt * 60)). */
  refFps: 60,
  /** 横滚回正的每参考帧保留比例 (roll *= 0.9^(dt * 60)). */
  rollKeep: 0.9,
} as const;

export type PrismAnimation = "rotate" | "hover" | "rotate3d";

/** 惯性跟随的每步比例: 按 60fps 归一, inertia 越大跟得越快. */
export function inertiaFollow(dt: number, inertia: number): number {
  if (dt <= 0) return 0;
  return 1 - Math.pow(1 - Math.min(Math.max(inertia, 0), 1), dt * PRISM.refFps);
}

/** 横滚回正一步. */
export function rollDecay(roll: number, dt: number): number {
  return roll * Math.pow(PRISM.rollKeep, dt * PRISM.refFps);
}

const BODY = `
uniform vec3 u_colors[8];
uniform float u_color_count;
uniform float u_clock;
uniform float u_glow;
uniform float u_noise;
uniform float u_scale;
uniform float u_hue;
uniform float u_freq;
uniform float u_sat;
uniform vec3 u_pose;
uniform vec2 u_offset;
uniform float u_inv_base_half;
uniform float u_inv_height;
uniform float u_center_shift;
uniform float u_intro;

const int STEPS = 72;

vec3 prism_tint(float x) {
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

// 正四棱锥的有符号距离 (底在 y = 0, 顶在 y = h): 侧面是一个按法向归一的斜平面, 底面是 y = 0.
float pyramid(vec3 p) {
  float q = max(abs(p.x), abs(p.z));
  float side = (q * u_inv_base_half + p.y * u_inv_height - 1.0) / length(vec2(u_inv_base_half, u_inv_height));
  return max(side, -p.y);
}

mat3 pose(vec3 e) {
  float cy = cos(e.x); float sy = sin(e.x);
  float cp = cos(e.y); float sp = sin(e.y);
  float cr = cos(e.z); float sr = sin(e.z);
  mat3 yaw = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
  mat3 pitch = mat3(1.0, 0.0, 0.0, 0.0, cp, sp, 0.0, -sp, cp);
  mat3 roll = mat3(cr, sr, 0.0, -sr, cr, 0.0, 0.0, 0.0, 1.0);
  return yaw * pitch * roll;
}

void main() {
  vec2 frag = v_uv * u_res - u_offset;
  vec2 uv = hx_centered(frag) * (2.8 / max(u_scale, 0.1)) / mix(0.75, 1.0, u_intro);
  vec3 ro = vec3(0.0, 0.0, -9.0);
  vec3 rd = normalize(vec3(uv, 1.0));
  mat3 m = pose(u_pose);
  vec3 col = vec3(0.0);
  float t = 0.0;
  for (int i = 0; i < STEPS; i++) {
    vec3 p = m * (ro + rd * t);
    p.y += u_center_shift;
    float wob = u_noise * 0.15 * (hx_vnoise3(p * 1.7 + u_clock) - 0.5);
    float d = 0.04 + 0.3 * abs(pyramid(p) + wob);
    float band = length(p) * 0.18 * u_freq + p.y * 0.08 * u_freq - u_clock * 0.25 + u_hue;
    col += prism_tint(band) / d;
    t += d;
    if (t > 22.0) break;
  }
  vec3 light = col * 0.0022 * u_glow;
  light = rays_saturate(light, u_sat);
  light += vec3(hx_grain(frag, u_clock)) * u_noise * 0.08 * smoothstep(0.02, 0.4, hx_luma(light));
  light *= u_intro * u_intro * rays_edge(v_uv);
  o_color = rays_compose(light);
}
`;

/** Prism 的上屏片元: 沿视线以 "距离越近步子越小" 的方式穿过四棱锥, 每步累积 色 / 步长 的辉光, 按半径与高度循环取色. */
export const PRISM_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, RAYS_COMPOSE);
