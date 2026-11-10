// 行为规格参照 docs/research/catalog/animations.md 的 DitherVeil 条目, 实现为 HX 自有.
/**
 * BayerVeil 的上屏片元 (遮罩通道与 DotReveal 共用 DOT_MASK_PASS).
 * 画面切成 pixelSize 的方格: 误差扩散图样直接读主线程算好的格网纹理; 有序图样 (bayer 8x8 / noise / lines) 按格算阈值后量化到 levels 档.
 * duotone 把档位映到墨色到纸色, color 三通道各自量化. 遮罩处露出原图, reverse 时反过来; 揭开边缘可描一圈 rimColor; 入场时抖动由上往下铺开.
 * 坐标: CSS 像素, y 从顶部量.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { VEIL } from "../tokens";

export const VEIL_FRAGMENT = fragmentSource(`
uniform sampler2D u_image;
uniform sampler2D u_dither;
uniform sampler2D u_mask;
uniform vec2 u_tex_size;
uniform float u_ready;
uniform float u_scale;
uniform vec2 u_grid;
uniform float u_ordered;
uniform float u_pattern;
uniform float u_levels;
uniform float u_color;
uniform float u_cover;
uniform vec3 u_ink;
uniform vec3 u_paper;
uniform vec3 u_rim_color;
uniform float u_rim;
uniform float u_contrast;
uniform float u_brightness;
uniform float u_reverse;
uniform float u_intro;
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
// 图片在 CSS 画面里的 uv (contain / cover), 出界返回 -1.
vec2 fitUv(vec2 p, vec2 css) {
  float sa = css.x / max(css.y, 1.0);
  float ta = u_tex_size.x / max(u_tex_size.y, 1.0);
  vec2 k = sa > ta ? vec2(ta / sa, 1.0) : vec2(1.0, sa / ta);
  if (u_cover > 0.5) k = sa > ta ? vec2(1.0, sa / ta) : vec2(ta / sa, 1.0);
  vec2 uv = (p / css - 0.5) / k + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec2(-1.0);
  return vec2(uv.x, 1.0 - uv.y);
}
vec4 photo(vec2 p, vec2 css) {
  vec2 uv = fitUv(p, css);
  if (uv.x < 0.0) return vec4(u_paper, 0.0);
  return vec4(texture(u_image, uv).rgb, 1.0);
}
vec3 adjust(vec3 c) { return clamp((c - 0.5) * u_contrast + 0.5 + u_brightness, 0.0, 1.0); }
vec3 quant(vec3 v, float thr) {
  float steps = max(u_levels, 2.0) - 1.0;
  return clamp(floor(v * steps + thr) / steps, 0.0, 1.0);
}
vec3 veil(vec2 p, vec2 css) {
  vec2 cell = floor(p / max(css / u_grid, vec2(1e-3)));
  vec2 cellCss = css / u_grid;
  if (u_ordered < 0.5) {
    vec4 d = texture(u_dither, vec2((cell.x + 0.5) / u_grid.x, 1.0 - (cell.y + 0.5) / u_grid.y));
    if (d.a < 0.5) return u_paper;
    return u_color > 0.5 ? d.rgb : mix(u_ink, u_paper, d.r);
  }
  vec4 c = photo((cell + 0.5) * cellCss, css);
  if (c.a < 0.5) return u_paper;
  float thr = u_pattern < 0.5 ? bayer8(cell) : u_pattern < 1.5 ? hx_hash1(dot(cell, vec2(12.9898, 78.233))) : fract((cell.x + cell.y) / ${VEIL.linePeriod}.0);
  if (u_color > 0.5) return quant(adjust(c.rgb), thr);
  float t = adjust(vec3(hx_luma(c.rgb))).r;
  return mix(u_ink, u_paper, quant(vec3(t), thr).r);
}
void main() {
  if (u_ready < 0.5) { o_color = vec4(0.0); return; }
  vec2 css = u_res / max(u_scale, 1e-3);
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) / max(u_scale, 1e-3);
  float m = texture(u_mask, gl_FragCoord.xy / u_res).r;
  float y = p.y / max(css.y, 1.0);
  m = mix(m, 1.0 - m, u_reverse);
  m = clamp(max(m, 1.0 - smoothstep(0.0, 0.2, u_intro * 1.2 - y)), 0.0, 1.0);
  vec4 raw = photo(p, css);
  vec3 col = mix(veil(p, css), raw.a > 0.5 ? raw.rgb : u_paper, m);
  float edge = 1.0 - clamp(abs(m - 0.5) / ${VEIL.rimBand}, 0.0, 1.0);
  col = mix(col, u_rim_color, edge * clamp(u_rim, 0.0, 1.0));
  o_color = vec4(col, 1.0);
}
`, GLSL_HASH, GLSL_UTIL);
