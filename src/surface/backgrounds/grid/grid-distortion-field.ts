// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GridDistortion 条目, 实现为 HX 自有.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel/glsl";
import { clamp } from "../../backdrop/kernel/math";

/** 规格常数与本库定的系数. */
export const GRID_DISTORTION = {
  /** 指针速度折算成位移的增益. */
  gain: 18,
  /** 点击涟漪寿命 (秒). */
  rippleLife: 1.6,
  /** 图像揭开时长 (秒). */
  revealSeconds: 0.6,
  /** 静止后幽灵晃动退去的速度倍数. */
  phantomFall: 3,
  /** 位移场量程 (uv), 打包成 8 位时用. */
  range: 0.25,
  /** 8 位零点. */
  zero: 127,
} as const;

/** 指针扰动方式: 拖拽 (顺速度), 推开 (径向), 旋涡 (切向). */
export const DISTORT_MODES = { drag: 0, push: 1, swirl: 2 } as const;
export type DistortMode = keyof typeof DISTORT_MODES;

/** 粗网格位移场 (uv 单位), 一格一组 (dx, dy). */
export interface DistortField {
  cols: number;
  rows: number;
  data: Float32Array;
  phantom: number;
}

/**
 * 按画布宽高比建场: 横向 grid 格, 纵向按比例取整, 格子近似正方.
 *
 * @param grid 横向格数.
 * @param aspect 宽 / 高.
 */
export function makeField(grid: number, aspect: number): DistortField {
  const cols = Math.max(2, Math.round(grid));
  const rows = Math.max(2, Math.round(cols / Math.max(aspect, 1e-3)));
  return { cols, rows, data: new Float32Array(cols * rows * 2), phantom: 0 };
}

export interface DistortInput {
  readonly mode: DistortMode;
  /** 指针 uv (y 朝上) 与速度 (uv 每秒); 不在场时 null. */
  readonly pointer: { readonly x: number; readonly y: number; readonly vx: number; readonly vy: number } | null;
  readonly radius: number;
  readonly strength: number;
  readonly relaxation: number;
  readonly aspect: number;
}

/**
 * 推进位移场一帧: 先按 relaxation^(dt * 60) 回弹, 再把指针速度按方式与距离衰减写进格子. 静止时幽灵量上升, 动起来按 3 倍速退去.
 *
 * @param f 原地修改的场.
 * @param dt 帧长 (秒), 0 时不动.
 * @param input 本帧输入.
 */
export function stepField(f: DistortField, dt: number, input: DistortInput): void {
  if (dt <= 0) return;
  const decay = Math.pow(clamp(input.relaxation, 0, 1), dt * 60);
  for (let k = 0; k < f.data.length; k += 1) f.data[k] *= decay;
  const p = input.pointer;
  const speed = p ? Math.hypot(p.vx, p.vy) : 0;
  const resting = speed < 0.02;
  f.phantom = clamp(f.phantom + (resting ? dt : -dt * GRID_DISTORTION.phantomFall), 0, 1);
  if (!p || resting || input.radius <= 0) return;
  for (let j = 0; j < f.rows; j += 1) {
    for (let i = 0; i < f.cols; i += 1) {
      const dx = (i + 0.5) / f.cols - p.x;
      const dy = ((j + 0.5) / f.rows - p.y) / input.aspect;
      const d = Math.hypot(dx, dy);
      if (d >= input.radius) continue;
      const fall = 1 - d / input.radius;
      const amount = fall * fall * input.strength * GRID_DISTORTION.gain * dt;
      const at = (j * f.cols + i) * 2;
      let ax = p.vx;
      let ay = p.vy;
      if (input.mode === "push" || input.mode === "swirl") {
        const n = d > 1e-4 ? [dx / d, (dy * input.aspect) / d] : [0, 0];
        [ax, ay] = input.mode === "push" ? [-n[0] * speed, -n[1] * speed] : [-n[1] * speed, n[0] * speed];
      }
      f.data[at] = clamp(f.data[at] + ax * amount, -GRID_DISTORTION.range, GRID_DISTORTION.range);
      f.data[at + 1] = clamp(f.data[at + 1] + ay * amount, -GRID_DISTORTION.range, GRID_DISTORTION.range);
    }
  }
}

/**
 * 场打包成 RGBA8 (R G 为位移, 零点 127, 量程 range), 行序自上而下, 内核上传时翻转 Y.
 *
 * @param f 场.
 * @param out 目标字节, 长度 cols * rows * 4.
 */
export function packField(f: DistortField, out: Uint8ClampedArray): void {
  for (let j = 0; j < f.rows; j += 1) {
    for (let i = 0; i < f.cols; i += 1) {
      const at = (j * f.cols + i) * 2;
      const o = ((f.rows - 1 - j) * f.cols + i) * 4;
      out[o] = Math.round(GRID_DISTORTION.zero + (f.data[at] / GRID_DISTORTION.range) * GRID_DISTORTION.zero);
      out[o + 1] = Math.round(GRID_DISTORTION.zero + (f.data[at + 1] / GRID_DISTORTION.range) * GRID_DISTORTION.zero);
      out[o + 2] = GRID_DISTORTION.zero;
      out[o + 3] = 255;
    }
  }
}

/**
 * 上屏: 图像 (或无图时两色渐变底加细网格) 按位移场偏移采样. softness 在块状 (逐格取值) 与平滑 (双线性) 之间混,
 * chroma 让三通道错开, idle 时整场缓慢晃动, 点击打出涟漪, reveal 控制揭开.
 */
const BODY = `
uniform sampler2D u_field;
uniform sampler2D u_image;
uniform vec2 u_grid;
uniform vec2 u_cover;
uniform float u_has_image;
uniform float u_softness;
uniform float u_chroma;
uniform float u_idle;
uniform float u_phantom;
uniform float u_ripple;
uniform float u_reveal;
uniform vec3 u_from;
uniform vec3 u_to;
uniform vec3 u_line;
const float ZERO = ${GRID_DISTORTION.zero}.0 / 255.0;
const float RANGE = ${GRID_DISTORTION.range};

vec2 field_at(vec2 uv) {
  vec2 cell = clamp(floor(uv * u_grid), vec2(0.0), u_grid - 1.0);
  vec2 blocky = texelFetch(u_field, ivec2(cell), 0).xy;
  vec2 smooth_ = texture(u_field, uv).xy;
  return (mix(blocky, smooth_, u_softness) - ZERO) / ZERO * RANGE;
}

vec3 base_at(vec2 uv) {
  if (u_has_image > 0.5) return texture(u_image, (uv - 0.5) * u_cover + 0.5).rgb;
  vec2 cells = uv * u_grid;
  vec2 g = abs(fract(cells) - 0.5);
  float line = 1.0 - smoothstep(0.47, 0.5, max(g.x, g.y));
  vec3 tone = mix(u_from, u_to, clamp(uv.x * 0.6 + uv.y * 0.4, 0.0, 1.0));
  return mix(tone, u_line, (1.0 - line) * 0.35);
}

void main() {
  vec2 uv = v_uv;
  vec2 shift = field_at(uv);
  vec2 cell = floor(uv * u_grid);
  float wob = hx_hash2(cell) * HX_TAU;
  shift += u_idle * u_phantom * 0.006 * vec2(sin(u_time * 0.9 + wob), cos(u_time * 0.7 + wob * 1.3));
  float aspect = u_res.x / u_res.y;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_tap_count || u_ripple < 0.5) break;
    vec4 tap = u_taps[i];
    float age = tap.z;
    if (age > ${GRID_DISTORTION.rippleLife.toFixed(2)}) continue;
    vec2 d = (uv - tap.xy) * vec2(aspect, 1.0);
    float r = length(d);
    float front = age * 0.6;
    float life = 1.0 - age / ${GRID_DISTORTION.rippleLife.toFixed(2)};
    float wave = sin((r - front) * 40.0) * exp(-abs(r - front) * 14.0) * life * life;
    shift += (r > 1e-4 ? d / r : vec2(0.0)) / vec2(aspect, 1.0) * wave * 0.02;
  }
  vec2 at = uv - shift;
  vec3 c = base_at(at);
  if (u_chroma > 0.0) {
    c.r = base_at(at - shift * u_chroma).r;
    c.b = base_at(at + shift * u_chroma).b;
  }
  float reveal = smoothstep(0.0, 1.0, u_reveal * 1.4 - length(uv - 0.5) * 0.8);
  o_color = vec4(c, reveal);
}
`;

/** GridDistortion 的完整片元源码. */
export const GRID_DISTORTION_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL);

/**
 * 图像按 cover 铺满画布时的 uv 缩放 (中心对齐).
 *
 * @param canvasAspect 画布宽 / 高.
 * @param imageAspect 图像宽 / 高.
 */
export function coverScale(canvasAspect: number, imageAspect: number): readonly [number, number] {
  if (!(imageAspect > 0) || !(canvasAspect > 0)) return [1, 1];
  return canvasAspect > imageAspect ? [1, imageAspect / canvasAspect] : [canvasAspect / imageAspect, 1];
}
