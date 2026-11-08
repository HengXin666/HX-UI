// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 DotGrid 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { DOT_GRID } from "./dot-grid-sim";

/** 点形到着色器枚举. */
export const DOT_SHAPES = { circle: 0, square: 1 } as const;
export type DotShape = keyof typeof DOT_SHAPES;

/**
 * 弹簧点阵的上屏程序. u_state 是 JS 侧积分后打包的格点纹理 (一格一个纹素),
 * 每个像素看所在格与八邻格的位移后点位, 点径随能量膨胀, 沿速度方向拉长.
 */
const BODY = `
uniform sampler2D u_state;
uniform vec2 u_grid;
uniform vec2 u_margin;
uniform float u_gap;
uniform float u_size;
uniform float u_swell;
uniform float u_stretch;
uniform float u_glow;
uniform float u_shape;
uniform float u_fade;
uniform float u_intro;
uniform vec3 u_base;
uniform vec3 u_active;
const float ZERO = ${DOT_GRID.zero}.0 / 255.0;
const float SPAN = ${DOT_GRID.zero}.0 / 255.0;

vec4 fetch_state(ivec2 cell) {
  vec4 raw = (texelFetch(u_state, cell, 0) - ZERO) / SPAN;
  return vec4(raw.xy * ${DOT_GRID.offsetRange.toFixed(1)}, raw.zw * ${DOT_GRID.velocityRange.toFixed(1)}) * u_gap;
}

void main() {
  vec2 css = u_res / u_dpr;
  vec2 p = gl_FragCoord.xy / u_dpr;
  vec2 home = floor((p - u_margin) / u_gap);
  float aa = 1.0 / u_dpr;
  float cover = 0.0;
  float energy = 0.0;
  float halo = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 cell = home + vec2(float(i), float(j));
    if (cell.x < 0.0 || cell.y < 0.0 || cell.x >= u_grid.x || cell.y >= u_grid.y) continue;
    vec4 s = fetch_state(ivec2(cell));
    vec2 center = u_margin + (cell + 0.5) * u_gap + s.xy;
    float e = clamp(length(s.xy) / u_gap + length(s.zw) / (u_gap * 12.0), 0.0, 1.0);
    float speed = length(s.zw);
    float stretch = 1.0 + u_stretch * smoothstep(8.0, 70.0, speed);
    vec2 axis = speed > 1e-3 ? s.zw / speed : vec2(1.0, 0.0);
    vec2 d = p - center;
    vec2 local = vec2(dot(d, axis) / stretch, dot(d, vec2(-axis.y, axis.x)));
    float wake = hx_hash2(cell + 3.1) * 0.35;
    float grow = smoothstep(wake, wake + 0.65, u_intro);
    float radius = 0.5 * u_size * grow * (1.0 + u_swell * e);
    float dist = u_shape < 0.5 ? length(local) : max(abs(local.x), abs(local.y));
    float c = 1.0 - smoothstep(-0.5 * aa, 0.5 * aa, dist - radius);
    if (c > cover) { cover = c; energy = e; }
    halo = max(halo, u_glow * e * exp(-max(dist - radius, 0.0) / max(u_size, 1.0)));
  }
  vec2 uv = p / css;
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  float fade = mix(1.0, smoothstep(0.0, 0.35, edge), clamp(u_fade, 0.0, 1.0));
  vec3 tone = mix(u_base, u_active, energy);
  float alpha = max(cover, halo * 0.6) * fade;
  vec3 lit = cover > 0.0 ? tone : u_active;
  o_color = vec4(lit, alpha);
}
`;

/** DotGrid 的完整片元源码. */
export const DOT_GRID_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL);
