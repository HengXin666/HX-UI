// 行为规格参照 docs/research/catalog/animations.md 的 Strands 条目, 实现为 HX 自有.
/**
 * FiberStrands 的上屏片元 (一遍): count 根横向发光丝带, 每根是 erf 求的带状填充 (高 H, 软边 sg) 加两侧边光, 中段粗两端收细 (taper),
 * 正弦摆动 (amplitude, waviness), 随时间与能量起伏; 亮度叠加后按规格 1 - exp(-2.6 lum) 求覆盖, 高亮处趋向白芯.
 * glass 时中央一颗玻璃球: 球内按球面高度反向放大取样 (refraction), 三通道各偏一点 (dispersion), 边缘菲涅尔 (rim) 与两处高光.
 * 坐标: 以短边为单位, 原点在中心, y 朝上.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { STRAND } from "../tokens";

const E = STRAND.erf;

export const STRAND_FRAGMENT = fragmentSource(`
uniform vec3 u_colors[${STRAND.maxColors}];
uniform float u_color_count;
uniform float u_count;
uniform float u_amplitude;
uniform float u_waviness;
uniform float u_thickness;
uniform float u_glow;
uniform float u_taper;
uniform float u_spread;
uniform float u_hue;
uniform float u_intensity;
uniform float u_saturation;
uniform float u_opacity;
uniform float u_scale;
uniform float u_glass;
uniform float u_refraction;
uniform float u_dispersion;
uniform float u_glass_r;
uniform float u_rim;
uniform float u_energy;
uniform float u_pulse;
uniform vec2 u_lean;
uniform float u_intro;
uniform float u_light;
uniform vec3 u_core;
float erfa(float x) {
  float a = abs(x);
  float t = 1.0 / (1.0 + ${E[0]} * a);
  float y = 1.0 - ((((${E[1]} * t + ${E[2]}) * t + ${E[3]}) * t + ${E[4]}) * t + ${E[5]}) * t * exp(-a * a);
  return sign(x) * y;
}
vec3 hueRotate(vec3 c, float a) {
  const vec3 k = vec3(0.57735);
  float ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}
vec3 strands(vec2 p, out float total) {
  vec3 acc = vec3(0.0);
  total = 0.0;
  float t = u_time;
  float amp = u_amplitude * (0.55 + 0.45 * u_energy) * u_pulse;
  float k = 1.0 * u_waviness;
  for (int i = 0; i < ${STRAND.maxColors}; i++) {
    if (float(i) >= u_count) break;
    float fi = float(i);
    float lane = (fi - (u_count - 1.0) * 0.5) * ${STRAND.lane} * u_spread;
    float phase = hx_hash1(fi * 7.31) * HX_TAU;
    float env = exp(-pow(p.x / 0.9, 2.0) * u_taper);
    float wave = sin(p.x * k * 4.2 + t * (0.6 + 0.17 * fi) + phase) * 0.6 + sin(p.x * k * 7.3 - t * (0.4 + 0.11 * fi) + phase * 1.7) * 0.4;
    float bend = u_lean.y * ${STRAND.lean} * exp(-pow(p.x - u_lean.x, 2.0) / 0.12);
    float yc = lane * env + amp * 0.16 * wave * env + bend;
    float th = ${STRAND.body} * u_thickness * exp(-pow(p.x / 0.5, 2.0) * 0.5 * u_taper) * (0.7 + 0.3 * env);
    float H = 2.0 * th;
    float sg = 0.25 * th + 0.002;
    float tt = p.y - yc + th;
    float fill = 0.5 * (erfa(tt / sg) - erfa((tt - H) / sg)) / H * th;
    float ew = ${STRAND.edge} * u_thickness * 0.25;
    float e1 = (p.y - (yc + th)) / ew;
    float e2 = (p.y - (yc - th)) / ew;
    float eg = exp(-e1 * e1) + exp(-e2 * e2);
    float halo = exp(-pow((p.y - yc) / (th * 5.0 * max(u_glow, 0.05)), 2.0)) * 0.25 * u_glow;
    float v = 0.6 * fill * (1.0 - 0.55 * u_light) + (1.6 * ew * 0.886 * eg / max(th, 1e-3)) * 0.3 * (1.0 + 1.3 * u_light) + halo;
    int ci = int(mod(fi, max(u_color_count, 1.0)));
    vec3 c = hueRotate(u_colors[ci], u_hue);
    c = mix(vec3(hx_luma(c)), c, u_saturation);
    acc += c * v;
    total += v;
  }
  float reveal = smoothstep(0.0, 0.3, u_intro) * smoothstep(u_intro * 1.6, u_intro * 1.6 - 0.5, abs(p.x));
  total *= ${STRAND.gain} * u_intensity * reveal;
  return acc * ${STRAND.gain} * u_intensity * reveal;
}
vec3 shade(vec3 acc, float lum) {
  vec3 base = lum > 1e-4 ? acc / lum : vec3(0.0);
  float white = 1.0 - u_light;
  float coreAmt = white * smoothstep(0.05, 2.2, lum) * ${STRAND.coreGain};
  vec3 cream = mix(mix(base, u_core, 0.3), u_core, smoothstep(1.2, 3.5, lum));
  return mix(base, cream, coreAmt);
}
void main() {
  vec2 res = u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) / max(u_scale, 1e-3);
  float lum;
  vec3 acc = strands(p, lum);
  vec3 col = shade(acc, lum);
  float cov = 1.0 - exp(-lum * ${STRAND.cover});
  if (u_glass > 0.5) {
    float R = u_glass_r;
    vec2 d = p / R;
    float rho = length(d);
    float appear = smoothstep(0.0, 0.35, u_intro);
    if (rho < 1.0) {
      float z = sqrt(1.0 - rho * rho);
      float bend = 1.0 - z;
      vec2 q = p * (1.0 - u_refraction * 0.45 * (1.0 - bend * 0.5));
      float ca = ${STRAND.chroma} * u_dispersion * bend;
      float lr; float lg; float lb;
      vec3 ar = strands(q * (1.0 + ca), lr);
      vec3 ag = strands(q, lg);
      vec3 ab = strands(q * (1.0 - ca), lb);
      vec3 inner = vec3(shade(ar, lr).r, shade(ag, lg).g, shade(ab, lb).b);
      float icov = 1.0 - exp(-max(max(lr, lg), lb) * ${STRAND.cover});
      float fres = smoothstep(0.8, 1.0, rho) * u_rim;
      float key = 0.4 * pow(max(0.0, d.x * 0.94 - d.y * 0.34), 6.0) + 0.2 * pow(max(0.0, -d.x * 0.5 + d.y * 0.87), 6.0);
      float px = 1.0 / (min(res.x, res.y) * R);
      float edgeA = smoothstep(1.0, 1.0 - 1.5 * px / max(u_scale, 1e-3), rho);
      vec3 glassC = inner * icov + u_core * (fres * 0.45 + key) * appear;
      float glassA = max(icov, (fres * 0.45 + key + 0.04) * appear);
      col = mix(col * cov, glassC, edgeA);
      cov = mix(cov, clamp(glassA, 0.0, 1.0), edgeA);
      col = cov > 1e-4 ? col / max(cov, 1e-4) : col;
    } else {
      float sh = u_light * 0.07 * exp(-pow((rho - 0.985) / 0.07, 2.0)) * smoothstep(-0.6, 0.4, -d.y) * appear * u_opacity;
      col = mix(col, vec3(0.0), sh / max(cov + sh, 1e-4));
      cov = cov + sh * (1.0 - cov);
    }
  }
  o_color = vec4(clamp(col, 0.0, 1.0), clamp(cov, 0.0, 1.0) * u_opacity);
}
`, GLSL_HASH, GLSL_UTIL);
