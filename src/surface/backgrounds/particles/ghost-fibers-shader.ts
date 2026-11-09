// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GhostFibers 条目, 实现为 HX 自有.
// 场景在离屏通道里画, 泛光走 ../bloom.ts 的降采样金字塔.
import { fragmentSource, GLSL_HASH, GLSL_UTIL } from "../../backdrop/kernel";
import { BLOOM_ENCODE, BLOOM_MAX_LEVELS } from "../bloom";

export type FiberStyle = "dots" | "dashes" | "lines";
export type FiberGradient = "depth" | "along" | "across";
export type FiberHover = "focus" | "part" | "none";

export const FIBERS = {
  /** 规格 INTRO_SECONDS / FIBER_STYLES / GRADIENTS / HOVER_EFFECTS. */
  introSeconds: 2.6,
  styles: { dots: 0, dashes: 0.45, lines: 1 } as Readonly<Record<FiberStyle, number>>,
  gradients: { depth: 0, along: 1, across: 2 } as Readonly<Record<FiberGradient, number>>,
  hovers: { focus: 0, part: 1, none: 2 } as Readonly<Record<FiberHover, number>>,
  /** 规格: 帧长上限 0.05s, 纤维流动 dt * flow * 12, 指针 0.08s 跟随, 在场升 0.3s / 落 0.6s. */
  dtCap: 0.05,
  flowRate: 12,
  hoverTau: 0.08,
  presenceIn: 0.3,
  presenceOut: 0.6,
  /** 本库定: 层数与每层纤维数上限, speed=1 对应规格 speed 0.5 的波动速率. */
  maxLayers: 4,
  maxThreads: 256,
  waveRate: 0.5,
  /** 规格 BLOOM_LEVELS 5, 共用金字塔上限 4 级; 规格亮部 smoothstep(0.35, 1.2, peak) 折成软膝阈值 0.775 / 膝 0.425; 泛光强度本库定. */
  bloomLevels: Math.min(5, BLOOM_MAX_LEVELS),
  bloomThreshold: 0.775,
  bloomKnee: 0.425,
  bloomStrength: 0.9,
  /** 规格散景: 失焦量 smoothstep(0.25, 0.7) 混向圆盘, 盘边 0.94 + 0.08 smoothstep(0.55, 0.95, rho) 略亮; 盘半径为线宽倍数 (本库定). */
  bokehRadius: 1.25,
} as const;

/** 纤维推进状态: 流动相位, 滚转相位, 平滑后的指针与在场程度. */
export interface FiberState {
  flow: number;
  roll: number;
  hx: number;
  hy: number;
  presence: number;
  primed: boolean;
}

export function makeFiberState(): FiberState {
  return { flow: 0, roll: 0, hx: 0.5, hy: 0.5, presence: 0, primed: false };
}

/**
 * 推进一帧: 流动相位 += dt * flow * 12, 滚转 += dt * rollSpeed, 指针 0.08s 跟随, 在场程度升 0.3s 落 0.6s.
 * 静态帧 (dt 为 0) 指针与在场直接到位.
 */
export function stepFibers(s: FiberState, dt: number, flow: number, rollSpeed: number, px: number, py: number, inside: boolean): void {
  const h = Math.min(FIBERS.dtCap, Math.max(0, dt));
  s.flow += h * flow * FIBERS.flowRate;
  s.roll += h * rollSpeed;
  const goal = inside ? 1 : 0;
  if (!s.primed || h === 0) {
    [s.hx, s.hy, s.primed] = [px, py, true];
    if (h === 0) s.presence = goal;
    return;
  }
  const k = 1 - Math.exp(-h / FIBERS.hoverTau);
  s.hx += (px - s.hx) * k;
  s.hy += (py - s.hy) * k;
  s.presence += (goal - s.presence) * (1 - Math.exp(-h / (goal > s.presence ? FIBERS.presenceIn : FIBERS.presenceOut)));
}

const FIBERS_BOKEH = FIBERS.bokehRadius.toFixed(2);

const BODY = `
uniform float u_layers;
uniform float u_threads;
uniform float u_waves;
uniform float u_twist;
uniform float u_roll;
uniform float u_flow;
uniform float u_scale;
uniform float u_rot;
uniform float u_volume;
uniform float u_spread;
uniform float u_density;
uniform float u_thick;
uniform float u_style;
uniform float u_tips;
uniform float u_fold;
uniform float u_persp;
uniform float u_dof;
uniform float u_focus;
uniform float u_particles;
uniform float u_intro;
uniform float u_effect;
uniform float u_grad;
uniform float u_wave_t;
uniform vec3 u_hover;
uniform vec3 u_glow;
uniform vec3 u_line;
uniform vec3 u_second;

float hx_mask(float q) {
  float m = fract(q) - 0.5;
  float dots = exp(-m * m / 0.012);
  float dashes = smoothstep(0.3, 0.22, abs(m));
  return u_style < 0.2 ? dots : u_style < 0.7 ? dashes : 1.0;
}

vec3 hx_ribbon(vec2 p, float L, float seedL, out float energy) {
  float n = max(u_threads, 2.0);
  float hw = 0.2 * u_volume;
  float off = (L - (u_layers - 1.0) * 0.5) * 0.2 * u_spread * u_volume;
  float u = p.x;
  float wave = sin(u * u_waves * 2.6 + u_wave_t + L * 1.7) * 0.16 + sin(u * u_waves * 1.1 - u_wave_t * 0.6 + seedL * 6.0) * 0.06;
  float yc = wave + off;
  float phi = u * u_twist * 2.4 + u_roll * 6.2832 + L * 0.9;
  float c = cos(phi);
  float half_ = hw * max(abs(c), 0.004);
  float v = (p.y - yc) / half_ * sign(c + 1e-6);
  float spacing = 2.0 * half_ / (n - 1.0);
  float t = (clamp(v, -1.0, 1.0) + 1.0) * 0.5 * (n - 1.0);
  float k = floor(t + 0.5);
  float vk = k / (n - 1.0) * 2.0 - 1.0;
  float z = hw * sin(phi) * vk;
  float persp = 1.0 / max(0.35, 1.0 - u_persp * z * 2.2);
  float blur = u_dof * smoothstep(0.0, 0.25, abs(z - u_focus * 0.2));
  float w = u_thick * 0.0016 * (1.0 + blur * 3.0) * persp;
  float d = abs(t - k) * spacing;
  float edge = abs(p.y - yc) - half_;
  float inside = 1.0 - smoothstep(0.0, w * 2.0, edge);
  float seed = hx_hash2(vec2(k, L + 3.0));
  float core = exp(-d * d / (w * w));
  float avg = min(3.0, w * 1.77 / spacing * (1.0 + u_fold * 0.6));
  float tw = 0.5 + 0.5 * sin(u_time * (1.0 + seed * 3.0) + seed * 20.0);
  float q = u * u_density * 34.0 - u_flow * (0.6 + seed * 0.8) + seed * 7.0;
  float dense = smoothstep(w * 3.0, w, spacing);
  float mask = mix(hx_mask(q), 1.0, dense);
  float al = u_style < 0.2 ? (fract(q) - 0.5) / max(u_density * 34.0, 0.001) * (1.0 - dense) : 0.0;
  float rho = length(vec2(al, d)) / max(w * ${FIBERS_BOKEH}, 1e-6);
  float bokeh = (1.0 - smoothstep(0.82, 1.0, rho)) * (0.94 + 0.08 * smoothstep(0.55, 0.95, rho)) * (u_style < 0.2 ? 1.0 : mask);
  float shape = mix(core * mask, bokeh, smoothstep(0.25, 0.7, blur));
  float I = mix(avg, shape, smoothstep(w, w * 3.0, spacing)) * inside;
  I *= (0.45 + 0.55 * tw) / (1.0 + blur * 1.5) * mix(0.35, 1.0, seed) * persp;
  float aspectHalf = 0.5 * u_res.x / min(u_res.x, u_res.y);
  float un = u / (2.0 * aspectHalf);
  I *= smoothstep(0.0, 0.12, u_intro * 1.3 - (un + 0.5) - seed * 0.12);
  float tipEnd = mix(4.0, 0.25, clamp(u_tips, 0.0, 1.0)) * aspectHalf;
  I *= smoothstep(tipEnd, tipEnd - 0.12, abs(u));
  float halo = 0.1 * u_fold * exp(-max(edge, 0.0) / 0.05) * (1.0 - abs(c) * 0.6);
  float zt = clamp(z / hw * 0.5 + 0.5 + smoothstep(u_focus, u_focus + 5.0, z * 10.0) * 0.5, 0.0, 1.0);
  float tint = u_grad < 0.5 ? zt : u_grad < 1.5 ? smoothstep(-0.9, 0.9, un * 2.0) : clamp(vk * 0.5 + 0.5, 0.0, 1.0);
  vec3 hue = mix(u_glow, u_second, tint);
  energy = I;
  return hue * (I + halo * smoothstep(0.0, 0.6, u_intro)) + u_line * shape * inside * 0.35 * (1.0 - blur);
}

void main() {
  vec2 p = hx_centered(v_uv * u_res) / max(u_scale, 0.05);
  vec2 m = (u_hover.xy - 0.5) * u_res / min(u_res.x, u_res.y) / max(u_scale, 0.05);
  p = hx_rot(-u_rot) * p;
  m = hx_rot(-u_rot) * m;
  vec2 away = p - m;
  float dist = length(away);
  float radius = 0.35;
  float push = 0.09 * u_hover.z * (1.0 - smoothstep(0.0, radius, dist)) * (u_effect > 0.5 && u_effect < 1.5 ? 1.0 : 0.0);
  p += away / max(dist, 1e-3) * push * smoothstep(0.0, radius * 0.25, dist);
  float focus = u_effect < 0.5 ? 1.0 + 1.1 * u_hover.z * exp(-dist * dist / (radius * radius)) : 1.0;
  vec3 col = vec3(0.0);
  for (int i = 0; i < ${FIBERS.maxLayers}; i++) {
    float L = float(i);
    if (L >= u_layers) break;
    float e;
    col += hx_ribbon(p, L, hx_hash1(L + 0.5), e) * mix(1.0, 0.6, L / max(u_layers - 1.0, 1.0));
  }
  col *= focus;
  vec2 g = p * 26.0 + vec2(u_flow * 0.15, 0.0);
  vec2 id = floor(g);
  vec2 h = hx_hash22(id);
  if (h.x < u_particles * 0.35) {
    vec2 c = id + 0.2 + 0.6 * hx_hash22(id + 9.1);
    float r = mix(0.03, 0.12, h.y);
    float tw = 0.5 + 0.5 * sin(u_time * (1.5 + h.y * 4.0) + h.x * 40.0);
    float spark = exp(-dot(g - c, g - c) / (r * r)) * (0.35 + 0.65 * tw) * mix(0.4, 1.0, h.y) * smoothstep(0.3, 1.0, u_intro);
    col += mix(u_glow, u_second, h.y) * spark * 0.8;
  }
  o_color = bloom_encode(col * 1.3, 1.0);
}
`;

/** 上屏主体: 场景线性光加泛光后再压缩色调, 按峰值出覆盖率 (无泛光时与原上屏一致). */
const COMPOSITE = `
void main() {
  vec3 col = hx_tonemap(bloom_scene(v_uv).rgb + bloom_glow(v_uv));
  float a = clamp(max(col.r, max(col.g, col.b)) * 1.15, 0.0, 1.0);
  o_color = vec4(clamp(col / max(a, 1e-3), 0.0, 1.0), a);
}
`;

/**
 * GhostFibers 的离屏场景片元: 若干层扭转的纤维带, 每层由 threads 根纤维组成, 解析求最近纤维, 折叠处纤维挤密自然发亮;
 * 失焦的点 / 段混向散景圆盘. 以 bloom_encode 写出未压缩的线性光, 由泛光金字塔 (../bloom.ts) 降采样模糊.
 */
export const FIBERS_FRAGMENT = fragmentSource(BODY, GLSL_HASH, GLSL_UTIL, BLOOM_ENCODE);

/**
 * GhostFibers 的上屏片元: 读场景与泛光金字塔合成.
 *
 * @param compositeGlsl bloomPyramid 返回的 compositeGlsl.
 */
export function fibersComposite(compositeGlsl: string): string {
  return fragmentSource(COMPOSITE, GLSL_HASH, GLSL_UTIL, compositeGlsl);
}
