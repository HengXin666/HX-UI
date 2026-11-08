// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.

/** 内核记住的最近点击数, 着色器里是 u_taps[BACKDROP_MAX_TAPS]. */
export const BACKDROP_MAX_TAPS = 8;

/**
 * 每个片元程序的公共头. 内核每帧写入:
 * u_res 画布设备像素, u_time 累计秒 (已乘 speed, 停帧时不走), u_dpr 实际像素比,
 * u_pointer (xy 归一化坐标 y 朝上, z 在场内的平滑程度 0..1, w 按下),
 * u_taps[i] (xy 坐标, z 距今秒数, w 1 表示有效), u_tap_count 有效个数.
 */
export const GLSL_HEADER = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_dpr;
uniform vec4 u_pointer;
uniform vec4 u_taps[${BACKDROP_MAX_TAPS}];
uniform float u_tap_count;
in vec2 v_uv;
out vec4 o_color;
`;

/** 整数混洗哈希 (lowbias32 结构), 输入任意浮点按位取整, 不用 sin, 各家驱动结果一致. */
export const GLSL_HASH = `
uint hx_mix(uint x) {
  x ^= x >> 16u; x *= 0x7feb352du;
  x ^= x >> 15u; x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}
const float HX_UINT_MAX = 4294967295.0;
float hx_hash1(float p) { return float(hx_mix(floatBitsToUint(p))) / HX_UINT_MAX; }
float hx_hash2(vec2 p) {
  uvec2 b = floatBitsToUint(p + 0.0);
  return float(hx_mix(b.x ^ hx_mix(b.y + 0x9e3779b9u))) / HX_UINT_MAX;
}
vec2 hx_hash22(vec2 p) {
  uvec2 b = floatBitsToUint(p + 0.0);
  uint h = hx_mix(b.x ^ hx_mix(b.y + 0x9e3779b9u));
  return vec2(float(h), float(hx_mix(h))) / HX_UINT_MAX;
}
float hx_hash3(vec3 p) {
  uvec3 b = floatBitsToUint(p + 0.0);
  return float(hx_mix(b.x ^ hx_mix(b.y ^ hx_mix(b.z + 0x632be5abu)))) / HX_UINT_MAX;
}
`;

/** 值噪声, 梯度噪声与分形叠加. 依赖 GLSL_HASH. */
export const GLSL_NOISE = `
vec2 hx_fade(vec2 f) { return f * f * f * (f * (f * 6.0 - 15.0) + 10.0); }
float hx_vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 u = hx_fade(fract(p));
  float a = hx_hash2(i);
  float b = hx_hash2(i + vec2(1.0, 0.0));
  float c = hx_hash2(i + vec2(0.0, 1.0));
  float d = hx_hash2(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float hx_gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = hx_fade(f);
  float a = dot(hx_hash22(i) * 2.0 - 1.0, f);
  float b = dot(hx_hash22(i + vec2(1.0, 0.0)) * 2.0 - 1.0, f - vec2(1.0, 0.0));
  float c = dot(hx_hash22(i + vec2(0.0, 1.0)) * 2.0 - 1.0, f - vec2(0.0, 1.0));
  float d = dot(hx_hash22(i + vec2(1.0, 1.0)) * 2.0 - 1.0, f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 1.4;
}
float hx_vnoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hx_hash3(i);
  float n100 = hx_hash3(i + vec3(1.0, 0.0, 0.0));
  float n010 = hx_hash3(i + vec3(0.0, 1.0, 0.0));
  float n110 = hx_hash3(i + vec3(1.0, 1.0, 0.0));
  float n001 = hx_hash3(i + vec3(0.0, 0.0, 1.0));
  float n101 = hx_hash3(i + vec3(1.0, 0.0, 1.0));
  float n011 = hx_hash3(i + vec3(0.0, 1.0, 1.0));
  float n111 = hx_hash3(i + vec3(1.0, 1.0, 1.0));
  float z0 = mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y);
  float z1 = mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y);
  return mix(z0, z1, u.z);
}
float hx_fbm(vec2 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amp * hx_vnoise(p);
    p = turn * p * 2.03 + 17.1;
    amp *= 0.5;
  }
  return sum;
}
`;

/** 杂项: 旋转矩阵, 以短边归一化的居中坐标, 胶片颗粒, 色调压缩. 颗粒依赖 GLSL_HASH. */
export const GLSL_UTIL = `
const float HX_PI = 3.14159265;
const float HX_TAU = 6.28318531;
mat2 hx_rot(float a) { float c = cos(a); float s = sin(a); return mat2(c, -s, s, c); }
vec2 hx_centered(vec2 frag) { return (frag - 0.5 * u_res) / min(u_res.x, u_res.y); }
vec2 hx_pointer_centered() { return (u_pointer.xy - 0.5) * u_res / min(u_res.x, u_res.y); }
float hx_grain(vec2 frag, float t) { return hx_hash2(floor(frag) + floor(t * 24.0) * 7.13) - 0.5; }
vec3 hx_tonemap(vec3 c) { return 1.0 - exp(-max(c, 0.0)); }
float hx_luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
`;

/**
 * 拼出完整片元源码: 公共头, 所需片段, 再接本件的主体.
 *
 * @param body 本件的声明与 main.
 * @param chunks 要带上的公共片段, 按依赖顺序给 (GLSL_HASH 在 GLSL_NOISE 之前).
 */
export function fragmentSource(body: string, ...chunks: readonly string[]): string {
  return [GLSL_HEADER, ...chunks, body].join("\n");
}
