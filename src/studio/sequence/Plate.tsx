"use client";

import { motion, useMotionValue, useScroll, useTransform, type MotionValue, type TargetAndTransition } from "motion/react";
import { createContext, useContext, useRef, type JSX, type ReactNode, type RefObject } from "react";
import { SCROLL_OFFSET } from "../../constants/motion";
import { cn } from "../../primitives/utils";
import { useMotionTokens } from "../../motion/presets";
import { STUDIO_CLASS } from "../classes";
import {
  SHOT_ARC_S,
  SHOT_DEPTH,
  SHOT_DEPTH_ENTER,
  SHOT_DEPTH_FROM,
  SHOT_DEPTH_REST,
  SHOT_DEPTH_TO,
  SHOT_DOLLY_SCALE,
  SHOT_DRIVE,
  SHOT_ORIGIN,
  SHOT_PERSPECTIVE,
  SHOT_SCROLL_RANGE,
  SHOT_VIEWPORT_AMOUNT,
  type ShotDepth,
  type ShotDrive,
} from "../moves";

const PlateProgress = createContext<MotionValue<number> | null>(null);

export interface ShotPlateProps {
  children: ReactNode;
  /** view: 进视口播一次弧线. scroll: 进度绑在元素穿过滚动容器的过程. 默认 view. */
  drive?: ShotDrive;
  /** scroll 驱动时的滚动容器. 嵌在 overflow 面板里时传入, 否则用视口. */
  container?: RefObject<HTMLElement | null>;
  className?: string;
  classNames?: { root?: string; frame?: string };
  label?: string;
}

/**
 * 机位. view 用一次推近落到正视; scroll 把同一条推近绑到滚动进度.
 * 两种驱动都只改 transform, 镜头本身不抖动.
 */
export function ShotPlate({
  children,
  drive = SHOT_DRIVE.view,
  container,
  className,
  classNames,
  label,
}: ShotPlateProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const { tokens, reduced } = useMotionTokens();
  const { scrollYProgress } = useScroll({
    target: ref,
    container,
    offset: [...SCROLL_OFFSET.through],
  });
  const scale = useTransform(scrollYProgress, [...SHOT_SCROLL_RANGE], reduced ? [1, 1, 1] : [...SHOT_DOLLY_SCALE]);
  const scrolling = drive === SHOT_DRIVE.scroll && !reduced;
  return (
    <div
      ref={ref}
      data-slot="shot-plate"
      data-drive={drive}
      className={cn(STUDIO_CLASS.plate, className, classNames?.root)}
      aria-label={label}
    >
      <PlateProgress.Provider value={scrolling ? scrollYProgress : null}>
        <motion.div
          data-slot="shot-plate-frame"
          className={cn(STUDIO_CLASS.shot, "h-full w-full", classNames?.frame)}
          style={scrolling ? { scale, transformOrigin: SHOT_ORIGIN, perspective: SHOT_PERSPECTIVE } : { transformOrigin: SHOT_ORIGIN, perspective: SHOT_PERSPECTIVE }}
          initial={scrolling || reduced ? undefined : { scale: SHOT_DOLLY_SCALE[0], opacity: 0 }}
          whileInView={scrolling ? undefined : { scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: SHOT_VIEWPORT_AMOUNT }}
          transition={reduced || scrolling ? { duration: 0 } : { duration: SHOT_ARC_S, ease: tokens.ease.emphasized }}
        >
          {children}
        </motion.div>
      </PlateProgress.Provider>
    </div>
  );
}

export interface ShotLayerProps {
  children: ReactNode;
  /** back 行程最大, subject 几乎贴在落幅上, front 反向轻轻带过. */
  depth?: ShotDepth;
  className?: string;
  classNames?: { root?: string };
}

/** 景深层. 父级是滚动推近时跟进度走; 否则进视口后落到 0. */
export function ShotLayer({ children, depth = SHOT_DEPTH.subject, className, classNames }: ShotLayerProps): JSX.Element {
  const progress = useContext(PlateProgress);
  const idle = useMotionValue(0);
  const { tokens, reduced } = useMotionTokens();
  const y = useTransform(progress ?? idle, [0, 1], reduced ? [0, 0] : [SHOT_DEPTH_FROM[depth], SHOT_DEPTH_TO[depth]]);
  const enter = (reduced ? SHOT_DEPTH_REST : SHOT_DEPTH_ENTER[depth]) as TargetAndTransition;
  if (progress && !reduced) {
    return (
      <motion.div data-slot="shot-layer" data-depth={depth} className={cn(STUDIO_CLASS.shot, className, classNames?.root)} style={{ y }}>
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div
      data-slot="shot-layer"
      data-depth={depth}
      className={cn(STUDIO_CLASS.shot, className, classNames?.root)}
      initial={enter}
      whileInView={SHOT_DEPTH_REST as TargetAndTransition}
      viewport={{ once: true, amount: SHOT_VIEWPORT_AMOUNT }}
      transition={reduced ? { duration: 0 } : { duration: SHOT_ARC_S, ease: tokens.ease.emphasized }}
    >
      {children}
    </motion.div>
  );
}
