// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 PixelSnow 条目, 实现为 HX 自有. 着色器源码与常数.
import { fragmentSource, GLSL_HASH, GLSL_NOISE } from "../../backdrop/kernel/glsl";
import { GLSL_GLYPH_KIT } from "./kit";

/** 雪花像素图案编号; mixed 按格哈希在前四种里挑. */
export const SNOW_VARIANTS = { snowflake: 0, star: 1, dot: 2, crystal: 3, mixed: 4 } as const;
export type SnowVariant = keyof typeof SNOW_VARIANTS;

export const PIXEL_SNOW = {
  /** 雪花图案边长 (图案像素). */
  cell: 9,
  /** 景深层数. */
  levels: 5,
  /** 生成格边长 (图案像素), 每格最多一片 (本库定). */
  slot: 22,
  /** 入场 (雪花渐次出现) 时长, 秒. */
  introSeconds: 1.4,
  /** 积雪最高占画面高度的比例 (本库定). */
  pileMax: 0.16,
  /** 积雪高度场的缩放: 只用一行信息, 八分之一分辨率足够. */
  pileScale: 0.125,
  /** 积雪每单位增长换算成高度比例每秒 (本库定). */
  pileRate: 0.04,
} as const;

/**
 * 积雪每秒增长量: (0.25 + density * 0.9) * min(1, speed), 乘 pileRate 换成占满高度的比例.
 *
 * @param density 雪量 0..1.
 * @param speed 时钟倍率.
 * @param dt 帧长 (秒).
 */
export function pileGrowth(density: number, speed: number, dt: number): number {
  return (0.25 + Math.max(0, density) * 0.9) * dt * Math.min(1, Math.max(0, speed)) * PIXEL_SNOW.pileRate;
}

/** 积雪通道: r 为每列高度 (0..1 占 pileMax). 按列增长, 与邻列略作平均, 指针靠近积雪顶时融化; 不积雪时回落. */
export const SNOW_PILE = fragmentSource(`
uniform sampler2D u_pile;
uniform vec2 u_target_res;
uniform float u_grow;
uniform float u_melt;
uniform float u_on;
uniform float u_pile_max;
void main() {
  float dx = 1.0 / u_target_res.x;
  float h = texture(u_pile, vec2(v_uv.x, 0.5)).r;
  float l = texture(u_pile, vec2(v_uv.x - dx, 0.5)).r;
  float r = texture(u_pile, vec2(v_uv.x + dx, 0.5)).r;
  h = mix(h, (l + r) * 0.5, 0.08);
  h += u_grow * (0.7 + 0.6 * hx_vnoise(vec2(v_uv.x * 9.0, 0.0)));
  vec2 aspect = vec2(u_res.x / u_res.y, 1.0);
  float d = length((vec2(v_uv.x, h * u_pile_max) - u_pointer.xy) * aspect);
  h -= u_melt * u_pointer.z * (1.0 - smoothstep(0.0, 0.12, d));
  h = u_on > 0.5 ? h : h * 0.9;
  o_color = vec4(clamp(h, 0.0, 1.0), 0.0, 0.0, 1.0);
}
`, GLSL_HASH, GLSL_NOISE);

/** 上屏: 五层景深格子里各放一片像素雪花 (下落, 风, 摇摆, 指针推开), Bayer 4 抖动三级明暗, 光晕与闪烁, 底部积雪. */
export const PIXEL_SNOW_FRAGMENT = fragmentSource(`
uniform sampler2D u_pile;
uniform vec3 u_color;
uniform float u_variant;
uniform float u_density;
uniform float u_wind;
uniform float u_sway;
uniform float u_size;
uniform float u_pixel;
uniform float u_depth;
uniform float u_brightness;
uniform float u_glow;
uniform float u_twinkle;
uniform float u_push;
uniform float u_intro;
uniform float u_fade;
uniform float u_pile_on;
uniform float u_pile_max;

float sprite(int kind, vec2 q) {
  float ax = abs(q.x);
  float ay = abs(q.y);
  if (kind == 1) return float((q.x == 0.0 && ay <= 3.0) || (q.y == 0.0 && ax <= 3.0) || (ax == ay && ax <= 1.0));
  if (kind == 2) return step(dot(q, q), 4.5);
  if (kind == 3) return float(ax + ay == 3.0 || (ax + ay <= 1.0 && ax * ay == 0.0));
  return float((q.x == 0.0 && ay <= 4.0) || (q.y == 0.0 && ax <= 4.0) || (ax == ay && ax <= 3.0)
    || (ax == 1.0 && ay == 3.0) || (ax == 3.0 && ay == 1.0));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 toPointer = (uv - u_pointer.xy) * u_res / min(u_res.x, u_res.y);
  float near = clamp(1.0 - length(toPointer) / 0.22, 0.0, 1.0) * u_pointer.z;
  vec2 at = u_pointer.xy * u_res;
  vec2 frag = at + (gl_FragCoord.xy - at) * (1.0 - 0.45 * clamp(u_push, 0.0, 1.0) * near * near);
  float ink = 0.0;
  for (int level = 0; level < ${PIXEL_SNOW.levels}; level++) {
    float ln = float(level) / ${PIXEL_SNOW.levels - 1}.0;
    float scale = max(1.0, u_pixel * u_dpr * u_size * mix(0.45, 1.0, ln));
    float fall = (10.0 + 14.0 * ln) * u_time;
    vec2 q = frag / scale + vec2(-u_wind * fall * 0.8, fall) + float(level) * 37.0;
    vec2 slot = floor(q / ${PIXEL_SNOW.slot}.0);
    float h = hx_hash2(slot + float(level) * 11.3);
    if (h > (0.05 + u_density * 0.7) * mix(1.0, 0.5, ln)) continue;
    vec2 jitter = (hx_hash22(slot + 5.7) - 0.5) * 8.0;
    jitter.x += sin(u_time * (0.8 + h * 1.4) + h * 40.0) * u_sway * 1.5;
    vec2 center = (slot + 0.5) * ${PIXEL_SNOW.slot}.0 + jitter;
    vec2 cell = floor(q - center + 0.5);
    float kind = u_variant > 3.5 ? floor(hx_hash2(slot + 2.2) * 4.0) : u_variant;
    float body = 0.0;
    if (max(abs(cell.x), abs(cell.y)) <= ${(PIXEL_SNOW.cell - 1) / 2}.0) {
      float on = sprite(int(kind + 0.5), cell);
      float shade = 3.0 * (1.0 - length(cell) / 6.0);
      float threshold = hxg_bayer4(floor(q)) + 0.5 / 16.0;
      float step3 = floor(shade) + step(threshold, fract(shade));
      body = on * (0.94 - (3.0 - step3) * 0.13);
    }
    float halo = u_glow * 0.18 * exp(-dot(cell, cell) / 8.0);
    float twinkle = 1.0 - u_twinkle * 0.5 * (0.5 + 0.5 * sin(u_time * 3.0 + h * 60.0));
    float dim = mix(1.0, mix(0.35, 1.0, ln), u_depth);
    float shown = clamp((u_intro * 1.3 - hx_hash2(slot + 9.1) * 0.3) * 3.0, 0.0, 1.0);
    ink = max(ink, (body + halo) * twinkle * dim * shown);
  }
  ink *= (1.0 - 0.6 * clamp(u_push, 0.0, 1.0) * near * near) * (u_fade > 0.0 ? smoothstep(0.0, u_fade, uv.y) : 1.0);

  float top = texture(u_pile, vec2(uv.x, 0.5)).r * u_pile_max * u_pile_on;
  vec2 pc = floor(gl_FragCoord.xy / max(1.0, u_pixel * u_dpr));
  float under = top - uv.y;
  float snow = step(0.0, under) * step(0.002, top);
  float crust = 0.94 - 0.13 * step(hxg_bayer4(pc) + 0.03, smoothstep(0.0, 0.03, under));
  ink = mix(ink, crust, snow);
  float a = clamp(ink * u_brightness, 0.0, 1.0);
  o_color = vec4(u_color, a);
}
`, GLSL_HASH, GLSL_NOISE, GLSL_GLYPH_KIT);
