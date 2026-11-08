// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 SlicedWaves 条目, 实现为 HX 自有.
/**
 * SlicedWaves 的片元与纯函数: 至多 6 条正弦飘带, 每条被切成等距竖条 (spacing, barWidth), 竖条按透视
 * (FOCAL 1.1, DISTANCE 2.6) 两侧收窄, 竖向边缘用 erf 近似做高斯虚化; slices 再把条身横切成段.
 * 飘带相加后高峰处发白, 指针附近竖条被抬起并聚焦, 入场 1.5s 内条身从中线长出.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel";
import { GLSL_LINES } from "./tokens";

/** 条目常数: 飘带上限, 焦距, 视距, 入场时长. */
export const SLICED_MAX_RIBBONS = 6;
export const SLICED_FOCAL = 1.1;
export const SLICED_DISTANCE = 2.6;
export const SLICED_INTRO_SECONDS = 1.5;
/** 抬起在场 (条目 engaged 0.25s / 离开 0.6s) 与抬起位置 (条目 0.12s) 的时间常数. */
export const SLICED_LIFT_IN_TAU = 0.25;
export const SLICED_LIFT_OUT_TAU = 0.6;
export const SLICED_LIFT_X_TAU = 0.12;
/** 聚焦弹簧 (条目 focusVelocity += (36 (target - focus) - 11 v) dt) 的刚度与阻尼. */
export const SLICED_FOCUS_STIFFNESS = 36;
export const SLICED_FOCUS_DAMPING = 11;

/** 聚焦弹簧状态. */
export interface SlicedFocus {
  value: number;
  velocity: number;
}

/**
 * 聚焦弹簧走一步 (半隐式欧拉, 条目同式).
 *
 * @param f 原地修改的状态.
 * @param target 目标 (指针纵向 0..1).
 * @param dt 帧长.
 */
export function stepFocus(f: SlicedFocus, target: number, dt: number): SlicedFocus {
  f.velocity += (SLICED_FOCUS_STIFFNESS * (target - f.value) - SLICED_FOCUS_DAMPING * f.velocity) * dt;
  f.value += f.velocity * dt;
  return f;
}

/**
 * 透视缩放: 横向 u (-1..1) 处的条身相对中线的缩放. curve 把两侧推远, perspective 控制推远的力度.
 *
 * @param u 横向位置.
 * @param perspective 透视强度.
 * @param curve 弯曲量.
 */
export function slicedScale(u: number, perspective: number, curve: number): number {
  const z = perspective * curve * u * u * 2;
  return (SLICED_FOCAL + SLICED_DISTANCE) / (SLICED_FOCAL + SLICED_DISTANCE + z);
}

const BODY = `
uniform float u_ribbons;
uniform float u_spacing;
uniform float u_bar;
uniform float u_height;
uniform float u_spread;
uniform float u_amp;
uniform float u_freq;
uniform float u_persp;
uniform float u_curve;
uniform float u_blur;
uniform float u_glow;
uniform float u_bright;
uniform float u_position;
uniform float u_angle;
uniform float u_slices;
uniform float u_grain;
uniform vec3 u_lift;
uniform vec2 u_focus;
uniform float u_intro;
uniform float u_fade;

float sw_erf(float x) {
  float a = x * x;
  float t = 1.0 - exp(-a * (1.2732395 + 0.147 * a) / (1.0 + 0.147 * a));
  return sign(x) * sqrt(max(t, 0.0));
}

void main() {
  vec2 css = hx_rot(u_angle) * (gl_FragCoord.xy - 0.5 * u_res) / u_dpr;
  vec2 half_res = 0.5 * u_res / u_dpr;
  float bar = floor(css.x / max(u_spacing, 2.0));
  float xc = (bar + 0.5) * u_spacing;
  float u = xc / max(half_res.x, 1.0);
  float within = abs(css.x - xc) / max(u_spacing, 2.0);
  float colMask = smoothstep(0.5 * u_bar + 0.04, 0.5 * u_bar - 0.04, within);
  float s = ${SLICED_FOCAL + SLICED_DISTANCE} / (${SLICED_FOCAL + SLICED_DISTANCE} + u_persp * u_curve * u * u * 2.0);
  float y = css.y / max(half_res.y, 1.0);
  float center = (0.5 - u_position) * 2.0;
  float lift = u_lift.z * exp(-pow((u - u_lift.x) * 3.0, 2.0)) * 0.12;
  float t = u_time;
  vec3 sum = vec3(0.0);
  float peak = 0.0;
  float k = 0.70710678 / max(u_blur, 0.3);
  for (int r = 0; r < ${SLICED_MAX_RIBBONS}; r++) {
    if (float(r) >= u_ribbons) break;
    float fr = float(r);
    float mid = fr - 0.5 * (u_ribbons - 1.0);
    float yc = center + mid * u_spread * 2.0 + sin(u * u_freq * 3.0 + t * 0.8 + fr * 1.3) * u_amp * 2.0 * s + lift;
    float h = 0.5 * u_height * s * u_intro;
    float d = (abs(y - yc) - h) / max(0.04 * u_blur + 0.004, 1e-3);
    float body = 0.5 * (1.0 - sw_erf(d * k * 2.0));
    if (u_slices > 0.0) {
      float f = 1.0 - abs(fract((y - yc) / max(2.0 * h, 1e-3) * u_slices) - 0.5) * 2.0;
      float soft = 0.05 + 0.1 * u_blur;
      body *= smoothstep(0.28 - soft, 0.28 + soft, f);
    }
    float focus = 1.0 + 0.6 * u_focus.y * exp(-pow((yc - (u_focus.x * 2.0 - 1.0)) * 2.5, 2.0));
    float core = 1.0 - 0.7 * clamp(pow(abs(y - yc) / max(h, 1e-3), 2.0), 0.0, 1.0);
    float glowv = body * core * u_glow * 0.7 * focus * (0.75 + 0.25 * sin(u * 2.0 + t * 0.5 + fr));
    sum += glowv * ln_palette(u_ribbons > 1.0 ? fr / (u_ribbons - 1.0) : 0.0);
    peak += glowv;
  }
  vec3 mapped = sum / max(peak, 1e-4) * (1.0 - exp(-peak * u_bright * 1.4));
  mapped = mix(mapped, vec3(1.0), smoothstep(1.1, 3.2, peak * u_bright) * 0.75);
  float ink = clamp((1.0 - exp(-peak * u_bright * 2.0)) * colMask, 0.0, 1.0);
  vec2 uv = gl_FragCoord.xy / u_res;
  ink *= u_fade > 0.0 ? smoothstep(0.0, u_fade, min(uv.x, 1.0 - uv.x)) : 1.0;
  ink = clamp(ink + hx_grain(gl_FragCoord.xy, t) * u_grain * ink, 0.0, 1.0);
  o_color = vec4(mapped / max(1.0 - exp(-peak * u_bright * 2.0), 1e-3), ink);
}
`;

/** 上屏片元. */
export const SLICED_WAVES_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, GLSL_LINES);
