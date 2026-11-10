// 行为规格参照 docs/research/catalog/animations.md 的 LaserFlow 条目, 实现为 HX 自有.
/**
 * BeamFlow 的上屏片元: 竖直光柱从顶部落到地面线, 落点炸开光晕并沿地面向两侧铺开;
 * 光柱上有流动的纹, 色带随下落距离从第一色过渡到第三色; 地面线上方有雾与上浮的尘点, 地面上有向外跑的光点,
 * 地面下方有一层溢光. 可选在指针处揭开一张图. 坐标是 CSS 像素, y 从顶部向下.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { GLSL_HASH, GLSL_NOISE, GLSL_UTIL, fragmentSource } from "../../backdrop/kernel/glsl";
import { BEAM } from "../tokens";

export const BEAM_FRAGMENT = fragmentSource(`
uniform vec4 u_beam;
uniform vec4 u_shape;
uniform vec4 u_extra;
uniform vec2 u_intro;
uniform vec3 u_colors[3];
uniform float u_seed;
uniform float u_light;
uniform sampler2D u_image;
uniform vec3 u_reveal;
float sq(float x) { return x * x; }
void main() {
  vec2 css = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) / u_dpr;
  float t = u_time;
  float surface = u_beam.y;
  float dx = css.x - u_beam.x;
  float adx = abs(dx);
  float f = css.y;
  float fn = f / max(surface, 1.0) * 130.0;
  float below = f - surface;
  float w = max(u_beam.z, 0.2) * 2.0;
  float u = adx / w;
  float seedOff = u_seed * 17.3;
  float breathe = 1.0 + u_extra.x * (0.12 * sin(t * 1.5708) + 0.08 * (hx_vnoise(vec2(t * 0.5, 3.0 + seedOff)) - 0.5));
  float front = u_intro.x * (surface + 80.0);
  float reveal = 1.0 - smoothstep(front - ${BEAM.frontLead.toFixed(1)}, front + ${BEAM.frontTail.toFixed(1)}, f);
  float above = smoothstep(0.5, -0.5, below);
  vec3 bandA = mix(u_colors[0], u_colors[1], smoothstep(50.0, 75.0, fn));
  bandA = mix(bandA, u_colors[2], smoothstep(100.0, 125.0, fn));
  float streak = ${BEAM.streakBase.toFixed(2)} + ${BEAM.streakAmp.toFixed(2)} * u_extra.y * (hx_vnoise(vec2(u * 6.0, f / 22.0 - t * 1.7) + seedOff) - 0.5) * 2.0;
  float start = smoothstep(-6.0, 12.0, f);
  float core = exp(-sq(u)) * 1.6 + exp(-u * 0.35) * 0.35;
  vec3 light = bandA * core * streak * start * above * reveal;
  float impact = length(vec2(dx, below));
  float flare = u_beam.w;
  light += mix(u_colors[1], vec3(1.0), 0.35) * exp(-impact / max(30.0 * flare, 1.0)) * 1.4 * u_intro.y;
  float spread = ${BEAM.spreadPx.toFixed(1)} * u_shape.x;
  float run = spread * 1.2 * u_intro.y;
  float runMask = 1.0 - smoothstep(run - 34.0, run + 6.0, adx);
  float flowMask = (1.0 - smoothstep(0.75 * spread, 1.1 * spread, adx)) * runMask;
  float hug = exp(-sq(abs(below) / ${BEAM.hug.toFixed(1)}));
  float hugWide = exp(-sq(abs(below) / ${BEAM.hugWide.toFixed(1)}));
  float side = smoothstep(-24.0, 24.0, dx);
  vec3 sideK = mix(u_colors[2], u_colors[1], side);
  light += sideK * (hug * 0.9 + hugWide * 0.25) * flowMask * (1.0 - adx / max(spread * 1.1, 1.0) * 0.6);
  float dotsAt = fract(adx / 46.0 - t * 0.6 + hx_hash1(floor(adx / 46.0 - t * 0.6) + seedOff) * 0.3);
  light += sideK * u_extra.z * smoothstep(0.08, 0.0, abs(dotsAt - 0.5) * 0.4) * exp(-sq(below / 2.5)) * flowMask * 1.2;
  light += sideK * u_shape.y * 0.35 * exp(-max(below, 0.0) / 60.0) * step(0.0, below) * flowMask;
  float fogN = hx_fbm(css / 140.0 + vec2(t * 0.05, -t * 0.08) + seedOff, 4);
  light += bandA * u_shape.z * fogN * exp(-adx / 220.0) * above * smoothstep(0.0, 0.3 * surface, f) * reveal;
  vec2 cell = floor(vec2(css.x / 9.0, (css.y + t * 22.0) / 9.0));
  float spark = step(1.0 - 0.012 * u_shape.w, hx_hash2(cell + seedOff));
  vec2 inCell = fract(vec2(css.x / 9.0, (css.y + t * 22.0) / 9.0)) - 0.5;
  light += mix(bandA, vec3(1.0), 0.5) * spark * smoothstep(0.25, 0.0, length(inCell)) * exp(-adx / 160.0) * above * reveal;
  light *= u_extra.w * 0.55 * breathe;
  float a = clamp(max(light.r, max(light.g, light.b)), 0.0, 1.0);
  vec3 col = hx_tonemap(light * 1.2) / max(a, 1e-4);
  col = u_light > 0.5 ? col * 0.75 : col;
  vec4 outc = vec4(clamp(col, 0.0, 1.0), a);
  if (u_reveal.z > 0.001) {
    vec2 pr = vec2(u_pointer.x, 1.0 - u_pointer.y) * u_res / u_dpr;
    float m = (1.0 - smoothstep(u_reveal.x * 0.6, u_reveal.x, length(css - pr))) * u_reveal.z * u_reveal.y;
    vec4 img = texture(u_image, v_uv);
    outc = vec4(mix(outc.rgb, img.rgb, m * img.a), max(outc.a, m * img.a));
  }
  o_color = outc;
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
