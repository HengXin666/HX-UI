// 行为规格参照 docs/research/catalog/animations.md 的 HalftoneReveal 条目, 实现为 HX 自有.
/**
 * DotReveal 的两段片元.
 * 遮罩通道 u_mask: 读上一帧, 减 u_fade, 叠上本帧画笔 (from 到 to 的一段胶囊, 边缘按 softness 羽化) 与点击爆开 (向外长的圆盘, 随进度变淡).
 * 上屏: 图片按 cover 铺满, 旋转 angle 的网格逐格取格心亮度, 按 contrast / brightness / invert 调过后变成网点半径,
 * 六种网点形状 (查 3x3 邻格取最大覆盖, 大点可以溢出格子); mono / duotone / color 三种上色; 遮罩处露出原图 (reverse 时反过来).
 * 坐标: CSS 像素, y 从顶部量.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { DOT } from "../tokens";

export const DOT_MASK_PASS = fragmentSource(`
uniform sampler2D u_mask;
uniform vec2 u_css;
uniform vec2 u_from;
uniform vec2 u_to;
uniform float u_radius;
uniform float u_softness;
uniform float u_strength;
uniform float u_fade;
uniform vec4 u_bursts[${DOT.maxBursts}];
uniform float u_reach;
float capsule(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
  return length(p - a - ab * h);
}
float brush(float d, float r) {
  float w = max(r * u_softness * 0.5, 0.5);
  return (1.0 - smoothstep(r - w, r + w, d)) * clamp(r / (w * 2.0), 0.0, 1.0);
}
void main() {
  vec2 p = vec2(v_uv.x, 1.0 - v_uv.y) * u_css;
  float m = max(texture(u_mask, v_uv).r - u_fade, 0.0);
  m = max(m, brush(capsule(p, u_from, u_to), u_radius) * u_strength);
  for (int i = 0; i < ${DOT.maxBursts}; i++) {
    vec4 b = u_bursts[i];
    if (b.w < 0.5) continue;
    float t = b.z;
    float r = u_radius * mix(0.5, u_reach, 1.0 - (1.0 - t) * (1.0 - t));
    m = max(m, brush(length(p - b.xy), r) * (1.0 - t));
  }
  o_color = vec4(m, 0.0, 0.0, 1.0);
}
`, GLSL_HASH, GLSL_UTIL);

export const DOT_FRAGMENT = fragmentSource(`
uniform sampler2D u_image;
uniform sampler2D u_mask;
uniform vec2 u_tex_size;
uniform float u_ready;
uniform float u_scale;
uniform float u_mode;
uniform float u_shape;
uniform float u_cell;
uniform float u_angle;
uniform float u_dot_scale;
uniform vec3 u_ink;
uniform vec3 u_accent;
uniform vec3 u_paper;
uniform float u_contrast;
uniform float u_brightness;
uniform float u_invert;
uniform float u_roughness;
uniform float u_misreg;
uniform float u_reverse;
uniform float u_intro;
uniform float u_fit;
uniform vec3 u_matte;
uniform float u_key;
// fit: cover 裁边铺满, contain 留边全见, fill 拉伸.
vec2 fitUv(vec2 uv) {
  float sa = u_res.x / max(u_res.y, 1.0);
  float ta = u_tex_size.x / max(u_tex_size.y, 1.0);
  vec2 k = vec2(1.0);
  if (u_fit < 0.5) k = sa > ta ? vec2(1.0, ta / sa) : vec2(sa / ta, 1.0);
  else if (u_fit < 1.5) k = sa > ta ? vec2(sa / ta, 1.0) : vec2(1.0, ta / sa);
  return (uv - 0.5) * k + 0.5;
}
// 取样, 并带回这一点留不留: 图外 (contain 的留边) 为 0, 与图片底色相近的按 key 抠掉.
vec3 photoKeep(vec2 p, vec2 css, out float keep) {
  vec2 uv = fitUv(clamp(vec2(p.x / css.x, 1.0 - p.y / css.y), 0.0, 1.0));
  vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
  vec3 c = texture(u_image, clamp(uv, 0.0, 1.0)).rgb;
  keep = inside.x * inside.y;
  keep *= mix(1.0, smoothstep(${DOT.keyLo}, ${DOT.keyHi}, distance(c, u_matte)), u_key);
  return c;
}
float tone(vec3 c) {
  float t = (hx_luma(c) - 0.5) * u_contrast + 0.5 + u_brightness;
  t = clamp(t, 0.0, 1.0);
  return mix(t, 1.0 - t, u_invert);
}
float shapeDist(vec2 l, float r) {
  vec2 a = abs(l);
  if (u_shape < 0.5) return length(l);
  if (u_shape < 1.5) return length(l * vec2(0.8, 1.35));
  if (u_shape < 2.5) return max(a.x, a.y) * 1.25;
  if (u_shape < 3.5) return (a.x + a.y) * 0.9;
  if (u_shape < 4.5) return a.y * 2.0;
  return min(max(a.x * 3.0, a.y), max(a.x, a.y * 3.0));
}
// 一张网: 旋转 turn 弧度, 取样偏移 shift (CSS 像素), 暗度乘 weight; 返回覆盖率, 也带回格心颜色.
float screen(vec2 p, vec2 css, float turn, vec2 shift, float weight, out vec3 ink) {
  vec2 center = css * 0.5;
  mat2 back = hx_rot(turn);
  vec2 q = hx_rot(-turn) * (p - center);
  vec2 base = floor(q / u_cell);
  float aa = 0.75 / max(u_scale, 0.5);
  float value = 0.0;
  ink = vec3(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cell = base + vec2(float(i), float(j));
      vec2 mid = (cell + 0.5) * u_cell;
      float keep;
      vec3 c = photoKeep(back * mid + center + shift, css, keep);
      float dark = (1.0 - tone(c)) * weight * keep;
      float r = sqrt(dark) * u_cell * 0.72 * u_dot_scale;
      r *= 1.0 + (hx_hash1(dot(cell, vec2(12.9898, 78.233))) - 0.5) * u_roughness;
      vec2 field = (back * mid) / max(min(css.x, css.y), 1.0);
      float delay = length(field) * ${DOT.introDelay} + hx_hash1(dot(cell, vec2(41.7, 17.3))) * ${DOT.introJitter};
      r *= smoothstep(0.0, 1.0, clamp((u_intro * ${DOT.introRate} - delay) / ${DOT.introSpan}, 0.0, 1.0));
      float d = shapeDist(q - mid, r);
      float k = (1.0 - smoothstep(r - aa, r + aa, d)) * clamp(r / (aa * 2.0), 0.0, 1.0);
      if (k > value) { value = k; ink = c; }
    }
  }
  return value;
}
void main() {
  if (u_ready < 0.5) { o_color = vec4(0.0); return; }
  vec2 css = u_res / max(u_scale, 1e-3);
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) / max(u_scale, 1e-3);
  float turn = radians(u_angle);
  vec2 shift = vec2(u_misreg * u_cell, -u_misreg * u_cell * 0.6);
  vec3 sampled;
  vec3 col;
  if (u_mode < 0.5) {
    float v = screen(p, css, turn, vec2(0.0), 1.0, sampled);
    col = mix(u_paper, u_ink, v);
  } else if (u_mode < 1.5) {
    vec3 unused;
    float va = screen(p, css, turn + radians(${DOT.accentTurn}.0), shift, ${DOT.accentWeight}, unused);
    float vi = screen(p, css, turn, vec2(0.0), 1.0, sampled);
    col = mix(mix(u_paper, u_accent, va), u_ink, vi * vi);
  } else {
    float v = screen(p, css, turn, shift, 1.0, sampled);
    col = mix(u_paper, sampled, v);
  }
  float m = texture(u_mask, vec2(gl_FragCoord.x, gl_FragCoord.y) / u_res).r;
  m = mix(m, 1.0 - m, u_reverse);
  float keep;
  vec3 shown = photoKeep(p, css, keep);
  o_color = vec4(mix(col, mix(u_paper, shown, keep), clamp(m, 0.0, 1.0)), 1.0);
}
`, GLSL_HASH, GLSL_UTIL);
