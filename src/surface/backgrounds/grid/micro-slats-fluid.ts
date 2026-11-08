// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 MicroSlats 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格的流体格是固定 FLUID_SIZE 96 格; 内核的离屏通道只按画布比例缩放, 这里取 FLUID_SCALE 0.05 (长边 1920 设备像素时正好 96 格) 近似.
import { fragmentSource } from "../../backdrop/kernel/glsl";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";

/** 流体规格常数与本库定的系数. */
export const MICRO_SLATS_FLUID = {
  /** 规格的流体格数 (长边参考). */
  size: 96,
  /** 压力 Jacobi 迭代次数. */
  pressureSteps: 16,
  /** 指针推力: 每秒每屏的指针速度换成每帧注入的格速度的增益. */
  splatForce: 6900,
  /** 点击喷出的射流数. */
  splashJets: 3,
  /** 状态缓冲相对画布的缩放 (见文件头 ENGINE-GAP). */
  scale: 0.05,
  /** 速度编码范围 (格每秒), 8 位缓冲也存得下负值. */
  velocityRange: 256,
  /** 压力编码范围. */
  pressureRange: 128,
  /** 涡量编码范围. */
  curlRange: 64,
  /** 指针速度封顶 (屏每秒, 本库定). */
  speedCap: 6,
  /** 射流速度 (格每秒, 本库定). */
  jetSpeed: 140,
  /** swirl 为 1 时的涡量约束强度 (本库定). */
  swirlGain: 24,
  /** 速度的轻阻尼 (每秒, 本库定). */
  drag: 0.6,
} as const;

/** 一帧最多注入的 splat 数: 指针一个加射流. */
export const MAX_SPLATS = 1 + MICRO_SLATS_FLUID.splashJets;

/**
 * 墨迹每帧的留存率: trail 为衰减时间常数 (秒), 0 时立即消失.
 *
 * @param trail 拖尾时长 (秒).
 * @param dt 帧长 (秒).
 */
export function inkKeep(trail: number, dt: number): number {
  if (dt <= 0) return 1;
  return trail <= 0 ? 0 : Math.exp(-dt / trail);
}

/** 跨帧的注入状态. */
export interface SlatFluidDrive {
  seenTap: number;
}

export function createSlatFluidDrive(): SlatFluidDrive {
  return { seenTap: Number.NEGATIVE_INFINITY };
}

/** 本帧注入: splats 为 vec4 列表 (x, y, 加速度 vx, vy 格每秒), ink 为每个 splat 的墨量, radius 为格数. */
export interface SlatSplats {
  readonly splats: Float32Array;
  readonly ink: Float32Array;
  readonly count: number;
  readonly radius: number;
}

/**
 * 推进注入: 指针在场且移动时按速度推一笔, 新点击沿 SPLASH_JETS 个方向喷射流 (起角随点击时刻转动). 静态帧与关闭交互时不注入.
 *
 * @param drive 原地推进的状态.
 * @param frame 内核的这一帧.
 * @param o 是否交互, 推力倍率, 光标半径 (CSS 像素).
 */
export function stepSlatFluid(drive: SlatFluidDrive, frame: Pick<BackdropFrame, "dt" | "fit" | "pointer" | "still">, o: { interactive: boolean; strength: number; size: number }): SlatSplats {
  const splats = new Float32Array(MAX_SPLATS * 4);
  const ink = new Float32Array(MAX_SPLATS);
  const { dt, fit, pointer: p } = frame;
  const cells = fit.scale * MICRO_SLATS_FLUID.scale;
  const radius = Math.max(1, (o.size * cells) / 2);
  let count = 0;
  if (frame.still || dt <= 0 || !o.interactive) return { splats, ink, count, radius };
  const tap = p.taps[p.taps.length - 1];
  if (tap && tap.at > drive.seenTap) {
    drive.seenTap = tap.at;
    for (let j = 0; j < MICRO_SLATS_FLUID.splashJets; j += 1) {
      const a = tap.at * 2.3 + (j / MICRO_SLATS_FLUID.splashJets) * Math.PI * 2;
      const push = MICRO_SLATS_FLUID.jetSpeed * o.strength;
      splats.set([tap.x, tap.y, Math.cos(a) * push, Math.sin(a) * push], count * 4);
      ink[count] = 1;
      count += 1;
    }
  }
  const cap = MICRO_SLATS_FLUID.speedCap;
  const vx = Math.max(-cap, Math.min(cap, p.vx));
  const vy = Math.max(-cap, Math.min(cap, p.vy));
  const speed = Math.hypot(vx, vy);
  if (p.inside && speed > 1e-3 && count < MAX_SPLATS) {
    const gain = MICRO_SLATS_FLUID.splatForce * dt * o.strength * (MICRO_SLATS_FLUID.size / 1000);
    splats.set([p.x, p.y, vx * gain, vy * gain], count * 4);
    ink[count] = Math.min(1, speed * 0.6);
    count += 1;
  }
  return { splats, ink, count, radius };
}

const F = MICRO_SLATS_FLUID;

/** 各通道共用: 编解码, 投影后的速度 (扣掉上一次解出的压力梯度), 高斯 splat. */
export const FLUID_COMMON = `
const float VR = ${F.velocityRange.toFixed(1)};
const float PR = ${F.pressureRange.toFixed(1)};
const float CR = ${F.curlRange.toFixed(1)};
vec2 decV(vec4 c) { return (c.xy - 0.5) * 2.0 * VR; }
vec4 encV(vec2 v) { return vec4(clamp(0.5 + v / (2.0 * VR), 0.0, 1.0), 0.0, 1.0); }
float decP(vec4 c) { return (c.r - 0.5) * 2.0 * PR; }
vec4 encP(float p) { return vec4(clamp(0.5 + p / (2.0 * PR), 0.0, 1.0), 0.0, 0.0, 1.0); }
float decC(vec4 c) { return (c.r - 0.5) * 2.0 * CR; }
vec4 encC(float w) { return vec4(clamp(0.5 + w / (2.0 * CR), 0.0, 1.0), 0.0, 0.0, 1.0); }
vec2 projected(sampler2D vel, sampler2D press, vec2 uv) {
  vec2 px = 1.0 / vec2(textureSize(press, 0));
  float l = decP(texture(press, uv - vec2(px.x, 0.0)));
  float r = decP(texture(press, uv + vec2(px.x, 0.0)));
  float d = decP(texture(press, uv - vec2(0.0, px.y)));
  float u = decP(texture(press, uv + vec2(0.0, px.y)));
  return decV(texture(vel, uv)) - 0.5 * vec2(r - l, u - d);
}
float blob(vec2 uv, vec2 at, float radius, vec2 res) {
  vec2 d = (uv - at) * res;
  return exp(-dot(d, d) / max(radius * radius, 1e-4));
}
`;

/** 涡量: 投影后速度的旋度. */
export const SLAT_CURL_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_vel;
uniform sampler2D u_press;
${FLUID_COMMON}
void main() {
  vec2 px = 1.0 / u_target_res;
  float l = projected(u_vel, u_press, v_uv - vec2(px.x, 0.0)).y;
  float r = projected(u_vel, u_press, v_uv + vec2(px.x, 0.0)).y;
  float b = projected(u_vel, u_press, v_uv - vec2(0.0, px.y)).x;
  float t = projected(u_vel, u_press, v_uv + vec2(0.0, px.y)).x;
  o_color = encC(0.5 * (r - l - t + b));
}
`);

/** 速度: 投影, 自平流, 涡量约束 (swirl), 轻阻尼, splat 注入. */
export const SLAT_VELOCITY_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_vel;
uniform sampler2D u_press;
uniform sampler2D u_curl;
uniform float u_dt;
uniform float u_swirl;
uniform float u_keep_v;
uniform vec4 u_splats[${MAX_SPLATS}];
uniform float u_splat_count;
uniform float u_radius;
${FLUID_COMMON}
void main() {
  vec2 px = 1.0 / u_target_res;
  vec2 v = projected(u_vel, u_press, v_uv);
  vec2 nv = projected(u_vel, u_press, v_uv - u_dt * v * px) * u_keep_v;
  float left = decC(texture(u_curl, v_uv - vec2(px.x, 0.0)));
  float right = decC(texture(u_curl, v_uv + vec2(px.x, 0.0)));
  float bottom = decC(texture(u_curl, v_uv - vec2(0.0, px.y)));
  float top = decC(texture(u_curl, v_uv + vec2(0.0, px.y)));
  float middle = decC(texture(u_curl, v_uv));
  vec2 force = 0.5 * vec2(abs(top) - abs(bottom), abs(right) - abs(left));
  force = force / (length(force) + 0.0001) * u_swirl * middle;
  force.y = -force.y;
  nv += force * u_dt;
  for (int i = 0; i < ${MAX_SPLATS}; i++) {
    if (float(i) >= u_splat_count) break;
    nv += u_splats[i].zw * blob(v_uv, u_splats[i].xy, u_radius, u_target_res);
  }
  o_color = encV(nv);
}
`);

/** 散度. */
export const SLAT_DIVERGENCE_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_vel;
${FLUID_COMMON}
void main() {
  vec2 px = 1.0 / vec2(textureSize(u_vel, 0));
  float l = decV(texture(u_vel, v_uv - vec2(px.x, 0.0))).x;
  float r = decV(texture(u_vel, v_uv + vec2(px.x, 0.0))).x;
  float d = decV(texture(u_vel, v_uv - vec2(0.0, px.y))).y;
  float u = decV(texture(u_vel, v_uv + vec2(0.0, px.y))).y;
  o_color = encP(0.5 * (r - l + u - d));
}
`);

/** 压力: Jacobi 迭代, 以上一帧的解热启动. */
export const SLAT_PRESSURE_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_press;
uniform sampler2D u_div;
${FLUID_COMMON}
void main() {
  vec2 px = 1.0 / u_target_res;
  float l = decP(texture(u_press, v_uv - vec2(px.x, 0.0)));
  float r = decP(texture(u_press, v_uv + vec2(px.x, 0.0)));
  float d = decP(texture(u_press, v_uv - vec2(0.0, px.y)));
  float u = decP(texture(u_press, v_uv + vec2(0.0, px.y)));
  float div = decP(texture(u_div, v_uv));
  o_color = encP((l + r + d + u - div) * 0.25);
}
`);

/** 墨迹: r 为浓度 / 4, 随投影后的速度平流, 按留存率衰减, splat 处补墨. */
export const SLAT_INK_PASS = fragmentSource(`
uniform vec2 u_target_res;
uniform sampler2D u_ink;
uniform sampler2D u_vel;
uniform sampler2D u_press;
uniform float u_dt;
uniform float u_keep;
uniform vec4 u_splats[${MAX_SPLATS}];
uniform float u_splat_ink[${MAX_SPLATS}];
uniform float u_splat_count;
uniform float u_radius;
${FLUID_COMMON}
void main() {
  vec2 px = 1.0 / u_target_res;
  vec2 v = projected(u_vel, u_press, v_uv);
  float level = texture(u_ink, v_uv - u_dt * v * px).r * 4.0 * u_keep;
  for (int i = 0; i < ${MAX_SPLATS}; i++) {
    if (float(i) >= u_splat_count) break;
    level += u_splat_ink[i] * blob(v_uv, u_splats[i].xy, u_radius, u_target_res);
  }
  o_color = vec4(clamp(level, 0.0, 4.0) / 4.0, 0.0, 0.0, 1.0);
}
`);
