// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 ShapeWaves 条目, 实现为 HX 自有.
/**
 * ShapeWaves 的片元与纯函数: 画面切成 cellSize 见方的格, 每格画一个形状 (方, 圆, 三角或按格哈希混排),
 * 大小由缓慢流动的值噪声场 (每 32 格一个噪声周期, 时钟乘 0.1) 经 contrast / brightness 定出, 四周按 fade 收成暗角.
 * JS 侧波场的 charge 让形状变大并染向悬停色, 超过 0.6 的高能处加光晕; 可选文字遮罩让形状拼出字样.
 * 入场是一道带扭曲与抖动的波前由中心扫开 (band 0.2, warp 0.3, jitter 0.16), 波前处轻染悬停色.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel";

/** 条目常数: 形状模式, 噪声周期 (格), 时钟倍率, 入场波前带宽 / 扭曲 / 抖动, 光晕阈值. */
export const SHAPE_MODES = { mixed: 0, squares: 1, circles: 2, triangles: 3 } as const;
export type ShapeMode = keyof typeof SHAPE_MODES;
export const SHAPE_NOISE_CELLS = 32;
export const SHAPE_TIME_RATE = 0.1;
export const SHAPE_INTRO_BAND = 0.2;
export const SHAPE_INTRO_WARP = 0.3;
export const SHAPE_INTRO_JITTER = 0.16;
/** 入场进度的终点: 波前要扫过最远的扭曲与抖动再加一个带宽. */
export const SHAPE_INTRO_END = 1 + SHAPE_INTRO_WARP + SHAPE_INTRO_JITTER + SHAPE_INTRO_BAND;
export const SHAPE_GLOW_THRESHOLD = 0.6;
/** 条目默认入场时长 (秒). */
export const SHAPE_INTRO_SECONDS = 1.6;

/** 形状模式名换成着色器里的编号, 不认识的名字按 mixed. */
export function shapeModeOf(mode: string): number {
  return mode in SHAPE_MODES ? SHAPE_MODES[mode as ShapeMode] : SHAPE_MODES.mixed;
}

/**
 * 入场进度 0..SHAPE_INTRO_END. 关掉入场, 减弱动效 (elapsed 为 Infinity) 或时长不正时直接到终点.
 *
 * @param since 本轮入场开始以来的秒数.
 * @param seconds introDuration.
 * @param enabled intro prop.
 */
export function shapeIntro(since: number, seconds: number, enabled: boolean): number {
  if (!enabled || !Number.isFinite(since) || seconds <= 0) return SHAPE_INTRO_END;
  return Math.min(Math.max(since / seconds, 0), 1) * SHAPE_INTRO_END;
}

const BODY = `
uniform vec3 u_ink;
uniform vec3 u_hover;
uniform vec3 u_bg;
uniform float u_opaque;
uniform sampler2D u_field;
uniform sampler2D u_mask;
uniform float u_has_text;
uniform vec2 u_grid;
uniform float u_cell;
uniform float u_mode;
uniform float u_dot;
uniform float u_scale;
uniform float u_contrast;
uniform float u_bright;
uniform vec2 u_flow;
uniform float u_fade;
uniform float u_glow;
uniform float u_intro;

float sd_triangle(vec2 p, float r) {
  const float k = 1.7320508;
  p.y += r * 0.25;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) * 0.5;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

float sd_shape(vec2 p, float kind, float size) {
  if (kind < 1.5) {
    vec2 d = abs(p) - vec2(size);
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }
  if (kind < 2.5) return length(p) - size;
  return sd_triangle(p, size * 1.15);
}

void main() {
  vec2 css = gl_FragCoord.xy / u_dpr;
  vec2 cell = floor(css / u_cell);
  vec2 local = (fract(css / u_cell) - 0.5) * 2.0;
  vec2 center = (cell + 0.5) / max(u_grid, vec2(1.0));
  float seed = hx_hash2(cell);
  float kind = u_mode > 0.5 ? u_mode : 1.0 + floor(seed * 2.999);

  vec2 q = (cell + u_flow) / (${SHAPE_NOISE_CELLS}.0 * max(u_scale, 0.05));
  float t = u_time * ${SHAPE_TIME_RATE};
  float n = 0.65 * hx_vnoise(q + vec2(t, -0.6 * t)) + 0.35 * hx_vnoise(q * 2.1 - vec2(0.4 * t, t) + 7.3);
  float level = clamp((n - 0.5) * 2.0 * u_contrast + u_bright, 0.0, 1.0);

  vec2 aspect = vec2(u_grid.x / max(u_grid.y, 1.0), 1.0);
  vec2 cc = (center - 0.5) * 2.0 * aspect / length(aspect);
  float radius = length(cc);
  level *= 1.0 - smoothstep(max(0.0, 1.0 - u_fade * 2.2), 1.0, radius);
  if (u_has_text > 0.5) level = max(level, texture(u_mask, center).a);

  ivec2 texel = ivec2(clamp(cell, vec2(0.0), u_grid - 1.0));
  float charge = texelFetch(u_field, texel, 0).r;
  level = clamp(level + charge * 0.6, 0.0, 1.0);

  float spread = radius + ${SHAPE_INTRO_WARP} * hx_vnoise(cell * 0.11 + 3.1) + ${SHAPE_INTRO_JITTER} * hx_hash2(cell + 17.0);
  float reveal = smoothstep(spread - ${SHAPE_INTRO_BAND}, spread, u_intro);
  float front = 1.0 - smoothstep(0.0, 1.0, abs(u_intro - spread) / ${SHAPE_INTRO_BAND});
  level *= reveal;

  float size = level * u_dot;
  float d = sd_shape(local, kind, size);
  float aa = max(fwidth(local.x), 1e-4) * 0.75;
  float coverage = smoothstep(aa, -aa, d) * step(0.002, size);
  float hot = smoothstep(${SHAPE_GLOW_THRESHOLD}, 1.0, charge);
  float halo = u_glow * hot * exp(-max(d, 0.0) * 3.0) * step(0.002, size);
  vec3 tint = mix(u_ink, u_hover, max(smoothstep(0.15, 0.85, charge), front * 0.35));
  float ink = clamp(coverage + halo * (1.0 - coverage), 0.0, 1.0);
  if (u_opaque > 0.5) {
    o_color = vec4(mix(u_bg, tint, ink), 1.0);
  } else {
    o_color = vec4(tint, ink);
  }
}
`;

/** 上屏片元. */
export const SHAPE_WAVES_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
