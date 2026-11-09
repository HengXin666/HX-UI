// 行为规格参照 docs/research/catalog/components-1.md 的 SpecularButton 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格的边缘高光是 WebGL 圆角矩形 SDF 场 (沿周长量弧长); 这里用 CSS conic-gradient 按中心角近似,
// 长宽比大的按钮上高光弧长会沿边略有伸缩. 不走 backdrop kernel 的整幅着色器, 一枚按钮不值一张 WebGL 上下文.

import { cssColorOf } from "../../../surface/backdrop/kernel/color";
import { clamp, DOUBLE, HALF, PERCENT } from "../tokens";

/** 规格 props 的默认值 (颜色 props 换成语义 token, 线宽固定 1px 不暴露). */
export const GLINT_DEFAULTS = {
  intensity: 1,
  idleIntensity: 0.35,
  shineSize: 10,
  shineFade: 34,
  glow: 1,
  speed: 0.35,
  proximity: 250,
  tintOpacity: 0.04,
  blur: 0,
  line: "foreground",
} as const;

/** 指数逼近的速率 (每秒): 高光角度 8, 亮度 7, 按下闪光衰减 5. */
export const GLINT_RATES = { spot: 8, level: 7, press: 5 } as const;
/** 单帧步长上限 (秒), 切回前台不让角度一步跨太远. */
export const GLINT_DT_CAP = 0.05;
/** 静止与减弱动效时高光停的方位 (度, 0 为正上, 顺时针): 左上角. */
export const GLINT_REST_DEG = 315;
/** 按下闪光叠加到亮度上的份额. */
export const GLINT_PRESS_BOOST = 0.5;
/** 外晕: 模糊半径 px 与每单位 glow 的不透明度. */
export const GLINT_GLOW = { blurPx: 6, alpha: 0.6 } as const;
/** 内侧反光在亮度 1 时的混色百分比. */
export const GLINT_SHEEN_PERCENT = 8;
/** 判定落定的角度与亮度阈值. */
export const GLINT_REST_EPS = { deg: 0.05, level: 0.001 } as const;

const FULL_TURN = 360;
const HALF_TURN = 180;
const RAD_TO_DEG = HALF_TURN / Math.PI;

export interface GlintState {
  /** 高光方位, 度, [0, 360). */
  spot: number;
  /** 当前亮度 (未叠闪光). */
  level: number;
  /** 按下闪光, 1 起衰减到 0. */
  press: number;
}

export interface GlintTarget {
  readonly spot: number;
  readonly level: number;
}

export interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** 角度差折到 (-180, 180], 高光走短的一边. */
export function wrapDeg(deg: number): number {
  const turned = (((deg + HALF_TURN) % FULL_TURN) + FULL_TURN) % FULL_TURN;
  return turned - HALF_TURN === -HALF_TURN ? HALF_TURN : turned - HALF_TURN;
}

/** 折到 [0, 360). */
export function normDeg(deg: number): number {
  return ((deg % FULL_TURN) + FULL_TURN) % FULL_TURN;
}

/** 指针相对按钮中心的方位, 与 conic-gradient 同一套: 0 为正上, 顺时针. */
export function pointerDeg(box: Box, x: number, y: number): number {
  const dx = x - (box.left + box.width * HALF);
  const dy = y - (box.top + box.height * HALF);
  return normDeg(Math.atan2(dx, -dy) * RAD_TO_DEG);
}

/** 指针到按钮外沿的距离, 在按钮内为 0. */
export function edgeDistance(box: Box, x: number, y: number): number {
  const dx = Math.max(box.left - x, 0, x - (box.left + box.width));
  const dy = Math.max(box.top - y, 0, y - (box.top + box.height));
  return Math.hypot(dx, dy);
}

/** 距离换亮度: proximity 以外为 idle, 贴近按钮时到 intensity, 中间 smoothstep. */
export function proximityLevel(distance: number, proximity: number, idle: number, intensity: number): number {
  const t = proximity <= 0 ? (distance <= 0 ? 0 : 1) : clamp(distance / proximity, 0, 1);
  const near = 1 - t * t * (3 - DOUBLE * t);
  return idle + (intensity - idle) * near;
}

/** 以速率 rate (每秒) 指数逼近的本帧份额. */
export function follow(rate: number, dt: number): number {
  return 1 - Math.exp(-dt * rate);
}

/** 推进一帧, 原地改 state; 返回是否已落定 (自转时永不落定). */
export function stepGlint(state: GlintState, target: GlintTarget, dtSeconds: number): boolean {
  const dt = clamp(dtSeconds, 0, GLINT_DT_CAP);
  const diff = wrapDeg(target.spot - state.spot);
  state.spot = normDeg(state.spot + diff * follow(GLINT_RATES.spot, dt));
  state.level += (target.level - state.level) * follow(GLINT_RATES.level, dt);
  state.press *= Math.exp(-dt * GLINT_RATES.press);
  return Math.abs(diff) < GLINT_REST_EPS.deg && Math.abs(target.level - state.level) < GLINT_REST_EPS.level && state.press < GLINT_REST_EPS.level;
}

/** 屏上实际亮度: 叠按下闪光, 钳到 [0, 1]. */
export function shownLevel(state: GlintState): number {
  return clamp(state.level + state.press * GLINT_PRESS_BOOST, 0, 1);
}

/** 沿周长的 px 弧长换成中心角 (度). 规格的 shineSize / shineFade 是沿边的像素. */
export function arcDeg(px: number, width: number, height: number): number {
  const perimeter = DOUBLE * (width + height);
  return perimeter > 0 ? clamp((px / perimeter) * FULL_TURN, 0, HALF_TURN) : 0;
}

/** 写到宿主上的 CSS 变量. 所有渐变串都是静态的, 每帧只改这几个数. */
export function glintVars(state: GlintState): Record<string, string> {
  const rad = state.spot / RAD_TO_DEG;
  return {
    "--hx-glint-spot": `${state.spot}deg`,
    "--hx-glint-level": `${shownLevel(state)}`,
    "--hx-glint-x": `${(HALF + HALF * Math.sin(rad)) * PERCENT}%`,
    "--hx-glint-y": `${(HALF - HALF * Math.cos(rad)) * PERCENT}%`,
  };
}

function tint(line: string, percent: string): string {
  return `color-mix(in srgb, ${cssColorOf(line)} ${percent}, transparent)`;
}

/** 边缘高光: 以 spot 为中心, 实心 core 度, 再 fade 度淡出. core 与 fade 由 --hx-glint-core / --hx-glint-fade 给. */
export function ringGradient(line: string): string {
  const lit = tint(line, `calc(var(--hx-glint-level) * ${PERCENT}%)`);
  const core = "var(--hx-glint-core)";
  const edge = "calc(var(--hx-glint-core) + var(--hx-glint-fade))";
  return `conic-gradient(from var(--hx-glint-spot), ${lit} 0deg, ${lit} ${core}, transparent ${edge}, transparent calc(${FULL_TURN}deg - ${edge}), ${lit} calc(${FULL_TURN}deg - ${core}), ${lit} ${FULL_TURN}deg)`;
}

/** 朝高光方向的内侧反光. */
export function sheenGradient(line: string): string {
  const lit = tint(line, `calc(var(--hx-glint-level) * ${GLINT_SHEEN_PERCENT}%)`);
  return `radial-gradient(circle at var(--hx-glint-x) var(--hx-glint-y), ${lit}, transparent ${PERCENT * HALF}%)`;
}

/** 把整块底切成 1px 边框环的遮罩 (只用 alpha, 颜色取任一不透明 token). */
export const RING_MASK = "linear-gradient(var(--foreground) 0 0) content-box, linear-gradient(var(--foreground) 0 0)";
