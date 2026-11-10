// 行为规格参照 docs/research/catalog/animations.md 的 MetallicPaint 条目, 实现为 HX 自有.
/**
 * ChromeMark 的着色器. 隆起通道: 在遮罩内解泊松方程 (Jacobi, 形状外为 0), 得到中间高边缘低的平滑隆起.
 * 上屏: 沿 angle 方向的金属条纹随时间流动, 边缘按隆起弯折, 三个色通道错开取样做色散, 遮罩外透明.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { GLSL_HASH, GLSL_NOISE, GLSL_UTIL, fragmentSource } from "../../backdrop/kernel/glsl";
import { CHROME } from "../tokens";
import { MASK_UV_GLSL } from "./mask";

/** 隆起通道. u_k 是每次迭代的源项, 让圆盘状形状中心约到 1. */
export const CHROME_BUMP_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_bump;
uniform sampler2D u_mask;
uniform float u_has_mask;
uniform float u_k;
${MASK_UV_GLSL}
void main() {
  if (u_has_mask < 0.5 || maskAt(u_mask, v_uv) < 0.5) { o_color = vec4(0.0); return; }
  vec2 px = 1.0 / u_target_res;
  float l = texture(u_bump, v_uv - vec2(px.x, 0.0)).r;
  float r = texture(u_bump, v_uv + vec2(px.x, 0.0)).r;
  float d = texture(u_bump, v_uv - vec2(0.0, px.y)).r;
  float u = texture(u_bump, v_uv + vec2(0.0, px.y)).r;
  o_color = vec4(clamp((l + r + d + u) * 0.25 + u_k, 0.0, 1.0), 0.0, 0.0, 1.0);
}
`);

export const CHROME_FRAGMENT = fragmentSource(`
uniform sampler2D u_bump;
uniform sampler2D u_mask;
uniform float u_has_mask;
uniform vec3 u_tint;
uniform vec3 u_bg;
uniform float u_bg_on;
uniform float u_light;
uniform float u_density;
uniform float u_softness;
uniform float u_dispersion;
uniform float u_distortion;
uniform float u_bend;
uniform float u_angle;
uniform float u_intro;
${MASK_UV_GLSL}
float band(float stripe, float bump, float blur) {
  float cycle = 1.0;
  float t1 = ${CHROME.thin1.toFixed(2)} / cycle * (1.0 - ${CHROME.bumpSkew.toFixed(1)} * bump);
  float t2 = ${CHROME.thin2.toFixed(2)} / cycle * (1.0 + ${CHROME.bumpSkew.toFixed(1)} * bump);
  float c1 = 1.0;
  float c2 = 0.0;
  float g = mix(c1, c2, smoothstep(0.0, 1.0, (stripe - t1 - t2) / max(1.0 - t1 - t2, 1e-3)));
  float ch = mix(c2, c1, smoothstep(0.0, 2.0 * blur, stripe));
  ch = mix(ch, c2, smoothstep(t1, t1 + 2.0 * blur, stripe));
  ch = mix(ch, g, smoothstep(t1 + t2, t1 + t2 + 0.5 * blur, stripe));
  return ch;
}
float metal(vec2 p, float bump, float edge, float n, float t, float shift) {
  vec2 dir = vec2(cos(u_angle), sin(u_angle));
  float diag = dot(p, vec2(-dir.y, dir.x));
  float direction = dot(p, dir) * u_density;
  direction += u_distortion * 6.0 * n;
  direction -= ${CHROME.bendNoise.toFixed(1)} * n * diag * smoothstep(0.0, 1.0, edge) * (1.0 - smoothstep(0.0, 1.0, edge));
  direction *= mix(1.0, 1.0 - edge, smoothstep(0.5, 1.0, u_bend));
  direction -= ${CHROME.bendEdge.toFixed(1)} * edge * smoothstep(0.5, 1.0, u_bend) + u_bend * edge * 0.6;
  direction += shift;
  return band(fract(direction - t), bump, max(u_softness * 0.25, 0.002));
}
void main() {
  float shape = u_has_mask > 0.5 ? maskAt(u_mask, v_uv) : 0.0;
  float bump = texture(u_bump, v_uv).r;
  float edge = 1.0 - smoothstep(0.0, 0.6, bump);
  vec2 p = maskUv(v_uv) - 0.5;
  float t = ${CHROME.timeRate.toFixed(1)} * (u_time + ${CHROME.timeOffset.toFixed(1)});
  float n = hx_vnoise(p * 6.0 + t * 0.4) - 0.5;
  float spread = u_dispersion * 0.08 * (0.3 + edge);
  vec3 m = vec3(metal(p, bump, edge, n, t, -spread), metal(p, bump, edge, n, t, 0.0), metal(p, bump, edge, n, t, spread));
  vec3 bright = mix(u_tint, vec3(1.0), 0.7);
  vec3 dark = u_tint * (u_light > 0.5 ? 0.45 : 0.12);
  vec3 col = mix(dark, bright, m);
  float front = u_intro * 1.2;
  float alpha = shape * smoothstep(front, front - 0.2, maskUv(v_uv).y);
  if (u_bg_on > 0.5) o_color = vec4(mix(u_bg, col, alpha), 1.0);
  else o_color = vec4(col, alpha);
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
