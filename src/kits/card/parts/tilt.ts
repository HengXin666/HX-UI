/**
 * 卡片族共用的倾斜: 指针 (相对卡心 -1..1) 换成绕 X / Y 的目标角, 平滑度换成弹簧, 反光的位置与角度.
 * TiltCard, BadgeCard, MirrorCard, FoilCard 共用.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
import type { SpringSpec } from "../../../craft/spring";
import { clamp, omegaSpring } from "../tokens";

/** 指针在卡右下时卡面朝右下倾: rotateX 取 -ny, rotateY 取 nx. */
export function tiltTarget(nx: number, ny: number, amplitude: number): { readonly rx: number; readonly ry: number } {
  return { rx: 0 - clamp(ny, -1, 1) * amplitude, ry: clamp(nx, -1, 1) * amplitude };
}

/** 平滑度 0..1 换成倾斜弹簧: omega 从 24 降到 8 rad/s, zeta 0.8 (规格只给 smoothness, 换算 HX 自定). */
export function tiltSpring(smoothness: number): SpringSpec {
  return omegaSpring(24 - 16 * clamp(smoothness, 0, 1), 0.8);
}

/** 规格 ProfileCard / ReflectiveCard 的倾斜弹簧: 跟手时劲度 120 阻尼 16, 归位 (slow) 时 24 / 9. */
export const TILT_FOLLOW: SpringSpec = { stiffness: 120, damping: 16, mass: 1 };
export const TILT_SETTLE: SpringSpec = { stiffness: 24, damping: 9, mass: 1 };

/** 反光: 光心落在指针对侧之外一点, 角度随指针方位. 返回百分比位置与渐变角 deg. */
export function glarePose(nx: number, ny: number): { readonly x: number; readonly y: number; readonly angle: number } {
  return {
    x: 50 + clamp(nx, -1, 1) * 50,
    y: 50 + clamp(ny, -1, 1) * 50,
    angle: (Math.atan2(ny, nx) * 180) / Math.PI + 90,
  };
}
