"use client";

import { useInView, type Transition } from "motion/react";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { SPRING_THUMB } from "../craft/tokens";
import { useMotionTokens } from "../motion/presets";
import { dealDelays } from "./scale";
import { VIZ_SHOT, VIZ_TIME, VIZ_VIEWPORT } from "./tokens";

export interface VizStage<E extends Element> {
  /** 挂到图的根节点, 进入视口后 shown 变为 true 并保持. */
  ref: RefObject<E | null>;
  shown: boolean;
  reduced: boolean;
  /** 第 index 项的过渡. 首次入场带发牌错峰, 入场之后的数据更新走 update, 不再错峰. */
  at: (index: number) => Transition;
  /** 数据更新时的过渡: 弹簧 thumb, 从当前值和速度继续. */
  update: Transition;
  /** 网格重标的过渡. */
  rescale: Transition;
  /** 越界那一拍: 线和柱按旧比例冲出画框. */
  shock: Transition;
  /** 进入曲线 (运动令牌 out), 给组件自己拼的 duration 过渡用. */
  ease: Transition["ease"];
  /** 还在首次入场 (入场之后的更新不再错峰). */
  entering: () => boolean;
  /** 描线的过渡. */
  draw: Transition;
  /** 坐标轴冲击标记圈的过渡. */
  ring: Transition;
}

const INSTANT: Transition = { duration: 0 };

/**
 * 图表共用的舞台: 视口触发, 减弱动效, 发牌错峰和三种过渡.
 * 只在这里把运动令牌翻成 motion 的 transition, 组件里不写秒数.
 *
 * .agents/notes/implemented/feature/2026-11-08-viz-layer.md
 */
export function useVizStage<E extends Element>(count: number): VizStage<E> {
  const ref = useRef<E | null>(null);
  const inView = useInView(ref, { once: true, amount: VIZ_VIEWPORT });
  const { tokens, reduced } = useMotionTokens();
  const entered = useRef(false);
  const shown = reduced || inView;
  useEffect(() => {
    if (shown) entered.current = true;
  }, [shown]);
  const delays = useMemo(() => dealDelays(count, VIZ_TIME.dealFirst, VIZ_TIME.dealLast), [count]);
  return useMemo(() => {
    const spring: Transition = { type: "spring", ...SPRING_THUMB };
    return {
      ref,
      shown,
      reduced,
      at: (index: number) => (reduced ? INSTANT : entered.current ? spring : { ...spring, delay: delays[index] ?? 0 }),
      update: reduced ? INSTANT : spring,
      rescale: reduced ? INSTANT : { duration: VIZ_TIME.rescale, ease: tokens.ease.out },
      shock: reduced ? INSTANT : { duration: VIZ_SHOT.shock, ease: tokens.ease.out },
      entering: () => !entered.current,
      ease: tokens.ease.out,
      draw: reduced ? INSTANT : { duration: VIZ_TIME.draw, ease: tokens.ease.out },
      ring: reduced ? INSTANT : { duration: VIZ_TIME.ring, ease: tokens.ease.out },
    };
  }, [delays, reduced, shown, tokens]);
}
