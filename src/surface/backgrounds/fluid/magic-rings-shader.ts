// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 MagicRings 条目, 实现为 HX 自有.
import { GLSL_HASH, GLSL_UTIL, fragmentSource } from "../../backdrop/kernel/glsl";
import { RINGS_MAX, RINGS_MAX_BURSTS } from "./magic-rings-motion";

/** 发光圆环: 每个环按半径距离取细芯加光晕, 粗细沿角度渐细, 可色散; 峰值经 1 - exp(-peak) 压缩, 过曝处泛白. */
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

float ringPeak(float d, float w) {
  float core = 1.0 - smoothstep(w * 0.5, w * 1.5, abs(d));
  float halo = u_glow * w * 1.5 / (abs(d) + w * 1.5);
  return core * 1.4 + halo * halo * 0.9;
}

float nearness(vec2 plane) {
  vec2 d = plane - u_aim;
  return exp(-dot(d, d) * 6.0);
}

void main() {
  vec2 frag = hx_centered(gl_FragCoord.xy);
  float w = u_line * u_dpr / min(u_res.x, u_res.y);
  vec3 peak = vec3(0.0);
  vec3 light = vec3(0.0);
  for (int i = 0; i < ${RINGS_MAX}; i++) {
    vec4 ring = u_rings[i];
    if (ring.y <= 0.0) continue;
    vec2 plane = frag - u_center - u_parallax * ring.w;
    plane.y /= max(cos(radians(u_tilt)), 0.2);
    plane = hx_rot(u_angle) * plane;
    float len = length(plane);
    float ang = atan(plane.y, plane.x);
    float shape = mix(1.0, pow(0.5 + 0.5 * cos(ang - ring.z), u_taper), clamp(u_taper * 0.4, 0.0, 0.85));
    float lw = w * max(shape, 0.08);
    float r = ring.x * u_zoom;
    vec3 d = vec3(len - r) + vec3(-1.0, 0.0, 1.0) * u_dispersion * 0.012 * (1.0 + ring.w);
    float boost = 1.0 + 1.6 * nearness(plane) * u_boost;
    vec3 p = vec3(ringPeak(d.r, lw), ringPeak(d.g, lw), ringPeak(d.b, lw)) * ring.y * boost;
    peak += p;
    light += p * mix(u_c0, u_c1, ring.w);
  }
  for (int i = 0; i < ${RINGS_MAX_BURSTS}; i++) {
    vec4 b = u_bursts[i];
    if (b.w <= 0.0) continue;
    float d = length(frag - b.xy) - b.z;
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
