"use client";

import { motion, useTransform } from "motion/react";
import { useRef, type JSX, type ReactNode, type RefObject } from "react";
import { MOTION_DIRECTION, PARALLAX_DEFAULT_SPEED, PARALLAX_RANGE_PX, PROGRESS_RANGE } from "../constants/motion";
import { useMotionTokens } from "./presets";
import { useScrollProgress } from "./ScrollProgress";

export type MotionDirection = (typeof MOTION_DIRECTION)[keyof typeof MOTION_DIRECTION];

export interface ParallaxProps {
  children: ReactNode;
  /**
   * 速度因子. 0 不动, 0.2 (默认) 慢半拍, 1 约等于整段滚动内位移 200px; 负数反向.
   * 背景层取小值 (0.1 到 0.3), 前景点缀取中值, 超过 0.6 会显得 "飘".
   */
  speed?: number;
  /** 层随滚动朝哪个方向漂移. 默认 up (比页面滚得更快地上移). */
  direction?: MotionDirection;
  /** 滚动容器. 省略时跟随整页. */
  container?: RefObject<HTMLElement | null>;
  /** 外层 (测量层) 类名. */
  className?: string;
  /** 内层 (位移层) 类名. */
  layerClassName?: string;
}

/** 方向换成位移的轴与符号. up / left 为负. */
function axisOf(direction: MotionDirection): { horizontal: boolean; sign: number } {
  const horizontal = direction === MOTION_DIRECTION.left || direction === MOTION_DIRECTION.right;
  const sign = direction === MOTION_DIRECTION.up || direction === MOTION_DIRECTION.left ? -1 : 1;
  return { horizontal, sign };
}

/**
 * 视差层. 元素从进屏到出屏的进度映射到 [-d, +d] 的位移, 进度 0.5 (屏幕正中) 时恰好归位,
 * 所以布局里看到的位置就是视觉焦点处的位置.
 *
 * 外层只负责测量, 内层负责位移: 测量的是未位移的盒子, 不会因自身位移而反馈抖动.
 * 只动 transform, 走合成器. prefers-reduced-motion 时不挂位移, 层静止在布局位置.
 */
export function Parallax({
  children,
  speed = PARALLAX_DEFAULT_SPEED,
  direction = MOTION_DIRECTION.up,
  container,
  className,
  layerClassName,
}: ParallaxProps): JSX.Element {
  const { reduced } = useMotionTokens();
  const ref = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress({ container, target: ref });
  const { horizontal, sign } = axisOf(direction);
  const distance = (speed * PARALLAX_RANGE_PX * sign) / 2;
  const offset = useTransform(progress, [...PROGRESS_RANGE], [-distance, distance]);
  const style = reduced ? undefined : horizontal ? { x: offset } : { y: offset };
  return (
    <div ref={ref} className={className}>
      <motion.div className={layerClassName} style={style}>
        {children}
      </motion.div>
    </div>
  );
}
