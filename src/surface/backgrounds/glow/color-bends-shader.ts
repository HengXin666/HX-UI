// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 ColorBends 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLOW_GLSL } from "./glow-kit";

/** 色带上限 (规格 MAX_COLORS). */
export const COLOR_BENDS_MAX_COLORS = 8;
/** 扭曲迭代上限 (iterations prop 钳到这里). */
export const COLOR_BENDS_MAX_ITERATIONS = 6;
/** 指针平滑速率 (规格 amt = min(1, dt * pointerSmooth), 本库取 8 并改成指数跟随). */
export const COLOR_BENDS_POINTER_RATE = 8;

const BODY = `
uniform vec3 u_colors[${COLOR_BENDS_MAX_COLORS}];
uniform float u_color_count;
uniform float u_rot;
uniform float u_transparent;
uniform float u_scale;
uniform float u_frequency;
uniform float u_warp_strength;
uniform float u_mouse_influence;
uniform float u_parallax;
uniform float u_noise;
uniform float u_iterations;
uniform float u_intensity;
uniform float u_band_width;
uniform vec3 u_mouse;

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 k = u_res / min(u_res.x, u_res.y);
  vec2 mp = (u_mouse.xy - 0.5) * k;
  vec2 p = (v_uv - 0.5) * k;
  p -= mp * u_parallax * 0.25 * u_mouse.z;
  vec2 q = hx_rot(u_rot) * p * (2.0 / max(u_scale, 0.01));
  float t = u_time;
  float gain = 1.0 + max(u_warp_strength - 1.0, 0.0); // >1 时放大位移
  for (int i = 0; i < ${COLOR_BENDS_MAX_ITERATIONS}; i++) {
    if (float(i) >= u_iterations) break;
    float fi = float(i) + 1.0;
    q += min(u_warp_strength, 1.0) * gain * 0.35 / fi * vec2(sin(q.y * 1.7 * fi + t * 0.9), cos(q.x * 1.3 * fi - t * 0.7));
  }
  vec2 dm = p - mp;
  q += u_mouse_influence * u_mouse.z * 0.3 * normalize(dm + 1e-4) * exp(-dot(dm, dm) * 5.0);
  vec3 col = vec3(0.0);
  float a = 1.0;
  float cover = 0.0;
  for (int i = 0; i < ${COLOR_BENDS_MAX_COLORS}; i++) {
    if (float(i) >= u_color_count) break;
    float fi = float(i);
    float phase = fi * 2.399 + t * (0.4 + 0.07 * fi);
    float bend = q.y + 0.45 * sin(q.x * u_frequency * (0.8 + 0.15 * fi) + phase) - (fi - (u_color_count - 1.0) * 0.5) * 0.32;
    float m = abs(bend);
    float w = 1.0 - exp(-u_band_width / exp(u_band_width * m));
    col += u_colors[i] * w * a;
    cover = max(cover, w);
    a *= 1.0 - 0.35 * w;
  }
  col *= u_intensity;
  col += (hx_hash2(floor(frag) + floor(t * 24.0)) - 0.5) * u_noise * cover;
  float alpha = mix(1.0, clamp(cover * u_intensity, 0.0, 1.0), u_transparent);
  o_color = glow_finish(hx_tonemap(col * 1.4), alpha, frag);
}
`;

/** ColorBends 的上屏程序. */
export const COLOR_BENDS_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL, GLOW_GLSL);
