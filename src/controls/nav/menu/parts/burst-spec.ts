/**
 * PillBurst 的规格常数与纯函数: 入场错峰 (含确定性抖动), 胶囊姿态.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */

/** 规格默认 (BubbleMenu.jsx:56-58): 入场时长与错峰, 秒. */
export const BURST_DEFAULTS = { animationDuration: 0.5, staggerDelay: 0.12 } as const;
/** 规格抖动 (BubbleMenu.jsx:93): 每颗的延迟再加 [-0.05, 0.05] 秒. */
export const BURST_JITTER_S = 0.05;
/** 规格离场 (BubbleMenu.jsx:119-125): 0.2s, power3.in. */
export const BURST_EXIT_MS = 200;
/** 规格悬停与配色过渡 (BubbleMenu.css:97-98, 204-205): 0.3s ease. */
export const BURST_HOVER_MS = 300;
/** 悬停时胶囊放大到这么多并转正. HX 自定. */
export const BURST_HOVER_SCALE = 1.06;
/** 开关两条线的间距与交叉角. HX 自定. */
export const BURST_BAR_GAP = 3;
export const BURST_CROSS_DEG = 45;

const GOLDEN = 0.618033988749895;

/**
 * 第 i 颗的入场延迟 (秒): i * stagger 加一个只由 i 决定的抖动, 结果不小于 0.
 * 规格用 Math.random; 这里用黄金分割序列, 同一列表每次打开节奏一致, 也便于测试.
 */
export function burstDelay(index: number, stagger: number): number {
  const frac = ((index + 1) * GOLDEN) % 1;
  return Math.max(0, index * Math.max(0, stagger) + (frac * 2 - 1) * BURST_JITTER_S);
}

/** 胶囊 transform: 未展开时缩到 0; 展开后按 rotation 摆角, 悬停时放大并转正. */
export function burstTransform(shown: boolean, rotation: number, hovered: boolean): string {
  if (!shown) return `rotate(${rotation}deg) scale(0)`;
  return hovered ? `rotate(0deg) scale(${BURST_HOVER_SCALE})` : `rotate(${rotation}deg) scale(1)`;
}
