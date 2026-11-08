"use client";

import { motion } from "motion/react";
import { useState, type JSX, type ReactNode } from "react";
import { NumberRoll } from "../../craft/NumberRoll";
import { cn } from "../../primitives/utils";
import { ratio } from "../scale";
import { VIZ_BOX, VIZ_CLASS, VIZ_SHOT, VIZ_SPRING } from "../tokens";
import { useVizStage } from "../use-stage";

export interface RingProps {
  value: number;
  /** 满值. 默认 100. */
  max?: number;
  /** 读屏名称, 也是图注. */
  label: string;
  /** 中心内容. 不传时显示按位滚动的百分比. */
  children?: ReactNode;
  /** 外径 (px). */
  size?: number;
  /** 入场延迟 (秒). 一排表用它错峰成波浪, RingRow 自动按 4f 递增. */
  delay?: number;
  className?: string;
  classNames?: { root?: string; ring?: string; center?: string };
}

const DEFAULT_MAX = 100;
const DEFAULT_SIZE = 120;
const FULL_TURN = 360;
const QUARTER = -90;
const NONE = "none";
const PIVOT = { originX: "50%", originY: "50%" } as const;

/**
 * 环形进度, 入场是仪表自检 (video-shotcraft gauge-readout-moves 的 needle-sweep-selftest):
 * 先 400ms ease-out 甩满整圈, 再用回程弹簧带一点过冲落到真值, 落定那一刻中心数字才开始滚 (先亮量程再报数).
 * 之后改值从当前位置用同一个弹簧继续. 轨道与进度都是 1px 线, 端点实心点随组旋转. 读屏走 progressbar 语义.
 */
export function Ring({ value, max = DEFAULT_MAX, label, children, size = DEFAULT_SIZE, delay = 0, className, classNames }: RingProps): JSX.Element {
  const stage = useVizStage<HTMLDivElement>(1);
  const [swept, setSwept] = useState(false);
  const part = Math.min(1, Math.max(0, ratio(value, max)));
  const center = VIZ_BOX.ring / 2;
  const radius = center - VIZ_BOX.pad;
  const settled = swept || stage.reduced;
  const shown = !stage.shown ? 0 : settled ? part : 1;
  const motionFor = settled
    ? stage.reduced
      ? stage.update
      : { type: "spring" as const, ...VIZ_SPRING.needle }
    : { duration: VIZ_SHOT.sweep, ease: stage.ease, delay };
  const onSwept = (): void => {
    if (stage.shown && !settled) setSwept(true);
  };
  return (
    <div ref={stage.ref} data-slot="hx-ring" className={cn("inline-flex flex-col items-center gap-2", className, classNames?.root)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="relative grid place-items-center"
        style={{ width: size, height: size }}
      >
        <svg aria-hidden viewBox={`0 0 ${VIZ_BOX.ring} ${VIZ_BOX.ring}`} className={cn("absolute inset-0 size-full text-primary", classNames?.ring)}>
          <circle cx={center} cy={center} r={radius} fill={NONE} className="stroke-border" strokeWidth={1} />
          <g transform={`rotate(${QUARTER} ${center} ${center})`}>
            <motion.circle
              cx={center}
              cy={center}
              r={radius}
              fill={NONE}
              stroke="currentColor"
              strokeWidth={1}
              initial={stage.reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: shown }}
              transition={motionFor}
              onAnimationComplete={onSwept}
            />
          </g>
          <motion.g
            style={PIVOT}
            initial={stage.reduced ? false : { rotate: 0 }}
            animate={{ rotate: shown * FULL_TURN }}
            transition={motionFor}
          >
            <rect width={VIZ_BOX.ring} height={VIZ_BOX.ring} fill={NONE} />
            <circle cx={center} cy={VIZ_BOX.pad} r={VIZ_BOX.pad / 2} className="fill-current" />
          </motion.g>
        </svg>
        <span className={cn(VIZ_CLASS.live, "relative text-lg font-semibold", classNames?.center)}>
          {children ?? (
            <>
              <NumberRoll value={settled ? Math.round(part * DEFAULT_MAX) : 0} />%
            </>
          )}
        </span>
      </div>
      <span className={VIZ_CLASS.caption}>{label}</span>
    </div>
  );
}
