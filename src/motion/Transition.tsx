"use client";

import { AnimatePresence } from "motion/react";
import type { JSX, ReactNode } from "react";
import { MOTION_PRESET_NAME, MOTION_STATE, MOTION_TAG, MOTION_TIMING, PRESENCE_MODE } from "../constants/motion";
import { presetVariants, useMotionTokens, type MotionPresetName, type MotionTiming } from "./presets";
import { MOTION_ELEMENTS, type MotionTag } from "./Reveal";

export type PresenceMode = (typeof PRESENCE_MODE)[keyof typeof PRESENCE_MODE];

interface SwapProps {
  /** 内容身份. 变化即视为换了一份内容: 旧的离场, 新的入场. */
  swapKey: string | number;
  children: ReactNode;
  preset: MotionPresetName;
  timing: MotionTiming;
  mode: PresenceMode;
  /** 首次挂载是否也播入场. */
  initial: boolean;
  as: MotionTag;
  className?: string;
}

/** PageTransition 与 FadeSwap 共用的进出场骨架. 离场走 fast + ease-in, 入场走所选节奏. */
function Swap({ swapKey, children, preset, timing, mode, initial, as, className }: SwapProps): JSX.Element {
  const { tokens, reduced } = useMotionTokens();
  const Element = MOTION_ELEMENTS[as];
  return (
    <AnimatePresence mode={mode} initial={initial}>
      <Element
        key={swapKey}
        className={className}
        variants={presetVariants(preset, tokens, { timing, reduced })}
        initial={MOTION_STATE.hidden}
        animate={MOTION_STATE.visible}
        exit={MOTION_STATE.exit}
      >
        {children}
      </Element>
    </AnimatePresence>
  );
}

export interface PageTransitionProps {
  /** 页面身份, 通常是路由路径或页面 id. */
  pageKey: string | number;
  children: ReactNode;
  /** 默认 fadeUp. */
  preset?: MotionPresetName;
  /** 默认 wait: 旧页完全离场后新页才进, 两页不叠在一起. */
  mode?: PresenceMode;
  /** 首屏是否播入场. 默认 false, 刷新页面时不让整页再浮一次. */
  animateOnMount?: boolean;
  className?: string;
}

/**
 * 页面级转场. 放在路由出口外面, pageKey 变化时旧页离场, 新页入场.
 * 默认 wait 模式, 避免两页同时在场导致高度跳动; 减弱动效时两段都是 0 时长.
 */
export function PageTransition({
  pageKey,
  children,
  preset = MOTION_PRESET_NAME.fadeUp,
  mode = PRESENCE_MODE.wait,
  animateOnMount = false,
  className,
}: PageTransitionProps): JSX.Element {
  return (
    <Swap
      swapKey={pageKey}
      preset={preset}
      timing={MOTION_TIMING.enter}
      mode={mode}
      initial={animateOnMount}
      as={MOTION_TAG.div}
      className={className}
    >
      {children}
    </Swap>
  );
}

export interface FadeSwapProps {
  /** 内容身份. 例如状态文字本身, 或加载中 / 已完成这样的阶段名. */
  swapKey: string | number;
  children: ReactNode;
  /** 默认 fade. 行内文字建议 fade 或 blurIn, 位移类在行内会挤动邻居. */
  preset?: MotionPresetName;
  /** 默认 popLayout: 旧内容立即脱离布局, 新内容就位, 容器不因叠放而变高. */
  mode?: PresenceMode;
  /** 默认 span, 可以放进一行文字里. */
  as?: MotionTag;
  className?: string;
}

/**
 * 局部内容替换: 按钮文案, 状态徽标, 空态与列表之间的切换.
 * 首帧不播动画, 只有 swapKey 变化才淡出旧的, 淡入新的.
 */
export function FadeSwap({
  swapKey,
  children,
  preset = MOTION_PRESET_NAME.fade,
  mode = PRESENCE_MODE.popLayout,
  as = MOTION_TAG.span,
  className,
}: FadeSwapProps): JSX.Element {
  return (
    <Swap
      swapKey={swapKey}
      preset={preset}
      timing={MOTION_TIMING.enter}
      mode={mode}
      initial={false}
      as={as}
      className={className}
    >
      {children}
    </Swap>
  );
}
