// 行为规格参照 docs/research/catalog/animations.md 的 GlowCursor 条目, 实现为 HX 自有.
/**
 * HaloCursor 的场景与上屏: 染料三通道 (energy, gas, halo) 按规格算密度 1 - exp(-((energy x 1.1 + gas x 0.8) x intensity + halo x 0.25)),
 * 墨色 tint x min(1, 0.5 / tone) x mix(0.95, 0.72, smoothstep(0.5, 3, energy)), 主色与尾色按 energy 与 halo 的比例混, 热芯趋向 u_hot;
 * 场景以线性光写给泛光金字塔; 上屏合成泛光, 边缘按规格 smoothstep(0, 0.02, 边距) 淡出, 颗粒按规格 (hash - 0.5) x grain x 2.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import { BLOOM_ENCODE } from "../../backgrounds/bloom";
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { HALO } from "../tokens";

export const HALO_SCENE = fragmentSource(`
uniform sampler2D u_dye;
uniform float u_intensity;
uniform vec3 u_main;
uniform vec3 u_tail;
uniform vec3 u_hot;
uniform float u_light;
void main() {
  vec3 f = texture(u_dye, v_uv).rgb;
  float energy = f.r;
  float gas = f.g;
  float halo = f.b;
  float density = 1.0 - exp(-((energy * 1.1 + gas * 0.8) * u_intensity + halo * 0.25));
  vec3 tint = mix(u_tail, u_main, smoothstep(0.0, 1.0, energy / max(energy + halo * 0.5, 1e-4)));
  float tone = max(hx_luma(tint), 0.001);
  vec3 ink = tint * min(1.0, 0.5 / tone) * mix(0.95, 0.72, smoothstep(0.5, 3.0, energy));
  ink = mix(ink, u_hot, (1.0 - u_light) * smoothstep(0.4, 2.0, gas) * 0.7);
  o_color = bloom_encode(ink * density * 2.0, density);
}
`, GLSL_HASH, GLSL_UTIL, BLOOM_ENCODE);

export function haloFragment(compositeGlsl: string): string {
  return fragmentSource(`
uniform float u_grain;
uniform float u_on;
void main() {
  if (u_on < 0.5) { o_color = vec4(0.0); return; }
  vec4 s = bloom_scene(v_uv);
  vec3 light = s.rgb + bloom_glow(v_uv);
  float edge = smoothstep(0.0, ${HALO.edgeFade}, min(min(v_uv.x, 1.0 - v_uv.x), min(v_uv.y, 1.0 - v_uv.y)));
  float grain = 1.0 + (hx_hash2(gl_FragCoord.xy + fract(u_time * 13.7) * 97.0) - 0.5) * u_grain * 2.0;
  light *= edge * grain;
  float a = clamp(max(max(light.r, max(light.g, light.b)), s.a * edge), 0.0, 1.0);
  vec3 col = light / max(a, 0.0001);
  o_color = vec4(clamp(col, 0.0, 1.0), a);
}
`, GLSL_HASH, GLSL_UTIL, compositeGlsl);
}
