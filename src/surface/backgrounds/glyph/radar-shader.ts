// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Radar 条目, 实现为 HX 自有. 着色器源码与常数.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";

/** 显示模式编号: 旋转扫描, 同心脉冲. */
export const RADAR_MODES = { sweep: 0, pulse: 1 } as const;
export type RadarMode = keyof typeof RADAR_MODES;

export const RADAR = {
  /** 目标上限. */
  maxTargets: 16,
  /** 每个目标保留的历史回波数. */
  history: 4,
  /** 入场 (刻度, 辐条, 扫描分段亮起) 时长, 秒. */
  introSeconds: 2.2,
  /** 扫描一圈 (或脉冲一次) 的秒数, 公共 speed 为 1 时 (本库定). */
  periodSeconds: 4,
  /** 俯仰角上限, 度. */
  maxTilt: 70,
} as const;

/**
 * 俯仰换成纵向压缩系数 cos(tilt), tilt 钳在 0..70 度.
 *
 * @param degrees 俯仰角 (度).
 */
export function radarSquash(degrees: number): number {
  const t = Math.max(0, Math.min(RADAR.maxTilt, degrees));
  return Math.cos((t * Math.PI) / 180);
}

/** 上屏: 极坐标网格 (环, 外环, 刻度, 辐条, 正方位, 外圈) -> 扫描或脉冲与拖尾 -> 杂波与目标回波 -> 指针锁定框 -> 着色. */
export const RADAR_FRAGMENT = fragmentSource(`
uniform vec3 u_color;
uniform vec3 u_back;
uniform float u_opaque;
uniform float u_mode;
uniform float u_trail;
uniform float u_scale;
uniform float u_rings;
uniform float u_spokes;
uniform float u_ticks;
uniform float u_targets;
uniform float u_clutter;
uniform float u_glow;
uniform float u_brightness;
uniform float u_grid;
uniform float u_line;
uniform float u_squash;
uniform vec2 u_center;
uniform float u_period;
uniform float u_grain;
uniform float u_fade;
uniform float u_intro;
uniform float u_lock;

float stroke(float d, float w) { return 1.0 - smoothstep(w * 0.5 - 0.5, w * 0.5 + 0.5, d); }

vec2 toDisc(vec2 frag) {
  vec2 q = (frag - u_center * u_res) / (0.5 * min(u_res.x, u_res.y) * u_scale);
  return vec2(q.x, q.y / max(u_squash, 0.2));
}

float turnOf(vec2 q) { return fract(0.25 - atan(q.y, q.x) / HX_TAU); }

float litSince(float turnAt, float rAt, float phase) {
  if (u_mode > 0.5) {
    float behind = phase - rAt;
    return behind < 0.0 ? 0.0 : exp(-behind / max(u_trail, 0.02));
  }
  return exp(-fract(phase - turnAt) / max(u_trail, 0.02));
}

void main() {
  vec2 q = toDisc(gl_FragCoord.xy);
  float r = length(q);
  float turn = turnOf(q);
  float pxR = max(fwidth(r), 1e-4);
  float inside = 1.0 - smoothstep(1.0 - pxR, 1.0 + pxR, r);
  float n = max(1.0, u_rings);

  float arc = smoothstep(0.0, 0.6, u_intro);
  float rings = stroke(abs(fract(r * n + 0.5) - 0.5) / (n * pxR), u_line) * inside * step(0.5 / n, r);
  rings *= 1.0 - smoothstep(arc - 0.01, arc, turn);
  float outerArc = smoothstep(0.1, 0.7, u_intro);
  float outer = stroke(abs(r - 1.0) / pxR, u_line * 1.15) * (1.0 - smoothstep(outerArc - 0.01, outerArc, turn));

  float tickIndex = floor(turn * 360.0 + 0.5);
  float major = 1.0 - step(0.5, mod(tickIndex, 15.0));
  float middle = 1.0 - step(0.5, mod(tickIndex, 5.0));
  float spacing = HX_TAU * r / 360.0 / pxR;
  float len = mix(mix(0.02, 0.035, middle), 0.055, major);
  float ticks = stroke(abs(turn * 360.0 - tickIndex) / 360.0 * HX_TAU * r / pxR, u_line) * step(1.0, r) * step(r, 1.0 + len);
  ticks *= mix(mix(0.42 * smoothstep(2.5, 5.0, spacing), 0.7, middle), 1.0, major) * u_ticks;
  ticks *= smoothstep(0.55, 0.9, u_intro);

  float spokeCoord = turn * max(1.0, u_spokes);
  float spokeIndex = floor(spokeCoord + 0.5);
  float spokes = stroke(abs(spokeCoord - spokeIndex) / max(1.0, u_spokes) * HX_TAU * r / pxR, u_line) * smoothstep(0.05, 0.16, r) * inside;
  float cardinalCoord = turn * 4.0;
  float cardinal = stroke(abs(cardinalCoord - floor(cardinalCoord + 0.5)) / 4.0 * HX_TAU * r / pxR, u_line) * smoothstep(0.02, 0.08, r) * inside;
  float spokesIn = smoothstep(0.35, 0.8, u_intro);
  float bezel = stroke(abs(r - 1.065) / pxR, u_line) * u_ticks * smoothstep(0.6, 0.95, u_intro);
  float grid = (rings * 0.6 + outer + ticks + (spokes * 0.35 + cardinal * 0.6) * spokesIn + bezel * 0.7) * u_grid;

  float phase = fract(u_time / u_period);
  float sweepIn = smoothstep(0.45, 1.0, u_intro);
  float edge;
  float trail = litSince(turn, r, phase * 1.1) * inside;
  if (u_mode > 0.5) {
    edge = stroke(abs(r - phase * 1.1) / pxR, u_line * 1.4) * inside;
  } else {
    float behind = fract(phase - turn);
    edge = stroke(min(behind, 1.0 - behind) * HX_TAU * r / pxR, u_line * 1.4) * smoothstep(0.0, 0.04, r) * inside;
  }
  float fill = trail * 0.11 * (0.35 + 0.65 * smoothstep(0.0, 0.6, r));

  float weather = hx_fbm(q * 2.5 + u_time * 0.02, 4);
  float cluster = smoothstep(0.5, 0.78, weather);
  float density = u_clutter * (0.02 + 0.35 * cluster) * (1.0 - smoothstep(0.55, 1.0, r));
  vec2 bin = vec2(r * 48.0, turn * 220.0);
  vec2 inBin = fract(bin) - 0.5;
  float clutter = step(hx_hash2(floor(bin) + floor(u_time / u_period) * 0.17), density) * (1.0 - smoothstep(0.18, 0.5, length(inBin)));
  float returns = clutter * trail * 0.7;

  vec2 pq = toDisc(u_pointer.xy * u_res);
  float lockOn = u_lock * u_pointer.z * step(length(pq), 1.0);
  float blipPx = 3.5 * u_line;
  for (int i = 0; i < ${RADAR.maxTargets}; i++) {
    if (float(i) >= u_targets) break;
    float fi = float(i);
    vec2 h = hx_hash22(vec2(fi, 4.7));
    for (int k = 0; k < ${RADAR.history}; k++) {
      float tk = u_time - float(k) * u_period;
      float rad = mix(0.18, 0.9, h.x) + 0.04 * sin(tk * 0.07 + fi);
      float ang = h.y * HX_TAU + tk * 0.012 * (hx_hash1(fi) - 0.5);
      vec2 at = rad * vec2(sin(ang), cos(ang));
      float d = length(q - at) / pxR;
      float dot_ = 1.0 - smoothstep(blipPx * 0.5, blipPx, d);
      float seen = litSince(turnOf(at), rad, phase * 1.1);
      float near = 1.0 + lockOn * 1.5 * exp(-dot(at - pq, at - pq) / 0.01);
      returns += dot_ * (k == 0 ? seen : 0.25 * (1.0 - float(k) / ${RADAR.history}.0)) * near;
    }
  }

  float reticle = stroke(abs(length(q - pq) - 0.07) / pxR, u_line) * step(0.5, fract(turnOf(q - pq) * 8.0)) * lockOn;
  float signal = (edge * 0.9 + fill + returns + reticle * 0.7) * sweepIn;
  float lum = grid * 0.55 + signal;
  lum += u_glow * 0.25 * (edge + returns) * sweepIn;
  lum *= u_brightness;
  lum += u_grain * hx_grain(gl_FragCoord.xy, u_time) * step(r, 1.1);
  lum *= u_fade > 0.0 ? 1.0 - smoothstep(1.0 - u_fade, 1.1, r) * u_fade : 1.0;
  lum = max(lum, 0.0);
  vec3 col = u_color * lum + vec3(1.0) * 0.35 * smoothstep(0.8, 1.6, lum);
  o_color = u_opaque > 0.5 ? vec4(u_back + col, 1.0) : vec4(u_color, clamp(lum, 0.0, 1.0));
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
