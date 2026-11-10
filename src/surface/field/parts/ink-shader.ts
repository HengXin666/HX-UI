// 行为规格参照 docs/research/catalog/animations.md 的 SplashCursor 条目, 实现为 HX 自有.
/**
 * InkSplash 的着色器: 速度 (投影滞后一帧, 自平流, 涡度约束, 溅点), 散度, 压力 Jacobi, 染料平流, 着色场景.
 * 泛光接 backgrounds/bloom 的金字塔, 上屏只做合成与抖动.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { BLOOM_ENCODE } from "../../backgrounds/bloom";
import { GLSL_HASH, GLSL_NOISE, GLSL_UTIL, fragmentSource } from "../../backdrop/kernel/glsl";
import { INK } from "../tokens";

const N = INK.maxSplats;

const CODEC = `
const float VR = ${INK.velocityRange.toFixed(1)};
const float PR = ${INK.pressureRange.toFixed(1)};
vec2 decV(vec4 c) { return (c.xy - 0.5) * 2.0 * VR; }
vec4 encV(vec2 v) { return vec4(clamp(0.5 + v / (2.0 * VR), 0.0, 1.0), 0.0, 1.0); }
float decP(vec4 c) { return (c.r - 0.5) * 2.0 * PR; }
vec4 encP(float p) { return vec4(clamp(0.5 + p / (2.0 * PR), 0.0, 1.0), 0.0, 0.0, 1.0); }
vec2 projected(sampler2D vel, sampler2D press, vec2 uv) {
  vec2 px = 1.0 / vec2(textureSize(press, 0));
  float l = decP(texture(press, uv - vec2(px.x, 0.0)));
  float r = decP(texture(press, uv + vec2(px.x, 0.0)));
  float d = decP(texture(press, uv - vec2(0.0, px.y)));
  float u = decP(texture(press, uv + vec2(0.0, px.y)));
  return decV(texture(vel, uv)) - 0.5 * vec2(r - l, u - d);
}
`;

const SPLATS = `
uniform vec4 u_splat_at[${N}];
uniform vec4 u_splat_paint[${N}];
uniform vec2 u_splat_meta[${N}];
uniform float u_splat_count;
float petals(float a, float seed) { return ${INK.petalBase.toFixed(2)} + ${INK.petalAmp.toFixed(2)} * sin(a * 5.0 + seed) * sin(a * 3.0 - seed * 1.7); }
vec2 splatOffset(vec2 uv, vec2 at) { vec2 d = uv - at; d.x *= u_target_res.x / max(u_target_res.y, 1.0); return d; }
float splatWeight(vec2 d, float radius, float kind, float seed) {
  float r = radius;
  if (kind > 0.5) { float p = petals(atan(d.y, d.x), seed); r *= p * p; }
  return exp(-dot(d, d) / max(r, 1e-6));
}
`;

/** 速度通道. */
export const INK_VELOCITY_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_vel;
uniform sampler2D u_press;
uniform float u_dt;
uniform float u_vel_diss;
uniform float u_curl;
${CODEC}
${SPLATS}
float curlAt(vec2 uv, vec2 px) {
  float l = decV(texture(u_vel, uv - vec2(px.x, 0.0))).y;
  float r = decV(texture(u_vel, uv + vec2(px.x, 0.0))).y;
  float b = decV(texture(u_vel, uv - vec2(0.0, px.y))).x;
  float t = decV(texture(u_vel, uv + vec2(0.0, px.y))).x;
  return 0.5 * (r - l - t + b);
}
void main() {
  vec2 px = 1.0 / u_target_res;
  vec2 v = projected(u_vel, u_press, v_uv);
  vec2 nv = projected(u_vel, u_press, v_uv - u_dt * v * px) / (1.0 + u_vel_diss * u_dt);
  float c = curlAt(v_uv, px);
  float cl = curlAt(v_uv - vec2(px.x, 0.0), px);
  float cr = curlAt(v_uv + vec2(px.x, 0.0), px);
  float cb = curlAt(v_uv - vec2(0.0, px.y), px);
  float ct = curlAt(v_uv + vec2(0.0, px.y), px);
  vec2 force = 0.5 * vec2(abs(ct) - abs(cb), abs(cr) - abs(cl));
  force /= length(force) + 0.0001;
  force *= u_curl * c;
  force.y *= -1.0;
  nv += force * u_dt;
  for (int i = 0; i < ${N}; i++) {
    if (float(i) >= u_splat_count) break;
    vec2 d = splatOffset(v_uv, u_splat_at[i].xy);
    float w = splatWeight(d, u_splat_paint[i].w, u_splat_meta[i].x, u_splat_meta[i].y);
    nv += u_splat_meta[i].x > 0.5 ? d / max(length(d), 1e-4) * u_splat_at[i].z * w : u_splat_at[i].zw * w;
  }
  o_color = encV(nv);
}
`);

/** 散度通道. */
export const INK_DIVERGENCE_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_vel;
${CODEC}
void main() {
  vec2 px = 1.0 / vec2(textureSize(u_vel, 0));
  float l = decV(texture(u_vel, v_uv - vec2(px.x, 0.0))).x;
  float r = decV(texture(u_vel, v_uv + vec2(px.x, 0.0))).x;
  float d = decV(texture(u_vel, v_uv - vec2(0.0, px.y))).y;
  float u = decV(texture(u_vel, v_uv + vec2(0.0, px.y))).y;
  o_color = encP(0.5 * (r - l + u - d));
}
`);

/** 压力通道: Jacobi, 第一次迭代把上一帧的解乘 u_keep 热启动. */
export const INK_PRESSURE_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_press;
uniform sampler2D u_div;
uniform float u_keep;
${CODEC}
void main() {
  vec2 px = 1.0 / u_target_res;
  float l = decP(texture(u_press, v_uv - vec2(px.x, 0.0)));
  float r = decP(texture(u_press, v_uv + vec2(px.x, 0.0)));
  float d = decP(texture(u_press, v_uv - vec2(0.0, px.y)));
  float u = decP(texture(u_press, v_uv + vec2(0.0, px.y)));
  float div = decP(texture(u_div, v_uv));
  o_color = encP((l + r + d + u) * u_keep * 0.25 - div * 0.25);
}
`);

/** 染料通道: 用模拟网格的格宽平流, 按 1 / trail 耗散, 溅点补色. */
export const INK_DYE_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_dye;
uniform sampler2D u_vel;
uniform sampler2D u_press;
uniform float u_dt;
uniform float u_dye_diss;
uniform vec2 u_sim_px;
${CODEC}
${SPLATS}
void main() {
  vec2 v = projected(u_vel, u_press, v_uv);
  vec3 c = texture(u_dye, v_uv - u_dt * v * u_sim_px).rgb / (1.0 + u_dye_diss * u_dt);
  for (int i = 0; i < ${N}; i++) {
    if (float(i) >= u_splat_count) break;
    vec2 d = splatOffset(v_uv, u_splat_at[i].xy);
    c += u_splat_paint[i].rgb * splatWeight(d, u_splat_paint[i].w, u_splat_meta[i].x, u_splat_meta[i].y);
  }
  o_color = vec4(max(c, 0.0), 1.0);
}
`);

/** 场景: 染料按亮度梯度打光 (shading), 减弱动效时改画一张静态墨迹; 输出线性光给泛光. */
export const INK_SCENE = fragmentSource(`
uniform sampler2D u_dye;
uniform float u_shading;
uniform float u_static;
uniform vec3 u_tint;
void main() {
  vec3 c = texture(u_dye, v_uv).rgb;
  if (u_static > 0.5) {
    vec2 p = hx_centered(gl_FragCoord.xy) * 2.4;
    float f = hx_fbm(p + vec2(hx_fbm(p * 1.4, 3), hx_fbm(p * 1.4 + 3.7, 3)) * 1.8, 4);
    c = u_tint * smoothstep(0.45, 0.8, f) * 0.9;
  }
  vec2 px = 1.0 / vec2(textureSize(u_dye, 0));
  float dx = hx_luma(texture(u_dye, v_uv + vec2(px.x, 0.0)).rgb) - hx_luma(texture(u_dye, v_uv - vec2(px.x, 0.0)).rgb);
  float dy = hx_luma(texture(u_dye, v_uv + vec2(0.0, px.y)).rgb) - hx_luma(texture(u_dye, v_uv - vec2(0.0, px.y)).rgb);
  vec3 n = normalize(vec3(dx, dy, length(px)));
  float diffuse = clamp(dot(n, vec3(0.0, 0.0, 1.0)) + 0.7, 0.7, 1.0);
  c *= mix(1.0, diffuse, clamp(u_shading, 0.0, 1.0));
  float a = clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0);
  o_color = bloom_encode(c, a);
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, BLOOM_ENCODE);

/** 上屏: 场景加泛光, 不透明度取峰值, 暗部 1/255 抖动去色带. 浅色主题压暗一点免得发灰. */
export function inkFragment(compositeGlsl: string): string {
  return fragmentSource(`
uniform float u_light;
void main() {
  vec4 s = bloom_scene(v_uv);
  vec3 light = s.rgb + bloom_glow(v_uv);
  float peak = max(light.r, max(light.g, light.b));
  light += (hx_hash2(gl_FragCoord.xy) - 0.5) / 255.0 * smoothstep(0.0, 0.03, peak);
  float a = clamp(max(light.r, max(light.g, light.b)), 0.0, 1.0);
  vec3 col = light / max(a, 0.0001);
  col = u_light > 0.5 ? col * 0.8 : col;
  o_color = vec4(clamp(col, 0.0, 1.0), a);
}
`, GLSL_HASH, compositeGlsl);
}
