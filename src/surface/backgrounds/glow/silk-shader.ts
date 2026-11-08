// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Silk 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLOW_GLSL } from "./glow-kit";

/** 入场时长秒 (规格 INTRO_SECONDS). */
export const SILK_INTRO_SECONDS = 2.2;
/** 入场时额外推进的流动相位 (规格 INTRO_RUSH): 起初褶皱冲得快, 入场结束时回到常速. */
export const SILK_INTRO_RUSH = 1.6;
/** 点击涟漪寿命秒 (规格 WAVE_LIFE). */
export const SILK_WAVE_LIFE = 1.6;
/** 流动相位每单位时钟的推进量 (规格 flow += dt * 0.1 * speed). */
export const SILK_FLOW_RATE = 0.1;
/** 指针位置跟随速率 (规格 exp(-dt * 10)). */
export const SILK_FOLLOW_RATE = 10;
/** 拖拽速度混合速率 (规格 exp(-dt * 4)). */
export const SILK_DRAG_RATE = 4;
/** 触碰程度进场 / 离场速率 (规格 3.5 / 1.4). */
export const SILK_TOUCH_RATE = { enter: 3.5, leave: 1.4 } as const;
/** 光源跟随速率 (规格 exp(-dt * 3)). */
export const SILK_LIGHT_RATE = 3;

const BODY = `
uniform vec3 u_color;
uniform vec3 u_sheen_color;
uniform float u_scale;
uniform float u_turn;
uniform float u_flow;
uniform float u_noise;
uniform float u_sheen;
uniform float u_depth;
uniform float u_glow;
uniform float u_ripple;
uniform float u_wave;
uniform float u_seed;
uniform float u_intro;
uniform float u_ripple_on;
uniform vec3 u_drag;
uniform vec2 u_vel;
uniform vec3 u_light_at;

float folds(vec2 p) {
  float t = u_flow;
  vec2 q = p + 0.22 * u_wave * vec2(sin(p.y * 2.1 + t * 0.9 + u_seed), sin(p.x * 1.7 - t * 0.7 + u_seed * 1.37));
  float broad = sin(3.9 * (q.x + 0.8 * q.y) + 1.4 * sin(2.3 * q.x - 3.1 * q.y + t * 1.3) + t * 2.0);
  float fine = sin(11.0 * (q.x - 0.35 * q.y) - t * 2.6 + 1.8 * broad);
  return 0.5 + 0.5 * mix(broad, fine, 0.22 * u_ripple);
}

vec2 tapDisplace(vec2 p) {
  vec2 off = vec2(0.0);
  for (int k = 0; k < 8; k++) {
    if (float(k) >= u_tap_count) break;
    vec4 tap = u_taps[k];
    if (tap.z > ${SILK_WAVE_LIFE}) continue;
    vec2 c = (tap.xy - 0.5) * u_res / min(u_res.x, u_res.y);
    vec2 d = p - c;
    float ring = length(d) - tap.z * 0.7;
    float life = 1.0 - tap.z / ${SILK_WAVE_LIFE};
    off += normalize(d + 1e-4) * exp(-ring * ring * 70.0) * 0.06 * life * life;
  }
  return off * u_ripple_on;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 p = hx_centered(frag);
  vec2 m = (u_drag.xy - 0.5) * u_res / min(u_res.x, u_res.y);
  float near = exp(-dot(p - m, p - m) * 9.0) * u_drag.z;
  p += tapDisplace(p) - near * u_vel * 0.1;
  p = hx_rot(u_turn) * p * (2.2 / max(u_scale, 0.01));
  float e = 0.01;
  float n = folds(p);
  vec2 grad = vec2(folds(p + vec2(e, 0.0)) - n, folds(p + vec2(0.0, e)) - n) / e;
  vec3 normal = normalize(vec3(-grad * 0.12 * (0.4 + u_depth), 1.0));
  vec2 lp = u_light_at.xy - frag / u_res;
  vec3 toLight = normalize(vec3(lp * 1.2 + vec2(-0.25, 0.35), 0.8));
  vec3 halfway = normalize(toLight + vec3(0.0, 0.0, 1.0));
  float relief = 1.0 + (dot(normal, toLight) - toLight.z) * 1.8 * u_depth;
  float gloss = pow(max(dot(normal, halfway), 0.0), 48.0) * smoothstep(0.25, 0.85, n);
  float bloom = 0.0;
  bloom += exp(-dot(lp, lp) * 7.0) * u_light_at.z;
  float pattern = n;
  float fold = smoothstep(0.28, 0.9, pattern);
  float specular = smoothstep(0.72, 0.98, pattern);
  vec3 ink = u_color * (0.5 + 0.65 * fold) * max(relief, 0.0);
  ink += u_sheen_color * (gloss + specular * 0.2) * u_sheen;
  ink += mix(u_color, u_sheen_color, 0.5) * bloom * u_glow;
  ink += (hx_hash2(floor(frag)) - 0.5) * u_noise * 0.06;
  float mask = 1.0;
  mask *= smoothstep(0.0, 1.0, u_intro * 1.5 - length(frag / u_res - 0.5) * 0.7);
  o_color = glow_finish(ink, mask, frag);
}
`;

/** Silk 的上屏程序. */
export const SILK_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, GLOW_GLSL);
