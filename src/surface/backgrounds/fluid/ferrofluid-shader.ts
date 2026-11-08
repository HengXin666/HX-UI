// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Ferrofluid 条目, 实现为 HX 自有.
import { GLSL_HASH, GLSL_NOISE, GLSL_UTIL, fragmentSource } from "../../backdrop/kernel/glsl";

/** 入场: 尖刺从平面长出的秒数. */
export const FERRO_INTRO_SECONDS = 2.4;
/** 指针强度跟随的时间常数 (秒). */
export const FERRO_STRENGTH_TAU = 0.35;
/** 点击脉冲的寿命 (秒), 包络 smoothstep(0, 0.08, age) * exp(-1.1 * age) 到这里已很小. */
export const FERRO_PULSE_LIFE = 4;
/** 菲涅耳 F0, 近黑的磁流体表面. */
export const FERRO_F0 = 0.06;
/** 射线步进步数与二分细化次数. */
export const FERRO_MARCH_STEPS = 72;
export const FERRO_REFINE_STEPS = 5;

export type FerroFlow = "up" | "down" | "left" | "right" | "none";
/** 磁场图样的漂移方向. */
export const FERRO_FLOW: Readonly<Record<FerroFlow, readonly [number, number]>> = { up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0], none: [0, 0] };

/**
 * 点击脉冲包络: 0.08 秒内升起, 再按 exp(-1.1 t) 衰减.
 *
 * @param age 距点击的秒数.
 */
export function ferroPulse(age: number): number {
  if (age < 0 || age > FERRO_PULSE_LIFE) return 0;
  const rise = Math.min(1, age / 0.08);
  return rise * rise * (3 - 2 * rise) * Math.exp(-age * 1.1);
}

/**
 * 跟手份额: 阻尼为 0 时直接贴手.
 *
 * @param dt 帧长 (秒).
 * @param damping mouseDampening (秒).
 */
export function ferroFollow(dt: number, damping: number): number {
  return damping > 0 ? 1 - Math.exp(-dt / damping) : 1;
}

/** 斜视的磁流体平面: 六角排布的尖刺, 高度由漂移的磁场图样, 指针与点击脉冲决定; 射线步进求交, 二分细化. */
export const FERRO_FRAGMENT = fragmentSource(`
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_bg;
uniform float u_scale;
uniform float u_height;
uniform float u_sharp;
uniform float u_turb;
uniform float u_fluid;
uniform float u_tilt;
uniform float u_magnet;
uniform float u_vary;
uniform vec2 u_flow;
uniform float u_bright;
uniform vec4 u_cursor;
uniform vec4 u_pulse;
uniform float u_grow;
uniform float u_light;
uniform float u_transparent;

const float CAM_DIST = 6.0;
const float FAR = 18.0;
vec2 gCursor;
vec2 gPulse;

vec3 camRay(vec2 frag, out vec3 ro) {
  float a = radians(u_tilt);
  ro = vec3(0.0, -cos(a) * CAM_DIST, sin(a) * CAM_DIST);
  vec3 fwd = normalize(-ro);
  vec3 right = vec3(1.0, 0.0, 0.0);
  vec3 up = cross(right, fwd);
  vec2 p = (frag - 0.5 * u_res) / u_res.y;
  return normalize(fwd * 1.6 + right * p.x + up * p.y);
}

vec2 onPlane(vec2 frag) {
  vec3 ro;
  vec3 rd = camRay(frag, ro);
  float t = -ro.z / min(rd.z, -1e-3);
  return (ro + rd * t).xy;
}

float magnetField(vec2 id) {
  vec2 q = id * 0.18 / u_scale + u_flow * u_time * 0.35;
  float n = hx_vnoise3(vec3(q, u_time * 0.12 * u_fluid)) + u_turb * 0.18 * (hx_vnoise(q * 3.1 - u_time * 0.2) - 0.5);
  float m = smoothstep(0.44, 0.86, n) * u_magnet;
  m *= 1.0 + u_vary * (hx_hash2(floor(id * 7.0)) - 0.5);
  vec2 dc = id - gCursor;
  m += u_cursor.z * exp(-dot(dc, dc) / (u_cursor.w * u_cursor.w * 2.2));
  float ring = abs(length(id - gPulse) - u_pulse.z * 3.5);
  m += u_pulse.w * exp(-ring * ring * 1.5);
  return m * u_grow;
}

float heightAt(vec2 p) {
  vec2 cell = vec2(1.0, 1.7320508) * 0.42 * u_scale;
  vec2 a = mod(p, cell) - cell * 0.5;
  vec2 b = mod(p - cell * 0.5, cell) - cell * 0.5;
  vec2 g = dot(a, a) < dot(b, b) ? a : b;
  vec2 id = p - g;
  float d = length(g) / (0.5 * cell.x);
  float spike = pow(max(1.0 - d, 0.0), u_sharp);
  float swell = 0.05 * u_turb * hx_gnoise(p * 0.7 + u_time * 0.3 * u_fluid);
  return spike * magnetField(id) * u_height * 0.9 + swell;
}

vec3 normalAt(vec2 p) {
  float e = 0.01;
  float h = heightAt(p);
  return normalize(vec3(h - heightAt(p + vec2(e, 0.0)), h - heightAt(p + vec2(0.0, e)), e));
}

void main() {
  gCursor = onPlane(u_cursor.xy * u_res);
  gPulse = onPlane(u_pulse.xy * u_res);
  vec3 ro;
  vec3 rd = camRay(gl_FragCoord.xy, ro);
  float t = 0.0;
  float lo = 0.0;
  bool hit = false;
  float stepLen = FAR / ${FERRO_MARCH_STEPS.toFixed(1)};
  for (int i = 0; i < ${FERRO_MARCH_STEPS}; i++) {
    vec3 p = ro + rd * t;
    if (p.z < heightAt(p.xy)) { hit = true; break; }
    lo = t;
    t += stepLen * mix(0.35, 1.0, smoothstep(1.5, 0.2, p.z));
    if (t > FAR) break;
  }
  if (!hit) {
    o_color = u_transparent > 0.5 ? vec4(0.0) : vec4(u_bg, 1.0);
    return;
  }
  float hi = t;
  for (int k = 0; k < ${FERRO_REFINE_STEPS}; k++) {
    float mid = 0.5 * (lo + hi);
    vec3 p = ro + rd * mid;
    if (p.z < heightAt(p.xy)) hi = mid; else lo = mid;
  }
  vec3 pos = ro + rd * hi;
  vec3 n = normalAt(pos.xy);
  vec3 r = reflect(rd, n);
  float cosV = clamp(abs(dot(rd, n)), 0.0, 1.0);
  float fres = ${FERRO_F0} + (1.0 - ${FERRO_F0}) * pow(1.0 - cosV, 5.0);
  float room = mix(0.3, 1.0, smoothstep(-0.25, 0.3, r.z));
  float strip = smoothstep(0.55, 0.95, r.z) * (0.7 + 0.3 * sin(r.x * 6.0));
  float rim = pow(1.0 - cosV, 3.0) * smoothstep(0.85, 0.4, n.z);
  float lift = clamp(pos.z / max(u_height, 0.05), 0.0, 1.6);
  vec3 tint = mix(u_c0, u_c1, smoothstep(0.1, 1.0, lift));
  vec3 base = u_light > 0.5 ? u_bg * 0.82 : u_bg * 0.08;
  vec3 col = base + tint * (fres * room * 1.4 + strip * 0.9 * fres * 6.0 + rim * 0.55) * u_bright;
  col += tint * 0.45 * smoothstep(0.08, 0.7, lift) * smoothstep(1.6, 1.0, lift) * 0.25;
  float fog = 1.0 - smoothstep(FAR * 0.45, FAR, hi);
  float alpha = fog;
  col = u_light > 0.5 ? col : hx_tonemap(col * 1.2);
  o_color = u_transparent > 0.5 ? vec4(col, alpha) : vec4(mix(u_bg, col, alpha), 1.0);
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);

