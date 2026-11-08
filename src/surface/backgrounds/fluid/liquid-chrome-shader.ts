// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LiquidChrome 条目, 实现为 HX 自有.
import { GLSL_HASH, GLSL_UTIL, fragmentSource } from "../../backdrop/kernel/glsl";

/** 涟漪模拟格子边长 (CSS 像素), 状态缓冲按 1 / SIM_CELL 缩放. */
export const CHROME_SIM_CELL = 4;
/** 模拟步长 1/120 秒, 60 帧下每帧走两步. */
export const CHROME_SIM_STEPS = 2;
/** 入场: 振幅从 0 涨满所需秒数. */
export const CHROME_INTRO_SECONDS = 1.8;
/** 涟漪每步保留的能量. */
export const CHROME_RIPPLE_DAMP = 0.985;
/** 指针拖动注入的基础强度, 按归一化速度缩放后封顶. */
export const CHROME_DRAG_GAIN = 0.035;
/** 点击注入的强度. */
export const CHROME_TAP_GAIN = 0.6;
/** 涟漪源半径 (占短边). */
export const CHROME_DROP_RADIUS = 0.025;
/** 速度封顶 (归一化坐标每秒), 免得甩一下就满屏. */
export const CHROME_SPEED_CAP = 3;

/**
 * 入场进度: 0..1, 线性涨满, 关掉 intro 或减弱动效时直接为 1.
 *
 * @param elapsed 出帧以来的真实秒数.
 * @param intro 是否有入场.
 */
export function chromeIntro(elapsed: number, intro: boolean): number {
  if (!intro || !Number.isFinite(elapsed)) return 1;
  return Math.min(1, Math.max(0, elapsed / CHROME_INTRO_SECONDS));
}

/**
 * 拖动注入强度: 速度越快越强, 封顶后不再涨.
 *
 * @param speed 指针速度 (归一化坐标每秒).
 * @param strength rippleStrength prop.
 */
export function chromeDragPush(speed: number, strength: number): number {
  return CHROME_DRAG_GAIN * Math.min(speed, CHROME_SPEED_CAP) * strength;
}

/** 涟漪状态: r 当前高度, g 上一步高度, 都按 0.5 + 0.5h 编码, 8 位缓冲也存得下负值. */
export const CHROME_WAVE_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_wave;
uniform vec4 u_drop;
uniform float u_damp;
float dec(float v) { return v * 2.0 - 1.0; }
float hgt(vec2 uv) { return dec(texture(u_wave, uv).r); }
void main() {
  vec2 px = 1.0 / u_target_res;
  vec4 here = texture(u_wave, v_uv);
  float h = dec(here.r);
  float prev = dec(here.g);
  float around = hgt(v_uv + vec2(px.x, 0.0)) + hgt(v_uv - vec2(px.x, 0.0)) + hgt(v_uv + vec2(0.0, px.y)) + hgt(v_uv - vec2(0.0, px.y));
  float next = (around * 0.5 - prev) * u_damp;
  vec2 aspect = vec2(u_target_res.x / min(u_target_res.x, u_target_res.y), u_target_res.y / min(u_target_res.x, u_target_res.y));
  float d = length((v_uv - u_drop.xy) * aspect);
  next += u_drop.w * exp(-d * d / max(u_drop.z * u_drop.z, 1e-6));
  next = clamp(next, -1.0, 1.0);
  o_color = vec4(0.5 + 0.5 * next, 0.5 + 0.5 * h, 0.0, 1.0);
}
`);

/** 上屏: 多层正弦扭曲出的液面, 斜率当法线, 反射一个摄影棚式的环境, 叠指针涟漪. */
export const CHROME_FRAGMENT = fragmentSource(`
uniform sampler2D u_wave;
uniform vec3 u_tint;
uniform vec3 u_bg;
uniform float u_amp;
uniform vec2 u_freq;
uniform float u_detail;
uniform float u_thick;
uniform float u_depth;
uniform float u_rough;
uniform float u_exposure;
uniform float u_ripple_size;
uniform float u_tilt;
uniform float u_intro;
uniform float u_light;

float surfaceAt(vec2 p, float t) {
  vec2 q = p;
  float h = 0.0;
  for (float i = 1.0; i < 9.0; i++) {
    if (i > u_detail) break;
    q += u_amp * u_intro * vec2(sin(q.y * u_freq.y * 0.5 * i + t * (0.5 + 0.13 * i)), cos(q.x * u_freq.x * 0.5 * i - t * (0.45 + 0.11 * i))) / i;
    h += sin(q.x * u_freq.x + q.y * u_freq.y * 0.5 + t) / (i + 1.0);
  }
  return h * u_thick;
}

float envAt(vec3 dir) {
  float rise = smoothstep(-1.0, 1.0, dir.y);
  float lobe = smoothstep(0.15, 0.85, 0.5 + 0.5 * sin(atan(dir.y, dir.x) * 2.0 + 0.9));
  float streak = smoothstep(0.2, 0.8, 0.5 + 0.5 * sin(atan(dir.y, dir.x) * 3.0 + 0.6));
  float softbox = smoothstep(0.35, 0.8, dir.y) * (0.9 + 1.5 * lobe);
  float horizon = exp(-abs(dir.y - 0.05) * 14.0) * (0.6 + 0.6 * streak);
  float floorDark = mix(0.02, 0.25, rise);
  return floorDark + softbox + horizon;
}

void main() {
  vec2 p = hx_centered(gl_FragCoord.xy) * 2.0;
  float t = u_time;
  float e = 0.004;
  float h = surfaceAt(p, t);
  float hx = surfaceAt(p + vec2(e, 0.0), t);
  float hy = surfaceAt(p + vec2(0.0, e), t);
  vec2 slope = vec2(hx - h, hy - h) / e * 0.12 * u_depth;
  vec2 cell = u_ripple_size / vec2(textureSize(u_wave, 0));
  float wl = texture(u_wave, v_uv - vec2(cell.x, 0.0)).r;
  float wr = texture(u_wave, v_uv + vec2(cell.x, 0.0)).r;
  float wd = texture(u_wave, v_uv - vec2(0.0, cell.y)).r;
  float wu = texture(u_wave, v_uv + vec2(0.0, cell.y)).r;
  slope += vec2(wr - wl, wu - wd) * 6.0;
  vec3 n = normalize(vec3(-slope, 1.0));
  vec3 view = normalize(vec3(0.0, -0.35 * u_tilt, 1.0));
  vec3 r = reflect(-view, n);
  float level = 0.0;
  for (float k = -0.375; k < 0.4; k += 0.25) {
    vec3 jitter = vec3(hx_hash2(gl_FragCoord.xy + k * 17.0) - 0.5, k, 0.0) * u_rough * 0.6;
    level += envAt(normalize(r + jitter));
  }
  level *= 0.25 * u_exposure;
  float fres = pow(1.0 - max(dot(n, view), 0.0), 5.0);
  vec3 f0 = mix(vec3(1.0), u_tint, smoothstep(0.05, 0.6, length(slope))) * 0.92;
  vec3 spec = f0 + (1.0 - f0) * fres;
  vec3 lit = hx_tonemap(spec * u_tint * level * 1.4);
  vec3 col = u_light > 0.5 ? u_bg * (0.4 + 0.6 * min(level, 1.3)) : mix(u_bg, lit, u_intro);
  o_color = vec4(col, 1.0);
}
`, GLSL_HASH, GLSL_UTIL);
