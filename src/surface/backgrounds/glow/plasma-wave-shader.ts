// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 PlasmaWave 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { BLOOM_ENCODE } from "../bloom";
import { GLOW_GLSL } from "./glow-kit";

/** 规格的泛光金字塔层数 (BLOOM_LEVELS), 交给 ../bloom.ts 的离屏金字塔. */
export const PLASMA_WAVE_BLOOM_LEVELS = 4;
/** 泛光的亮部阈值, 软膝与强度增益 (本库定); 强度为 glow * 增益. */
export const PLASMA_WAVE_BLOOM = { threshold: 0.5, knee: 0.5, gain: 0.6 } as const;
/** 规格的粗通道降采样比 (COARSE_RATIO). */
export const PLASMA_WAVE_COARSE_RATIO = 3;
/** 入场时长秒 (规格 INTRO_SECONDS). */
export const PLASMA_WAVE_INTRO_SECONDS = 1.8;
/** 规格的光照像素上限 (MAX_LIGHT_PIXELS). */
export const PLASMA_WAVE_MAX_LIGHT_PIXELS = 2400000;
/** 色标上限. */
export const PLASMA_WAVE_MAX_COLORS = 4;
/** 热点横向跟随速率 (规格 exp(-dt * 6)). */
export const PLASMA_WAVE_HEAT_FOLLOW_RATE = 6;
/** 热度弹簧: 刚度 120, 阻尼 19, 上限 1.15 (规格原式). */
export const PLASMA_WAVE_HEAT_SPRING = { stiffness: 120, damping: 19, max: 1.15 } as const;
/** 透镜跟随速率 (规格 exp(-dt * 8)). */
export const PLASMA_WAVE_LENS_RATE = 8;

/** 粗通道的输出采样器名; 场景通道按名读同帧结果. */
export const PLASMA_WAVE_COARSE = "u_plasma_coarse";
/** 光带外场的截断: 场 1 - exp(-e) 不过 0.03 (soft 的下沿) 时整像素透明, 即 e <= -ln(0.97). */
const FIELD_CUT = -Math.log(0.97);
/** 粗通道把距离下压的屏幕导数倍数 (覆盖本格与邻格的细像素), 与跳过阈值 (截断的一半), 都偏保守. */
const COARSE_MARGIN = 1.5;
const COARSE_SKIP = 1 / 3;

const COMMON = `
uniform vec3 u_ramp[${PLASMA_WAVE_MAX_COLORS}];
uniform float u_count;
uniform vec2 u_speeds;
uniform float u_dir2;
uniform vec2 u_bends;
uniform float u_thickness;
uniform float u_focal;
uniform float u_turn;
uniform vec2 u_offset;
uniform float u_brightness;
uniform float u_glow;
uniform float u_core;
uniform float u_presence;
uniform vec2 u_heat;
uniform vec3 u_lens;
const float FIELD_CUT = ${FIELD_CUT.toFixed(7)};

float ribbon(vec2 p, float phase, float bend, float lift) {
  float y = 0.22 * bend * sin(p.x * 2.1 + phase) + 0.08 * bend * sin(p.x * 4.7 - phase * 1.3) + lift;
  return abs(p.y - y);
}

vec2 wave(vec2 uv) {
  vec2 k = u_res / min(u_res.x, u_res.y);
  vec2 p = (uv - 0.5) * k;
  vec2 lc = (u_lens.xy - 0.5) * k;
  vec2 ld = p - lc;
  p = lc + ld * (1.0 - 0.25 * u_lens.z * exp(-dot(ld, ld) * 10.0));
  p = hx_rot(u_turn) * (p - u_offset);
  p *= u_focal / max(u_focal - p.y * 0.5, 0.2);
  float hx = (u_heat.x - 0.5) * k.x;
  float lift = 0.12 * u_heat.y * exp(-(p.x - hx) * (p.x - hx) * 6.0);
  float t = u_time * 20.0;
  float d1 = ribbon(p, t * u_speeds.x, u_bends.x, lift);
  float d2 = ribbon(p * vec2(0.8, 1.0) + vec2(1.7, 0.0), t * u_speeds.y * u_dir2 + 2.0, u_bends.y, lift * 0.6);
  return vec2(d1, d2);
}

float wave_peak(vec2 d) {
  float w = 0.01 + u_thickness * 0.04;
  return w / (d.x + w * 0.15) * 2.0 + w / (d.y + w * 0.15) * 1.4;
}

float wave_halo(vec2 d) { return exp(-d.x * 9.0) + 0.7 * exp(-d.y * 9.0); }
`;

const COARSE = `
void main() {
  vec2 d = wave(v_uv);
  vec2 lo = max(d - ${COARSE_MARGIN.toFixed(1)} * fwidth(d), 0.0);
  float e = wave_peak(lo) * 0.06 + wave_halo(lo) * 0.5 * max(u_glow, 0.0);
  float near = min(lo.x, lo.y);
  o_color = vec4(e / (e + FIELD_CUT), near / (near + 1.0), step(lo.y, lo.x), 1.0);
}
`;

const FINE = `
uniform sampler2D ${PLASMA_WAVE_COARSE};

vec3 ramp(float x) {
  float n = max(u_count - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  float i = min(floor(f), n - 1.0);
  vec3 a = u_ramp[0];
  vec3 b = u_ramp[0];
  for (int k = 0; k < ${PLASMA_WAVE_MAX_COLORS}; k++) {
    if (float(k) == i) a = u_ramp[k];
    if (float(k) == min(i + 1.0, n)) b = u_ramp[k];
  }
  return mix(a, b, smoothstep(0.0, 1.0, f - i));
}

float coarse_hint() {
  ivec2 size = textureSize(${PLASMA_WAVE_COARSE}, 0);
  ivec2 c = ivec2(v_uv * vec2(size));
  float m = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) m = max(m, texelFetch(${PLASMA_WAVE_COARSE}, clamp(c + ivec2(x, y), ivec2(0), size - 1), 0).r);
  }
  return m;
}

void main() {
  if (coarse_hint() < ${COARSE_SKIP.toFixed(4)}) { o_color = vec4(0.0); return; }
  vec2 d = wave(v_uv);
  float peak = wave_peak(d);
  float field = 1.0 - exp(-peak * 0.06 - wave_halo(d) * 0.5 * u_glow);
  float soft = smoothstep(0.03, 0.36, field);
  float hot = smoothstep(0.32, 0.8, field);
  float t = u_time * 20.0;
  vec3 ink = ramp(v_uv.x + 0.1 * sin(t * 0.05));
  vec3 color = mix(ink, vec3(1.0), smoothstep(12.0, 26.0, peak) * u_core);
  float alpha = (soft * u_glow * 0.7 + hot) * u_presence;
  float feather = 0.1;
  float body = smoothstep(0.15 - feather, 0.15 + feather, alpha);
  float a = clamp(alpha * u_brightness, 0.0, 1.0) * mix(0.85, 1.0, body);
  o_color = bloom_encode(color * u_brightness * (0.6 + 0.6 * hot) * a, a);
}
`;

/**
 * PlasmaWave 的粗通道 (1 / COARSE_RATIO 场景比例): 以屏幕导数把两条光带的距离下压成本格下界, 写出
 * r = 场强上界的覆盖提示 e / (e + 截断), g = 最近距离 d / (d + 1), b = 最近光带号 (0 / 1).
 */
export const PLASMA_WAVE_COARSE_SCENE = fragmentSource(COARSE, GLSL_HASH, GLSL_UTIL, COMMON);

/**
 * PlasmaWave 的离屏场景 (细通道): 读同帧粗通道, 3x3 粗格的提示都低于截断一半时整像素透明直接跳过,
 * 否则逐像素追踪光带, 以预乘的线性光与覆盖率写出 (bloom_encode). 跳过只落在全追踪结果本就为 0 的像素上.
 */
export const PLASMA_WAVE_SCENE = fragmentSource(FINE, GLSL_HASH, GLSL_UTIL, BLOOM_ENCODE, COMMON);

/** 上屏: 场景加泛光, 覆盖率取场景与泛光峰值的较大者, 再按本路收尾 (渐隐, 颗粒, 亮底). */
const COMPOSITE = `
void main() {
  vec4 s = bloom_scene(v_uv);
  vec3 g = bloom_glow(v_uv);
  float a = clamp(max(s.a, max(g.r, max(g.g, g.b))), 0.0, 1.0);
  o_color = glow_finish((s.rgb + g) / max(a, 0.0001), a, gl_FragCoord.xy);
}
`;

/**
 * PlasmaWave 的上屏片元.
 *
 * @param compositeGlsl bloomPyramid 返回的 compositeGlsl.
 */
export function plasmaWaveComposite(compositeGlsl: string): string {
  return fragmentSource(COMPOSITE, GLSL_HASH, GLSL_UTIL, GLOW_GLSL, compositeGlsl);
}
