import type * as React from "react";
import { LazyMotion, MotionConfig } from "motion/react";

// 动画特性包异步加载: 首屏只带 m 组件骨架 (~5KB), 完整特性 (含 layout / 拖拽) 在空闲时补上
const loadFeatures = () => import("./features").then((r) => r.default);

/**
 * 应用根部包一次. 组件内一律用 m.div 而不是 motion.div.
 * reducedMotion="user": 系统开了减弱动效时, 所有位移 / 缩放 / 布局动画直接到终态, 只保留淡入淡出.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures} strict>{children}</LazyMotion>
    </MotionConfig>
  );
}
