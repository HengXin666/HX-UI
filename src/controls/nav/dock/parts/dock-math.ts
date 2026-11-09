/**
 * MagnifyDock 的规格常数与纯函数: 放大曲线, 弹簧夹取, 起跳关键帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
import type { SpringSpec } from "../../../../craft/spring";
import { cssCurve } from "../../../../motion/curves";

/** 规格 EDGE: 坞两端与上下的内边距. */
export const DOCK_EDGE = 12;
/** 规格 HOP: 起跳高度占当前图标尺寸的比例. */
export const DOCK_HOP = 0.4;
/** 规格 HOP_TIME, 秒. */
export const DOCK_HOP_S = 0.38;
/** 规格 HOLD_TIME: 按住多久算长按, ms. */
export const DOCK_HOLD_MS = 450;
/** 规格 MENU_GAP: 标签与图标之间的间距. */
export const DOCK_LABEL_GAP = 8;
/** 起跳上抛段的缓出 (Dock.css:420 的 transform 曲线). */
export const DOCK_RISE = cssCurve("lift");
/** 规格 POP 曲线, 起跳落地用. */
export const DOCK_POP = cssCurve("popOut");
/** 标签显隐 (Dock.css:293-294): opacity 与 transform 0.16s ease. */
export const DOCK_LABEL_MS = 160;
/** 活动点的透明度过渡 (Dock.css:422). */
export const DOCK_DOT_MS = 120;
/** 规格默认弹簧与下限 (Dock.jsx:446, 495-497). */
export const DOCK_SPRING = { mass: 0.1, stiffness: 150, damping: 12 } as const;
/** 起跳顶点在时间轴上的位置, HX 自定. */
export const DOCK_HOP_PEAK = 0.45;
const MIN_MASS = 0.01;
const MIN_STIFFNESS = 1;

/** 尺寸与影响半径为 HX 自定. */
export const DOCK_DEFAULTS = { size: 48, magnified: 72, distance: 140, gap: 8 } as const;

/** 规格的弹簧夹取: 质量不小于 0.01, 刚度不小于 1, 阻尼不小于 0. */
export function dockSpring(spring?: Partial<SpringSpec>): SpringSpec {
  return {
    mass: Math.max(MIN_MASS, spring?.mass ?? DOCK_SPRING.mass),
    stiffness: Math.max(MIN_STIFFNESS, spring?.stiffness ?? DOCK_SPRING.stiffness),
    damping: Math.max(0, spring?.damping ?? DOCK_SPRING.damping),
  };
}

/**
 * 指针到图标中心距离 -> 目标尺寸. 半径内按余弦钟形从 magnified 落到 size, 半径外为 size.
 * 钟形让相邻两三个图标一起抬起, 中心处导数为 0, 指针在中心附近抖动不会让尺寸跳.
 */
export function magnifySize(distancePx: number, size: number, magnified: number, radius: number): number {
  const d = Math.abs(distancePx);
  if (radius <= 0 || d >= radius) return size;
  const bell = (1 + Math.cos((Math.PI * d) / radius)) / 2;
  return size + (magnified - size) * bell;
}

/** 起跳: 抬到 HOP * 尺寸再落回, 上抛走缓出, 落地走 POP 的轻过冲. */
export function hopFrames(sizePx: number): Keyframe[] {
  const lift = -DOCK_HOP * sizePx;
  return [
    { transform: "translateY(0px)", easing: DOCK_RISE },
    { transform: `translateY(${lift}px)`, easing: DOCK_POP, offset: DOCK_HOP_PEAK },
    { transform: "translateY(0px)" },
  ];
}
