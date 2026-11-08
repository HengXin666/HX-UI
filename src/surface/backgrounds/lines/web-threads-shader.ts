// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 WebThreads 条目, 实现为 HX 自有.
/**
 * WebThreads 的片元与纯函数: 至多 24 条正弦线在等距的 "结点" 处收拢成束 (像蛛丝或双螺旋),
 * 每条线振幅 1 + i * taper, 可镜像成对; 线芯加 1 / d^falloff 光晕, 能量叠高处发白 (core).
 * 入场时各线依次从左往右描出 (STROKE 1.25s, 错开 min(0.12, 0.9 / (n - 1))), 点击沿线放出至多 3 道光涌.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel";
import { GLSL_LINES } from "./tokens";

/** 条目常数: 线数, 颜色数, 光涌数, 光涌时长与逐线错开, 单线描出时长. */
export const WEB_MAX_THREADS = 24;
export const WEB_MAX_COLORS = 6;
export const WEB_MAX_SURGES = 3;
export const WEB_SURGE_SECONDS = 1.6;
export const WEB_SURGE_STAGGER = 0.05;
export const WEB_STROKE_SECONDS = 1.25;

/** 逐线描出的错开秒数 (条目 staggerFor). */
export function webStagger(count: number): number {
  return Math.min(0.12, 0.9 / Math.max(count - 1, 1));
}

/** 整段入场时长 (条目 introLength). */
export function webIntroLength(count: number): number {
  return (count - 1) * webStagger(count) + WEB_STROKE_SECONDS;
}

const BODY = `
uniform float u_count;
uniform float u_freq;
uniform float u_spread;
uniform float u_taper;
uniform float u_position;
uniform float u_pinch;
uniform float u_nodes;
uniform float u_angle;
uniform float u_glow;
uniform float u_falloff;
uniform float u_thick;
uniform float u_bright;
uniform float u_depth;
uniform float u_pulses;
uniform float u_mirror;
uniform float u_shimmer;
uniform float u_fade;
uniform float u_grain;
uniform float u_intro;
uniform float u_stagger;
uniform float u_surge;
uniform vec3 u_bend;
uniform vec3 u_core;
uniform vec3 u_bg;
uniform float u_opaque;
uniform float u_light;

float hubAt(float x) { return (floor(x * u_nodes) + 0.5) / u_nodes; }

void main() {
  float sh = min(u_res.x, u_res.y);
  vec2 c = hx_rot(u_angle) * (gl_FragCoord.xy - 0.5 * u_res);
  vec2 uv = c / u_res.yy + vec2(0.5 * u_res.x / u_res.y, 0.5);
  float x = uv.x / max(u_res.x / u_res.y, 1e-3);
  float pixel = 1.0 / u_res.y;
  float t = u_time;
  float pinchEnv = pow(abs(sin(HX_PI * x * u_nodes)), u_pinch);
  float twist = u_depth * smoothstep(0.0, 0.07, abs(x - hubAt(x)));
  vec2 pc = hx_rot(u_angle) * ((u_bend.xy - 0.5) * u_res) / u_res.yy + vec2(0.5 * u_res.x / u_res.y, 0.5);
  float bend = u_bend.z * exp(-pow((x - pc.x / max(u_res.x / u_res.y, 1e-3)) * 4.0, 2.0));
  float energy = 0.0;
  vec3 tint = vec3(0.0);
  float total = u_count * (u_mirror > 0.5 ? 2.0 : 1.0);
  for (int k = 0; k < ${WEB_MAX_THREADS * 2}; k++) {
    if (float(k) >= total) break;
    float i = mod(float(k), u_count);
    float side = float(k) >= u_count ? -1.0 : 1.0;
    float amp = (1.0 + i * u_taper) / (1.0 + (u_count - 1.0) * u_taper);
    float phase = i * 0.7 + (side < 0.0 ? HX_PI : 0.0);
    float z = t * 1.3 + phase;
    float wave = sin(x * u_freq * HX_TAU * 0.5 / max(u_nodes, 1.0) + t + phase * u_depth);
    float ly = u_position + side * u_spread * amp * wave * pinchEnv * (1.0 - twist * 0.5 * (1.0 - cos(z)));
    ly += bend * (pc.y - ly) * 0.35;
    float d = abs(uv.y - ly);
    float px = d / pixel / u_dpr;
    float head = u_intro - i * u_stagger;
    float progress = clamp(head / ${WEB_STROKE_SECONDS}, 0.0, 1.0);
    float born = progress > 0.0 ? smoothstep(-0.05, 0.03, progress * 1.1 - x) : 0.0;
    float depth = mix(1.0, 0.5 + 0.5 * cos(z), u_depth);
    float bead = 0.0;
    for (int s = 0; s < ${WEB_MAX_SURGES}; s++) {
      if (float(s) >= u_surge) break;
      vec4 tap = u_taps[s];
      float pos = (tap.z - i * ${WEB_SURGE_STAGGER}) / ${WEB_SURGE_SECONDS};
      float run = pos * 1.4 - 0.2;
      bead += exp(-pow((x - run) * 18.0, 2.0)) * step(0.0, pos) * step(pos, 1.0) * tap.w;
    }
    if (u_pulses > 0.0) {
      float run = fract(t * 0.25 * u_pulses + i * 0.13) * 1.4 - 0.2;
      bead += exp(-pow((x - run) * 18.0, 2.0)) * 0.6;
    }
    float stroke = ln_line(px, 0.5 * u_thick, 0.75);
    float halo = u_glow / pow(max(d, pixel), u_falloff) * 0.15;
    float spark = u_shimmer > 0.5 ? 0.6 + 0.8 * hx_vnoise(vec2(x * 60.0 - t * 3.0, i * 7.1)) : 1.0;
    float e = (stroke * 1.4 + halo) * born * depth * spark * (1.0 + bead * 2.5);
    energy += e;
    tint += e * ln_palette(i / max(u_count - 1.0, 1.0));
  }
  vec3 col = tint / max(energy, 1e-4);
  float core = smoothstep(0.5, 2.2, energy);
  col = mix(col, u_core, core * (u_light > 0.5 ? 0.35 : 0.8));
  float edge = u_fade > 0.0 ? smoothstep(0.0, u_fade, x) * smoothstep(0.0, u_fade, 1.0 - x) : 1.0;
  float focal = smoothstep(2.0, 9.0, energy * edge) * 0.25;
  float ink = clamp(energy * u_bright * edge + focal, 0.0, 1.0);
  ink = clamp(ink + hx_grain(gl_FragCoord.xy, t) * u_grain * ink, 0.0, 1.0);
  if (u_opaque > 0.5) {
    o_color = vec4(mix(u_bg, col, ink), 1.0);
  } else {
    o_color = vec4(col, ink);
  }
}
`;

/** 上屏片元. */
export const WEB_THREADS_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, GLSL_LINES);
