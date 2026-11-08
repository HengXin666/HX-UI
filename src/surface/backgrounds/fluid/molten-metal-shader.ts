// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 MoltenMetal 条目, 实现为 HX 自有.
import { GLSL_HASH, GLSL_NOISE, GLSL_UTIL, fragmentSource } from "../../backdrop/kernel/glsl";

/** 调色板最多几色. */
export const MOLTEN_MAX_COLORS = 6;
/** 指针拖尾的采样点数. */
export const MOLTEN_TRAIL = 16;
/** 同时存活的点击耀斑数 (与内核记住的点击数一致). */
export const MOLTEN_MAX_FLARES = 8;
/** 拖尾采样间隔 (秒). */
export const MOLTEN_SAMPLE_SECONDS = 0.06;
/** 拖尾点的寿命 (秒). */
export const MOLTEN_TRAIL_SECONDS = 0.9;
/** 点击耀斑的寿命 (秒). */
export const MOLTEN_FLARE_SECONDS = 1.8;
/** 入场: 熔流从下往上漫开的秒数. */
export const MOLTEN_INTRO_SECONDS = 2.4;
/** 入场前段只扫前沿, 进度过了这里才开始流动. */
export const MOLTEN_FLOW_START = 0.4;
/** 指针在场程度的时间常数 (秒). */
export const MOLTEN_PRESENCE_TAU = 0.25;
/** 热点跟手的时间常数 (秒). */
export const MOLTEN_FOLLOW_TAU = 0.33;

export type MoltenMode = "molten" | "ember" | "frost";
/** 调色板取色的偏置: 熔融居中, 余烬偏暗端, 霜冻偏亮端. */
export const MOLTEN_BALANCE: Readonly<Record<MoltenMode, number>> = { molten: 0.5, ember: 0.3, frost: 0.7 };

/**
 * 拖尾点权重: 寿命内按 (1 - age / life)^2 衰减, 之外为 0.
 *
 * @param age 采样以来的秒数.
 */
export function moltenTrailWeight(age: number): number {
  if (age < 0 || age >= MOLTEN_TRAIL_SECONDS) return 0;
  const left = 1 - age / MOLTEN_TRAIL_SECONDS;
  return left * left;
}

/**
 * 点击耀斑包络: 1 - exp(-age / 0.07) 迅速升起, 寿命内平滑落下.
 *
 * @param age 距点击的秒数.
 */
export function moltenFlare(age: number): number {
  if (age < 0 || age >= MOLTEN_FLARE_SECONDS) return 0;
  const t = age / MOLTEN_FLARE_SECONDS;
  return (1 - Math.exp(-age / 0.07)) * (1 - t * t * (3 - 2 * t));
}

/**
 * 入场进度: 0..1, 关掉 intro 或减弱动效时为 1.
 *
 * @param elapsed 出帧以来的真实秒数.
 * @param intro 是否有入场.
 */
export function moltenReveal(elapsed: number, intro: boolean): number {
  if (!intro || !Number.isFinite(elapsed)) return 1;
  return Math.min(1, Math.max(0, elapsed / MOLTEN_INTRO_SECONDS));
}

/** 熔融金属场: 多层旋涡扭曲的分形高度, 屏幕导数取脊线与法线, 指针拖尾与点击耀斑加热到芯色. */
export const MOLTEN_FRAGMENT = fragmentSource(`
uniform vec3 u_colors[${MOLTEN_MAX_COLORS}];
uniform float u_color_count;
uniform vec3 u_core;
uniform vec3 u_bg;
uniform float u_bg_alpha;
uniform float u_scale;
uniform float u_detail;
uniform float u_glow;
uniform float u_thick;
uniform float u_swirl;
uniform float u_turb;
uniform float u_haze;
uniform float u_bright;
uniform float u_balance;
uniform float u_rotation;
uniform vec2 u_offset;
uniform float u_drift;
uniform float u_grain;
uniform vec4 u_trail[${MOLTEN_TRAIL}];
uniform vec4 u_flares[${MOLTEN_MAX_FLARES}];
uniform vec4 u_hot;
uniform vec2 u_reveal;
uniform float u_light;

vec3 ramp(float x) {
  float scaled = clamp(x, 0.0, 1.0) * max(u_color_count - 1.0, 0.0);
  int index = int(min(floor(scaled), max(u_color_count - 2.0, 0.0)));
  if (u_color_count < 1.5) return u_colors[0];
  return mix(u_colors[index], u_colors[index + 1], smoothstep(0.0, 1.0, scaled - float(index)));
}

float field(vec2 p, float t) {
  vec2 q = p;
  for (float i = 1.0; i < 7.0; i++) {
    if (i > u_detail) break;
    float a = u_swirl * (0.55 / i) * sin(length(q) * 0.7 * i - t * (0.4 + 0.1 * i));
    q = hx_rot(a) * q + vec2(sin(q.y * 0.8 * i + t * 0.6), cos(q.x * 0.7 * i - t * 0.5)) * 0.35 / i;
  }
  q += u_drift * t * vec2(0.35, 0.12);
  return hx_fbm(q * 0.6, 4) + u_turb * 0.5 * hx_gnoise(q * 2.3 + t * 0.4);
}

float heatAt(vec2 uv) {
  vec2 aspect = vec2(u_res.x / min(u_res.x, u_res.y), u_res.y / min(u_res.x, u_res.y));
  float heat = 0.0;
  for (int i = 0; i < ${MOLTEN_TRAIL}; i++) {
    vec4 f = u_trail[i];
    if (f.z <= 0.0) continue;
    vec2 d = (uv - f.xy) * aspect;
    heat += f.z * exp(-dot(d, d) / 0.006);
  }
  vec2 dh = (uv - u_hot.xy) * aspect;
  heat += u_hot.z * exp(-dot(dh, dh) / 0.012);
  for (int i = 0; i < ${MOLTEN_MAX_FLARES}; i++) {
    vec4 f = u_flares[i];
    if (f.w <= 0.0) continue;
    vec2 d = (uv - f.xy) * aspect;
    float r = 0.04 + f.z * 0.25;
    heat += f.w * 1.6 * exp(-dot(d, d) / (r * r));
  }
  return heat * u_hot.w;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = hx_rot(radians(u_rotation)) * (hx_centered(gl_FragCoord.xy) * u_scale) - u_offset;
  float flowing = smoothstep(${MOLTEN_FLOW_START}, 1.0, u_reveal.y);
  float t = u_time * flowing;
  float l = field(p, t);
  float footprint = 0.5 * length(vec2(dFdx(l), dFdy(l)));
  float c = 0.0;
  float blurred = 0.0;
  for (float n = 0.0; n < 8.0; n++) {
    float k = 4.0 + n * 1.5;
    float ridge = abs(fract(l * k * 0.5) - 0.5) * 2.0;
    float w = max(footprint * k, 1e-3) + 0.06 * u_thick;
    c += (1.0 - smoothstep(0.0, w, ridge)) / (n + 1.0);
    blurred += (1.0 - smoothstep(0.0, w * 4.0, ridge)) / (n + 1.0);
  }
  c /= 2.7;
  blurred /= 2.7;
  vec2 g = vec2(dFdx(l), dFdy(l)) / max(footprint * 2.0, 1e-4);
  vec3 n = normalize(vec3(-g * 0.4 * u_thick, 1.0));
  float spec = pow(max(dot(reflect(vec3(0.0, 0.0, -1.0), n), normalize(vec3(-0.4, 0.5, 0.8))), 0.0), 18.0);
  float heat = heatAt(uv);
  vec3 metal = ramp(l + u_balance - 0.5);
  vec3 col = metal * (0.25 + 0.75 * c) + metal * blurred * u_glow * 0.35 + u_core * spec * 0.6;
  col = mix(col, u_core, clamp(heat * (0.4 + c), 0.0, 1.0));
  col += ramp(u_balance) * u_haze * 0.18 * smoothstep(0.2, 0.9, blurred);
  col *= u_bright;
  float level = (uv.y * 2.0 - 1.0) * 2.0 + l - 0.5;
  float reveal = 1.0;
  float front = 0.0;
  if (u_reveal.y < 1.0) {
    float edge = mix(-2.6, 2.6, u_reveal.y) - level;
    reveal = smoothstep(-1.0, 1.0, edge) * smoothstep(0.0, 0.08, u_reveal.y);
    front = 0.2 * exp(-edge * edge * 1.5) * smoothstep(-2.6, -0.6, mix(-2.6, 2.6, u_reveal.y));
  }
  col += u_core * front;
  col += hx_grain(gl_FragCoord.xy, u_time) * u_grain;
  if (u_light > 0.5) col = mix(u_bg, u_bg * (0.55 + 0.45 * metal) - spec * 0.1, clamp(0.35 + c, 0.0, 1.0));
  else col = hx_tonemap(col * 1.3);
  float a = max(u_bg_alpha, reveal * clamp(0.35 + c + heat, 0.0, 1.0));
  o_color = vec4(mix(u_bg, col, reveal), a);
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
