// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 DarkVeil 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLOW_GLSL } from "./glow-kit";

/** 入场时长秒 (规格 INTRO_SECONDS). */
export const DARK_VEIL_INTRO_SECONDS = 1.8;
/** 场通道像素上限 (规格 MAX_FIELD_PIXELS): 画布再大, 场也不超过这个像素数. */
export const DARK_VEIL_MAX_FIELD_PIXELS = 900000;
/** 指针位置跟随速率 (规格 exp(-dt * 9)). */
export const DARK_VEIL_FOLLOW_RATE = 9;
/** 拖拽速度混合速率 (规格 exp(-dt * 5)). */
export const DARK_VEIL_DRAG_RATE = 5;
/** 触碰程度进场 / 离场速率 (规格 3 / 1.6). */
export const DARK_VEIL_TOUCH_RATE = { enter: 3, leave: 1.6 } as const;
/** 光源跟随速率 (规格 exp(-dt * 4)). */
export const DARK_VEIL_LIGHT_RATE = 4;
/** 场通道的采样器名. */
export const DARK_VEIL_FIELD = "u_veil";

/**
 * 场通道: 域扭曲分形噪声作高度, 写出 (高度, 两向梯度, 拖拽涟漪). 分辨率由 quality 决定, 上屏程序双线性放大.
 */
const FIELD_BODY = `
uniform float u_scale;
uniform float u_turn;
uniform float u_flow;
uniform float u_warp;
uniform float u_seed;
uniform vec3 u_drag;
uniform vec2 u_vel;

float veil(vec2 p) {
  float t = u_time * u_flow * 0.12;
  vec2 q = vec2(hx_fbm(p + vec2(0.0, t) + u_seed, 5), hx_fbm(p + vec2(5.2, 1.3 - t) + u_seed, 5));
  vec2 r = p + (0.85 + u_warp) * q + vec2(t * 0.6, -t * 0.4);
  return hx_fbm(r * 1.3 + 3.1, 5);
}

void main() {
  vec2 aspect = vec2(u_res.x / min(u_res.x, u_res.y), u_res.y / min(u_res.x, u_res.y));
  vec2 p = (v_uv - 0.5) * aspect;
  vec2 m = (u_drag.xy - 0.5) * aspect;
  float near = exp(-dot(p - m, p - m) * 14.0) * u_drag.z;
  vec2 push = -near * u_vel * 0.12;
  p = hx_rot(u_turn) * p * (1.6 * u_scale);
  float e = 0.012;
  float h = veil(p + push);
  float hx = veil(p + push + vec2(e, 0.0));
  float hy = veil(p + push + vec2(0.0, e));
  o_color = vec4(h, (hx - h) / e * 0.1 + 0.5, (hy - h) / e * 0.1 + 0.5, near);
}
`;

/** 场通道程序. */
export const DARK_VEIL_FIELD_FRAGMENT = fragmentSource(FIELD_BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);

/** 上屏: 由高度与法线打光, 收成墨色薄纱. */
const COMPOSITE_BODY = `
uniform sampler2D ${DARK_VEIL_FIELD};
uniform vec3 u_ink;
uniform float u_brightness;
uniform float u_sheen;
uniform float u_glow;
uniform float u_intro;
uniform vec3 u_light_at;

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec4 field = texture(${DARK_VEIL_FIELD}, v_uv);
  float base = field.r;
  vec2 grad = (field.gb - 0.5) * 10.0;
  vec3 normal = normalize(vec3(-grad * 0.3, 1.0));
  vec2 lp = u_light_at.xy - v_uv;
  vec3 toLight = normalize(vec3(lp * 1.5, 0.9));
  float facing = max(dot(normal, toLight), 0.0);
  float glow = 0.0;
  glow += exp(-dot(lp, lp) * 6.0) * u_light_at.z;
  float sheen = pow(facing, 40.0) * smoothstep(0.08, 0.7, base);
  float peak = smoothstep(0.4, 0.82, base) * 1.8 * (0.6 + 0.6 * facing) + field.a * 0.6;
  float cover = 1.0 - exp(-peak * 1.6);
  vec3 ink = mix(u_ink, u_ink * 0.82, smoothstep(0.5, 1.0, cover));
  ink *= 0.45 + 0.75 * facing;
  ink += u_ink * glow * u_glow + vec3(sheen) * u_sheen;
  float reveal = smoothstep(0.0, 1.0, u_intro * 1.4 - length(v_uv - 0.5) * 0.6);
  float density = clamp(cover * u_brightness + glow * u_glow * 0.25, 0.0, 1.0) * reveal;
  o_color = glow_finish(ink * u_brightness, density, frag);
}
`;

/** 上屏程序. */
export const DARK_VEIL_FRAGMENT = fragmentSource(COMPOSITE_BODY, GLSL_HASH, GLSL_UTIL, GLOW_GLSL);
