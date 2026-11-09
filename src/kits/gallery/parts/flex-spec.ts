/**
 * FlexReel 的规格常数与纯函数: 分模式的临界阻尼弹簧, 速度能量, 能量到弯折.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
import type { SpringSpec } from "../../../craft/spring";

/** 临界阻尼弹簧: damping = 2 sqrt(k) (FlexCarousel.jsx:757-758). */
function critical(stiffness: number): SpringSpec {
  return { stiffness, damping: 2 * Math.sqrt(stiffness), mass: 1 };
}
/** 规格分模式刚度: 点选与松手 55, 滚轮 80. */
export const FLEX_SPRING = { snap: critical(55), wheel: critical(80) } as const;
/** 能量上升 70ms, 回落 350ms 的时间常数 (FlexCarousel.jsx:817). */
export const FLEX_ENERGY_UP_MS = 70;
export const FLEX_ENERGY_DOWN_MS = 350;
/** 速度 (张/秒) 到这个值时能量满. HX 自定. */
export const FLEX_ENERGY_FULL = 6;
/** 能量满时两侧卡片最大转角 deg 与缩小量. HX 自定 (规格是着色器弯曲). */
export const FLEX_BEND_DEG = 28;
export const FLEX_SQUEEZE = 0.06;
/** 滚轮 delta 每 px 推进多少张. HX 自定. */
export const FLEX_WHEEL_UNIT = 0.006;
/** 滚轮停多久后吸附 ms. HX 自定. */
export const FLEX_SNAP_IDLE_MS = 140;
/** 能量的落定阈值. */
export const FLEX_ENERGY_EPS = 0.001;

/** 速度 (张/秒) 对应的目标能量, 0 到 1. */
export function flexEnergyTarget(velocity: number): number {
  return Math.min(1, Math.abs(velocity) / FLEX_ENERGY_FULL);
}

/** 能量一帧: 上升快, 回落慢. */
export function flexEnergyStep(energy: number, target: number, dtMs: number): number {
  const tau = target > energy ? FLEX_ENERGY_UP_MS : FLEX_ENERGY_DOWN_MS;
  return energy + (target - energy) * (1 - Math.exp(-dtMs / tau));
}

/** 偏移 off (张) 的卡片在能量 e, 运动方向 dir 下的转角与缩放: 越靠边转得越多, 朝运动反方向倾. */
export function flexPose(off: number, e: number, dir: number): { deg: number; scale: number } {
  const reach = Math.max(-1, Math.min(1, off / 2));
  return { deg: -dir * e * FLEX_BEND_DEG * (0.5 + 0.5 * Math.abs(reach)), scale: 1 - e * FLEX_SQUEEZE };
}
