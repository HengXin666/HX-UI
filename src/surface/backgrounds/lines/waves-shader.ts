// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Waves 条目, 实现为 HX 自有.
/**
 * Waves 的片元与纯函数: 等距平行线被二维噪声位移场推成起伏的地形线 (twist 让位移方向随噪声转),
 * 指针处是一个弹簧驱动的推挤 (bounce 给阻尼比, returnDuration 给固有频率, 按帧细分积分), 点击放出
 * 640 px/s 外扩, 宽 64 px 的环形涟漪; 位移大的地方染强调色 (heat). 入场 2.2s 内线由中间向两侧长出.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel";

/** 条目常数: 线型, 虚线周期 (CSS 像素), 入场时长, 涟漪速度与环宽 (CSS 像素). */
export const WAVES_STYLES = { solid: 0, dashed: 1 } as const;
export type WavesLineStyle = keyof typeof WAVES_STYLES;
export const WAVES_CELL = 12;
export const WAVES_INTRO_SECONDS = 2.2;
export const WAVES_RIPPLE_SPEED = 640;
export const WAVES_RIPPLE_WIDTH = 64;
/** 跟手 (条目 1 - exp(-dt / 0.045)) 与在场混合 (条目 1 - exp(-dt / 0.06)) 的时间常数. */
export const WAVES_FOLLOW_TAU = 0.045;
export const WAVES_BLEND_TAU = 0.06;
/** 指针速度 (CSS 像素每秒) 换弹簧目标位移的系数 (本库定). */
export const WAVES_DRAG = 0.06;

/** 弹簧状态: 位移与速度 (CSS 像素). */
export interface WavesSpring {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * 弹簧朝目标走 dt 秒. 阻尼比 zeta = 1 - bounce, 固有频率 omega = 2 PI / returnDuration;
 * 条目 damping = 2 zeta omega, 子步数 min(16, max(1, ceil(dt / min(1 / 120, 0.6 / omega)))).
 *
 * @param s 原地修改的弹簧.
 * @param tx 目标位移 x.
 * @param ty 目标位移 y.
 * @param dt 帧长 (秒).
 * @param bounce 0..1, 越大越弹.
 * @param returnDuration 回弹周期 (秒).
 */
export function stepSpring(s: WavesSpring, tx: number, ty: number, dt: number, bounce: number, returnDuration: number): WavesSpring {
  if (dt <= 0) return s;
  const omega = (2 * Math.PI) / Math.max(returnDuration, 0.05);
  const zeta = Math.min(Math.max(1 - bounce, 0.05), 1);
  const damping = 2 * zeta * omega;
  const steps = Math.min(16, Math.max(1, Math.ceil(dt / Math.min(1 / 120, 0.6 / omega))));
  const h = dt / steps;
  for (let i = 0; i < steps; i += 1) {
    s.vx += (omega * omega * (tx - s.x) - damping * s.vx) * h;
    s.vy += (omega * omega * (ty - s.y) - damping * s.vy) * h;
    s.x += s.vx * h;
    s.y += s.vy * h;
  }
  return s;
}

const BODY = `
uniform vec3 u_line;
uniform vec3 u_accent;
uniform vec3 u_bg;
uniform float u_opaque;
uniform float u_dashed;
uniform float u_spacing;
uniform float u_width;
uniform float u_angle;
uniform float u_amp;
uniform float u_scale;
uniform float u_twist;
uniform float u_variation;
uniform vec4 u_push;
uniform vec2 u_spring;
uniform float u_radius;
uniform float u_ripples;
uniform float u_intro;
uniform float u_fade;
uniform float u_light;

vec2 field(vec2 p, float t) {
  vec2 q = p * 0.0028 * u_scale;
  float n = hx_gnoise(q + vec2(t * 0.11, -t * 0.07));
  float m = hx_gnoise(q * 1.9 + vec2(-t * 0.05, t * 0.09) + 13.7);
  float a = n * u_twist * 2.2 + m * u_variation * 2.0;
  return vec2(sin(a), cos(a)) * (0.55 * n + 0.45 * m) * u_amp;
}

void main() {
  float t = u_time;
  vec2 css = (gl_FragCoord.xy - 0.5 * u_res) / u_dpr;
  vec2 p = hx_rot(u_angle) * css;
  vec2 disp = field(p, t);
  vec2 cp = hx_rot(u_angle) * ((u_push.xy - 0.5) * u_res / u_dpr);
  vec2 dc = p - cp;
  float near = exp(-dot(dc, dc) / max(u_radius * u_radius, 1.0));
  disp += near * (dc / max(u_radius, 1.0) * u_push.z * u_amp * 1.2 + hx_rot(u_angle) * u_spring) * u_push.w;
  float ring = 0.0;
  for (int k = 0; k < 8; k++) {
    if (float(k) >= min(u_tap_count, u_ripples)) break;
    vec4 tap = u_taps[k];
    vec2 rp = hx_rot(u_angle) * ((tap.xy - 0.5) * u_res / u_dpr);
    vec2 dr = p - rp;
    float r = length(dr) - tap.z * ${WAVES_RIPPLE_SPEED}.0;
    float wave = exp(-r * r / ${WAVES_RIPPLE_WIDTH * WAVES_RIPPLE_WIDTH}.0) * exp(-tap.z * 1.2) * tap.w;
    ring += wave;
    disp += dr / max(length(dr), 1.0) * wave * u_amp * 0.6;
  }
  vec2 src = p - disp;
  float v = src.y / max(u_spacing, 1.0);
  float pixels = abs(fract(v) - 0.5) / max(fwidth(v), 1e-5);
  float core = smoothstep(0.5 * u_width * u_dpr + 0.75, 0.5 * u_width * u_dpr - 0.75, pixels);
  if (u_dashed > 0.5) core *= step(fract(src.x / ${WAVES_CELL}.0), 0.5);
  float half_w = 0.5 * u_res.x / u_dpr;
  float grow = smoothstep(0.0, 0.12, u_intro * 1.25 - abs(css.x) / max(half_w, 1.0));
  float energy = length(disp) / max(u_amp, 1.0) * 0.5 + ring;
  float heat = smoothstep(0.0, 1.0, energy * 0.8);
  vec3 col = mix(u_line, u_accent, heat);
  vec2 uv = gl_FragCoord.xy / u_res;
  float edge = u_fade > 0.0 ? smoothstep(0.0, u_fade, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y))) : 1.0;
  float ink = core * grow * edge * mix(1.0, 0.85, u_light);
  if (u_opaque > 0.5) {
    o_color = vec4(mix(u_bg, col, ink), 1.0);
  } else {
    o_color = vec4(col, ink);
  }
}
`;

/** 上屏片元. */
export const WAVES_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
