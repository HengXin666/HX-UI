// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 FloatingLines 条目, 实现为 HX 自有.
/**
 * FloatingLines 的片元与纯函数: 至多三组 (上 / 中 / 下) 平行波浪线, 指针附近按高斯核弯折,
 * 视差随指针平移各组, 点击处起一个衰减的旋涡, 入场时从左向右扫出.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel";
import { GLSL_LINES } from "./tokens";

/** 每组至多几条线 (条目 MAX_LINES). */
export const FLOATING_MAX_LINES = 24;
/** 参与旋涡的最近点击数 (条目 MAX_CLICKS). */
export const FLOATING_MAX_CLICKS = 3;
/** 入场时长 (条目 INTRO_SECONDS). */
export const FLOATING_INTRO_SECONDS = 1.8;
/** 跟手阻尼按 60 帧给出 (条目 follow = 1 - (1 - damping)^(dt * 60)). */
export const FLOATING_DAMPING_FPS = 60;

export type FloatingWave = "top" | "middle" | "bottom";
export const FLOATING_WAVES: readonly FloatingWave[] = ["top", "middle", "bottom"];
/** 三组的默认纵向位置, 以短边为 1 的居中坐标, y 朝上 (本库定). */
export const FLOATING_WAVE_Y: Readonly<Record<FloatingWave, number>> = { top: 0.26, middle: 0, bottom: -0.26 };
/** lineDistance 的一个单位折成短边的比例 (本库定: 6 即相邻线隔短边的 2.4%). */
export const FLOATING_DISTANCE_UNIT = 0.004;
/** bendRadius 的一个单位折成短边的比例 (本库定: 5 即 0.25 短边). */
export const FLOATING_BEND_UNIT = 0.05;

/**
 * 条目的逐帧跟手系数 1 - (1 - damping)^(dt * 60) 换成等价的一阶时间常数 (秒).
 * damping 不小于 1 时贴手 (0), 不大于 0 时不动 (Infinity).
 */
export function dampingTau(damping: number): number {
  if (damping >= 1) return 0;
  if (damping <= 0) return Number.POSITIVE_INFINITY;
  return -1 / (FLOATING_DAMPING_FPS * Math.log(1 - damping));
}

/** 启用的组换成 vec3 开关. */
export function waveFlags(enabled: readonly FloatingWave[]): [number, number, number] {
  const on = new Set(enabled);
  return [on.has("top") ? 1 : 0, on.has("middle") ? 1 : 0, on.has("bottom") ? 1 : 0];
}

const BODY = `
uniform float u_reveal;
uniform float u_count;
uniform float u_spacing;
uniform vec3 u_waves;
uniform vec3 u_wave_y;
uniform float u_amp;
uniform float u_anim;
uniform float u_width;
uniform float u_dashed;
uniform float u_glow;
uniform float u_bright;
uniform float u_dof;
uniform float u_edge;
uniform vec3 u_follow;
uniform vec2 u_bend;
uniform float u_parallax;
uniform float u_swirl;

vec2 toCentered(vec2 n) { return (n - 0.5) * u_res / min(u_res.x, u_res.y); }

vec2 swirl(vec2 p) {
  if (u_swirl < 0.5) return p;
  for (int k = 0; k < ${FLOATING_MAX_CLICKS}; k++) {
    int idx = int(u_tap_count) - 1 - k;
    if (idx < 0) break;
    vec4 click = u_taps[idx];
    float age = click.z;
    float turn = 1.9 * smoothstep(0.0, 0.23, age) * exp(-max(age - 0.23, 0.0) * 1.1) * click.w;
    float spread = 0.3 * (1.0 + age * 0.55);
    vec2 c = toCentered(click.xy);
    vec2 d = p - c;
    float fall = exp(-dot(d, d) / (spread * spread));
    p = c + hx_rot(turn * fall) * d;
  }
  return p;
}

void main() {
  vec2 base = hx_centered(gl_FragCoord.xy);
  float t = u_time * u_anim;
  vec2 m = toCentered(u_follow.xy);
  float presence = u_follow.z;
  float aa = 0.75 * u_dpr;
  float invSigma = 1.0 / max(u_bend.x * u_bend.x, 1e-4);
  float tight = 1.0 / (2.6 * u_dpr);
  float wide = 1.0 / (11.0 * u_dpr);
  float n = max(u_count, 1.0);
  float ink = 0.0;
  vec3 tint = vec3(0.0);
  for (int w = 0; w < 3; w++) {
    if (u_waves[w] < 0.5) continue;
    float fw = float(w);
    vec2 p = swirl(base + m * presence * u_parallax * (0.35 + 0.3 * fw));
    vec2 dm = p - m;
    float near = exp(-dot(dm, dm) * invSigma) * presence;
    float bend = u_bend.y * 0.2 * near * sign(p.y - m.y + 1e-4);
    for (int i = 0; i < ${FLOATING_MAX_LINES}; i++) {
      if (float(i) >= n) break;
      float fi = float(i);
      float lane = fi - 0.5 * (n - 1.0);
      float breathe = 1.0 + 0.4 * sin(p.x * 0.8 + t * 0.3 + fw * 1.7);
      float y = u_wave_y[w] + lane * u_spacing * breathe;
      y += u_amp * 0.12 * sin(p.x * (1.4 + 0.3 * fw) + t * (0.45 + 0.07 * fw) + fi * 0.22 + fw * 2.1);
      y += u_amp * 0.05 * sin(p.x * 3.1 - t * 0.6 + fi * 0.4 + fw);
      float d = p.y - y - bend;
      float gap = abs(d) / max(fwidth(d), 1e-5);
      float depth = n > 1.0 ? abs(fi / (n - 1.0) - 0.5) * 2.0 : 0.0;
      float soft = aa + depth * u_dof * 3.0 * u_dpr;
      float size = 0.5 * u_width * u_dpr;
      float core = smoothstep(size + soft, size - soft, gap) * (1.0 - depth * u_dof * 0.4);
      float halo = u_glow * (0.45 * exp(-gap * tight) + 0.2 * exp(-gap * wide));
      float dash = u_dashed > 0.5 ? step(0.45, fract(p.x * 36.0 - t * 0.4 + fi * 0.37)) : 1.0;
      float lift = 1.0 + near * 0.8;
      float a = (core + halo) * dash * lift;
      tint += ln_palette(n > 1.0 ? fi / (n - 1.0) : 0.0) * a;
      ink += a;
    }
  }
  float u = v_uv.x;
  float edge = 1.0;
  if (u_edge > 0.0) {
    float left = smoothstep(0.0, u_edge, u);
    float right = smoothstep(0.0, u_edge, 1.0 - u);
    edge = left * right;
  }
  float sweep = u_reveal * 1.25;
  float shown = 1.0 - smoothstep(sweep - 0.2, sweep, u);
  vec3 rgb = tint / max(ink, 1e-4);
  o_color = vec4(min(rgb * u_bright, 1.0), clamp(ink * u_bright, 0.0, 1.0) * edge * shown);
}
`;

/** 上屏片元. */
export const FLOATING_LINES_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL, GLSL_LINES);
