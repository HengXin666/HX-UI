// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GradientBlinds 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL, type BackdropTap } from "../../backdrop/kernel";

export const BLINDS = {
  /** 规格 MAX_COLORS / MAX_WAVES / INTRO_SECONDS / RIPPLE_SECONDS. */
  maxColors: 8,
  maxWaves: 4,
  introSeconds: 1.8,
  rippleSeconds: 1.6,
  /** 规格: 色带平移 dt * gradientSpeed * 0.06, 在 0..2 内循环; 指针在场 0.35s 跟随. */
  shiftRate: 0.06,
  shiftPeriod: 2,
  hoverTau: 0.35,
  /** 本库定: 涟漪环扩散速度 (短边 / 秒) 与环宽. */
  rippleSpeed: 0.9,
  rippleWidth: 0.06,
} as const;

/**
 * 实际百叶数: 不超过 blindCount, 且每片不窄于 blindMinWidth (CSS 像素), 至少 1 片.
 *
 * @param widthCss 画布 CSS 宽.
 */
export function blindCountFor(widthCss: number, blindCount: number, blindMinWidth: number): number {
  const byWidth = blindMinWidth > 0 ? Math.floor(widthCss / blindMinWidth) : Number.POSITIVE_INFINITY;
  return Math.max(1, Math.min(Math.round(blindCount), byWidth));
}

/** 色带平移一帧, 在 [0, 2) 内循环. */
export function stepShift(shift: number, dt: number, gradientSpeed: number): number {
  const next = (shift + dt * gradientSpeed * BLINDS.shiftRate) % BLINDS.shiftPeriod;
  return next < 0 ? next + BLINDS.shiftPeriod : next;
}

/**
 * 最近 4 次点击摊成 vec4 数组 (xy 归一化坐标, z 距今秒数, w 有效位), 超过 RIPPLE_SECONDS 的作废.
 *
 * @param taps 内核记下的点击 (at 为 elapsed 时钟).
 * @param elapsed 当前 elapsed.
 */
export function blindWaves(taps: readonly BackdropTap[], elapsed: number): Float32Array {
  const out = new Float32Array(BLINDS.maxWaves * 4);
  const recent = taps.slice(-BLINDS.maxWaves);
  recent.forEach((tap, i) => {
    const age = elapsed - tap.at;
    const valid = Number.isFinite(age) && age >= 0 && age < BLINDS.rippleSeconds;
    out.set([tap.x, tap.y, Math.max(0, age), valid ? 1 : 0], i * 4);
  });
  return out;
}

const BODY = `
uniform float u_count;
uniform float u_angle;
uniform float u_noise;
uniform float u_spot_r;
uniform float u_spot_soft;
uniform float u_spot_op;
uniform float u_distort;
uniform float u_shine_dir;
uniform float u_shine;
uniform float u_relief;
uniform float u_glow;
uniform float u_sway;
uniform float u_persp;
uniform float u_mirror;
uniform float u_shift;
uniform float u_intro;
uniform float u_hover;
uniform float u_ncolors;
uniform vec2 u_mouse;
uniform vec3 u_light;
uniform vec3 u_colors[${BLINDS.maxColors}];
uniform vec4 u_waves[${BLINDS.maxWaves}];

vec3 hx_palette(float g) {
  float x = clamp(g, 0.0, 1.0) * max(u_ncolors - 1.0, 0.0);
  vec3 a = u_colors[0];
  vec3 b = u_colors[0];
  float f = fract(x);
  for (int k = 0; k < ${BLINDS.maxColors}; k++) {
    if (float(k) == floor(x)) a = u_colors[k];
    if (float(k) == min(floor(x) + 1.0, u_ncolors - 1.0)) b = u_colors[k];
  }
  return mix(a, b, smoothstep(0.0, 1.0, f));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv0 = frag / u_res;
  float unit = min(u_res.x, u_res.y);
  vec2 q = hx_rot(u_angle) * (frag - 0.5 * u_res);
  float span = abs(cos(u_angle)) * u_res.x + abs(sin(u_angle)) * u_res.y;
  float x = q.x / span + 0.5;
  float w = 0.01 * u_distort;
  x += w * sin(q.y / span * 12.0 + u_time * 1.3) + w * 0.5 * sin(q.y / span * 27.0 - u_time * 0.7);
  float xp = x * (1.0 + u_persp) / (1.0 + u_persp * clamp(x, 0.0, 1.0));
  float fx = xp * u_count;
  float idx = floor(fx);
  float s = fract(fx);
  float tilt = u_sway * 0.25 * sin(u_time * 0.8 + idx * 0.6 + q.y / span * 2.0);
  float pulse = 0.0;
  vec2 p = (frag - 0.5 * u_res) / unit;
  for (int i = 0; i < ${BLINDS.maxWaves}; i++) {
    vec4 wv = u_waves[i];
    if (wv.w < 0.5) continue;
    float age = wv.z;
    float d = length(p - (wv.xy - 0.5) * u_res / unit);
    float k = (d - age * ${BLINDS.rippleSpeed.toFixed(3)}) / ${BLINDS.rippleWidth.toFixed(3)};
    float fade = 1.0 - age / ${BLINDS.rippleSeconds.toFixed(3)};
    float ring = exp(-k * k) * fade * smoothstep(0.0, 0.2, age);
    pulse += ring;
    tilt += ring * 0.3;
  }
  float settle = smoothstep(0.0, 1.0, clamp(u_intro * 1.5 - uv0.x * 0.5, 0.0, 1.0));
  float ramp = clamp(s + tilt * (s - 0.5) * 2.0 + tilt * 0.5, 0.0, 1.0);
  ramp = u_shine_dir > 0.0 ? ramp : 1.0 - ramp;
  ramp *= settle;
  vec2 m = (u_mouse - 0.5) * u_res / unit;
  float dm = length(p - m);
  float r = max(u_spot_r, 1e-3);
  float spot = (1.0 - smoothstep(r * (1.0 - 0.9 * clamp(u_spot_soft, 0.0, 1.0)), r, dm)) * u_hover * u_spot_op;
  float calm = 1.0 - 0.6 * clamp(spot, 0.0, 1.0);
  float g = xp + u_shift;
  g = u_mirror > 0.5 ? 1.0 - abs(2.0 * fract(g * 0.5) - 1.0) : fract(g);
  vec3 base = hx_palette(g);
  float crease = u_relief * 0.38 * smoothstep(0.62, 1.0, ramp);
  vec3 col = base * (1.0 - crease) * mix(1.0, 0.75 + 0.5 * ramp, u_relief * calm);
  float aa = 1.5 * u_count / max(span, 1.0);
  float edgeBlend = 1.0 - smoothstep(0.0, aa * 2.0, min(s, 1.0 - s));
  col *= 1.0 - u_relief * 0.25 * edgeBlend;
  col += u_light * u_shine * pow(ramp, 6.0) * calm;
  col += u_light * pulse * 0.18;
  col += base * u_glow * 0.4 * smoothstep(0.0, 1.0, spot) * (0.4 + 0.6 * ramp);
  col = mix(col, col + u_light * 0.2, spot);
  float luma = hx_luma(col);
  float gt = floor(u_time * 24.0) * 7.13;
  float grain = 0.5 * (hx_hash2(floor(frag) + gt) + hx_hash2(floor(frag).yx + gt * 1.7)) - 0.5;
  col += grain * u_noise * (0.45 + 0.55 * smoothstep(0.0, 0.5, luma));
  float presence = smoothstep(0.0, 0.65, u_intro);
  o_color = vec4(clamp(col, 0.0, 1.0), presence);
}
`;

/** GradientBlinds 的上屏片元: 旋转的百叶条带, 每片自带明暗坡度与压痕, 色板沿条带方向渐变, 指针聚光, 点击涟漪. */
export const BLINDS_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL);
