// 行为规格参照 docs/research/catalog/animations.md 的 ElasticMesh 条目, 实现为 HX 自有.
/**
 * SpringMesh 的上屏片元 (一遍): 形状 (文字或图片) 的距离场当 "充气高度" (h = inflate x sqrt(dn (2 - dn))), 有限差分求法线;
 * 拉伸为反向扭曲 p - D x exp(-|p - (A + D)|^2 / r^2), 按压凹陷在抓取点压低高度; 入场按 x 逐字欠阻尼弹起.
 * 四种材质 (balloon / chrome / jelly / clay) 共用规格的天地环境 (sky / ground 分界随模糊变软), 菲涅尔反射率按规格.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { sdfGlsl } from "../../field/parts/sdf";

export const MESH_FRAGMENT = fragmentSource(`
${sdfGlsl("u_shape")}
uniform sampler2D u_tint;
uniform float u_use_tint;
uniform float u_aspect;
uniform float u_inner;
uniform float u_px;
uniform float u_ready;
uniform float u_fill;
uniform vec4 u_grab;
uniform float u_grab_r;
uniform float u_dent;
uniform float u_inflate;
uniform float u_shadow;
uniform float u_material;
uniform float u_blur;
uniform float u_clock;
uniform float u_stagger;
uniform vec3 u_color;
uniform vec3 u_hi;
uniform vec3 u_lo;
uniform vec3 u_shade;
float springStep(float t) {
  float omega = 15.0;
  float zeta = 0.38;
  if (t <= 0.0) return 0.0;
  float wd = omega * sqrt(1.0 - zeta * zeta);
  return 1.0 - exp(-zeta * omega * t) * (cos(wd * t) + zeta / sqrt(1.0 - zeta * zeta) * sin(wd * t));
}
vec2 shapeUv(vec2 q) {
  vec2 box = u_aspect >= 1.0 ? vec2(1.0, 1.0 / u_aspect) : vec2(u_aspect, 1.0);
  return q / (box * u_fill) * u_inner + 0.5;
}
float depthAt(vec2 q) { return -u_shape_distance(shapeUv(q)); }
vec3 env(vec3 d) {
  float y = d.y;
  vec3 skyLow = mix(u_lo, u_hi, 0.35);
  vec3 sky = mix(skyLow, u_hi, smoothstep(0.0, 0.75, y));
  vec3 ground = mix(u_lo * 0.6, u_lo, smoothstep(0.0, -0.4, y));
  float edge = 0.004 + u_blur;
  vec3 c = mix(ground, sky, smoothstep(-edge, edge, y));
  float glow = 0.035 + u_blur;
  return c + u_hi * 0.25 * exp(-abs(y) / glow);
}
void main() {
  if (u_ready < 0.5) { o_color = vec4(0.0); return; }
  float short_side = min(u_res.x, u_res.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / short_side;
  vec2 A = u_grab.xy;
  vec2 D = u_grab.zw;
  float r = max(u_grab_r, 1e-3);
  vec2 q = p - D * exp(-dot(p - A - D, p - A - D) / (r * r));
  float delay = clamp(q.x / u_fill + 0.5, 0.0, 1.0) * u_stagger;
  float pop = springStep(u_clock - delay);
  q.y += (1.0 - min(pop, 1.0)) * 0.12;
  float range = u_shape_range;
  float d = -depthAt(q);
  float pxPer = max(u_px, 1e-3);
  float cover = smoothstep(pxPer, -pxPer, d);
  float dn = clamp(-d / range, 0.0, 1.0);
  float dentFall = exp(-dot(q - A, q - A) / (r * r));
  float inflate = u_inflate * max(pop, 0.0) * (1.0 - u_dent * dentFall);
  float e = 1.5 / short_side;
  float hx1 = clamp(depthAt(q + vec2(e, 0.0)) / range, 0.0, 1.0);
  float hx0 = clamp(depthAt(q - vec2(e, 0.0)) / range, 0.0, 1.0);
  float hy1 = clamp(depthAt(q + vec2(0.0, e)) / range, 0.0, 1.0);
  float hy0 = clamp(depthAt(q - vec2(0.0, e)) / range, 0.0, 1.0);
  float hc = sqrt(dn * (2.0 - dn));
  vec2 grad = vec2(sqrt(hx1 * (2.0 - hx1)) - sqrt(hx0 * (2.0 - hx0)), sqrt(hy1 * (2.0 - hy1)) - sqrt(hy0 * (2.0 - hy0))) / (2.0 * e);
  vec3 n = normalize(vec3(-grad * inflate * 0.35, 1.0));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 R = reflect(-V, n);
  vec3 L = normalize(vec3(-0.45, 0.6, 0.66));
  float lambert = max(dot(n, L), 0.0);
  float facing = n.z;
  float fresnel = pow(1.0 - clamp(facing, 0.0, 1.0), 5.0);
  float occlusion = mix(0.55, 1.0, smoothstep(0.0, 12.0, -d));
  vec3 base = u_color;
  if (u_use_tint > 0.5) {
    vec2 tuv = (shapeUv(q) - 0.5) / u_inner + 0.5;
    vec4 tc = texture(u_tint, tuv);
    base = tc.a > 0.01 ? tc.rgb / tc.a : u_color;
  }
  float spec = pow(max(dot(R, L), 0.0), 60.0);
  vec3 col;
  float alpha = 1.0;
  if (u_material < 0.5) {
    float reflectance = 0.045 + 0.955 * fresnel;
    col = base * (0.25 + 0.75 * lambert) * occlusion + env(R) * reflectance + u_hi * spec * 0.8;
  } else if (u_material < 1.5) {
    float reflectance = 0.03 + 0.97 * fresnel;
    col = mix(env(R) * mix(vec3(1.0), base, 0.35), env(R), reflectance) * occlusion + u_hi * spec;
  } else if (u_material < 2.5) {
    float core = smoothstep(0.0, 1.0, facing);
    float reflectance = 0.03 + 0.97 * fresnel;
    col = base * (0.45 + 0.6 * core) + env(R) * reflectance * 0.8 + u_hi * spec * 0.6;
    alpha = mix(0.9, 0.6, core);
  } else {
    col = base * (0.3 + 0.7 * lambert) * occlusion + u_hi * spec * 0.04;
  }
  col *= 0.85 + 0.15 * hc;
  float a = cover * alpha * smoothstep(0.0, 0.18, pop);
  vec2 sq = q - vec2(0.015, -0.045) * u_inflate;
  float ds = u_shape_distance(shapeUv(sq));
  float soft = range * 0.6;
  float sh = smoothstep(soft, -soft, ds) * u_shadow * 0.55 * smoothstep(0.0, 0.18, pop);
  float outA = a + sh * (1.0 - a);
  vec3 outC = outA > 0.0 ? (col * a + u_shade * sh * (1.0 - a)) / outA : vec3(0.0);
  o_color = vec4(outC, outA);
}
`, GLSL_HASH, GLSL_UTIL);
