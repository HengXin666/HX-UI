// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Balatro 条目, 实现为 HX 自有.
import { GLSL_HASH, GLSL_UTIL, fragmentSource } from "../../backdrop/kernel/glsl";

/** 搅动场格子边长 (CSS 像素), 状态缓冲按 1 / FIELD_SCALE 缩放. */
export const BALATRO_FIELD_SCALE = 8;
/** 指针搅动半径 (CSS 像素). */
export const BALATRO_STIR_RADIUS = 90;
/** 同时生效的点击旋涡数. */
export const BALATRO_MAX_TWIRLS = 4;
/** 搅动场衰减的时间常数 (秒), 每帧乘 exp(-dt / 1.6). */
export const BALATRO_DECAY_TAU = 1.6;
/** 入场: 颜料从中心旋开的秒数. */
export const BALATRO_INTRO_SECONDS = 2.2;
/** 指针转向的时间常数 (秒). */
export const BALATRO_STEER_TAU = 0.8;
/** 流动时钟倍率: 流动相位每秒走 speed * 7. */
export const BALATRO_FLOW_RATE = 7;
/** 自转倍率: 每秒转 rotationSpeed * 0.2 弧度. */
export const BALATRO_SPIN_RATE = 0.2;
/** 点击旋涡的寿命 (秒). */
export const BALATRO_TWIRL_LIFE = 3;

/**
 * 搅动场每帧的保留率.
 *
 * @param dt 帧长 (秒).
 */
export function balatroDecay(dt: number): number {
  return Math.exp(-Math.max(dt, 0) / BALATRO_DECAY_TAU);
}

/**
 * 点击旋涡强度: 0.15 秒拧起, 再按 exp(-1.2 age) 松开, 寿命外为 0.
 *
 * @param age 距点击的秒数.
 */
export function balatroTwirl(age: number): number {
  if (age < 0 || age > BALATRO_TWIRL_LIFE) return 0;
  const rise = Math.min(1, age / 0.15);
  return rise * Math.exp(-age * 1.2);
}

/**
 * 入场进度 0..1, 关掉 intro 或减弱动效时为 1.
 *
 * @param elapsed 出帧以来的真实秒数.
 * @param intro 是否有入场.
 */
export function balatroOpening(elapsed: number, intro: boolean): number {
  if (!intro || !Number.isFinite(elapsed)) return 1;
  return Math.min(1, Math.max(0, elapsed / BALATRO_INTRO_SECONDS));
}

/** 搅动场: rg 是位移 (按 0.5 + 0.5v 编码), 每帧衰减, 指针本帧走过的线段沿运动方向推开颜料. */
export const BALATRO_STIR_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_stir;
uniform vec2 u_from;
uniform vec2 u_to;
uniform float u_push;
uniform float u_radius;
uniform float u_decay;
void main() {
  vec2 v = (texture(u_stir, v_uv).rg * 2.0 - 1.0) * u_decay;
  vec2 aspect = vec2(u_target_res.x / u_target_res.y, 1.0);
  vec2 a = u_from * aspect;
  vec2 b = u_to * aspect;
  vec2 p = v_uv * aspect;
  vec2 ab = b - a;
  float len = length(ab);
  if (u_push > 0.0 && len > 1e-5) {
    float h = clamp(dot(p - a, ab) / (len * len), 0.0, 1.0);
    float d = length(p - a - ab * h);
    float w = exp(-d * d / (u_radius * u_radius));
    v += (ab / len) * min(len * 6.0, 1.0) * u_push * w;
  }
  v = clamp(v, -1.0, 1.0);
  o_color = vec4(0.5 + 0.5 * v, 0.0, 1.0);
}
`);

/** 上屏: 像素化后的坐标经搅动场与点击旋涡扭过, 迭代正弦折叠出颜料, 三色按对比度分带, 可叠 CRT 弯曲与扫描线. */
export const BALATRO_FRAGMENT = fragmentSource(`
uniform sampler2D u_stir;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform float u_contrast;
uniform float u_lighting;
uniform float u_swirl;
uniform float u_flow;
uniform float u_spin;
uniform float u_scale;
uniform float u_detail;
uniform vec2 u_offset;
uniform float u_pixel;
uniform float u_crt;
uniform vec2 u_steer;
uniform vec4 u_twirls[${BALATRO_MAX_TWIRLS}];
uniform float u_opening;
uniform float u_light;

vec2 bend(vec2 uv) {
  vec2 c = uv * 2.0 - 1.0;
  c *= 1.0 + u_crt * 0.12 * dot(c.yx, c.yx);
  return c * 0.5 + 0.5;
}

void main() {
  vec2 uv = bend(gl_FragCoord.xy / u_res);
  float cell = max(u_pixel * u_dpr, 1.0);
  vec2 frag = (floor(uv * u_res / cell) + 0.5) * cell;
  vec2 suv = frag / u_res;
  vec2 shift = texture(u_stir, suv).rg * 2.0 - 1.0;
  vec2 p = (frag - 0.5 * u_res) / length(u_res) - u_offset - u_steer * 0.08;
  p -= shift * 0.06;
  for (int i = 0; i < ${BALATRO_MAX_TWIRLS}; i++) {
    vec4 tw = u_twirls[i];
    if (tw.w == 0.0) continue;
    vec2 c = (tw.xy - 0.5) * u_res / length(u_res);
    vec2 d = p - c;
    float k = tw.w * exp(-dot(d, d) * 40.0);
    p = c + hx_rot(k * 4.0) * d;
  }
  float r = length(p);
  float unwind = (1.0 - u_opening) * 3.0;
  float twist = u_spin + unwind - u_swirl * 20.0 * (r - 0.5 * r * r);
  p = hx_rot(twist) * p;
  vec2 q = p * 30.0 / max(u_scale, 0.05);
  vec2 w = q;
  float flow = u_flow;
  for (float i = 0.0; i < 8.0; i++) {
    if (i >= u_detail) break;
    w += vec2(sin(max(q.x, q.y) * 0.9 + i * 0.7), cos(min(q.x, q.y) * 0.8 - i * 0.4)) + q * 0.97;
    q += 0.48 * vec2(cos(4.9 + 0.33 * w.y + flow * 0.12), sin(w.x * 0.97 - 0.1 * flow));
    q -= 0.9 * vec2(cos(q.x + q.y), sin(q.x * 0.69 - q.y));
  }
  float contrastMod = 0.25 * u_contrast + 0.5 * u_swirl + 1.2;
  float paint = clamp(length(q) * 0.035 * contrastMod, 0.0, 2.0);
  float c1 = max(0.0, 1.0 - contrastMod * abs(1.0 - paint));
  float c2 = max(0.0, 1.0 - contrastMod * abs(paint));
  float c3 = 1.0 - min(1.0, c1 + c2);
  float shine = (u_lighting - 0.2) * max(c1 * 5.0 - 4.0, 0.0) + u_lighting * max(c2 * 5.0 - 4.0, 0.0);
  float base = 0.3 / u_contrast;
  vec3 col = base * u_c1 + (1.0 - base) * (u_c1 * c1 + u_c2 * c2 + u_c3 * c3) + shine;
  col = mix(u_c3, col, smoothstep(0.0, 0.6, u_opening));
  if (u_crt > 0.0) {
    float scan = 0.5 + 0.5 * sin(gl_FragCoord.y / max(u_dpr, 1.0) * 3.14159);
    col *= 1.0 - u_crt * 0.25 * scan;
    vec2 e = uv * (1.0 - uv);
    col *= mix(1.0, pow(clamp(e.x * e.y * 16.0, 0.0, 1.0), 0.25), u_crt);
  }
  if (u_light > 0.5) col = 1.0 - (1.0 - col) * 0.55;
  o_color = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`, GLSL_HASH, GLSL_UTIL);
