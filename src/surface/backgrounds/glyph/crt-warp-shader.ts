// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 CRTWarp 条目, 实现为 HX 自有. 着色器源码与常数.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";

/** 荫罩编号: 无, 栅格 (竖条), 荫罩 (三点错行), 槽形 (竖条错段). */
export const CRT_MASKS = { none: 0, aperture: 1, shadow: 2, slot: 3 } as const;
export type CrtMask = keyof typeof CRT_MASKS;

export const CRT_WARP = {
  /** 格子宽高比 (宽 / 高). */
  cellAspect: 0.56,
  /** 入场 (逐行预热) 时长, 秒. */
  introSeconds: 1.6,
  /** 点击翻滚 (垂直同步丢失) 时长, 秒. */
  flipSeconds: 0.8,
  /** 入场期间荧光上升的时间常数, 秒: rise = dt / 0.22. */
  riseSeconds: 0.22,
  /** 波场变体个数, variation 按它取模. */
  variants: 4,
  /** 场时钟基准倍率: 上游 speed 默认 0.5, 这里折进着色器, 公共 speed 默认 1. */
  timeBase: 0.5,
} as const;

/**
 * 荧光每帧的保留比例: persistence ** (dt * 60). 减弱动效 (reduced) 时为 0, 静态帧不留残影.
 *
 * @param persistence 余辉 0..1.
 * @param dt 帧长 (秒).
 * @param reduced 是否减弱动效.
 */
export function crtDecay(persistence: number, dt: number, reduced: boolean): number {
  if (reduced) return 0;
  return Math.max(0, Math.min(1, persistence)) ** (dt * 60);
}

/**
 * 入场期间荧光向目标逼近的比例: 入场没完时为 dt / 0.22 (封顶 1), 完成后为 1.
 *
 * @param reveal 入场进度 0..1.
 * @param dt 帧长 (秒).
 */
export function crtRise(reveal: number, dt: number): number {
  return reveal < 1 ? Math.min(1, dt / CRT_WARP.riseSeconds) : 1;
}

/** 内容通道: 平面坐标里按 columns 分格, 波场量化成 levels 级点亮圆角格, 与上一帧余辉合成. 输出 r 为亮度. */
export const CRT_CONTENT = fragmentSource(`
uniform sampler2D u_content;
uniform vec2 u_target_res;
uniform float u_columns;
uniform float u_levels;
uniform float u_amp;
uniform float u_freq;
uniform float u_variant;
uniform float u_decay;
uniform float u_rise;
uniform float u_reveal;
uniform float u_time_base;

float wave(vec2 p, float t) {
  int v = int(u_variant + 0.5);
  float f = u_freq;
  if (v == 1) {
    float a = sin(length(p - vec2(-0.4, 0.2)) * f * 6.0 - t * 2.0);
    float b = sin(length(p - vec2(0.5, -0.3)) * f * 6.0 - t * 1.6);
    return 0.5 + 0.25 * (a + b);
  }
  if (v == 2) return hx_fbm(p * f + vec2(t * 0.4, -t * 0.3), 4);
  if (v == 3) return 0.5 + 0.5 * sin((p.x + p.y) * f * 4.0 + sin(p.x * f * 2.0 - t) * u_amp * 4.0 - t * 1.5);
  float bend = sin(p.x * f * 2.0 + t) * u_amp + hx_gnoise(p * f + t * 0.2) * u_amp * 0.5;
  return 0.5 + 0.5 * sin((p.y + bend) * f * 5.0 - t * 1.8);
}

void main() {
  float cw = u_target_res.x / max(1.0, u_columns);
  vec2 size = vec2(cw, cw / ${CRT_WARP.cellAspect});
  vec2 cell = floor(gl_FragCoord.xy / size);
  vec2 local = fract(gl_FragCoord.xy / size) - 0.5;
  vec2 center = (cell + 0.5) * size;
  vec2 p = (center - 0.5 * u_target_res) / min(u_target_res.x, u_target_res.y);
  float t = u_time * u_time_base;
  float n = max(2.0, u_levels);
  float q = floor(clamp(wave(p, t), 0.0, 0.999) * n) / (n - 1.0);

  vec2 half_ = vec2(0.42, 0.44);
  vec2 d = abs(local) - half_ + 0.12;
  float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - 0.12;
  float aa = 1.5 / max(size.x, 1.0);
  float shape = (1.0 - smoothstep(-aa, aa, sd)) * mix(1.0, smoothstep(0.0, 0.06, -sd), 0.35);

  float row = 1.0 - (cell.y + 0.5) * size.y / u_target_res.y;
  float shown = smoothstep(row - 0.08, row, u_reveal * 1.1);
  float lit = q * shape * shown;
  float prev = texture(u_content, gl_FragCoord.xy / u_target_res).r;
  float risen = prev + (lit - prev) * u_rise;
  o_color = vec4(max(risen, prev * u_decay), 0.0, 0.0, 1.0);
}
`, GLSL_HASH, GLSL_NOISE);

/** 上屏: 翻滚 -> 桶形弯曲与圆角 -> 指针磁偏 -> 色移三采样 -> 辉光 -> 荫罩, 扫描线, 颗粒, 闪烁, 工频干扰, 暗角 -> 着色. */
export const CRT_WARP_FRAGMENT = fragmentSource(`
uniform sampler2D u_content;
uniform vec3 u_color;
uniform vec3 u_back;
uniform float u_curvature;
uniform float u_corners;
uniform float u_scan_strength;
uniform float u_scan_freq;
uniform float u_mask;
uniform float u_mask_strength;
uniform float u_bloom;
uniform float u_bloom_radius;
uniform float u_shift;
uniform float u_noise;
uniform float u_flicker;
uniform float u_interference;
uniform float u_vignette;
uniform float u_brightness;
uniform float u_roll_on;
uniform float u_flip;

float maskAt(vec2 frag, int channel) {
  vec2 px = floor(frag / max(u_dpr, 1.0));
  int mode = int(u_mask + 0.5);
  float stripe = mod(px.x, 3.0);
  if (mode == 2) stripe = mod(px.x + 1.5 * mod(floor(px.y / 2.0), 2.0), 3.0);
  if (mode == 3) {
    float gap = step(2.5, mod(px.y + 2.0 * mod(floor(px.x / 3.0), 2.0), 4.0));
    if (gap > 0.5) return 1.0 - u_mask_strength;
  }
  float hit = step(float(channel) - 0.5, stripe) * step(stripe, float(channel) + 0.5);
  float low = 1.0 - u_mask_strength;
  return mix(low, 1.0, hit);
}

void main() {
  float offset = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_tap_count || u_roll_on < 0.5) break;
    float age = u_taps[i].z / u_flip;
    if (age < 1.0) offset = max(offset, smoothstep(0.0, 1.0, age));
  }
  float rolling = step(0.0001, offset) * step(offset, 0.9999);
  vec2 c = v_uv * 2.0 - 1.0;
  c *= 1.0 + u_curvature * 0.3 * dot(c, c);
  vec2 uv = c * 0.5 + 0.5;
  vec2 q = abs(c) - (1.0 - u_corners * 0.25);
  float corner = length(max(q, 0.0)) - u_corners * 0.25;
  float inside = 1.0 - smoothstep(-0.004, 0.004, corner);
  inside *= step(abs(c.x), 1.0) * step(abs(c.y), 1.0);

  vec2 toPointer = (uv - u_pointer.xy) * u_res / min(u_res.x, u_res.y);
  float pull = u_pointer.z * exp(-dot(toPointer, toPointer) * 18.0);
  uv += toPointer * pull * 0.04 * min(u_res.x, u_res.y) / u_res;

  float wrapped = fract(uv.y - offset);
  float reach = smoothstep(0.0, 0.08, min(offset, 1.0 - offset));
  float blank = mix(1.0, smoothstep(0.0, 0.05, wrapped) * smoothstep(1.0, 0.95, wrapped), rolling * reach);
  uv.y = mix(uv.y, wrapped, rolling);

  float shift = u_shift * (1.0 + pull * 3.0);
  float r = texture(u_content, uv + vec2(shift, 0.0)).r;
  float g = texture(u_content, uv).r;
  float b = texture(u_content, uv - vec2(shift, 0.0)).r;
  vec2 px = u_bloom_radius * 2.5 / u_res * u_dpr;
  float halo = 0.0;
  for (int i = -2; i <= 2; i++) {
    for (int j = -2; j <= 2; j++) {
      halo += texture(u_content, uv + vec2(float(i), float(j)) * px).r * exp(-0.25 * float(i * i + j * j));
    }
  }
  halo /= 9.5;

  vec3 lum = vec3(r, g, b) * vec3(maskAt(gl_FragCoord.xy, 0), maskAt(gl_FragCoord.xy, 1), maskAt(gl_FragCoord.xy, 2));
  lum += u_bloom * 0.35 * halo;
  float core = max(lum.r, max(lum.g, lum.b));
  vec3 col = lum * mix(u_color, vec3(1.0), 0.4 * smoothstep(0.6, 1.2, core));
  float lines = max(1.0, u_scan_freq);
  float scan = 1.0 - u_scan_strength * 0.5 * (0.5 + 0.5 * cos(uv.y * lines * HX_TAU));
  float hum = 1.0 - u_interference * 0.24 * smoothstep(0.2, 1.0, 0.5 + 0.5 * sin((uv.y - u_time * 0.09) * HX_TAU));
  float flick = 1.0 + u_flicker * 0.1 * (hx_hash2(vec2(floor(u_time * 60.0), 7.3)) - 0.5);
  col *= scan * hum * flick * u_brightness * blank;
  col += u_noise * 0.2 * hx_grain(gl_FragCoord.xy, u_time) * (0.3 + core);
  vec2 v = uv - 0.5;
  float vignette = mix(1.0, smoothstep(0.0, 1.0, clamp(1.0 - dot(v, v) * 2.0, 0.0, 1.0)), u_vignette);
  col = max(col * vignette * inside, 0.0);
  o_color = vec4(u_back + col * (1.0 - 0.5 * u_back), 1.0);
}
`, GLSL_HASH, GLSL_UTIL);
