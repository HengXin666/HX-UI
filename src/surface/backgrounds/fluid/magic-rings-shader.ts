// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 MagicRings 条目, 实现为 HX 自有.
// 环带截面 (细芯与光晕) 走 Canvas2D 预烘的一行纹理 (ringsProfileBytes), 倾斜按相机射线与倾斜平面解析求交得到真透视.
import { GLSL_HASH, GLSL_UTIL, fragmentSource } from "../../backdrop/kernel/glsl";
import { smoothstep } from "../../backdrop/kernel/math";
import { RINGS_MAX, RINGS_MAX_BURSTS } from "./magic-rings-motion";
import { bakeBytes } from "./prebake";

/** 截面预烘图的宽 (像素), 高 1. */
export const RINGS_PROFILE_SIZE = 256;
/** 预烘图覆盖离环心线 0..48 个线宽; 末端窗口压到 0, 采样越界时夹到末端即为 0. */
export const RINGS_PROFILE_REACH = 48;
/** 相机焦距 (短边单位): 倾斜为 0 时屏幕与平面重合, 透视强弱由它定. */
export const RINGS_FOCAL = 2;
/** 倾斜上限 (度), 再大地平线会切进画面中央. */
export const RINGS_TILT_LIMIT = 85;

/**
 * 环带截面: 离环心线 x 个线宽处的细芯与光晕. 光晕按 1.5 / (x + 1.5) 存 (片元里乘 glow 再平方), 以免 8 位存不下远处的弱光.
 *
 * @param x 离环心线的距离 (线宽).
 */
export function ringsProfile(x: number): readonly [number, number] {
  const d = Math.abs(x);
  const fade = 1 - smoothstep(0.85, 1, d / RINGS_PROFILE_REACH);
  return [1 - smoothstep(0.5, 1.5, d), (1.5 / (d + 1.5)) * fade];
}

/** 截面预烘图的字节: r 细芯, g 光晕的平方根, b 为 0, a 为 1. */
export function ringsProfileBytes(): Uint8ClampedArray {
  return bakeBytes(RINGS_PROFILE_SIZE, 1, (u) => {
    const [core, halo] = ringsProfile(u * RINGS_PROFILE_REACH);
    return [core, halo, 0, 1];
  });
}

/**
 * 倾斜平面上的点: 屏幕点 (短边单位, 以环心为原点) 从焦距 RINGS_FOCAL 处的相机射向绕 x 轴倾斜 tilt 度的平面, 返回平面坐标;
 * 越过地平线时返回 null. tilt 为正时上方远离观者. 纯函数, 与片元里的 onTilted 一致, 单测用.
 *
 * @param x 屏幕 x.
 * @param y 屏幕 y (向上).
 * @param tilt 倾斜 (度).
 */
export function ringsOnTilted(x: number, y: number, tilt: number): readonly [number, number] | null {
  const a = (Math.max(-RINGS_TILT_LIMIT, Math.min(RINGS_TILT_LIMIT, tilt)) * Math.PI) / 180;
  const den = -y * Math.sin(a) + RINGS_FOCAL * Math.cos(a);
  if (den <= 1e-4) return null;
  const t = (RINGS_FOCAL * Math.cos(a)) / den;
  const pz = RINGS_FOCAL - RINGS_FOCAL * t;
  return [x * t, y * t * Math.cos(a) - pz * Math.sin(a)];
}

/** 发光圆环: 倾斜平面上的同心环带, 截面取预烘纹理, 线宽按屏幕导数保持像素粗细, 可色散; 峰值经 1 - exp(-peak) 压缩, 过曝处泛白. */
export const RINGS_FRAGMENT = fragmentSource(`
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec4 u_rings[${RINGS_MAX}];
uniform vec4 u_bursts[${RINGS_MAX_BURSTS}];
uniform float u_line;
uniform float u_glow;
uniform float u_taper;
uniform float u_angle;
uniform float u_tilt;
uniform float u_dispersion;
uniform float u_grain;
uniform vec2 u_center;
uniform vec2 u_parallax;
uniform float u_zoom;
uniform float u_boost;
uniform vec2 u_aim;
uniform sampler2D u_profile;
uniform float u_has_profile;

const float FOCAL = ${RINGS_FOCAL.toFixed(1)};
const float REACH = ${RINGS_PROFILE_REACH.toFixed(1)};

// 相机在 (0, 0, FOCAL) 看向原点, 屏幕点 s 的射线与绕 x 轴倾斜的平面求交, 返回平面坐标; 越过地平线时 ok 为 0.
vec2 onTilted(vec2 s, out float ok) {
  float a = radians(clamp(u_tilt, -${RINGS_TILT_LIMIT.toFixed(1)}, ${RINGS_TILT_LIMIT.toFixed(1)}));
  float den = -s.y * sin(a) + FOCAL * cos(a);
  ok = step(1e-4, den);
  float t = FOCAL * cos(a) / max(den, 1e-4);
  vec3 p = vec3(s * t, FOCAL - FOCAL * t);
  return vec2(p.x, p.y * cos(a) - p.z * sin(a));
}

// d 与 w 都是设备像素.
float ringPeak(float d, float w) {
  float x = abs(d) / max(w, 1e-4);
  if (u_has_profile > 0.5) {
    vec2 s = texture(u_profile, vec2(x / REACH, 0.5)).rg;
    float halo = u_glow * s.g;
    return s.r * 1.4 + halo * halo * 0.9;
  }
  float core = 1.0 - smoothstep(0.5, 1.5, x);
  float halo = u_glow * 1.5 / (x + 1.5);
  return core * 1.4 + halo * halo * 0.9;
}

float nearness(vec2 plane, vec2 aim) {
  vec2 d = plane - aim;
  return exp(-dot(d, d) * 6.0);
}

void main() {
  vec2 frag = hx_centered(gl_FragCoord.xy);
  float shortSide = min(u_res.x, u_res.y);
  float w = u_line * u_dpr;
  float seen;
  float len0 = length(onTilted(frag - u_center, seen));
  float stretch = 1.0 / max(length(vec2(dFdx(len0), dFdy(len0))), 1e-6);
  float aimOk;
  vec2 aim = hx_rot(u_angle) * onTilted(u_aim, aimOk);
  vec3 peak = vec3(0.0);
  vec3 light = vec3(0.0);
  for (int i = 0; i < ${RINGS_MAX}; i++) {
    vec4 ring = u_rings[i];
    if (ring.y <= 0.0) continue;
    float ok;
    vec2 plane = hx_rot(u_angle) * onTilted(frag - u_center - u_parallax * ring.w, ok);
    float len = length(plane);
    float ang = atan(plane.y, plane.x);
    float shape = mix(1.0, pow(0.5 + 0.5 * cos(ang - ring.z), u_taper), clamp(u_taper * 0.4, 0.0, 0.85));
    float lw = w * max(shape, 0.08);
    float r = ring.x * u_zoom;
    vec3 d = (vec3(len - r) + vec3(-1.0, 0.0, 1.0) * u_dispersion * 0.012 * (1.0 + ring.w)) * stretch;
    float boost = 1.0 + 1.6 * nearness(plane, aim) * u_boost * aimOk;
    vec3 p = vec3(ringPeak(d.r, lw), ringPeak(d.g, lw), ringPeak(d.b, lw)) * ring.y * boost * ok;
    peak += p;
    light += p * mix(u_c0, u_c1, ring.w);
  }
  for (int i = 0; i < ${RINGS_MAX_BURSTS}; i++) {
    vec4 b = u_bursts[i];
    if (b.w <= 0.0) continue;
    float d = (length(frag - b.xy) - b.z) * shortSide;
    float p = ringPeak(d, w * 1.5) * b.w;
    peak += vec3(p);
    light += p * mix(u_c1, u_c0, 0.5);
  }
  float total = max(max(peak.r, peak.g), max(peak.b, 1e-4));
  vec3 level = 1.0 - exp(-peak);
  vec3 tint = light / max(peak, vec3(1e-4));
  vec3 color = mix(tint * level, level, smoothstep(1.4, 3.6, total) * 0.4);
  float grain = 1.0 + (hx_grain(gl_FragCoord.xy, u_time) * 2.0) * u_grain;
  color *= grain;
  float alpha = clamp(max(max(level.r, level.g), level.b), 0.0, 1.0);
  o_color = vec4(color / max(alpha, 1e-4), alpha);
}
`, GLSL_HASH, GLSL_UTIL);
