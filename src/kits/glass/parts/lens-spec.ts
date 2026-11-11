/**
 * LensGlass 的规格常数与纯函数: 形状几何, 拉伸与倾斜目标, 闲置漂移, 跟随系数.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-glass.md
 */
import { TAU, clamp, omegaSpring } from "../../tokens";

export type LensShape = "lens" | "blob" | "cube" | "pill" | "torus" | "prism" | "diamond";
export type LensInteraction = "follow" | "drag" | "static";

export const LENS_DEFAULTS = { size: 260, text: "Look closer.", fontWeight: 600, refraction: 1, reflection: 1, frost: 0, tint: 0, shadow: 0.5, smoothness: 0.5, wobble: 0.5, spin: 0.3 } as const;
/** 各形状的外延比例 (FluidGlass.jsx:9 EXTENT). */
export const LENS_EXTENT: Readonly<Record<LensShape, number>> = { lens: 1.02, blob: 1.08, cube: 1.32, pill: 1.02, torus: 1.0, prism: 1.18, diamond: 1.05 };
/** 弹簧细分步长 1/240 s, 帧间隔上限 0.05 s, 落定阈值 0.0005 / 0.002 (FluidGlass.jsx:938-965). craft 弹簧自带细分与落定, 这里只记上限. */
export const LENS_MAX_DT_S = 0.05;
/** 按下时 vstretch -= 2.5 × wobble (FluidGlass.jsx:983). */
export const LENS_PRESS_KICK = 2.5;
/**
 * 拉伸, 倾斜, 显隐三组弹簧. 规格以 omega / zeta 积分但未摘录数值, HX 自定:
 * 拉伸偏软带晃 (2pi × 2.2, zeta 0.42), 倾斜 (2pi × 1.6, zeta 0.7), 显隐 (2pi × 1.8, zeta 0.65).
 */
export const LENS_STRETCH_SPRING = omegaSpring(TAU * 2.2, 0.42);
export const LENS_TILT_SPRING = omegaSpring(TAU * 1.6, 0.7);
export const LENS_SCALE_SPRING = omegaSpring(TAU * 1.8, 0.65);
/** 速度到形变: 2000px/s 时拉伸满 0.22, 1500px/s 时倾斜满 14 度 (HX 自定). */
export const LENS_STRETCH_MAX = 0.22;
export const LENS_STRETCH_SPEED = 2000;
export const LENS_TILT_MAX_DEG = 14;
export const LENS_TILT_SPEED = 1500;
/** 指针跟随时间常数 = 0.02 + smoothness × 0.2 s; 闲置漂移周期 9 s, 幅度为台面的 0.22 (HX 自定). */
export const LENS_FOLLOW_BASE_S = 0.02;
export const LENS_FOLLOW_SCALE_S = 0.2;
export const LENS_IDLE_PERIOD_S = 9;
export const LENS_IDLE_REACH = 0.22;
/** 自转: spin × 这个角速度 (deg/s, HX 自定). */
export const LENS_SPIN_DEG_S = 60;

export function lensFollow(dtMs: number, smoothness: number): number {
  const tau = LENS_FOLLOW_BASE_S + clamp(smoothness, 0, 1) * LENS_FOLLOW_SCALE_S;
  return 1 - Math.exp(-Math.min(LENS_MAX_DT_S, dtMs / 1000) / tau);
}

/** 速度 (px/s) 给出拉伸方向角 (deg) 与拉伸量. */
export function lensStretch(vx: number, vy: number): { readonly angle: number; readonly amount: number } {
  const speed = Math.hypot(vx, vy);
  return { angle: speed > 0 ? (Math.atan2(vy, vx) * 180) / Math.PI : 0, amount: clamp(speed / LENS_STRETCH_SPEED, 0, 1) * LENS_STRETCH_MAX };
}

/** 速度 (px/s) 给出倾斜目标 (deg): 横向速度绕 Y 轴, 纵向绕 X 轴. */
export function lensTilt(vx: number, vy: number): { readonly x: number; readonly y: number } {
  return { x: 0 - clamp(vy / LENS_TILT_SPEED, -1, 1) * LENS_TILT_MAX_DEG, y: clamp(vx / LENS_TILT_SPEED, -1, 1) * LENS_TILT_MAX_DEG };
}

/** 闲置时镜片沿李萨如曲线绕台面中心漂移. tS 为秒. */
export function lensIdle(tS: number, width: number, height: number): readonly [number, number] {
  const p = (tS / LENS_IDLE_PERIOD_S) * TAU;
  return [width / 2 + Math.sin(p) * width * LENS_IDLE_REACH, height / 2 + Math.sin(p * 2) * height * LENS_IDLE_REACH * 0.6];
}

/** 形状的盒子与裁切. 外延比例乘到尺寸上. */
export function lensBox(shape: LensShape, size: number): { readonly width: number; readonly height: number; readonly borderRadius: string; readonly clipPath?: string; readonly mask?: string; readonly rotate: number } {
  const s = size * LENS_EXTENT[shape];
  switch (shape) {
    case "pill":
      return { width: s * 1.6, height: s * 0.62, borderRadius: "9999px", rotate: 0 };
    case "cube":
      return { width: s * 0.72, height: s * 0.72, borderRadius: "18%", rotate: 0 };
    case "diamond":
      return { width: s * 0.7, height: s * 0.7, borderRadius: "12%", rotate: 45 };
    case "prism":
      return { width: s, height: s * 0.87, borderRadius: "0", clipPath: "polygon(50% 0, 100% 100%, 0 100%)", rotate: 0 };
    case "blob":
      return { width: s, height: s * 0.9, borderRadius: "42% 58% 63% 37% / 41% 44% 56% 59%", rotate: 0 };
    case "torus":
      return { width: s, height: s, borderRadius: "50%", mask: "radial-gradient(circle, transparent 0, transparent 30%, black 31%)", rotate: 0 };
    default:
      return { width: s, height: s, borderRadius: "50%", rotate: 0 };
  }
}

/** 镜片的 backdrop-filter: frost 加模糊, refraction 加饱和与对比, reflection 提亮 (系数 HX 自定). */
export function lensFilter(refraction: number, reflection: number, frost: number): string {
  const blur = clamp(frost, 0, 1) * 14;
  return `blur(${blur.toFixed(1)}px) saturate(${(1 + 0.45 * refraction).toFixed(2)}) contrast(${(1 + 0.12 * refraction).toFixed(2)}) brightness(${(1 + 0.08 * reflection).toFixed(2)})`;
}
