// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 EvilEye 条目, 实现为 HX 自有.
import { GLSL_HASH, GLSL_NOISE, GLSL_UTIL, fragmentSource } from "../../backdrop/kernel/glsl";

/** 瞳孔跟随指针的时间常数 (秒). */
export const EYE_LOOK_TAU = 0.2;
/** 瞳孔最大偏移 (眼眶坐标). */
export const EYE_LOOK_RANGE = 0.15;
/** 瞳孔竖缝的横纵压缩. */
export const EYE_PUPIL_SQUASH: readonly [number, number] = [9, 2.3];
/** 外圈光晕的椭圆压缩. */
export const EYE_GLOW_SQUASH: readonly [number, number] = [0.5, 1.5];

/**
 * 瞳孔的目标偏移: 指针相对中心的偏移乘 pupilFollow, 长度封顶为 1; 指针离开时回正.
 *
 * @param x 指针归一化 x.
 * @param y 指针归一化 y (朝上).
 * @param inside 指针是否在场内.
 * @param follow pupilFollow prop.
 */
export function eyeLookTarget(x: number, y: number, inside: boolean, follow: number): readonly [number, number] {
  if (!inside || follow === 0) return [0, 0];
  const dx = (x - 0.5) * 2 * follow;
  const dy = (y - 0.5) * 2 * follow;
  const len = Math.hypot(dx, dy);
  return len > 1 ? [dx / len, dy / len] : [dx, dy];
}

/** 邪眼: 极坐标三维噪声烧出向外窜的火焰, 中间一圈虹膜, 竖缝瞳孔跟着指针转, 外圈椭圆光晕. */
export const EYE_FRAGMENT = fragmentSource(`
uniform vec3 u_eye;
uniform vec3 u_bg;
uniform float u_intensity;
uniform float u_pupil;
uniform float u_iris;
uniform float u_glow;
uniform float u_scale;
uniform float u_noise;
uniform float u_flame;
uniform vec2 u_look;
uniform float u_light;

float flameAt(vec2 dir, float r, float t) {
  vec3 q = vec3(dir * 2.2, r * 3.0 - t) * u_noise;
  float n = hx_vnoise3(q) * 0.6 + hx_vnoise3(q * 2.1 + 7.3) * 0.3 + hx_vnoise3(q * 4.3 - 3.1) * 0.1;
  return n;
}

void main() {
  vec2 uv = hx_centered(gl_FragCoord.xy) * 2.0 / max(u_scale, 0.05);
  float r = length(uv);
  vec2 dir = r > 1e-4 ? uv / r : vec2(0.0, 1.0);
  float t = u_time * u_flame;
  float distanceMask = 1.0 - length(uv);
  float n = flameAt(dir, r, t);
  float flames = smoothstep(0.35, 0.95, n + distanceMask * 0.55) * max(distanceMask + 0.35, 0.0);
  float irisR = 0.3 + 0.04 * (n - 0.5);
  float iris = 1.0 - smoothstep(0.0, max(u_iris, 0.01), abs(r - irisR));
  float streaks = smoothstep(0.45, 0.85, hx_vnoise3(vec3(dir * 5.0, t * 0.4))) * smoothstep(irisR + u_iris, irisR - 0.02, r);
  vec2 pupilUv = (uv - u_look * ${EYE_LOOK_RANGE}) * (0.6 / max(u_pupil, 0.05));
  float pupil = 1.0 - length(pupilUv * vec2(${EYE_PUPIL_SQUASH[0].toFixed(1)}, ${EYE_PUPIL_SQUASH[1].toFixed(1)}));
  float hole = smoothstep(0.0, 0.08, pupil);
  float rim = smoothstep(-0.25, 0.0, pupil) * (1.0 - hole);
  float outerEyeGlow = max(1.0 - length(uv * vec2(${EYE_GLOW_SQUASH[0].toFixed(1)}, ${EYE_GLOW_SQUASH[1].toFixed(1)})), 0.0);
  float energy = (flames * 0.9 + iris * (0.7 + n) + streaks * 0.5 + rim * 0.8) * u_intensity + outerEyeGlow * outerEyeGlow * u_glow * 2.0;
  energy *= 1.0 - hole;
  vec3 hue = mix(u_eye * 0.35, u_eye, smoothstep(0.1, 0.7, energy));
  hue = mix(hue, vec3(1.0), smoothstep(0.9, 2.2, energy) * 0.7);
  vec3 color = mix(u_bg, hue, smoothstep(0.02, 0.82, energy) * 0.96);
  if (u_light > 0.5) color = mix(u_bg, u_eye * 0.55, smoothstep(0.02, 0.82, energy) * 0.9);
  o_color = vec4(color, 1.0);
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
