// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Galaxy 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel";

export const GALAXY = {
  /** 规格 MAX_LAYERS / MAX_COLORS / INTRO_SECONDS. */
  maxLayers: 8,
  maxColors: 4,
  introSeconds: 2.2,
  /** 规格: 点击加速衰减率 exp(-dt * 1.3), 加速时飞行速度乘 (1 + boost * 14). */
  boostDecay: 1.3,
  boostGain: 14,
  /** 规格: 指针跟随时间常数 0.325s. */
  pointerTau: 0.325,
  /** 本库定: starSpeed=1 时每秒穿过的层深 (一层 0..1). */
  flightRate: 0.1,
} as const;

/** 星场推进一帧的状态. */
export interface GalaxyState {
  depth: number;
  boost: number;
  mx: number;
  my: number;
  seen: number;
}

export function makeGalaxyState(): GalaxyState {
  return { depth: 0, boost: 0, mx: 0.5, my: 0.5, seen: -1 };
}

/**
 * 推进层深与点击加速. 静态帧 (dt 为 0) 由场时钟直接给出层深, 让减弱动效的画面固定.
 *
 * @param s 状态, 原地更新.
 * @param dt 真实帧长 (秒).
 * @param flight 每秒层深 (已乘 starSpeed, speed 与方向).
 * @param stillDepth 静态帧用的层深.
 */
export function stepGalaxy(s: GalaxyState, dt: number, flight: number, stillDepth: number | null): void {
  if (stillDepth !== null) {
    s.depth = stillDepth;
    return;
  }
  s.depth += dt * flight * (1 + s.boost * GALAXY.boostGain);
  s.boost *= Math.exp(-dt * GALAXY.boostDecay);
}

const BODY = `
uniform float u_layers;
uniform float u_density;
uniform float u_glow;
uniform float u_twinkle;
uniform float u_flare;
uniform float u_size;
uniform float u_angle;
uniform float u_depth;
uniform float u_reveal;
uniform float u_hue;
uniform float u_sat;
uniform float u_light;
uniform float u_opaque;
uniform float u_repel;
uniform float u_auto;
uniform float u_warp;
uniform float u_count;
uniform vec2 u_focal;
uniform vec3 u_mouse;
uniform vec3 u_colors[${GALAXY.maxColors}];
uniform vec3 u_bg;

vec3 hx_hue_turn(vec3 c, float a) {
  const mat3 toYiq = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  const mat3 fromYiq = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 yiq = toYiq * c;
  float cs = cos(a); float sn = sin(a);
  yiq.yz = mat2(cs, sn, -sn, cs) * yiq.yz;
  return fromYiq * yiq;
}

float hx_star(vec2 uv, float flare) {
  float d = length(uv);
  float m = 0.05 * u_glow / max(d, 1e-3);
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare;
  uv *= hx_rot(HX_PI * 0.25);
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 hx_star_layer(vec2 uv, float seed) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 off = vec2(float(x), float(y));
      vec2 si = id + off + seed * 17.0;
      float n = hx_hash2(si);
      float size = fract(n * 345.32);
      vec2 jitter = hx_hash22(si + 3.1) - 0.5;
      float flare = smoothstep(0.9, 1.0, size) * u_flare;
      float pick = floor(hx_hash2(si + 7.7) * u_count);
      vec3 tint = u_colors[0];
      for (int k = 1; k < ${GALAXY.maxColors}; k++) {
        if (float(k) == pick) tint = u_colors[k];
      }
      float tw = mix(1.0, 0.5 + 0.5 * sin(u_time * (2.0 + n * 5.0) + n * HX_TAU), u_twinkle);
      col += hx_star(gv - off - jitter, flare) * size * tint * tw;
    }
  }
  return col * u_size;
}

void main() {
  float unit = min(u_res.x, u_res.y);
  vec2 p = (gl_FragCoord.xy - u_focal * u_res) / unit;
  vec2 m = (u_mouse.xy - u_focal) * u_res / unit;
  vec2 away = p - m;
  float dm = length(away);
  p += away / max(dm, 1e-3) * u_repel * 0.04 * u_mouse.z / (dm * 6.0 + 1.0);
  float dc = length(p);
  p += p / max(dc, 1e-3) * u_auto * 0.04 / (dc * 6.0 + 1.0);
  p *= 1.0 - u_warp * 0.35 * smoothstep(0.0, 1.0, dc);
  p = hx_rot(u_angle) * p;
  vec3 col = vec3(0.0);
  for (int i = 0; i < ${GALAXY.maxLayers}; i++) {
    if (float(i) >= u_layers) break;
    float fi = float(i);
    float depth = fract(fi / u_layers + u_depth);
    float scale = mix(20.0, 0.5, depth) * u_density;
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += hx_star_layer(p * scale + fi * 453.32, fi) * fade;
  }
  float reach = smoothstep(0.0, 1.0, u_reveal * 1.6 - dc);
  col *= reach;
  col = hx_hue_turn(col, u_hue);
  float l = hx_luma(col);
  col = max(mix(vec3(l), col, 1.0 + u_sat), 0.0);
  float alpha = min(smoothstep(0.0, 0.3, length(col)), 1.0);
  vec3 ink = col / max(max(col.r, max(col.g, col.b)), 1e-3);
  vec3 lit = mix(clamp(col / max(alpha, 1e-3), 0.0, 1.0), ink * 0.55, u_light);
  vec3 outRgb = mix(lit, mix(u_bg, lit, alpha), u_opaque);
  o_color = vec4(outRgb, mix(alpha, 1.0, u_opaque));
}
`;

/** Galaxy 的上屏片元: 多层视差星格, 每格一颗星 (光核加十字与斜十字光芒), 层深循环推进. */
export const GALAXY_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL);
