// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Topography 条目, 实现为 HX 自有.
import { GLSL_HASH, GLSL_NOISE, GLSL_UTIL, fragmentSource } from "../../backdrop/kernel/glsl";
import { BLOOM_ENCODE } from "../bloom";

/** 视场 (弧度, 半角的正切近似), 长焦压缩出等高线的层叠感. */
export const TOPO_FOV = 0.32;
/** 相机到注视点的距离 (世界单位). */
export const TOPO_ORBIT = 9;
/** 射线最远距离 (世界单位). */
export const TOPO_FAR = 160;
/** 地形最大高度 (elevation 为 1 时). */
export const TOPO_HEIGHT = 1.7;
/** 地形基础频率. */
export const TOPO_FREQUENCY = 0.45;
/** 入场: 地形从平面隆起的秒数. */
export const TOPO_INTRO_SECONDS = 2.8;
/** 同时存活的点击脉冲数. */
export const TOPO_MAX_PULSES = 4;
/** 指针拖尾的采样点数与采样间隔 (秒). */
export const TOPO_TRAIL = 8;
export const TOPO_SAMPLE_SECONDS = 0.08;
/** 点击脉冲的寿命 (秒). */
export const TOPO_PULSE_LIFE = 3;
/** 射线步进步数与二分细化次数. */
export const TOPO_MARCH_STEPS = 96;
export const TOPO_REFINE_STEPS = 5;
/** 泛光: 规格 BLOOM_LEVELS 4; 亮部阈值, 软膝与强度增益本库定, 强度为 glow * 增益. */
export const TOPO_BLOOM = { levels: 4, threshold: 0.2, knee: 0.3, gain: 2 } as const;

export type TopoDirection = "forward" | "backward" | "left" | "right";
/** 地形流动方向. */
export const TOPO_DIRECTIONS: Readonly<Record<TopoDirection, readonly [number, number]>> = { forward: [0, 1], backward: [0, -1], left: [-1, 0], right: [1, 0] };
export type TopoHover = "lift" | "sink" | "none";
/** 指针处地形抬起, 压下, 或不动. */
export const TOPO_HOVER_SIGN: Readonly<Record<TopoHover, number>> = { lift: 1, sink: -1, none: 0 };

/**
 * 入场: 0..1 平滑涨满, 关掉或减弱动效时为 1.
 *
 * @param elapsed 出帧以来的真实秒数.
 * @param intro 是否有入场.
 */
export function topoIntro(elapsed: number, intro: boolean): number {
  if (!intro || !Number.isFinite(elapsed)) return 1;
  const t = Math.min(1, Math.max(0, elapsed / TOPO_INTRO_SECONDS));
  return t * t * (3 - 2 * t);
}

/**
 * 点击脉冲包络: 0.1 秒升起, 再按 exp(-0.9 t) 衰减, 寿命外为 0.
 *
 * @param age 距点击的秒数.
 */
export function topoPulse(age: number): number {
  if (age < 0 || age > TOPO_PULSE_LIFE) return 0;
  return Math.min(1, age / 0.1) * Math.exp(-age * 0.9);
}

/**
 * 拖尾点权重: 寿命 trail * 3 秒内线性衰减, trail 为 0 时没有拖尾.
 *
 * @param age 采样以来的秒数.
 * @param trail trail prop.
 */
export function topoTrailWeight(age: number, trail: number): number {
  const life = trail * 3;
  if (life <= 0 || age < 0 || age >= life) return 0;
  return 1 - age / life;
}

/**
 * 斜视地形的离屏场景: 分形高度场射线步进求交, 等高线按屏幕导数定宽, 景深加宽, 过密处淡出, 主等高线加粗, 远处雾化.
 * 写出线性线光 u_color * ink 与覆盖率 clamp(ink) (bloom_encode), 未命中处为 0. 须以画布原尺寸 (sceneScale 1) 跑, 片元坐标与 u_res 同尺度.
 */
export const TOPO_SCENE = fragmentSource(`
uniform vec3 u_color;
uniform float u_lines;
uniform float u_width;
uniform float u_major;
uniform float u_elev;
uniform float u_scale;
uniform float u_detail;
uniform float u_tilt;
uniform vec2 u_flow;
uniform float u_morph;
uniform float u_dof;
uniform float u_fog;
uniform float u_front;
uniform float u_bright;
uniform vec2 u_look;
uniform vec4 u_hover;
uniform vec4 u_marks[${TOPO_TRAIL}];
uniform vec4 u_pulses[${TOPO_MAX_PULSES}];

const float ORBIT = ${TOPO_ORBIT.toFixed(1)};
const float FAR = ${TOPO_FAR.toFixed(1)};
const float HEIGHT = ${TOPO_HEIGHT};
const float FREQ = ${TOPO_FREQUENCY};
vec2 gMarks[${TOPO_TRAIL}];
vec2 gPulses[${TOPO_MAX_PULSES}];
vec2 gCursor;

vec3 camRay(vec2 frag, out vec3 ro) {
  float a = radians(u_tilt) + u_look.y;
  ro = vec3(sin(u_look.x) * ORBIT, -cos(a) * ORBIT, sin(a) * ORBIT);
  vec3 fwd = normalize(vec3(0.0, 0.0, HEIGHT * 0.4) - ro);
  vec3 right = normalize(cross(fwd, vec3(0.0, 0.0, 1.0)));
  vec3 up = cross(right, fwd);
  vec2 p = (frag - 0.5 * u_res) / u_res.y;
  return normalize(fwd + (right * p.x + up * p.y) * ${TOPO_FOV} * 2.0);
}

vec2 onGround(vec2 frag) {
  vec3 ro;
  vec3 rd = camRay(frag, ro);
  float t = (HEIGHT * 0.4 * u_elev - ro.z) / min(rd.z, -1e-3);
  return (ro + rd * t).xy;
}

float bump(vec2 p, vec2 c, float r) {
  vec2 d = p - c;
  return exp(-dot(d, d) / (r * r));
}

float terrain(vec2 p) {
  vec2 q = (p + u_flow) * FREQ * u_scale;
  float m = u_time * u_morph * 0.3;
  float h = hx_vnoise3(vec3(q, m)) * 0.62 + hx_vnoise3(vec3(q * 2.07 + 5.2, m * 1.3)) * 0.26 + u_detail * 0.4 * (hx_vnoise(q * 4.6 - 3.1) - 0.5);
  h *= HEIGHT * u_elev;
  float lift = u_hover.z * bump(p, gCursor, u_hover.w);
  for (int i = 0; i < ${TOPO_TRAIL}; i++) if (u_marks[i].z > 0.0) lift += u_hover.z * u_marks[i].z * 0.6 * bump(p, gMarks[i], u_hover.w * 0.8);
  for (int i = 0; i < ${TOPO_MAX_PULSES}; i++) {
    if (u_pulses[i].w <= 0.0) continue;
    float ring = length(p - gPulses[i]) - u_pulses[i].z * 3.0;
    lift += u_pulses[i].w * 0.6 * exp(-ring * ring * 2.0);
  }
  return h + lift;
}

float smoother(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

void main() {
  gCursor = onGround(u_hover.xy * u_res);
  for (int i = 0; i < ${TOPO_TRAIL}; i++) gMarks[i] = onGround(u_marks[i].xy * u_res);
  for (int i = 0; i < ${TOPO_MAX_PULSES}; i++) gPulses[i] = onGround(u_pulses[i].xy * u_res);
  vec3 ro;
  vec3 rd = camRay(gl_FragCoord.xy, ro);
  float t = 0.0;
  float lo = 0.0;
  bool hit = false;
  for (int i = 0; i < ${TOPO_MARCH_STEPS}; i++) {
    vec3 p = ro + rd * t;
    float gap = p.z - terrain(p.xy);
    if (gap < 0.0) { hit = true; break; }
    lo = t;
    t += max(gap * 0.6, 0.02 + t * 0.004);
    if (t > FAR) break;
  }
  if (!hit) { o_color = bloom_encode(vec3(0.0), 0.0); return; }
  float hi = t;
  for (int k = 0; k < ${TOPO_REFINE_STEPS}; k++) {
    float mid = 0.5 * (lo + hi);
    vec3 p = ro + rd * mid;
    if (p.z < terrain(p.xy)) hi = mid; else lo = mid;
  }
  vec3 pos = ro + rd * hi;
  float depth = hi;
  float h = terrain(pos.xy);
  float e = 0.02;
  vec3 n = normalize(vec3(h - terrain(pos.xy + vec2(e, 0.0)), h - terrain(pos.xy + vec2(0.0, e)), e));
  float f = h / (HEIGHT * max(u_elev, 0.05)) * u_lines;
  float density = fwidth(f);
  float soft = 1.0 + min(u_dof * 3.0 * abs(1.0 - ORBIT / depth), 4.0);
  float idx = floor(f + 0.5);
  float major = u_major * step(abs(mod(idx, 5.0)), 0.5);
  float width = u_width * u_dpr * 0.5 * (1.0 + 0.8 * major);
  float d = abs(fract(f + 0.5) - 0.5) / max(density, 1e-4);
  float line = (1.0 - smoothstep(width * soft - 0.5, width * soft + 0.75, d)) / soft;
  float crowd = smoothstep(0.3, 0.75, density * max(width, soft));
  line *= 1.0 - crowd * 0.85;
  float sun = max(dot(n, normalize(vec3(-0.4, 0.5, 0.75))), 0.0);
  float level = mix(0.45, 1.05, smoothstep(0.0, 1.1, h)) * mix(0.35, 1.25, sun * sun) * (1.0 + 0.6 * major);
  vec2 fade = vec2(ORBIT * (1.0 + 1.5 * (1.0 - u_fog)), ORBIT * (2.0 + 10.0 * (1.0 - u_fog)));
  float far = 1.0 - smoother((depth - fade.x) / max(fade.y - fade.x, 1e-3));
  float near = mix(1.0, smoothstep(ORBIT * 0.55, ORBIT * 0.95, depth), clamp(u_front * 2.0, 0.0, 1.0));
  float ink = line * level * far * near * u_bright;
  o_color = bloom_encode(u_color * ink, clamp(ink, 0.0, 1.0));
}
`, GLSL_HASH, GLSL_NOISE, GLSL_UTIL, BLOOM_ENCODE);

/** 上屏: 底色上按覆盖率铺线色, 线光过 1 的部分按 0.3 溢出, 再加泛光. */
const TOPO_COMPOSITE = `
uniform vec3 u_color;
uniform vec3 u_bg;
void main() {
  vec4 s = bloom_scene(v_uv);
  vec3 over = max(s.rgb - u_color * s.a, 0.0) * 0.3;
  o_color = vec4(mix(u_bg, u_color, s.a) + over + bloom_glow(v_uv), 1.0);
}
`;

/**
 * Topography 的上屏片元.
 *
 * @param compositeGlsl bloomPyramid 返回的 compositeGlsl.
 */
export function topoComposite(compositeGlsl: string): string {
  return fragmentSource(TOPO_COMPOSITE, compositeGlsl);
}
