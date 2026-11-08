// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Plasma 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLOW_GLSL } from "./glow-kit";

/** 入场时长秒 (规格 INTRO_SECONDS). */
export const PLASMA_INTRO_SECONDS = 1.6;
/** 体积通道像素上限 (规格 MAX_VOLUME_PIXELS), 见组件头 ENGINE-GAP. */
export const PLASMA_MAX_VOLUME_PIXELS = 1600000;
/** 视角弹簧刚度与阻尼 (规格 40 * (goal - yaw) - 11 * velocity). */
export const PLASMA_SPRING = { stiffness: 40, damping: 11 } as const;
/** 热点进场 / 离场速率 (规格 4 / 2). */
export const PLASMA_HEAT_RATE = { enter: 4, leave: 2 } as const;
/** 热点位置跟随速率 (规格 exp(-dt * 8)). */
export const PLASMA_HEAT_FOLLOW_RATE = 8;
/** 体积通道的采样器名. */
export const PLASMA_VOLUME = "u_volume";
/** 体积通道步进次数. */
export const PLASMA_STEPS = 32;
/** 通道里峰值的压缩倍率: 存 peak / PEAK_RANGE, 8 位缓冲也不截断. */
const PEAK_RANGE = "4.0";

/** 体积通道: 视线穿过扭转的正弦湍流体, 累积发光密度 (peak) 与色带相位 (band). */
const VOLUME_BODY = `
uniform float u_scale;
uniform float u_zoom;
uniform float u_twist;
uniform float u_wave;
uniform float u_sharpness;
uniform vec2 u_orbit;
uniform float u_dir;

float plasma(vec3 p, float t) {
  p.xy = hx_rot(p.z * 0.35 * u_twist + t * 0.2) * p.xy;
  float f = 0.0;
  float amp = 1.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    p += u_wave * 0.45 * amp * sin(p.yzx * (1.3 + fi * 0.6) + t * (0.7 + fi * 0.25));
    f += amp * sin(p.x + p.y * 0.7 + p.z * 0.5);
    amp *= 0.55;
  }
  return f;
}

void main() {
  vec2 p = (v_uv - 0.5) * u_res / min(u_res.x, u_res.y);
  vec3 ro = vec3(0.0, 0.0, u_time * 0.6 * u_dir);
  vec3 rd = normalize(vec3(p * u_zoom, 1.0));
  rd.xz = hx_rot(u_orbit.x) * rd.xz;
  rd.yz = hx_rot(u_orbit.y) * rd.yz;
  float t = u_time;
  float z = 0.0;
  float density = 0.0;
  float band = 0.0;
  for (int i = 0; i < ${PLASMA_STEPS}; i++) {
    vec3 q = (ro + rd * z) * (1.2 / max(u_scale, 0.01));
    float f = plasma(q, t);
    float sheet = abs(f) + 0.06 + 0.3 * (1.0 - u_sharpness);
    float glow = 0.018 / pow(sheet, 1.0 + u_sharpness);
    density += glow;
    band += glow * f;
    z += 0.08 + sheet * 0.12;
  }
  float peak = density;
  o_color = vec4(peak / ${PEAK_RANGE}, band / max(density, 1e-4) * 0.25 + 0.5, 0.0, 1.0);
}
`;

/** 体积通道程序. */
export const PLASMA_VOLUME_FRAGMENT = fragmentSource(VOLUME_BODY, GLSL_HASH, GLSL_UTIL);

/** 上屏: 峰值换覆盖与热芯, 色带相位换亮暗, 指针处升温. */
const COMPOSITE_BODY = `
uniform sampler2D ${PLASMA_VOLUME};
uniform vec3 u_ink;
uniform float u_shine;
uniform float u_brightness;
uniform float u_intro;
uniform vec3 u_heat;

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec4 vol = texture(${PLASMA_VOLUME}, v_uv);
  vec2 h = (v_uv - u_heat.xy) * u_res / min(u_res.x, u_res.y);
  float warm = exp(-dot(h, h) * 6.0) * u_heat.z;
  float peak = vol.r * ${PEAK_RANGE} * (1.0 + warm * 0.8);
  float level = 1.0 - exp(-peak);
  float hot = smoothstep(1.0, 3.0, peak);
  float shade = 0.75 + 0.5 * (vol.g - 0.5);
  vec3 ink = u_ink * shade * (0.6 + 0.6 * level);
  ink = mix(ink, mix(u_ink, vec3(1.0), 0.75), hot * u_shine);
  float reveal = smoothstep(0.0, 1.0, u_intro * 1.4 - length(v_uv - 0.5) * 0.6);
  o_color = glow_finish(ink * u_brightness, clamp(level * u_brightness, 0.0, 1.0) * reveal, frag);
}
`;

/** 上屏程序. */
export const PLASMA_FRAGMENT = fragmentSource(COMPOSITE_BODY, GLSL_HASH, GLSL_UTIL, GLOW_GLSL);
