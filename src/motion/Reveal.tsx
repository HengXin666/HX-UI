"use client";

import { motion, useScroll, useTransform, type MotionValue, type UseInViewOptions } from "motion/react";
import { useRef, type JSX, type ReactNode } from "react";
import { MOTION_PRESET_NAME, MOTION_STATE, MOTION_TAG, MOTION_TIMING, REVEAL_VIEWPORT } from "../constants/motion";
import { MOTION_PRESETS, presetVariants, useMotionTokens, type MotionPresetName, type MotionTiming } from "./presets";

/** 可选的包裹标签对应的 motion 组件. 只开放块级与列表项, 行内动画请用 FadeSwap. */
export const MOTION_ELEMENTS = {
  [MOTION_TAG.div]: motion.div,
  [MOTION_TAG.section]: motion.section,
  [MOTION_TAG.article]: motion.article,
  [MOTION_TAG.li]: motion.li,
  [MOTION_TAG.ul]: motion.ul,
  [MOTION_TAG.span]: motion.span,
} as const;

export type MotionTag = keyof typeof MOTION_ELEMENTS;

export interface RevealProps {
  children: ReactNode;
  /** 入场预设. 默认 fadeUp. */
  preset?: MotionPresetName;
  /** 节奏: enter (默认, slow + ease-out) 或 emphasized (首屏大标题). */
  timing?: MotionTiming;
  /** 延迟 (s). 同屏多块依次出现时使用; 一组同类子项请改用 Stagger. */
  delay?: number;
  /** 只播一次. 默认 true; 设为 false 时滚出视口会复位, 再次进入重播. */
  once?: boolean;
  /** 露出比例达到多少才触发, 0 到 1. */
  amount?: number;
  /** 视口边距, 同 IntersectionObserver 的 rootMargin. */
  margin?: UseInViewOptions["margin"];
  /** 包裹标签. 默认 div. */
  as?: MotionTag;
  className?: string;
  /**
   * 防闪: 未入场时同时 visibility hidden, 入场前不可见也不可聚焦, 首帧不会先露一下再藏起来.
   * 默认 false. 对应 react-bits Animations 的 AnimatedContent / FadeContent 条目.
   */
  cloak?: boolean;
  /**
   * 进度跟滚动走, 可正可反: 元素顶边从视口底边进来时为 hidden, 到 scrubEnd 处为 visible, 往回滚倒放.
   * 默认 false; 开启后 once, amount, delay, timing 不再生效. 减弱动效时直接落在 visible.
   */
  scrub?: boolean;
  /** scrub 的终点: 元素顶边到达视口高度的这个比例时进度为 1. 默认 0.55. */
  scrubEnd?: number;
}

/** scrub 默认终点 (视口高度比例). */
export const REVEAL_SCRUB_END = 0.55;
/** scrub 插值的样式键, 预设里缺的键按 visible 值不动. */
const SCRUB_KEYS = ["opacity", "x", "y", "scale", "filter"] as const;
type ScrubKey = (typeof SCRUB_KEYS)[number];
type ScrubValue = number | string;
const STILL: Record<ScrubKey, ScrubValue> = { opacity: 1, x: 0, y: 0, scale: 1, filter: "none" };

/** 预设在 hidden 与 visible 两端的取值, 给 scrub 插值. 缺的键两端相同. */
export function scrubEnds(preset: MotionPresetName): Record<ScrubKey, readonly [ScrubValue, ScrubValue]> {
  const base = MOTION_PRESETS[preset] as { hidden: Partial<Record<ScrubKey, ScrubValue>>; visible: Partial<Record<ScrubKey, ScrubValue>> };
  const out = {} as Record<ScrubKey, readonly [ScrubValue, ScrubValue]>;
  for (const key of SCRUB_KEYS) {
    const to = base.visible[key] ?? STILL[key];
    out[key] = [base.hidden[key] ?? to, to];
  }
  return out;
}

const PERCENT = 100;

/** scrub 分支单独成件, 不开 scrub 的 Reveal 不挂滚动监听. */
function ScrubReveal({ as, preset, cloak, scrubEnd, reduced, className, children }: { as: MotionTag; preset: MotionPresetName; cloak: boolean; scrubEnd: number; reduced: boolean; className?: string; children: ReactNode }): JSX.Element {
  const Element = MOTION_ELEMENTS[as];
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", `start ${scrubEnd * PERCENT}%`] });
  const style = useScrubStyle(scrollYProgress, preset, cloak);
  return (
    <Element ref={ref as never} className={className} style={reduced ? undefined : style}>
      {children}
    </Element>
  );
}

function useScrubStyle(progress: MotionValue<number>, preset: MotionPresetName, cloak: boolean): Record<string, MotionValue<ScrubValue>> {
  const ends = scrubEnds(preset);
  const opacity = useTransform(progress, [0, 1], [...ends.opacity] as number[]);
  const x = useTransform(progress, [0, 1], [...ends.x] as number[]);
  const y = useTransform(progress, [0, 1], [...ends.y] as number[]);
  const scale = useTransform(progress, [0, 1], [...ends.scale] as number[]);
  const filter = useTransform(progress, [0, 1], [...ends.filter] as string[]);
  const visibility = useTransform(progress, (p) => (cloak && p <= 0 ? "hidden" : "visible"));
  return { opacity, x, y, scale, filter, visibility };
}

/**
 * 进入视口时播放一次入场动画.
 *
 * 用 whileInView 而不是 useInView + 手动 animate: 观察器的创建与销毁由 motion 管理, 列表里
 * 几十个 Reveal 共享同一套调度. 首帧固定渲染 hidden 态, 服务端与客户端一致不触发水合告警;
 * 减弱动效 (useMotionTokens 内的 useReducedMotion) 时过渡换成 0 时长, 元素进视口即刻落到终态.
 * cloak 与 scrub 两个可选项默认关闭, 见 .agents/notes/implemented/feature/2026-11-09-surface-reveal.md.
 */
export function Reveal({
  children,
  preset = MOTION_PRESET_NAME.fadeUp,
  timing = MOTION_TIMING.enter,
  delay = 0,
  once = true,
  amount = REVEAL_VIEWPORT.amount,
  margin = REVEAL_VIEWPORT.margin,
  as = MOTION_TAG.div,
  className,
  cloak = false,
  scrub = false,
  scrubEnd = REVEAL_SCRUB_END,
}: RevealProps): JSX.Element {
  const { tokens, reduced } = useMotionTokens();
  const variants = presetVariants(preset, tokens, { timing, delay, reduced });
  const Element = MOTION_ELEMENTS[as];
  if (scrub) {
    return (
      <ScrubReveal as={as} preset={preset} cloak={cloak} scrubEnd={scrubEnd} reduced={reduced} className={className}>
        {children}
      </ScrubReveal>
    );
  }
  if (cloak) {
    variants.hidden = { ...variants.hidden, visibility: "hidden" };
    variants.visible = { ...variants.visible, visibility: "visible" };
  }
  return (
    <Element
      className={className}
      variants={variants}
      initial={MOTION_STATE.hidden}
      whileInView={MOTION_STATE.visible}
      viewport={{ once, amount, margin }}
    >
      {children}
    </Element>
  );
}
