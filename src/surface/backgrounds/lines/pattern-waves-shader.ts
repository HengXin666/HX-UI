// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 PatternWaves 条目, 实现为 HX 自有.
/**
 * PatternWaves 的片元与纯函数: 一张会动的高度场 (silk 褶皱绸面, swell 大块涌浪, ripple 交叠水纹) 按法线受光,
 * 受光程度 level 决定网格里每个记号 (点, 方块, 十字, 短线, 字形) 的大小或字形档位. 高度场让记号按 depth 做视差错位,
 * 指针按下表面形成凹坑, 点击放出环形水纹; 五种淡出 (none / edges / center / bottom / top), 入场 2s 由中心向外显影.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
import { clamp, fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel";

/** 条目常数: 记号, 波形, 淡出的枚举值. */
export const PATTERN_WAVES_PATTERNS = { dot: 0, square: 1, plus: 2, line: 3, glyph: 4 } as const;
export const PATTERN_WAVES_WAVES = { silk: 0, swell: 1, ripple: 2 } as const;
export const PATTERN_WAVES_FADES = { none: 0, edges: 1, center: 2, bottom: 3, top: 4 } as const;
export type PatternWavesPattern = keyof typeof PATTERN_WAVES_PATTERNS;
export type PatternWavesWave = keyof typeof PATTERN_WAVES_WAVES;
export type PatternWavesFade = keyof typeof PATTERN_WAVES_FADES;

/** 条目常数: 字形图集格边长 (像素), 波形单位长度 (CSS 像素), 水纹格与水纹时钟速率, 入场秒数, 褶皱数. */
export const PATTERN_WAVES_ATLAS_TILE = 128;
export const PATTERN_WAVES_UNIT = 520;
export const PATTERN_WAVES_RIPPLE_CELL = 8;
export const PATTERN_WAVES_RIPPLE_RATE = 60;
export const PATTERN_WAVES_INTRO_SECONDS = 2;
export const PATTERN_WAVES_FOLDS = 5.5;
/** 字形记号的默认字符, 由疏到密 (本库定). */
export const PATTERN_WAVES_CHARACTERS = ".:-=+*#%@";
/** 点击水纹的外扩速度 (CSS 像素每秒) 与衰减 (每秒) (本库定). */
export const PATTERN_WAVES_TAP_SPEED = 420;
export const PATTERN_WAVES_TAP_DECAY = 1.4;

/** 一种表面预设: 波形与光照参数. */
export interface PatternWavesSurface {
  readonly wave: PatternWavesWave;
  /** 高度带来的视差错位 (格宽倍数). */
  readonly depth: number;
  /** 光照方向 (度, 0 为自右向左照). */
  readonly light: number;
  /** 高光强度 0..1. */
  readonly shine: number;
  /** 受光对比度. */
  readonly contrast: number;
}

/** 条目的 SURFACE_PRESETS: 三种表面的组合 (取值本库定). */
export const PATTERN_WAVES_PRESETS: Readonly<Record<PatternWavesWave, PatternWavesSurface>> = {
  silk: { wave: "silk", depth: 0.6, light: 135, shine: 0.55, contrast: 1.1 },
  swell: { wave: "swell", depth: 0.9, light: 120, shine: 0.35, contrast: 1 },
  ripple: { wave: "ripple", depth: 0.45, light: 150, shine: 0.7, contrast: 1.25 },
};

/**
 * 预设叠上逐项覆写: 未给 (undefined) 的项取预设, 数值钳到合理范围. 纯函数.
 *
 * @param preset 预设名, 未知名取 silk.
 * @param overrides 用户给的单项.
 */
export function resolveSurface(preset: PatternWavesWave, overrides: Partial<PatternWavesSurface>): PatternWavesSurface {
  const base = PATTERN_WAVES_PRESETS[preset] ?? PATTERN_WAVES_PRESETS.silk;
  const pick = <K extends keyof PatternWavesSurface>(key: K): PatternWavesSurface[K] => (overrides[key] ?? base[key]) as PatternWavesSurface[K];
  return {
    wave: pick("wave") in PATTERN_WAVES_WAVES ? pick("wave") : base.wave,
    depth: clamp(pick("depth"), 0, 4),
    light: pick("light"),
    shine: clamp(pick("shine"), 0, 1),
    contrast: clamp(pick("contrast"), 0.1, 4),
  };
}

/** 枚举名换着色器里的整数, 未知名取 fallback. 纯函数. */
export function enumOf<T extends Record<string, number>>(table: T, key: string, fallback: keyof T): number {
  return key in table ? (table[key] as number) : table[fallback];
}

/** 波形单位长度 (CSS 像素): WAVE_UNIT 除以 scale, scale 不正时按 0.05. 纯函数. */
export function waveUnit(scale: number): number {
  return PATTERN_WAVES_UNIT / Math.max(Number.isFinite(scale) ? scale : 1, 0.05);
}

/**
 * 指针尾流时钟: 指针在场且移动时按 RIPPLE_RATE 每秒长到 4, 否则以同速回落到 0; 凹坑强度取 clock / 4. 纯函数.
 *
 * @param clock 上一帧的时钟.
 * @param dt 帧长 (秒).
 * @param active 指针是否在场并移动.
 */
export function stepWake(clock: number, dt: number, active: boolean): number {
  const step = Math.max(dt, 0) * PATTERN_WAVES_RIPPLE_RATE;
  return active ? Math.min(clock + step, 4) : Math.max(clock - step, 0);
}

/** 格距 (CSS 像素): 不小于水纹格 RIPPLE_CELL 的一半, 非有限值取 RIPPLE_CELL. 纯函数. */
export function pitchOf(spacing: number): number {
  return Number.isFinite(spacing) ? Math.max(spacing, PATTERN_WAVES_RIPPLE_CELL / 2) : PATTERN_WAVES_RIPPLE_CELL;
}

/** 光照方向 (度) 换单位向量 [x, y]. 纯函数. */
export function headingOf(degrees: number): readonly [number, number] {
  const a = (degrees * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a)];
}

const BODY = `
uniform vec3 u_ink;
uniform vec3 u_bg;
uniform float u_opaque;
uniform float u_pattern;
uniform float u_wave;
uniform float u_pitch;
uniform float u_mark;
uniform float u_depth;
uniform vec2 u_heading;
uniform float u_shine;
uniform float u_contrast;
uniform float u_unit;
uniform float u_angle;
uniform float u_fade_mode;
uniform float u_fade_size;
uniform vec4 u_cursor;
uniform float u_appear;
uniform float u_tap_on;
uniform sampler2D u_atlas;
uniform vec2 u_atlas_grid;
uniform float u_glyph_count;
uniform float u_has_atlas;

const float FOLDS = ${PATTERN_WAVES_FOLDS};

float surface(vec2 q, float t) {
  float u = q.x;
  float v = q.y;
  float h;
  if (u_wave < 0.5) {
    float bend = hx_gnoise(vec2(u * 0.7, v * 0.5 + t * 0.03)) * 2.0;
    float swell = 0.6 + 0.4 * hx_gnoise(vec2(u * 0.55 + 3.0, v * 0.45 + t * 0.04));
    float ripple = 0.16 * sin(u * FOLDS * 2.5 + bend * 1.9 - t * 0.9 + 2.1);
    h = sin(v * FOLDS + bend * 2.4 - t * 0.6) * swell + ripple;
  } else if (u_wave < 1.5) {
    float roll = 0.75 + 0.25 * hx_gnoise(q * 0.9 + 11.0 + t * 0.05);
    h = (hx_fbm(q * 0.8 + vec2(t * 0.08, -t * 0.05), 4) * 2.0 - 1.0) * 1.4 * roll;
  } else {
    float a = sin(length(q - vec2(-0.8, 0.4)) * FOLDS * 2.0 - t * 1.4);
    float b = sin(length(q - vec2(0.9, -0.5)) * FOLDS * 1.7 - t * 1.1);
    h = 0.5 * (a + b) * (0.75 + 0.25 * hx_gnoise(q * 1.3 + t * 0.06));
  }
  vec2 cp = (u_cursor.xy - 0.5) * u_res / u_dpr / u_unit;
  float r = max(u_cursor.z, 1.0) / u_unit;
  vec2 dq = hx_rot(-u_angle) * q - cp;
  h -= u_cursor.w * exp(-dot(dq, dq) / (r * r)) * 1.6;
  for (int k = 0; k < 8; k++) {
    if (float(k) >= u_tap_count) break;
    vec4 tap = u_taps[k];
    vec2 tp = (tap.xy - 0.5) * u_res / u_dpr / u_unit;
    float d = length(dq + cp - tp) - tap.z * ${PATTERN_WAVES_TAP_SPEED}.0 / u_unit;
    h += 0.8 * sin(d * 18.0) * exp(-d * d * 30.0) * exp(-tap.z * ${PATTERN_WAVES_TAP_DECAY}) * tap.w * u_tap_on;
  }
  return h;
}

float mark(vec2 local, float level, float glyph) {
  vec2 c = local - 0.5;
  float aa = 1.0 / max(u_pitch * u_dpr, 1.0);
  float area = clamp(u_mark, 0.05, 1.0);
  if (u_pattern < 0.5) {
    float rad = 0.5 * area * sqrt(level);
    return smoothstep(rad + aa, rad - aa, length(c));
  }
  if (u_pattern < 1.5) {
    float extent = 0.5 * area * sqrt(level);
    return smoothstep(extent + aa, extent - aa, max(abs(c.x), abs(c.y)));
  }
  float arm = 0.5 * area * mix(0.3, 1.0, level);
  float width = max(0.5 * 0.22 * area, aa);
  if (u_pattern < 2.5) {
    float bx = max(abs(c.x) - arm, abs(c.y) - width);
    float by = max(abs(c.y) - arm, abs(c.x) - width);
    return smoothstep(aa, -aa, min(bx, by));
  }
  if (u_pattern < 3.5) {
    vec2 r = hx_rot(atan(u_heading.y, u_heading.x)) * c;
    return smoothstep(aa, -aa, max(abs(r.x) - arm, abs(r.y) - width));
  }
  if (u_has_atlas < 0.5) {
    float extent = 0.5 * area * sqrt(level);
    return smoothstep(extent + aa, extent - aa, max(abs(c.x), abs(c.y)));
  }
  float col = mod(glyph, u_atlas_grid.x);
  float row = floor(glyph / u_atlas_grid.x);
  vec2 inset = clamp((local - 0.5) / max(area, 0.05) + 0.5, 0.02, 0.98);
  vec2 uv = vec2((col + inset.x) / u_atlas_grid.x, (u_atlas_grid.y - 1.0 - row + inset.y) / u_atlas_grid.y);
  return texture(u_atlas, uv).a * step(0.02, level);
}

void main() {
  float t = u_time;
  vec2 css = (gl_FragCoord.xy - 0.5 * u_res) / u_dpr;
  vec2 grid = hx_rot(u_angle) * css;
  float pitch = max(u_pitch, 2.0);
  vec2 cell = floor(grid / pitch);
  vec2 centre = (cell + 0.5) * pitch;
  vec2 q = centre / u_unit;
  float e = pitch / u_unit;
  float h = surface(q, t);
  float hx = surface(q + vec2(e, 0.0), t) - surface(q - vec2(e, 0.0), t);
  float hy = surface(q + vec2(0.0, e), t) - surface(q - vec2(0.0, e), t);
  vec3 n = normalize(vec3(-hx, -hy, 2.0 * e * 2.5));
  vec3 l = normalize(vec3(u_heading, 0.9));
  float diffuse = clamp(dot(n, l), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 24.0) * u_shine;
  float hollow = 0.7 + 0.3 * clamp(h * 0.5 + 0.5, 0.0, 1.0);
  float level = clamp((diffuse * hollow - 0.5) * u_contrast + 0.5 + spec * 0.5, 0.0, 1.0);
  vec2 shift = vec2(hx, hy) / max(2.0 * e, 1e-4) * u_depth * 0.25;
  vec2 local = fract(grid / pitch + shift);
  float glyph = min(floor(level * u_glyph_count), u_glyph_count - 1.0);
  float cover = mark(local, level, glyph);
  float emphasis = u_pattern > 3.5 ? smoothstep(0.55, 0.95, level) : clamp(spec * 1.6, 0.0, 1.0);
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 c = uv * 2.0 - 1.0;
  float fs = max(u_fade_size, 1e-3);
  float fade = 1.0;
  if (u_fade_mode > 0.5 && u_fade_mode < 1.5) {
    fade = 1.0 - smoothstep(1.0 - fs, 1.18, length(c));
  } else if (u_fade_mode < 2.5 && u_fade_mode > 1.5) {
    fade = mix(0.05, 1.0, smoothstep(0.08, 0.08 + fs, length(c * vec2(1.0, 1.35))));
  } else if (u_fade_mode < 3.5 && u_fade_mode > 2.5) {
    fade = smoothstep(0.0, fs, uv.y);
  } else if (u_fade_mode > 3.5) {
    fade = smoothstep(0.0, fs, 1.0 - uv.y);
  }
  float reach = length(c) / 1.4142;
  float appear = smoothstep(reach - 0.05, reach + 0.3, u_appear * 1.35);
  float ink = cover * clamp(0.35 + 0.65 * level + 0.3 * emphasis, 0.0, 1.0) * fade * appear;
  if (u_opaque > 0.5) {
    o_color = vec4(mix(u_bg, u_ink, ink), 1.0);
  } else {
    o_color = vec4(u_ink, ink);
  }
}
`;

/** 上屏片元. */
export const PATTERN_WAVES_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
