// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Threads 条目, 实现为 HX 自有.
/**
 * Threads 的片元与纯函数: 一束从左侧汇聚点散开的细线, 每条线的纵向位置是 1D 梯度噪声乘振幅包络
 * (split 之前收拢, 之后张开); 越靠外的线越细, 越虚 (blur 随序号增长), 透明度按 pow(perc, 0.3) 收尾 (taper).
 * 覆盖率按 "线宽 / 绘制宽" 守恒, 虚线更宽但更淡. 指针可把线束拨开 (parting).
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel";

/** 线数上限 (本库定; 条目默认 90, 片元逐线求距离). */
export const THREADS_MAX_LINES = 128;
/** 跟手 (条目 follow 1 - exp(-dt * 3)) 与在场 (条目 1 - exp(-dt * 4)) 的时间常数. */
export const THREADS_FOLLOW_TAU = 1 / 3;
export const THREADS_PRESENCE_TAU = 1 / 4;
/** 条目 width = 7 * thickness * pixel * (1 - perc), 这里的 pixel 是设备像素. */
export const THREADS_WIDTH_UNIT = 7;
/** 拨开的半径与最大位移 (画布短边比例, 本库定). */
export const THREADS_PART_RADIUS = 0.18;
export const THREADS_PART_SHIFT = 0.12;

/**
 * 第 i 条线 (perc = i / count) 的透明度: 1 - smoothstep(0, 1, perc^0.3) * taper.
 *
 * @param perc 线序比例 0..1.
 * @param taper 收尾强度.
 */
export function threadAlpha(perc: number, taper: number): number {
  const x = Math.min(Math.max(Math.pow(Math.max(perc, 0), 0.3), 0), 1);
  return 1 - x * x * (3 - 2 * x) * taper;
}

const BODY = `
uniform vec3 u_ink;
uniform vec3 u_accent;
uniform float u_count;
uniform float u_amp;
uniform float u_dist;
uniform float u_thick;
uniform float u_soft;
uniform float u_waves;
uniform float u_split;
uniform float u_fray;
uniform float u_angle;
uniform float u_seed;
uniform vec3 u_part;
uniform float u_taper;
uniform float u_bright;
uniform float u_fade;

void main() {
  float sh = min(u_res.x, u_res.y);
  vec2 c = hx_rot(u_angle) * (gl_FragCoord.xy - 0.5 * u_res) / sh;
  float aspect = max(u_res.x, u_res.y) / sh;
  float x = c.x / aspect + 0.5;
  float y = c.y + 0.5;
  vec2 m = hx_rot(u_angle) * (u_part.xy - 0.5) * u_res / sh;
  float mx = m.x / aspect + 0.5;
  float my = m.y + 0.5;
  float near = exp(-pow((x - mx) * aspect / ${THREADS_PART_RADIUS}, 2.0)) * u_part.z;
  float pixel = 1.0 / sh;
  float t = u_time;
  float ink = 0.0;
  float wsum = 0.0;
  vec3 col = vec3(0.0);
  float envelope = smoothstep(u_split, max(0.7, u_split + 0.2), x);
  for (int i = 0; i < ${THREADS_MAX_LINES}; i++) {
    if (float(i) >= u_count) break;
    float perc = float(i) / max(u_count, 1.0);
    float xnoise = hx_gnoise(vec2(x * u_waves * 2.0 + t * 0.3 + u_seed, perc * u_fray * 6.0 + t * 0.15 + u_seed * 0.37));
    float blur = smoothstep(u_split, u_split + 0.05, x) * perc;
    float ly = 0.5 + (perc - 0.5) * u_dist + xnoise * 0.5 * u_amp * 0.3 * envelope;
    ly += sign(ly - my) * near * ${THREADS_PART_SHIFT} * (1.0 - abs(ly - my));
    float width = ${THREADS_WIDTH_UNIT}.0 * u_thick * pixel * (1.0 - perc) * u_dpr * 0.5 + pixel * 0.5;
    float draw = width + blur * u_soft * 5.0 * pixel;
    float alpha = 1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3)) * u_taper;
    float cover = (1.0 - smoothstep(0.0, draw, abs(y - ly))) * (width / draw) * alpha * 0.7;
    ink = ink + cover * (1.0 - ink);
    col += cover * mix(u_ink, u_accent, perc);
    wsum += cover;
  }
  vec3 base = col / max(wsum, 1e-4);
  float edge = u_fade > 0.0 ? smoothstep(0.0, u_fade, x) * smoothstep(0.0, u_fade, 1.0 - x) : 1.0;
  o_color = vec4(base, clamp(ink * u_bright, 0.0, 1.0) * edge);
}
`;

/** 上屏片元. */
export const THREADS_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
