// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LineWaves 条目, 实现为 HX 自有.
/**
 * LineWaves 的片元与纯函数: 旋转坐标系里一组被正弦域扭曲的平行线, 线随慢漂移起伏;
 * 一条缓慢游走的高光带横穿线组, 颜色沿三色循环; 线挤到一起时自动淡出 (crowd), 噪声给线身微光;
 * 指针像透镜把附近的线推开, 点击处起至多 4 圈衰减涟漪, 入场时从左向右扫出.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel";
import { GLSL_LINES } from "./tokens";

/** 条目 MAX_RIPPLES 4: 只取内核最近点击里的前 4 个. */
export const LINE_WAVES_MAX_RIPPLES = 4;
/** 入场时长 (条目 reveal + dt / 1.8). */
export const LINE_WAVES_INTRO_SECONDS = 1.8;
/** 场时钟倍率 (条目 time += dt * speed * 2.5). */
export const LINE_WAVES_TIME_RATE = 2.5;
/** 颜色循环速率 (条目 cycle += dt * speed * cycleSpeed * 0.05). */
export const LINE_WAVES_CYCLE_RATE = 0.05;
/** 跟手时间常数 (条目 follow 1 - exp(-dt * 10)) 与透镜在场时间常数 (条目 1 - exp(-dt * 5)). */
export const LINE_WAVES_FOLLOW_TAU = 0.1;
export const LINE_WAVES_PRESENCE_TAU = 0.2;
/** 线数上限 (本库定, fwidth 抗锯齿下再密只剩 crowd 淡出). */
export const LINE_WAVES_MAX_LINES = 400;
/** 透镜半径 (短边的比例) 与每单位 mouseInfluence 的推开量 (本库定). */
export const LINE_WAVES_LENS_RADIUS = 0.22;
export const LINE_WAVES_LENS_PUSH = 0.03;
/** 涟漪扩散速度 (短边每秒) 与环宽 (本库定). */
export const LINE_WAVES_RIPPLE_SPEED = 0.6;
export const LINE_WAVES_RIPPLE_WIDTH = 0.05;

/**
 * 入场扫线的位置 (居中坐标的 x). 条目 span = 0.5 * sqrt(aspect^2 + 1), 从 -span - 0.6 扫到 span + 0.6.
 *
 * @param progress 入场进度 0..1.
 * @param aspect 宽高比 (以短边为 1 时的长宽比).
 */
export function revealSweep(progress: number, aspect: number): number {
  const span = 0.5 * Math.sqrt(aspect * aspect + 1);
  return -span - 0.6 + progress * (2 * span + 1.2);
}

const BODY = `
uniform float u_lines;
uniform float u_width;
uniform float u_glow;
uniform float u_bright;
uniform float u_highlight;
uniform float u_hl_width;
uniform float u_warp;
uniform float u_warp_scale;
uniform float u_angle;
uniform float u_edge;
uniform vec3 u_lens;
uniform float u_influence;
uniform float u_ripples;
uniform float u_sweep;
uniform float u_cycle;
uniform float u_light;

void main() {
  float t = u_time * ${LINE_WAVES_TIME_RATE};
  vec2 c = hx_centered(gl_FragCoord.xy);
  vec2 p = hx_rot(u_angle) * c;
  vec2 lens = hx_rot(u_angle) * ((u_lens.xy - 0.5) * u_res / min(u_res.x, u_res.y));
  vec2 dl = p - lens;
  float near = exp(-dot(dl, dl) / ${LINE_WAVES_LENS_RADIUS * LINE_WAVES_LENS_RADIUS}) * u_lens.z;
  float bump = sign(dl.y) * near * u_influence * ${LINE_WAVES_LENS_PUSH};
  float ring = 0.0;
  for (int k = 0; k < ${LINE_WAVES_MAX_RIPPLES}; k++) {
    if (float(k) >= min(u_tap_count, u_ripples)) break;
    vec4 tap = u_taps[k];
    vec2 rc = hx_rot(u_angle) * ((tap.xy - 0.5) * u_res / min(u_res.x, u_res.y));
    float r = length(p - rc) - tap.z * ${LINE_WAVES_RIPPLE_SPEED};
    float fade = exp(-tap.z * 1.3) * smoothstep(0.0, 0.12, tap.z);
    ring += exp(-r * r / ${LINE_WAVES_RIPPLE_WIDTH * LINE_WAVES_RIPPLE_WIDTH}) * fade * tap.w;
  }
  vec2 q = p * 2.0 * u_warp_scale;
  float w = 0.6 * sin(q.x * 0.55 + t * 0.4 + 0.6 * sin(q.y * 0.9 - t * 0.28));
  float drift = 0.7 * (0.18 * sin(p.x * 1.6 - t * 0.33 + 0.7) + 0.1 * sin(p.x * 3.1 + t * 0.21));
  float y = p.y + w * 0.12 * u_warp + drift * 0.2 + bump + ring * 0.025;
  float v = y * u_lines;
  float fw = max(fwidth(v), 1e-5);
  float pixels = abs(fract(v) - 0.5) / fw;
  float hw = 0.5 * u_width * u_dpr;
  float core = ln_line(pixels, hw, 0.75);
  float halo = u_glow * exp(-pixels / (4.0 * u_dpr));
  float crowd = smoothstep(0.18, 0.5, fw);
  float center = 0.5 * (0.2 * sin(t * 0.17) + 0.08 * sin(t * 0.29 + 1.3));
  float width = 0.13 * u_hl_width;
  float band = exp(-pow((p.y - center) / max(width, 1e-3), 2.0));
  float shimmer = mix(1.0, smoothstep(0.15, 0.85, hx_vnoise(vec2(y * 1.6 + t * 0.07, p.x * 0.55 - t * 0.22) * 4.0)), 0.5);
  float level = (core + halo * 0.6) * (1.0 - crowd * 0.85) * shimmer * u_bright * (0.55 + u_highlight * band + ring * 0.6);
  float reveal = 1.0 - smoothstep(u_sweep - 0.6, u_sweep, c.x);
  level *= reveal * ln_edge_fade(v_uv, u_edge);
  vec3 hue = ln_cycle(floor(v) / max(u_lines, 1.0) * 0.5 + u_cycle);
  vec3 col = mix(hue, vec3(1.0), band * u_highlight * 0.25 * (1.0 - u_light));
  o_color = vec4(col, clamp(level, 0.0, 1.0));
}
`;

/** 上屏片元. */
export const LINE_WAVES_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, GLSL_LINES);
