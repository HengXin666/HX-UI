// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Iridescence 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLOW_GLSL } from "./glow-kit";

/** 规格的搅动场列数 (FIELD_COLUMNS); 这里是离屏通道, 倍率取 48 / 画布宽, 恰 48 列. */
export const IRIDESCENCE_FIELD_COLUMNS = 48;
/** 同时生效的点击旋涡上限 (规格 MAX_SWIRLS). */
export const IRIDESCENCE_MAX_SWIRLS = 6;
/** 点击旋涡寿命秒 (规格 SWIRL_LIFE). */
export const IRIDESCENCE_SWIRL_LIFE = 3.2;
/** 搅动场每秒衰减速率 (规格 exp(-dt * 1.4)). */
export const IRIDESCENCE_FIELD_DECAY = 1.4;
/** 指针跟随速率 (规格 exp(-dt * 5)). */
export const IRIDESCENCE_FOLLOW_RATE = 5;
/** 指针在场速率 (规格 exp(-dt * 4)). */
export const IRIDESCENCE_PRESENCE_RATE = 4;
/** 迭代细节层数上限 (detail prop 钳到这里). */
export const IRIDESCENCE_MAX_DETAIL = 12;
/** 搅动场的采样器名. */
export const IRIDESCENCE_FIELD = "u_stir_field";

/** 搅动场: 速度存在 rg (0.5 为零), 每帧乘衰减, 指针处按跟随速度注入. 读自己拿上一帧. */
const FIELD_BODY = `
uniform sampler2D ${IRIDESCENCE_FIELD};
uniform float u_decay;
uniform vec3 u_splat;
uniform vec2 u_force;

void main() {
  vec2 v = (texture(${IRIDESCENCE_FIELD}, v_uv).rg - 0.5) * 4.0 * u_decay;
  vec2 k = u_res / min(u_res.x, u_res.y);
  vec2 d = (v_uv - u_splat.xy) * k;
  v += u_force * exp(-dot(d, d) * 40.0) * u_splat.z * 0.25;
  o_color = vec4(clamp(v * 0.25 + 0.5, 0.0, 1.0), 0.0, 1.0);
}
`;

/** 搅动场程序. */
export const IRIDESCENCE_FIELD_FRAGMENT = fragmentSource(FIELD_BODY, GLSL_HASH, GLSL_UTIL);

const BODY = `
uniform sampler2D ${IRIDESCENCE_FIELD};
uniform vec3 u_color;
uniform float u_amplitude;
uniform float u_scale;
uniform float u_detail;
uniform float u_turn;
uniform float u_warp;
uniform float u_hue;
uniform float u_saturation;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_stir;
uniform float u_sheen;
uniform float u_swirl_on;
uniform vec3 u_mouse;

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 k = u_res / min(u_res.x, u_res.y);
  vec2 p = (v_uv - 0.5) * k;
  vec2 v = (texture(${IRIDESCENCE_FIELD}, v_uv).rg - 0.5) * 4.0;
  p -= v * u_stir * 0.35;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_tap_count) break;
    if (float(i) < u_tap_count - ${IRIDESCENCE_MAX_SWIRLS}.0) continue;
    vec4 tap = u_taps[i];
    if (tap.z > ${IRIDESCENCE_SWIRL_LIFE}) continue;
    vec2 c = (tap.xy - 0.5) * k;
    float radius = 0.21 + tap.z * 0.08;
    float ease = exp(-tap.z * 1.35) - exp(-tap.z * 10.0);
    float fade = 1.0 - tap.z / ${IRIDESCENCE_SWIRL_LIFE};
    float power = 3.0 * ease * fade * pow(0.21 / radius, 2.0);
    vec2 d = p - c;
    p = c + hx_rot(u_swirl_on * power * exp(-dot(d, d) / (radius * radius))) * d;
  }
  p += (u_mouse.xy - 0.5) * k * u_amplitude * u_mouse.z;
  vec2 q = hx_rot(u_turn) * p * (3.0 / max(u_scale, 0.01));
  float t = u_time * 0.35;
  float a = 0.0;
  for (int i = 0; i < ${IRIDESCENCE_MAX_DETAIL}; i++) {
    if (float(i) >= u_detail) break;
    float fi = float(i) + 1.0;
    q += u_warp * 0.55 / fi * vec2(cos(q.y * 1.3 + t + fi * 0.7), sin(q.x * 1.1 - t * 0.8 + fi * 1.9));
    a += cos(q.x * 0.6 + q.y * 0.4 + t * 0.5) / fi;
  }
  float film = length(q) * 0.3 + a * 0.5;
  vec3 hue = 0.62 + 0.38 * cos(HX_TAU * (film + u_hue + vec3(0.0, 0.33, 0.67)));
  vec3 col = mix(vec3(hx_luma(hue)), hue, u_saturation);
  col = (col - 0.5) * u_contrast + 0.5;
  float sheen = pow(max(sin(film * HX_TAU * 1.5 + t), 0.0), 12.0) * u_sheen;
  vec3 ink = (col * u_color * 0.6 + sheen * 0.4) * u_brightness;
  o_color = glow_finish(ink, 1.0, frag);
}
`;

/** 上屏程序. */
export const IRIDESCENCE_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL, GLOW_GLSL);
