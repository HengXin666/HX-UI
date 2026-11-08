// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 FluxLines 条目, 实现为 HX 自有.
/**
 * FluxLines 的片元与纯函数: 沿流向平流的噪声场取等值线, 得到成束流动的细线; 第二层噪声给线身打光 (锐度, 微光),
 * 指针像磁铁把场往自己拉并点亮附近, 点击处起旋涡, 入场时线由暗处逐束亮起.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel";
import { GLSL_LINES } from "./tokens";

/** 入场时长 (条目 INTRO_SECONDS). */
export const FLUX_INTRO_SECONDS = 1.8;
/** 磁铁强弱的跟随时间常数 (条目 magnet.active 的 tau 0.3s). */
export const FLUX_MAGNET_TAU = 0.3;
/** 场的参考尺度 (CSS 像素, 条目 ref = 700 / scale), scale 下限 0.05. */
export const FLUX_REFERENCE = 700;
export const FLUX_MIN_SCALE = 0.05;
/** 平流速度 (CSS 像素每秒, 条目 spd = 200 * speed). */
export const FLUX_FLOW_PX = 200;
/** 每个参考尺度里的线数 (本库定). */
export const FLUX_DENSITY = 16;

export type FluxDirection = "up" | "down" | "left" | "right";
/** 流向单位向量, y 朝上 (条目 FLOW). */
export const FLUX_FLOW: Readonly<Record<FluxDirection, readonly [number, number]>> = { up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0] };

/** 场的参考尺度 (CSS 像素). */
export function fluxReference(scale: number): number {
  return FLUX_REFERENCE / Math.max(scale, FLUX_MIN_SCALE);
}

const BODY = `
uniform vec2 u_flow;
uniform float u_ref;
uniform float u_turb;
uniform float u_fluid;
uniform float u_rim;
uniform float u_sharp;
uniform float u_shimmer;
uniform float u_glow;
uniform float u_line;
uniform vec4 u_magnet;
uniform float u_swirl;
uniform float u_reveal;
uniform float u_light;
uniform float u_opaque;
uniform vec3 u_bg;

vec2 toField(vec2 frag) { return frag / (u_dpr * u_ref); }

void main() {
  vec2 p = toField(gl_FragCoord.xy);
  float t = u_time;
  vec2 m = toField(u_magnet.xy * u_res);
  vec2 dm = p - m;
  float pull = exp(-dot(dm, dm) / max(u_magnet.z * u_magnet.z, 1e-4)) * u_magnet.w;
  p -= dm * pull * 0.45;
  if (u_swirl > 0.5) {
    for (int k = 0; k < ${8}; k++) {
      if (float(k) >= u_tap_count) break;
      vec4 tap = u_taps[k];
      float age = tap.z;
      float turn = 1.6 * smoothstep(0.0, 0.2, age) * exp(-max(age - 0.2, 0.0) * 1.4) * tap.w;
      vec2 c = toField(tap.xy * u_res);
      vec2 d = p - c;
      float spread = 0.22 * (1.0 + age * 0.5);
      p = c + hx_rot(turn * exp(-dot(d, d) / (spread * spread))) * d;
    }
  }
  vec2 dir = u_flow;
  vec2 side = vec2(-dir.y, dir.x);
  float shift = t * ${FLUX_FLOW_PX}.0 / u_ref;
  float along = dot(p, dir) - shift;
  float across = dot(p, side);
  float morph = t * u_fluid;
  float warp = 0.6 * hx_gnoise(vec2(across * 1.2, along * 0.55) + morph);
  warp += 0.25 * hx_gnoise(vec2(across * 2.7, along * 1.3) - morph * 1.4);
  float v = (across + warp * u_turb * 0.5) * ${FLUX_DENSITY}.0;
  float pixels = abs(fract(v) - 0.5) / max(fwidth(v), 1e-5);
  float energy = hx_vnoise(vec2(floor(v) * 0.37, along * 0.9 + morph));
  float glow = pow(clamp(energy + pull * 0.6, 0.0, 1.0), u_sharp) * u_glow;
  float band = 5.0 * u_rim * (1.0 - abs(fract(v) - 0.5) * 2.0);
  float shimmer = 1.0 + u_shimmer * 0.25 * sin(along * 24.0 - t * 5.0 + floor(v) * 1.7);
  float reveal = smoothstep(0.2, 0.85, energy + u_reveal * 1.2 - 0.6);
  float core = u_line > 0.0 ? smoothstep(u_line + 0.75, u_line - 0.75, pixels) * max(smoothstep(0.08, 0.6, glow), reveal) : 0.0;
  float halo = glow * (0.18 * band + 0.35 * exp(-pixels / (4.0 * u_dpr))) * mix(1.0, 0.35, u_light);
  float ink = clamp((core * (0.45 + glow) + halo) * shimmer, 0.0, 1.0) * smoothstep(0.0, 0.35, u_reveal);
  vec3 col = ln_palette(hx_hash1(floor(v) + 0.5));
  col = mix(col, vec3(1.0), smoothstep(0.85, 1.6, glow) * 0.35 * (1.0 - u_light));
  if (u_opaque > 0.5) {
    o_color = vec4(mix(u_bg, col, ink), 1.0);
  } else {
    o_color = vec4(col, ink);
  }
}
`;

/** 上屏片元. */
export const FLUX_LINES_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, GLSL_LINES);
