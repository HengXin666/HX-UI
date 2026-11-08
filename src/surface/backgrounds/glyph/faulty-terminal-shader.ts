// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 FaultyTerminal 条目, 实现为 HX 自有. 着色器源码与常数.
import { fragmentSource, GLSL_HASH, GLSL_NOISE, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { GLSL_GLYPH_KIT } from "./kit";

/** 字形画法编号: 方块, 圆点, 字符图集. */
export const TERMINAL_GLYPHS = { blocks: 0, dots: 1, characters: 2 } as const;
export type TerminalGlyphs = keyof typeof TERMINAL_GLYPHS;
/** 点击效果编号. */
export const TERMINAL_CLICKS = { none: 0, glitch: 1, degauss: 2 } as const;
export type TerminalClick = keyof typeof TERMINAL_CLICKS;

export const FAULTY_TERMINAL = {
  /** 点击效果寿命, 秒: glitch 0.7, degauss 1.6. */
  glitchSeconds: 0.7,
  degaussSeconds: 1.6,
  /** characters 画法的字符 (本库定). */
  characters: "0123456789ABCDEF",
  /** 基础格边长 (CSS 像素) 再除以 scale 与 gridMul (本库定). */
  baseCell: 12,
} as const;

/**
 * 余辉每帧的保留比例: persistence ** (dt * 60), 即按 60 帧每秒折算. dt 为 0 时为 1.
 *
 * @param persistence 余辉 0..1.
 * @param dt 帧长 (秒).
 */
export function phosphorDecay(persistence: number, dt: number): number {
  return Math.max(0, Math.min(1, persistence)) ** (dt * 60);
}

/** 屏幕通道: 平面坐标里画字形格, 与上一帧的余辉取较大者. 输出 r 为亮度, g 为指针辉光. */
export const TERMINAL_SCREEN = fragmentSource(`
uniform sampler2D u_atlas;
uniform sampler2D u_screen;
uniform vec2 u_target_res;
uniform vec2 u_atlas_grid;
uniform float u_glyph_count;
uniform float u_has_atlas;
uniform vec2 u_cell;
uniform float u_digit;
uniform float u_noise_amp;
uniform float u_glyphs;
uniform float u_decay;
uniform float u_scramble;
uniform float u_mouse;
uniform float u_mouse_strength;
uniform float u_mouse_glow;
uniform float u_intro;
uniform float u_flicker;
uniform float u_time_scale;

float field(vec2 p, float t) {
  float f = 0.0;
  float amp = 0.5 * u_noise_amp;
  for (int i = 0; i < 4; i++) {
    f += amp * hx_vnoise(p + vec2(0.0, t));
    p = p * 2.0 + 13.7;
    amp *= 0.5;
  }
  return f;
}

void main() {
  vec2 size = u_cell * u_dpr;
  vec2 frag = gl_FragCoord.xy;
  vec2 cellPx = size;
  vec2 cell = floor(frag / cellPx);
  vec2 local = fract(frag / cellPx);
  float t = u_time * u_time_scale;
  vec2 uv = (cell + 0.5) * cellPx / u_target_res;
  vec2 toPointer = (uv - u_pointer.xy) * u_target_res / min(u_target_res.x, u_target_res.y);
  float near = u_mouse * u_pointer.z * exp(-dot(toPointer, toPointer) / max(u_mouse_strength * u_mouse_strength, 1e-4));
  vec2 p = cell * 0.09 - toPointer * near * 0.5;
  float v = field(p, t);
  float on = smoothstep(0.32, 0.62, v + near * 0.25);
  float rate = 1.2 + near * u_scramble * 18.0;
  float tick = floor(t * rate * 3.0 + hx_hash2(cell) * 7.0);
  float index = floor(hx_hash2(cell + tick * 0.37) * u_glyph_count);
  float shade = 0.35 + 0.65 * hx_hash2(cell + 4.2);
  float flick = 1.0 - u_flicker * 0.25 * hx_hash2(cell + floor(u_time * 15.0));
  float order = hx_hash2(cell + 8.8);
  float cellProgress = clamp((u_intro * 1.3 - order) * 4.0, 0.0, 1.0);
  float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);

  vec2 d = (local - 0.5) * u_digit;
  int mode = int(u_glyphs + 0.5);
  float edge = 1.5 / max(cellPx.x, 1.0);
  float shape;
  if (mode == 1) {
    float radius = 0.36 + 0.06 * on;
    shape = 1.0 - smoothstep(radius - edge, radius + edge, length(d));
  } else if (mode == 2 && u_has_atlas > 0.5) {
    shape = hxg_glyph(u_atlas, u_atlas_grid, index, clamp(d + 0.5, 0.0, 1.0));
  } else {
    vec2 q = abs(d) - 0.4;
    shape = 1.0 - smoothstep(-edge, edge, max(q.x, q.y));
  }
  float lit = shape * on * shade * flick * fadeAlpha;
  vec2 prev = texture(u_screen, gl_FragCoord.xy / u_target_res).rg * u_decay;
  o_color = vec4(max(lit * (1.0 + near * u_mouse_glow * 1.3), prev.r), max(near, prev.g), 0.0, 1.0);
}
`, GLSL_HASH, GLSL_NOISE, GLSL_GLYPH_KIT);

/** 上屏: 桶形弯曲 -> 横向故障位移 -> 色差三采样 -> 辉光 -> 扫描线, 抖动, 暗角 -> 着色. */
export const FAULTY_TERMINAL_FRAGMENT = fragmentSource(`
uniform sampler2D u_screen;
uniform vec3 u_tint;
uniform vec3 u_back;
uniform float u_curvature;
uniform float u_scanline;
uniform float u_glitch;
uniform float u_chroma;
uniform float u_dither;
uniform float u_brightness;
uniform float u_glow;
uniform float u_vignette;
uniform float u_click;
uniform float u_click_life;

vec2 bend(vec2 uv) {
  vec2 c = uv * 2.0 - 1.0;
  c *= 1.0 + u_curvature * 0.25 * dot(c, c);
  return c * 0.5 + 0.5;
}

void main() {
  vec2 uv = bend(v_uv);
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  float t = u_time;
  float y = uv.y;
  float slice = floor(y * 40.0);
  float burst = step(0.92, hx_hash2(vec2(floor(t * 6.0), 1.3)));
  uv.x += u_glitch * burst * (hx_hash2(vec2(slice, floor(t * 24.0))) - 0.5) * 0.04;

  float hit = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_tap_count || u_click < 0.5) break;
    float age = u_taps[i].z / u_click_life;
    if (age >= 1.0) continue;
    float k = 1.0 - age;
    hit = max(hit, k);
    if (u_click < 1.5) {
      float bands = 14.0 + 26.0 * hx_hash2(vec2(float(i), floor(t * 20.0) * 0.37));
      uv.x += k * (hx_hash2(vec2(floor(y * bands), floor(t * 30.0))) - 0.5) * 0.08;
    } else {
      vec2 c = uv - u_taps[i].xy;
      float wobble = sin(length(c) * 40.0 - u_taps[i].z * 18.0) * k * k;
      uv += normalize(c + 1e-4) * wobble * 0.01;
    }
  }

  float off = 0.002 + u_chroma * 0.01 + (u_click > 1.5 ? hit * 0.012 : 0.0);
  float r = texture(u_screen, uv + vec2(off, 0.0)).r;
  float g = texture(u_screen, uv).r;
  float b = texture(u_screen, uv - vec2(off, 0.0)).r;
  vec2 px = 1.5 / u_res;
  float halo = 0.0;
  for (int i = -2; i <= 2; i++) {
    for (int j = -2; j <= 2; j++) {
      halo += texture(u_screen, uv + vec2(float(i), float(j)) * px * 2.0).r;
    }
  }
  halo /= 25.0;
  float pointerGlow = texture(u_screen, uv).g;

  vec3 lum = vec3(r, g, b) + u_glow * halo * 1.4;
  float core = max(lum.r, max(lum.g, lum.b));
  vec3 peak = mix(u_tint, vec3(1.0), 0.45 * smoothstep(0.45, 0.9, core));
  vec3 col = lum * peak * u_brightness;
  col += u_tint * pointerGlow * 0.06;

  float scan = 1.0 - u_scanline * (0.5 + 0.5 * sin(gl_FragCoord.y * HX_PI / max(u_dpr, 1.0)));
  float flick = 1.0 + 0.03 * (hx_hash2(vec2(floor(t * 60.0), 7.3)) - 0.5);
  col *= scan * flick;
  col += u_dither * (hxg_bayer4(gl_FragCoord.xy) - 0.5) / 16.0;
  float edge = 0.04 + 0.22 * u_vignette;
  vec2 fade = smoothstep(vec2(0.0), vec2(edge), uv) * smoothstep(vec2(0.0), vec2(edge), 1.0 - uv);
  col *= fade.x * fade.y * inside;
  o_color = vec4(u_back * (1.0 - clamp(hx_luma(col), 0.0, 1.0)) + col, 1.0);
}
`, GLSL_HASH, GLSL_UTIL, GLSL_GLYPH_KIT);
