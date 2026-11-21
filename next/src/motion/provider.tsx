import type * as React from "react";
import { LazyMotion } from "motion/react";

// 动画特性包异步加载: 首屏只带 m 组件骨架 (~5KB), 完整特性 (含 layout / 拖拽) 在空闲时补上
const loadFeatures = () => import("./features").then((r) => r.default);

/** 应用根部包一次. 组件内一律用 m.div 而不是 motion.div. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={loadFeatures} strict>{children}</LazyMotion>;
}
