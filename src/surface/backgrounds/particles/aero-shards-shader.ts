// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 AeroShards 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel";
import { AERO } from "./aero-shards-field";

const N = AERO.floats;
const R = AERO.maxRings;

const BODY = `
uniform vec4 u_sa[${N}];
uniform vec4 u_sb[${N}];
uniform float u_count;
uniform vec4 u_rings[${R}];
uniform vec3 u_shard;
uniform vec3 u_accent;
uniform vec3 u_ink;
uniform vec3 u_bg;
uniform float u_bg_alpha;
uniform float u_light;
uniform vec4 u_material;
uniform float u_dof;
uniform float u_glow;
uniform float u_grain;
uniform float u_vignette;
uniform float u_markers;
uniform float u_intro;
uniform vec2 u_cam;

const float SHARD_FOCUS = ${AERO.shardFocus.toFixed(3)};

vec3 hx_sky(vec2 p) {
  float sky = clamp(p.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 tone = mix(u_ink * 0.03, u_ink * 0.12 + u_accent * 0.03, smoothstep(0.25, 0.95, sky));
  vec3 base = mix(u_bg, tone + u_bg * 0.85, 0.5);
  return mix(base, u_bg * 0.92 + u_accent * 0.04, u_light);
}

float hx_shape(vec2 q, float h, float soft, out float bevel) {
  vec2 extent = vec2(0.42 + 0.2 * h, 1.0);
  float a = 1.0 - smoothstep(extent.x - soft, extent.x + soft, abs(q.x));
  float b = 1.0 - smoothstep(extent.y - soft, extent.y + soft, abs(q.y));
  float cut = 0.55 + 0.35 * h - (q.x * 0.8 + q.y * 0.6);
  float c = smoothstep(-soft, soft, cut);
  float tip = 0.75 + 0.2 * h + (q.y * 0.5 - q.x * 0.9);
  float d = smoothstep(-soft, soft, tip);
  bevel = max(0.0, min(min(extent.x - abs(q.x), extent.y - abs(q.y)), min(cut, tip)));
  return a * b * c * d;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / (0.5 * u_res.y);
  float aspect = u_res.x / u_res.y;
  vec3 sky = hx_sky(p);
  vec3 pc = sky * u_bg_alpha;
  float alpha = u_bg_alpha;
  float halo = 0.0;
  vec3 haloTint = vec3(0.0);
  float px = 2.0 / u_res.y;
  for (int i = 0; i < ${N}; i++) {
    if (float(i) >= u_count) break;
    vec4 sa = u_sa[i];
    vec4 sb = u_sb[i];
    if (sb.w <= 0.001 || sa.w <= 0.0) continue;
    vec2 d = p - sa.xy;
    float r = length(d);
    float fade = sb.w;
    halo += exp(-r / max(sa.w * 1.6, px)) * fade * sa.w;
    haloTint += mix(u_shard, u_accent, sb.z) * exp(-r / max(sa.w * 1.6, px)) * fade * sa.w;
    if (r > sa.w * 1.6) continue;
    vec2 q = hx_rot(sb.x) * d / sa.w;
    float bank = sb.y;
    q.x /= max(0.2, cos(bank));
    float blur = abs(sa.z - SHARD_FOCUS) * u_dof * 0.12;
    float soft = px / sa.w * 1.2 + blur + u_material.y * 0.03;
    float bevel;
    float cov = hx_shape(q, fract(sb.z * 7.31), soft, bevel) * fade;
    if (cov <= 0.0) continue;
    vec2 n = normalize(q + 1e-4) * (1.0 - smoothstep(0.0, 0.3, bevel));
    vec3 env = hx_sky(p + n * u_material.x + vec2(bank * 0.05, 0.0));
    float fresnel = 1.0 - smoothstep(0.0, 0.25, bevel);
    float band = sin(bank * 2.0 + sb.x) * 0.6;
    float streak = (1.0 - smoothstep(0.0, 0.12, abs(q.x * 0.7 + q.y * 0.7 - band))) * (1.0 - smoothstep(0.0, 0.6, bevel) * 0.6);
    vec3 body = mix(u_shard, u_accent, sb.z * 0.6);
    vec3 col = mix(env, body, u_material.w + u_material.y * 0.4) + u_ink * fresnel * u_material.z * 0.5 + mix(u_ink, u_accent, 0.3) * streak * 0.35;
    col = mix(col, body * 0.55, u_light * 0.5);
    float haze = smoothstep(3.5, 12.0, sa.z) * 0.6;
    col = mix(col, sky, haze);
    float a = cov * clamp(0.35 + u_material.w + fresnel * 0.45 + streak * 0.3 + u_material.y * 0.3, 0.0, 1.0);
    pc = pc * (1.0 - a) + col * a;
    alpha = alpha * (1.0 - a) + a;
  }
  vec3 glowCol = haloTint / max(halo, 1e-4);
  float g = halo * u_glow * 0.5;
  pc += glowCol * g;
  alpha += g;
  if (u_markers > -0.5) {
    for (int k = 0; k < ${AERO.markerFloats}; k++) {
      float h = hx_hash1(float(k) * 3.17 + 0.5);
      vec2 m = vec2((h * 2.0 - 1.0) * aspect * 0.9, fract(hx_hash1(float(k) + 9.1) + u_time * 0.01 * (0.5 + h)) * 2.2 - 1.1);
      m -= u_cam * 0.3;
      vec2 dm = abs(p - m);
      float s = 0.018;
      float mark = u_markers < 0.5
        ? max(step(dm.x, px) * step(dm.y, s), step(dm.y, px) * step(dm.x, s))
        : max(1.0 - smoothstep(px * 1.2, px * 2.2, length(p - m)), 1.0 - smoothstep(px * 1.2, px * 2.2, length(p - m - vec2(s, 0.0))));
      mark *= 0.35 * u_intro;
      pc += u_ink * mark;
      alpha += mark;
    }
  }
  for (int j = 0; j < ${R}; j++) {
    vec4 ring = u_rings[j];
    if (ring.w < 0.5) continue;
    vec2 c = (ring.xy - 0.5) * vec2(2.0 * aspect, 2.0);
    float rad = ring.z * 1.4;
    float w = 0.012 + ring.z * 0.03;
    float t = (length(p - c) - rad) / w;
    float e = exp(-t * t) * (1.0 - ring.z) * 0.6;
    pc += mix(u_accent, u_ink, 0.3) * e;
    alpha += e;
  }
  alpha = clamp(alpha, 0.0, 1.0);
  vec3 col = pc / max(alpha, 1e-3);
  col *= 1.0 - u_vignette * smoothstep(0.6, 1.8, length(p / vec2(max(aspect, 1.0), 1.0)) * 1.3) * u_bg_alpha;
  col += hx_grain(gl_FragCoord.xy, u_time) * u_grain;
  o_color = vec4(clamp(col, 0.0, 1.0), alpha * u_intro);
}
`;

/** AeroShards 的上屏片元: 远到近逐片求覆盖, 磨边菲涅耳与偏移取背景近似折射, 叠单级光晕, 漂浮标记与点击环. */
export const AERO_SHARDS_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL);
