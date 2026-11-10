// 行为规格参照 docs/research/catalog/animations.md 的 RippleDistortion 条目, 实现为 HX 自有.
/**
 * RippleLens 的上屏片元: 图片按 cover 铺满, 每个波在半径附近一条高斯带里推出径向位移 (带内 rings 道起伏) 与切向漩涡,
 * 三色错开取样出色散, 波峰加高光; 可选去色与染色. 坐标是设备像素, y 从顶部量.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { fragmentSource, GLSL_UTIL, GLSL_HASH } from "../../backdrop/kernel/glsl";
import { LENS } from "../tokens";

export const LENS_FRAGMENT = fragmentSource(`
uniform sampler2D u_image;
uniform vec2 u_tex_size;
uniform float u_ready;
uniform vec4 u_waves[${LENS.maxWaves}];
uniform float u_count;
uniform float u_band;
uniform float u_push;
uniform float u_swirl;
uniform float u_rings;
uniform float u_dispersion;
uniform float u_glint;
uniform vec3 u_tint;
uniform float u_tint_amount;
uniform float u_gray;
uniform vec3 u_highlight;
vec2 coverUv(vec2 uv) {
  float sa = u_res.x / max(u_res.y, 1.0);
  float ta = u_tex_size.x / max(u_tex_size.y, 1.0);
  vec2 k = sa > ta ? vec2(1.0, ta / sa) : vec2(sa / ta, 1.0);
  return (uv - 0.5) * k + 0.5;
}
vec3 look(vec2 uv) {
  vec3 c = texture(u_image, coverUv(clamp(uv, 0.0, 1.0))).rgb;
  c = mix(c, vec3(hx_luma(c)), u_gray);
  return mix(c, c * u_tint * 1.6, u_tint_amount);
}
void main() {
  if (u_ready < 0.5) { o_color = vec4(0.0); return; }
  vec2 frag = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 disp = vec2(0.0);
  float crest = 0.0;
  for (int i = 0; i < ${LENS.maxWaves}; i++) {
    if (float(i) >= u_count) break;
    vec4 w = u_waves[i];
    vec2 d = frag - w.xy;
    float r = length(d);
    vec2 n = d / max(r, 1e-3);
    float x = (r - w.z) / max(u_band, 1.0);
    float band = exp(-x * x * 2.0);
    float phase = x * u_rings * HX_PI;
    float a = band * w.w;
    disp += n * cos(phase) * a * u_push + vec2(-n.y, n.x) * sin(phase) * a * u_push * u_swirl * 0.5;
    crest += max(0.0, sin(phase)) * a;
  }
  vec2 uv = vec2(frag.x, u_res.y - frag.y) / u_res;
  vec2 o = vec2(disp.x, -disp.y) / u_res;
  vec3 c = vec3(look(uv - o * (1.0 + u_dispersion * 0.3)).r, look(uv - o).g, look(uv - o * (1.0 - u_dispersion * 0.3)).b);
  c += u_highlight * u_glint * clamp(crest, 0.0, 1.0);
  o_color = vec4(clamp(c, 0.0, 1.0), 1.0);
}
`, GLSL_HASH, GLSL_UTIL);
