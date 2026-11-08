// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LiquidEther 条目, 实现为 HX 自有.
import { GLSL_HASH, GLSL_NOISE, GLSL_UTIL, fragmentSource } from "../../backdrop/kernel/glsl";

/** 压力求解的 Jacobi 迭代次数. */
export const ETHER_PRESSURE_STEPS = 32;
/** 调色板最多几种颜色. */
export const ETHER_MAX_COLORS = 5;
/** 速度编码范围 (格每秒), 状态缓冲按 0.5 + v / (2 * 范围) 存, 8 位缓冲也存得下负值. */
export const ETHER_VELOCITY_RANGE = 512;
/** 压力编码范围. */
export const ETHER_PRESSURE_RANGE = 256;
/** 染料里 "速度" 通道的参考速度 (格每秒), 着色器里 speed = |v| / 参考. */
export const ETHER_SPEED_REF = 120;

/** 各通道共用: 编解码与投影后的速度 (减去上一次解出的压力梯度). */
const COMMON = `
const float VR = ${ETHER_VELOCITY_RANGE.toFixed(1)};
const float PR = ${ETHER_PRESSURE_RANGE.toFixed(1)};
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
float blob(vec2 uv, vec2 at, float radius) {
  vec2 d = (uv - at) * u_target_res;
  return exp(-dot(d, d) / max(radius * radius, 1e-4));
}
`;

/** 速度: 投影, 自平流, 粘性衰减, 指针 / 自动 / 点击的力, 可选反弹墙. */
export const ETHER_VELOCITY_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_vel;
uniform sampler2D u_press;
uniform float u_dt;
uniform float u_keep_v;
uniform float u_walls;
uniform vec4 u_splat;
uniform vec2 u_splat_k;
uniform vec4 u_burst;
${COMMON}
void main() {
  vec2 px = 1.0 / u_target_res;
  vec2 v = projected(u_vel, u_press, v_uv);
  vec2 nv = projected(u_vel, u_press, v_uv - u_dt * v * px) * u_keep_v;
  float g = blob(v_uv, u_splat.xy, u_splat_k.x) * u_splat_k.y;
  nv += (u_splat.zw - nv) * clamp(g, 0.0, 1.0);
  vec2 away = (v_uv - u_burst.xy) * u_target_res;
  float gb = blob(v_uv, u_burst.xy, u_burst.w);
  nv += away / max(length(away), 1e-3) * u_burst.z * gb;
  if (u_walls > 0.5) {
    if (v_uv.x < px.x * 1.5 || v_uv.x > 1.0 - px.x * 1.5) nv.x = -nv.x * 0.8;
    if (v_uv.y < px.y * 1.5 || v_uv.y > 1.0 - px.y * 1.5) nv.y = -nv.y * 0.8;
  }
  o_color = encV(nv);
}
`);

/** 散度. */
export const ETHER_DIVERGENCE_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_vel;
${COMMON}
void main() {
  vec2 px = 1.0 / vec2(textureSize(u_vel, 0));
  float l = decV(texture(u_vel, v_uv - vec2(px.x, 0.0))).x;
  float r = decV(texture(u_vel, v_uv + vec2(px.x, 0.0))).x;
  float d = decV(texture(u_vel, v_uv - vec2(0.0, px.y))).y;
  float u = decV(texture(u_vel, v_uv + vec2(0.0, px.y))).y;
  o_color = encP(0.5 * (r - l + u - d));
}
`);

/** 压力: Jacobi 迭代, 以上一帧的解热启动. */
export const ETHER_PRESSURE_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_press;
uniform sampler2D u_div;
${COMMON}
void main() {
  vec2 px = 1.0 / u_target_res;
  float l = decP(texture(u_press, v_uv - vec2(px.x, 0.0)));
  float r = decP(texture(u_press, v_uv + vec2(px.x, 0.0)));
  float d = decP(texture(u_press, v_uv - vec2(0.0, px.y)));
  float u = decP(texture(u_press, v_uv + vec2(0.0, px.y)));
  float div = decP(texture(u_div, v_uv));
  o_color = encP((l + r + d + u - div) * 0.25);
}
`);

/** 染料: r 浓度, g 流速 (除以参考速度再除 4 存), 按投影后的速度平流, 按留存率衰减, 指针处补染料. */
export const ETHER_DYE_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_dye;
uniform sampler2D u_vel;
uniform sampler2D u_press;
uniform float u_dt;
uniform float u_keep;
uniform vec4 u_splat;
uniform vec2 u_splat_k;
uniform vec4 u_burst;
uniform float u_dye_in;
${COMMON}
void main() {
  vec2 px = 1.0 / u_target_res;
  vec2 v = projected(u_vel, u_press, v_uv);
  vec4 prev = texture(u_dye, v_uv - u_dt * v * px);
  float level = prev.r * 4.0 * u_keep;
  level += u_dye_in * (blob(v_uv, u_splat.xy, u_splat_k.x) * u_splat_k.y + blob(v_uv, u_burst.xy, u_burst.w) * step(0.001, u_burst.z));
  float speed = length(v) / ${ETHER_SPEED_REF.toFixed(1)};
  o_color = vec4(clamp(level, 0.0, 4.0) / 4.0, clamp(speed, 0.0, 4.0) / 4.0, 0.0, 1.0);
}
`);

/** 上屏: 浓度当不透明度, 流速沿调色板取色, 快处镂空并发热; 减弱动效时改画一张静态的噪声流. */
export const ETHER_FRAGMENT = fragmentSource(`
uniform sampler2D u_dye;
uniform vec3 u_colors[${ETHER_MAX_COLORS}];
uniform float u_count;
uniform vec3 u_bg;
uniform float u_bg_on;
uniform float u_intensity;
uniform float u_light;
uniform float u_static;
vec3 palette(float t) {
  float scaled = clamp(t, 0.0, 1.0) * max(u_count - 1.0, 0.0);
  int i = int(floor(scaled));
  int j = min(i + 1, int(u_count) - 1);
  return mix(u_colors[i], u_colors[j], smoothstep(0.0, 1.0, fract(scaled)));
}
void main() {
  vec4 dye = texture(u_dye, v_uv);
  float level = dye.r * 4.0;
  float speed = dye.g * 4.0;
  if (u_static > 0.5) {
    vec2 p = hx_centered(gl_FragCoord.xy) * 2.2;
    float f = hx_fbm(p + vec2(hx_fbm(p * 1.3, 3), hx_fbm(p * 1.3 + 4.1, 3)) * 1.6, 4);
    level = smoothstep(0.35, 0.75, f) * 0.8;
    speed = f * 1.4;
  }
  float hollow = smoothstep(0.7, 1.6, speed);
  float alpha = smoothstep(0.08, 0.5, level) * mix(0.85, 0.1, hollow) * u_intensity;
  float hot = 1.0 - exp(-max(speed - 0.75, 0.0) * 1.2);
  vec3 col = palette(speed / 1.6);
  col = u_light > 0.5 ? mix(col, col * 0.45, hot) : mix(col, vec3(1.0), hot * 0.45);
  alpha = clamp(alpha, 0.0, 1.0);
  if (u_bg_on > 0.5) {
    o_color = vec4(mix(u_bg, col, alpha), 1.0);
  } else {
    o_color = vec4(col, alpha);
  }
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
