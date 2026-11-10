// 行为规格参照 docs/research/catalog/animations.md 的 GhostCursor 条目, 实现为 HX 自有.
/**
 * HazeCursor 的场景与上屏: 染料 body / smoke 两通道; 细节噪声调制 smoke, 按规格 wisp = pow(smoothstep(0.18, 0.82, smoke), 2) x 2.8,
 * cloud = body x smoothstep(0, 0.32, body) x 1.15, 由 cloud 的梯度求法线打光 0.7 + 0.5 x max(dot(n, normalize(-0.35, 0.55, 0.75)), 0),
 * 芯 smoothstep(0.7, 2.2, cloud) 趋向 u_hot; edgeIntensity 加轮廓. 场景写线性光给泛光金字塔;
 * 上屏按规格覆盖 1 - exp(-(a + bloom x u_bloom x 0.6) x 0.95), 加颗粒, 乘渐隐与入场.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import { BLOOM_ENCODE } from "../../backgrounds/bloom";
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { HAZE } from "../tokens";

export const HAZE_SCENE = fragmentSource(`
uniform sampler2D u_dye;
uniform vec3 u_tint;
uniform vec3 u_hot;
uniform float u_detail;
uniform float u_edge;
uniform float u_light;
float cloudAt(vec2 uv) { float b = texture(u_dye, uv).r; return b * smoothstep(0.0, ${HAZE.cloudKnee}, b) * ${HAZE.cloudGain}; }
void main() {
  vec2 f = texture(u_dye, v_uv).rg;
  float n = hx_fbm(v_uv * vec2(u_res.x / max(u_res.y, 1.0), 1.0) * 6.0 * u_detail + vec2(0.0, -u_time * 0.25), 4);
  float smoke = f.g * (0.55 + 0.9 * n);
  float wisp = pow(smoothstep(${HAZE.wispLo}, ${HAZE.wispHi}, smoke), 2.0) * ${HAZE.wispGain};
  float cloud = cloudAt(v_uv);
  vec2 px = 1.0 / vec2(textureSize(u_dye, 0));
  vec2 g = vec2(cloudAt(v_uv + vec2(px.x, 0.0)) - cloudAt(v_uv - vec2(px.x, 0.0)), cloudAt(v_uv + vec2(0.0, px.y)) - cloudAt(v_uv - vec2(0.0, px.y)));
  vec3 normal = normalize(vec3(-g * 6.0, 1.0));
  float light = 0.7 + 0.5 * max(dot(normal, normalize(vec3(-0.35, 0.55, 0.75))), 0.0);
  float core = smoothstep(0.7, 2.2, cloud);
  float body = cloud + wisp * 0.45;
  vec3 col = u_tint * light * body;
  col = mix(col, u_hot * body, core * (1.0 - u_light) * 0.6);
  float rim = clamp(length(g) * 8.0, 0.0, 1.0) * u_edge;
  col += u_tint * rim;
  o_color = bloom_encode(col, clamp(body + rim, 0.0, 4.0));
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, BLOOM_ENCODE);

export function hazeFragment(compositeGlsl: string): string {
  return fragmentSource(`
uniform float u_bloom;
uniform float u_grain;
uniform float u_fade;
void main() {
  vec4 s = bloom_scene(v_uv);
  vec3 glow = bloom_glow(v_uv);
  float ga = max(glow.r, max(glow.g, glow.b));
  float coverage = 1.0 - exp(-(s.a + ga * u_bloom * 0.6) * ${HAZE.coverGain});
  vec3 col = (s.rgb + glow * u_bloom) / max(s.a + ga * u_bloom, 1e-4);
  col *= 1.0 + (hx_hash2(gl_FragCoord.xy + fract(u_time * 13.7) * 97.0) - 0.5) * u_grain * 2.0;
  o_color = vec4(clamp(col, 0.0, 1.0), clamp(coverage * u_fade, 0.0, 1.0));
}
`, GLSL_HASH, GLSL_UTIL, compositeGlsl);
}
