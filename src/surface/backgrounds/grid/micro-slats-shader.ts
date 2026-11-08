// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 MicroSlats 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { FLUID_COMMON } from "./micro-slats-fluid";

/** 规格常数与本库定的系数. */
export const MICRO_SLATS = {
  /** 规格的像素预算 (设备像素面积), 由内核的 dpr 上限与 maxEdge 代替, 只作记录. */
  pixelBudget: 4.5e6,
  /** scale 为 1 时一个世界单位的 CSS 像素 (本库定). */
  worldUnit: 90,
  /** perspective 为 1 时的后仰角 (度, 本库定). */
  maxTilt: 62,
  /** 流速推移浪面的增益 (世界单位每格速度, 本库定). */
  flowShift: 0.004,
  /** 入场揭开波前的宽度 (规格 0.35). */
  revealBand: 0.35,
} as const;

/** 一组浪况: 波长缩放, 浪速, 方向 (度), 碎浪, 拉伸, 闪光, 对比, 透视, 雾. */
export interface SwellPreset {
  readonly scale: number;
  readonly speed: number;
  readonly direction: number;
  readonly chop: number;
  readonly stretch: number;
  readonly glint: number;
  readonly contrast: number;
  readonly perspective: number;
  readonly fog: number;
}

/** 规格的 SWELL_PRESETS 名, 数值本库定. */
export const SWELL_PRESETS = {
  swell: { scale: 1, speed: 1, direction: 20, chop: 0.25, stretch: 1.6, glint: 0.8, contrast: 1.4, perspective: 0.45, fog: 0.5 },
  chop: { scale: 0.6, speed: 1.5, direction: 35, chop: 0.8, stretch: 1.1, glint: 1, contrast: 1.2, perspective: 0.35, fog: 0.4 },
  storm: { scale: 1.4, speed: 2, direction: -15, chop: 1, stretch: 1.3, glint: 1.2, contrast: 1.8, perspective: 0.55, fog: 0.7 },
  glass: { scale: 1.8, speed: 0.5, direction: 0, chop: 0, stretch: 2.2, glint: 0.5, contrast: 1, perspective: 0.3, fog: 0.3 },
} as const satisfies Readonly<Record<string, SwellPreset>>;
export type SwellPresetName = keyof typeof SWELL_PRESETS;

/**
 * 取浪况: 未知名落到 swell, 显式给的覆盖项优先.
 *
 * @param name 预设名.
 * @param overrides 组件 props 里给出的单项 (undefined 表示用预设).
 */
export function resolveSwell(name: string, overrides: Partial<Record<keyof SwellPreset, number | undefined>>): SwellPreset {
  const base: SwellPreset = (SWELL_PRESETS as Readonly<Record<string, SwellPreset>>)[name] ?? SWELL_PRESETS.swell;
  const out = { ...base };
  for (const key of Object.keys(base) as Array<keyof SwellPreset>) {
    const v = overrides[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
  }
  return out;
}

/**
 * 微百叶: 屏幕点 (CSS 像素, 中心为原点) 按透视后仰反投影到地面, 加 lean 斜切, 切成圆角小百叶;
 * 每片在片心取一次四分量方向浪高 (深水色散, chop 尖化浪峰, stretch 沿浪向拉长, meander 慢摆),
 * 浪高按 contrast 定亮度, 浪峰 (smoothstep 0.6..1) 出闪光; 流体墨迹点亮百叶, 流速推移浪面;
 * 远处挤密退成平均覆盖并入雾, 入场由下往上揭开.
 */
const BODY = `
uniform sampler2D u_ink;
uniform sampler2D u_vel;
uniform sampler2D u_press;
uniform vec3 u_color;
uniform vec3 u_glint_color;
uniform vec3 u_bg;
uniform vec2 u_slat;
uniform float u_gap;
uniform float u_round;
uniform float u_scale;
uniform float u_wave_speed;
uniform vec2 u_dir;
uniform float u_chop;
uniform float u_stretch;
uniform float u_glint;
uniform float u_contrast;
uniform float u_tilt;
uniform float u_fog;
uniform float u_lean;
uniform float u_ink_gain;
uniform float u_front;
${FLUID_COMMON}
const float LENGTH[4] = float[4](1.0, 0.61, 0.37, 0.23);
const float SPREAD[4] = float[4](0.0, 0.45, -0.6, 0.9);
const float AMP[4] = float[4](1.0, 0.55, 0.3, 0.18);

float focal() { return max(u_res.x, u_res.y) / u_dpr; }

// 屏幕点到地面坐标, depth 为到地平线的距离 (不后仰时恒为焦距).
vec2 ground_of(vec2 s, out float depth) {
  float f = focal();
  float c = cos(u_tilt);
  float k = sin(u_tilt);
  depth = f * c - s.y * k;
  float v = s.y * f / max(depth, 1e-3);
  return vec2(s.x * (f + v * k) / f, v);
}

// 地面坐标回到屏幕点 (ground_of 的逆).
vec2 screen_of(vec2 q) {
  float f = focal();
  float k = sin(u_tilt);
  float den = f + q.y * k;
  return vec2(q.x * f / den, q.y * f * cos(u_tilt) / den);
}

float round_box(vec2 p, vec2 half_size, float r) {
  vec2 q = abs(p) - half_size + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float swell_height(vec2 world) {
  vec2 perp = vec2(-u_dir.y, u_dir.x);
  vec2 w = vec2(dot(world, u_dir), dot(world, perp) / max(u_stretch, 0.1));
  float meander = 0.55 * sin(dot(world, vec2(0.23, 0.41)) * 0.9 + u_time * 0.13);
  float height = 0.0;
  float total = 0.0;
  for (int i = 0; i < 4; i++) {
    float a = SPREAD[i] + meander * (0.4 + 0.2 * float(i));
    vec2 d = vec2(cos(a), sin(a));
    float k = 6.2831853 / LENGTH[i];
    float wave = sin(k * dot(w, d) - sqrt(9.8 * k) * u_time * u_wave_speed * 0.35 + float(i) * 1.7);
    float sharp = 2.0 * pow(0.5 + 0.5 * wave, 1.0 + u_chop * 2.0) - 1.0;
    height += AMP[i] * sharp;
    total += AMP[i];
  }
  return height / total;
}

void main() {
  vec2 css = u_res / u_dpr;
  vec2 s = gl_FragCoord.xy / u_dpr - 0.5 * css;
  float depth;
  vec2 q = ground_of(s, depth);
  vec2 g = vec2(q.x + q.y * u_lean, q.y);
  vec2 pitch = u_slat + u_gap;
  vec2 id = floor(g / pitch);
  vec2 center = (id + 0.5) * pitch;
  vec2 local = g - center;
  vec2 half_size = 0.5 * u_slat;
  float d = round_box(local, half_size, u_round * min(half_size.x, half_size.y));
  float aa = max(fwidth(d), 1e-3);
  float shape = 1.0 - smoothstep(-aa, aa, d);
  float crowd = smoothstep(0.25, 0.6, max(fwidth(g.x / pitch.x), fwidth(g.y / pitch.y)));
  shape = mix(shape, (u_slat.x * u_slat.y) / (pitch.x * pitch.y), crowd);

  vec2 suv = clamp(screen_of(vec2(center.x - center.y * u_lean, center.y)) / css + 0.5, 0.0, 1.0);
  vec2 flow = projected(u_vel, u_press, suv);
  float ink = texture(u_ink, suv).r * 4.0;
  vec2 world = center / (${MICRO_SLATS.worldUnit.toFixed(1)} * max(u_scale, 0.05)) - flow * ${MICRO_SLATS.flowShift};
  float level = clamp(0.5 + 0.5 * swell_height(world), 0.0, 1.0);
  float crest = smoothstep(0.6, 1.0, level);
  float glow = 1.0 - exp(-max(ink, 0.0) * u_ink_gain * 1.6);
  float lum = pow(level, max(u_contrast, 0.05));
  float bevel = 1.0 - 0.22 * clamp(local.y / max(half_size.y, 1e-3), -1.0, 1.0);
  float sparkle = 0.6 + 0.4 * sin(u_time * 3.0 + hx_hash2(id) * 40.0);
  vec3 col = mix(u_bg, u_color, clamp(0.12 + 0.88 * lum, 0.0, 1.0) * bevel);
  col = mix(col, u_glint_color, clamp(crest * u_glint * sparkle * 0.7 + glow * 0.55, 0.0, 1.0));

  float far = u_tilt > 0.001 ? 1.0 - smoothstep(0.0, focal() * cos(u_tilt), depth) : 0.0;
  float edge = smoothstep(0.3, 0.75, length(s / css));
  float fogged = clamp(u_fog * max(far, 0.35 * edge), 0.0, 1.0);
  float v = gl_FragCoord.y / u_res.y + hx_hash2(id + 3.1) * 0.15;
  float reveal = 1.0 - smoothstep(u_front - ${MICRO_SLATS.revealBand.toFixed(2)}, u_front, v);
  o_color = vec4(mix(u_bg, col, clamp(shape * reveal * (1.0 - fogged), 0.0, 1.0)), 1.0);
}
`;

/** MicroSlats 的上屏片元源码. */
export const MICRO_SLATS_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL);
