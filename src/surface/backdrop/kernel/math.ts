// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.

/** 设备像素比上限: 高分屏按 2 倍渲染, 再高只多耗填充率, 背景场肉眼看不出差别. */
export const BACKDROP_DPR_CAP = 2;
/** 画布最长边 (设备像素) 上限, 超大屏按比例降采样. */
export const BACKDROP_MAX_EDGE = 2400;
/** 单帧步长上限 (秒): 切回前台或掉帧后不让积分一步跨太远. */
export const BACKDROP_DT_CAP = 0.05;
/** 减弱动效时那一帧静态画面取的时刻 (秒), 避开 t=0 时多数场还没展开的样子. */
export const BACKDROP_STILL_TIME = 8;
/** 毫秒换秒. */
export const MS_PER_S = 1000;

/** 钳到 [lo, hi]. */
export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** 线性插值. */
export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 与 GLSL 同义的 smoothstep, 给 JS 侧的入场与包络用. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0 || Number.EPSILON), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * 实际使用的像素比: 取设备值与上限的较小者. 非有限值或不大于 0 时按 1, 防止画布被设成 0 像素.
 *
 * @param device 设备像素比, 通常是 window.devicePixelRatio.
 * @param cap 上限, 默认 BACKDROP_DPR_CAP; 用户传的 dpr prop 也走这里.
 */
export function clampDpr(device: number | undefined, cap: number = BACKDROP_DPR_CAP): number {
  const safeDevice = Number.isFinite(device) && device > 0 ? device : 1;
  const safeCap = Number.isFinite(cap) && cap > 0 ? cap : BACKDROP_DPR_CAP;
  return Math.min(safeDevice, safeCap);
}

export interface CanvasFit {
  /** 设备像素宽. */
  readonly width: number;
  /** 设备像素高. */
  readonly height: number;
  /** 最终每 CSS 像素对应的设备像素, 降采样后可能小于 dpr. */
  readonly scale: number;
}

/**
 * CSS 尺寸换算成画布的设备像素尺寸, 最长边不超过 maxEdge, 至少 1 像素.
 *
 * @param cssWidth 容器 CSS 宽.
 * @param cssHeight 容器 CSS 高.
 * @param dpr 已钳过的像素比.
 * @param maxEdge 最长边上限.
 */
export function fitCanvas(cssWidth: number, cssHeight: number, dpr: number, maxEdge: number = BACKDROP_MAX_EDGE): CanvasFit {
  const longest = Math.max(cssWidth, cssHeight) * dpr;
  const scale = longest > maxEdge ? (dpr * maxEdge) / longest : dpr;
  return {
    width: Math.max(1, Math.round(cssWidth * scale)),
    height: Math.max(1, Math.round(cssHeight * scale)),
    scale,
  };
}

/**
 * 一阶指数逼近: 每帧向目标走 1 - exp(-dt / tau). 与帧率无关, 目标随时可换, 不跳变.
 *
 * @param current 当前值.
 * @param target 目标值.
 * @param dt 帧长 (秒).
 * @param tau 时间常数 (秒), 不大于 0 时直接落到目标.
 */
export function approach(current: number, target: number, dt: number, tau: number): number {
  if (tau <= 0) return target;
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

/** 帧长毫秒换成秒并钳到 [0, BACKDROP_DT_CAP]. */
export function frameSeconds(dtMs: number): number {
  return clamp(dtMs / MS_PER_S, 0, BACKDROP_DT_CAP);
}

/** 由字符串得到稳定的 0..1 种子, 给需要 seed prop 的场用. */
export function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
