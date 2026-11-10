// 行为规格参照 docs/research/catalog/animations.md 的 CrystalizedBall 条目, 实现为 HX 自有.
/**
 * PrismOrb 的上屏片元 (一遍): 宿主中心一颗玻璃球, 球内从中心向外的电弧主干与闪烁支弧 (按极坐标算角距, 噪声抖动),
 * 主干落到球壁处的耀斑, 三层程序化尘埃 (rise / fall / drift / orbit 四种运动, 视差, 摇摆, 闪烁, 入场逐颗亮起),
 * 内部雾与填光, 玻璃的边光, 高光点与外晕. 坐标: 设备像素, y 朝上; 球内以半径为 1.
 * ENGINE-GAP: 尘埃在规格里是 GPGPU 状态纹理驱动的实例化粒子, 这里是片元里按格的程序化光点 (见组件文件头).
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { PRISM } from "../tokens";

const f = (n: number): string => (Number.isInteger(n) ? `${n}.0` : `${n}`);

export const PRISM_FRAGMENT = fragmentSource(`
uniform vec4 u_strands[${PRISM.maxStrands}];
uniform vec4 u_arcs[${PRISM.maxArcs}];
uniform float u_size;
uniform vec3 u_color;
uniform vec3 u_body;
uniform float u_light;
uniform float u_energy;
uniform float u_reveal;
uniform float u_crackle;
uniform float u_flares;
uniform float u_glow;
uniform float u_sparks;
uniform float u_density;
uniform float u_fill;
uniform float u_motion;
uniform float u_square;
uniform float u_depth;
uniform float u_sway;
uniform float u_twinkle;
uniform float u_haze;
uniform float u_dust_time;
float angDist(float phi, float a) { float d = phi - a; return abs(atan(sin(d), cos(d))); }
float wig(float r, float seed, float freq, float amp) {
  return (hx_vnoise(vec2(r * freq + seed, u_time * 3.0 + seed * 0.7)) - 0.5) * 2.0 * amp * r;
}
// 一根弧: 返回 (芯, 晕).
vec2 bolt(vec2 d, float r, float phi, float a, float r0, float r1, float seed, float freq, float width) {
  if (r > r1 + 0.05 || r < r0 - 0.02) return vec2(0.0);
  float bend = 0.25 * sin(seed * 2.1) * r * r;
  float da = angDist(phi, a + bend + wig(r, seed, freq, 0.35 * u_crackle + 0.05));
  float dist = da * max(r, 0.02);
  float swell = 0.8 + 0.4 * (0.5 + 0.5 * sin(3.0 * phi + u_time * 0.7 + seed * 1.7));
  float w = width * swell;
  float span = smoothstep(r0 - 0.02, r0 + 0.02, r) * (1.0 - smoothstep(r1 - 0.03, r1, r));
  return vec2(1.0 - smoothstep(w * 0.4, w * 1.6, dist), exp(-dist / (w * 7.0))) * span;
}
float dust(vec2 d, float r) {
  float total = 0.0;
  float t = u_dust_time;
  for (int L = 0; L < ${PRISM.dustLayers}; L++) {
    float layer = float(L);
    vec2 q = d * (1.0 + u_depth * 0.5 * layer);
    float v = 0.08 * (1.0 + layer * 0.3);
    if (u_motion < 0.5) q.y -= t * v;
    else if (u_motion < 1.5) q.y += t * v;
    else if (u_motion < 2.5) q.x -= t * v;
    else q = hx_rot(t * v * 1.5) * q;
    q.x += u_sway * 0.04 * sin(q.y * 5.0 + t + layer);
    vec2 g = q * u_density;
    vec2 cell = floor(g);
    vec2 h2 = hx_hash22(cell + layer * 17.0);
    float h = hx_hash2(cell + layer * 31.0);
    vec2 o = fract(g) - 0.5 - (h2 - 0.5) * 0.6;
    float dd = u_square > 0.5 ? max(abs(o.x), abs(o.y)) : length(o);
    float size = 0.1 + 0.1 * h;
    float spot = 1.0 - smoothstep(size * 0.4, size, dd);
    float blink = sin(u_time * (1.0 + 3.0 * h) + h * HX_TAU);
    float tw = mix(1.0, smoothstep(${f(PRISM.twinkleEdge[0])}, ${f(PRISM.twinkleEdge[1])}, blink), u_twinkle);
    float reveal = smoothstep(h, h + 0.2, u_reveal);
    total += spot * tw * reveal * (1.0 - layer * 0.25);
  }
  return total * sqrt(max(0.0, 1.0 - r * r));
}
void main() {
  vec2 c = 0.5 * u_res;
  float R = max(u_size * 0.5 * min(u_res.x, u_res.y), 1.0);
  vec2 d = (gl_FragCoord.xy - c) / R;
  float r = length(d);
  float phi = atan(d.y, d.x);
  vec3 hot = clamp(u_color * 1.6 + vec3(0.35), 0.0, 1.0);
  float inside = 1.0 - smoothstep(${f(PRISM.innerEdge[0])}, ${f(PRISM.innerEdge[1])}, r);
  vec3 add = vec3(0.0);
  if (r < 1.0) {
    for (int i = 0; i < ${PRISM.maxStrands}; i++) {
      vec4 s = u_strands[i];
      if (s.w <= 0.0) continue;
      vec2 b = bolt(d, r, phi, s.x, 0.0, s.y * 0.96, s.z, 5.0, 0.012);
      add += (hot * b.x + u_color * b.y * u_glow) * s.w * u_energy;
      float endR = s.y * 0.96;
      vec2 tip = endR * vec2(cos(s.x + 0.25 * sin(s.z * 2.1) * endR * endR), sin(s.x + 0.25 * sin(s.z * 2.1) * endR * endR));
      add += u_color * exp(-length(d - tip) / 0.06) * u_flares * s.w * step(0.5, s.y);
      float spark = step(0.97 - 0.05 * u_sparks, hx_hash2(floor(vec2(r * 60.0, u_time * 12.0 + s.z))));
      add += hot * spark * b.y * u_sparks;
    }
    for (int k = 0; k < ${PRISM.maxArcs}; k++) {
      vec4 a = u_arcs[k];
      if (a.w <= 0.0) continue;
      vec2 b = bolt(d, r, phi, a.x, a.y, a.z, float(k) * 5.3 + 2.0, 9.0, 0.007);
      add += (hot * b.x + u_color * b.y * u_glow * 0.6) * a.w * u_energy;
    }
    add += hot * exp(-r / 0.08) * 0.8 * u_energy;
    add += u_color * dust(d, r) * 0.6;
    float fog = hx_vnoise(d * 3.0 + u_time * 0.1);
    add += u_color * (u_fill * 0.25 * (1.0 - r * r) + u_haze * 0.2 * (0.6 + 0.4 * fog) * (1.0 - smoothstep(0.2, 1.0, r)));
    float topDim = 1.0 - 0.35 * pow(max(d.y, 0.0), 1.5);
    add *= topDim;
    float rimLit = smoothstep(${f(PRISM.rimLit[0])}, ${f(PRISM.rimLit[1])}, r);
    add += u_color * rimLit * 0.35 + hot * exp(-length(d - vec2(-0.38, 0.42)) / 0.12) * 0.35;
  }
  float out_r = r - 1.0;
  float halo = 1.0 - smoothstep(${f(PRISM.halo[0])}, ${f(PRISM.halo[1])}, abs(out_r - ${f(PRISM.halo[2])}));
  vec3 outer = u_color * (halo * 0.5 + exp(-max(out_r, 0.0) / 0.15) * 0.35) * u_glow * step(0.0, out_r);
  float aOut = clamp(max(outer.r, max(outer.g, outer.b)), 0.0, 1.0) * (u_light > 0.5 ? 0.7 : 1.0);
  vec3 colOut = outer / max(max(outer.r, max(outer.g, outer.b)), 1e-3);
  vec3 colIn = clamp(u_body * 0.85 + add, 0.0, 1.0);
  vec3 col = mix(colOut, u_light > 0.5 ? colIn * 0.9 : colIn, inside);
  o_color = vec4(col, max(aOut * (1.0 - inside), inside * 0.94));
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
