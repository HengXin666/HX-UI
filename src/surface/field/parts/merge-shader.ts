// 行为规格参照 docs/research/catalog/animations.md 的 MetaBalls 条目, 实现为 HX 自有.
/**
 * MergeBlobs 的上屏片元: 场 = sum (r^2 / d^2)^gamma (沿速度方向拉伸), 阈值 1.3^gamma 处取等值面;
 * 光标色按各球对场的贡献加权混入. 三种画法: solid 实心, outline 描边, contour 多级等值环 (过密的环淡出).
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { fragmentSource } from "../../backdrop/kernel/glsl";
import { MERGE } from "../tokens";

/** 等值环上限. */
export const MERGE_MAX_RINGS = 12;
export const MERGE_VARIANTS = { solid: 0, outline: 1, contour: 2 } as const;
export type MergeVariant = keyof typeof MERGE_VARIANTS;

export const MERGE_FRAGMENT = fragmentSource(`
uniform vec4 u_balls[${MERGE.maxBalls}];
uniform vec4 u_shapes[${MERGE.maxBalls}];
uniform float u_count;
uniform float u_scale;
uniform float u_gamma;
uniform float u_threshold;
uniform vec3 u_color;
uniform vec3 u_cursor_color;
uniform float u_variant;
uniform float u_line;
uniform float u_rings;
float line(float dist) { return 1.0 - smoothstep(u_line * 0.5 - 0.5, u_line * 0.5 + 0.5, abs(dist)); }
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / max(u_scale, 1e-4);
  float field = 0.0;
  float tint = 0.0;
  float mass = 0.0;
  for (int i = 0; i < ${MERGE.maxBalls}; i++) {
    if (float(i) >= u_count) break;
    vec4 b = u_balls[i];
    if (b.z <= 1e-4) continue;
    vec4 sh = u_shapes[i];
    vec2 d = p - b.xy;
    float along = dot(d, sh.xy) / (1.0 + sh.z);
    float side = dot(d, vec2(-sh.y, sh.x));
    float f = pow(b.z * b.z / max(along * along + side * side, 1e-6), u_gamma);
    field += f;
    tint += f * b.w;
    mass += f;
  }
  vec3 color = mix(u_color, u_cursor_color, mass > 0.0 ? clamp(tint / mass, 0.0, 1.0) : 0.0);
  float rate = max(fwidth(field), 1e-8);
  float alpha;
  if (u_variant < 0.5) {
    alpha = smoothstep(u_threshold - rate, u_threshold + rate, field);
  } else if (u_variant < 1.5) {
    alpha = line((field - u_threshold) / rate);
  } else {
    alpha = 0.0;
    float level = u_threshold;
    for (int k = 0; k < ${MERGE_MAX_RINGS}; k++) {
      if (float(k) >= u_rings) break;
      float ring = line((field - level) / rate);
      float spacing = level * (1.0 - ${MERGE.ringStep.toFixed(2)});
      if (k > 0) ring *= smoothstep(u_line * 6.0, u_line * 12.0, spacing / rate);
      alpha = max(alpha, ring);
      level *= ${MERGE.ringStep.toFixed(2)};
    }
  }
  o_color = vec4(color, clamp(alpha, 0.0, 1.0));
}
`);
