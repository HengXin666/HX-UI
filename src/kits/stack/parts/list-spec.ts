/**
 * PopList 的规格常数与纯函数: 入场姿态, 错峰延迟, 上下渐隐, 键盘步进.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
import type { SpringSpec } from "../../../craft/spring";
import { clamp } from "../tokens";

/** 位移 620ms (回弹缓出), 透明度 300ms outQuint, 模糊 200ms ease (AnimatedList.jsx:171). */
export const LIST_MOVE_MS = 620;
export const LIST_FADE_MS = 300;
export const LIST_FILTER_MS = 200;
/** 上下渐隐层的透明度过渡 200ms ease (AnimatedList.css:186). */
export const LIST_EDGE_MS = 200;
export const LIST_DEFAULTS = { stagger: 0.05, fadeSize: 56, radius: 14, gap: 8, width: 420, maxHeight: 440 } as const;
/** 选中底板跟随的弹簧. 规格只给了 240Hz 细分积分, 数值 HX 自定. */
export const LIST_INDICATOR_SPRING: SpringSpec = { stiffness: 380, damping: 34, mass: 1 };

export type ListAnimation = "pop" | "slide" | "fade" | "none";

export interface ListPose {
  readonly transform: string;
  readonly opacity: number;
  readonly filter: string;
}

/** 未入场的姿态 (规格 HIDDEN 未给数值, HX 自定). */
const HIDDEN: Record<ListAnimation, ListPose> = {
  pop: { transform: "translateY(8px) scale(0.86)", opacity: 0, filter: "blur(4px)" },
  slide: { transform: "translateY(24px) scale(1)", opacity: 0, filter: "blur(0px)" },
  fade: { transform: "translateY(0px) scale(1)", opacity: 0, filter: "blur(0px)" },
  none: { transform: "translateY(0px) scale(1)", opacity: 1, filter: "blur(0px)" },
};
export const SHOWN_POSE: ListPose = { transform: "translateY(0px) scale(1)", opacity: 1, filter: "blur(0px)" };

export function listPose(animation: ListAnimation, shown: boolean): ListPose {
  return shown ? SHOWN_POSE : HIDDEN[animation];
}

/** 第 order 个同批入场项的延迟秒数 (AnimatedList.jsx:298). 只给位移与透明度, 模糊不延迟. */
export function revealDelay(order: number, stagger: number): number {
  return order * Math.max(0, stagger);
}

/** 上, 下渐隐层的不透明度: 距边缘不足 fadeSize 时按比例淡出. */
export function edgeFades(scrollTop: number, scrollHeight: number, clientHeight: number, fadeSize: number): readonly [number, number] {
  const size = Math.max(1, fadeSize);
  const rest = Math.max(0, scrollHeight - clientHeight - scrollTop);
  return [clamp(scrollTop / size, 0, 1), clamp(rest / size, 0, 1)];
}

/** 键盘步进: loop 时首尾相接, 否则停在两端. 未选中时向下从 0 起, 向上从末项起. */
export function listStep(index: number, step: number, n: number, loop: boolean): number {
  if (n <= 0) return -1;
  if (index < 0) return step > 0 ? 0 : n - 1;
  const next = index + step;
  if (loop) return ((next % n) + n) % n;
  return clamp(next, 0, n - 1);
}
