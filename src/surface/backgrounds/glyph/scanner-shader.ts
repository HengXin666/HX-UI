// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Scanner 条目, 实现为 HX 自有. 着色器源码与常数.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";

/** 扫描方向编号: 竖线横扫, 横线竖扫, 斜扫. */
export const SCAN_DIRECTIONS = { vertical: 0, horizontal: 1, diagonal: 2 } as const;
export type ScanDirection = keyof typeof SCAN_DIRECTIONS;

export const SCANNER = {
  /** 同时显示的点击回波上限. */
  maxPings: 6,
  /** 入场 (由扫描起点一侧展开) 时长, 秒. */
  introSeconds: 2,
  /** 回波寿命, 秒: exp(-age * 0.9) 到这里已不足 1%. */
  pingSeconds: 5,
  /** 扫描行程 (短边归一化的坐标从 -span 到 span). */
  sweepSpan: 1.3,
  /** 场时钟基准倍率: 上游 speed 默认 0.5, 这里折进着色器, 公共 speed 默认 1. */
  timeBase: 0.5,
} as const;

/** 回波环宽: 0.12 + age * 0.1. */
export function pingWidth(age: number): number {
  return 0.12 + age * 0.1;
}

/** 回波亮度: exp(-age * 0.9) * smoothstep(0, 0.12, age). */
export function pingFade(age: number): number {
  const x = Math.max(0, Math.min(1, age / 0.12));
  return Math.exp(-age * 0.9) * x * x * (3 - 2 * x);
}

/** 上屏: 波形条纹场 -> 扫描线与拖尾 -> 点击回波与指针 -> 入场 -> 三色着色 -> 辉光, 扫描线, 颗粒, 暗角. */
export const SCANNER_FRAGMENT = fragmentSource(`
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_back;
uniform float u_sweep_speed;
uniform float u_sweep_width;
uniform float u_trail;
uniform float u_reverse;
uniform float u_scale;
uniform float u_freq;
uniform float u_ripple;
uniform float u_bands;
uniform float u_line;
uniform float u_glow;
uniform float u_dir;
uniform float u_spread;
uniform float u_brightness;
uniform float u_vignette;
uniform float u_scanline;
uniform float u_grain;
uniform float u_ping_life;
uniform float u_intro;
uniform float u_time_base;

vec2 axes(vec2 p) {
  int d = int(u_dir + 0.5);
  if (d == 1) return vec2(p.y, p.x);
  if (d == 2) return vec2((p.x + p.y) * 0.7071, (p.y - p.x) * 0.7071);
  return p;
}

void main() {
  vec2 p = hx_centered(gl_FragCoord.xy);
  vec2 a = axes(p);
  float coord = a.x;
  float t = u_time * u_time_base;
  vec2 toPointer = p - hx_pointer_centered();
  float near = u_pointer.z * exp(-dot(toPointer, toPointer) / 0.03);

  float warp = sin(coord * u_freq * u_scale * 2.0 + t * 1.3) * u_ripple
    + hx_gnoise(a * u_scale + vec2(t * 0.25, 0.0)) * u_ripple * 0.8;
  float lc = (a.y + warp) * u_bands + near * 1.2;
  float fw = max(fwidth(lc), 1e-4);
  float crowd = smoothstep(0.2, 0.55, fw);
  float dist = abs(lc - floor(lc + 0.5));
  float halfW = 0.5 * u_line * fw;
  float line = 1.0 - smoothstep(halfW, halfW + fw, dist);
  float halo = u_glow * 0.35 * exp(-dist / max(fw * 4.0, 0.02));
  float thread = 0.62 + 0.38 * hx_hash2(vec2(floor(lc + 0.5), 3.7));
  float ink = mix(line + halo, 0.35, crowd) * thread;

  float span = ${SCANNER.sweepSpan};
  float dir = u_reverse > 0.5 ? -1.0 : 1.0;
  float s = (fract(t * u_sweep_speed * 0.5) * 2.0 - 1.0) * span * dir;
  float behind = (s - coord) * dir;
  behind += behind < 0.0 ? 2.0 * span : 0.0;
  float width = max(u_sweep_width * 0.1, 1e-3);
  float u = clamp(1.0 - behind / width, 0.0, 1.0);
  float lead = smoothstep(0.84, 1.0, u);
  float wake = exp(-behind / max(u_trail * 0.6, 0.02));

  float pingLight = 0.0;
  for (int i = 0; i < ${SCANNER.maxPings}; i++) {
    if (float(i) >= u_tap_count) break;
    float age = u_taps[i].z;
    if (age >= u_ping_life) continue;
    vec2 at = (u_taps[i].xy - 0.5) * u_res / min(u_res.x, u_res.y);
    float w = 0.12 + age * 0.1;
    float fade = exp(-age * 0.9) * smoothstep(0.0, 0.12, age);
    float r = abs(length(p - at) - age * 0.55);
    pingLight += (1.0 - smoothstep(0.0, w, r)) * fade;
  }

  float introFront = mix(-span - 0.3, span + 0.4, u_intro) * dir;
  float reveal = 1.0 - smoothstep(introFront - 0.05, introFront + 0.3, coord * dir);
  float base = 0.11 * reveal;
  float lit = ink * (base + wake * 0.9 + pingLight * 0.8 + near * 0.6) * reveal;
  float hue = smoothstep(0.05, 0.75, lit) + u_spread * 0.3 * sin(a.y * 3.0 + coord * 2.0 + t * 0.4);
  vec3 tone = mix(u_c1, u_c2, clamp(hue, 0.0, 1.0));
  vec3 col = tone * lit + u_c3 * lead * (0.25 + ink) * reveal;
  col *= u_brightness;

  float scan = 1.0 - u_scanline * 0.55 * (0.5 + 0.5 * cos(gl_FragCoord.y * HX_TAU / (3.0 * max(u_dpr, 1.0))));
  col *= scan;
  col += u_grain * hx_grain(gl_FragCoord.xy, u_time);
  vec2 v = gl_FragCoord.xy / u_res - 0.5;
  col *= mix(1.0, smoothstep(0.0, 1.0, clamp(1.0 - dot(v, v) * 2.0, 0.0, 1.0)), u_vignette);
  o_color = vec4(u_back + max(col, 0.0), 1.0);
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL);
