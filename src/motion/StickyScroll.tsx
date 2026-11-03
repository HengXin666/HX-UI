"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { MOTION_PRESET_NAME, PRESENCE_MODE, STICKY_LAYOUT, STICKY_STEP_MARGIN } from "../constants/motion";
import { FadeSwap } from "./Transition";

export type StickyLayout = (typeof STICKY_LAYOUT)[keyof typeof STICKY_LAYOUT];

export interface StickyScrollProps {
  /** 分步内容, 每项一步. 通常是一段标题加说明. */
  steps: ReactNode[];
  /** 粘住的媒体. 传函数时按当前步渲染 (每步一张图 / 一帧视频). */
  media: ReactNode | ((activeIndex: number) => ReactNode);
  /** side: 宽屏左粘右滚, 窄屏退为上粘下滚; top: 始终上粘下滚. 默认 side. */
  layout?: StickyLayout;
  /** 当前步变化时回调, 参数是步的下标. */
  onStepChange?: (index: number) => void;
  /** 媒体切换时是否淡入淡出. 默认 true; 减弱动效时 FadeSwap 自动 0 时长. */
  crossfade?: boolean;
  className?: string;
  /** 每一步的类名. 默认最小高度 60vh, 让每步都有一段停留. */
  stepClassName?: string;
  /** 媒体粘性层的类名, 可用来调 top 偏移 (例如避开固定导航). */
  mediaClassName?: string;
}

interface StepProps {
  index: number;
  active: boolean;
  onEnter: (index: number) => void;
  className: string;
  children: ReactNode;
}

/** 单步. 压过视口正中线时上报自己的下标. */
function Step({ index, active, onEnter, className, children }: StepProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: STICKY_STEP_MARGIN });
  useEffect(() => {
    if (inView) onEnter(index);
  }, [inView, index, onEnter]);
  return (
    <div
      ref={ref}
      data-active={active || undefined}
      aria-current={active ? "step" : undefined}
      className={[
        className,
        "opacity-40 transition-opacity duration-[var(--duration-base)] data-[active]:opacity-100 motion-reduce:transition-none",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

const LAYOUT_CLASS: Record<StickyLayout, { root: string; media: string }> = {
  [STICKY_LAYOUT.side]: {
    root: "relative grid grid-cols-1 gap-8 md:grid-cols-2",
    media: "sticky top-0 z-10 self-start md:top-[20vh]",
  },
  [STICKY_LAYOUT.top]: {
    root: "relative flex flex-col gap-8",
    media: "sticky top-0 z-10",
  },
};

/**
 * 粘性叙事 (scrollytelling, 审计 E9). 媒体用 CSS sticky 粘住, 步骤正常滚动;
 * 每步用 IntersectionObserver 观察是否压过视口正中线, 压线的那步成为当前步.
 *
 * 粘住是布局不是动效, prefers-reduced-motion 时照常粘住, 只是媒体切换不淡入淡出,
 * 步骤高亮直接切换不过渡.
 */
export function StickyScroll({
  steps,
  media,
  layout = STICKY_LAYOUT.side,
  onStepChange,
  crossfade = true,
  className,
  stepClassName = "flex min-h-[60vh] items-center",
  mediaClassName,
}: StickyScrollProps): JSX.Element {
  const [active, setActive] = useState(0);
  const callback = useRef(onStepChange);
  callback.current = onStepChange;
  const reported = useRef(active);
  useEffect(() => {
    if (reported.current === active) return;
    reported.current = active;
    callback.current?.(active);
  }, [active]);
  const classes = LAYOUT_CLASS[layout];
  const content = typeof media === "function" ? media(active) : media;
  return (
    <div className={[classes.root, className].filter(Boolean).join(" ")}>
      <div className={[classes.media, mediaClassName].filter(Boolean).join(" ")}>
        {crossfade ? (
          <FadeSwap swapKey={active} preset={MOTION_PRESET_NAME.fade} mode={PRESENCE_MODE.wait} as="div">
            {content}
          </FadeSwap>
        ) : (
          content
        )}
      </div>
      <ol className="m-0 list-none p-0">
        {steps.map((step, index) => (
          <li key={index}>
            <Step index={index} active={index === active} onEnter={setActive} className={stepClassName}>
              {step}
            </Step>
          </li>
        ))}
      </ol>
    </div>
  );
}
