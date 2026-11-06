"use client";

import { motion } from "motion/react";
import type { JSX } from "react";
import { HEALTH_LABEL } from "../../constants/gallery";
import { SVG_CURRENT_COLOR, SVG_NONE, SVG_NON_SCALING_STROKE } from "../../constants/polish";
import { useMotionTokens } from "../../motion/presets";
import { SHOT_ARC_S, SPARK_BOX, sparkPath } from "../moves";
import { F06 } from "../num";

export interface SparkProps {
  /** 至少两个点. 少于此数不画线, 读屏标签仍在. */
  values: readonly number[];
  /** 读屏名称, 例如 "近八周完成的决定". */
  label: string;
  className?: string;
}

/**
 * 迷你折线. 用 pathLength 描线, 不改布局尺寸.
 * 减弱动效时直接画出整条线.
 */
export function Spark({ values, label, className }: SparkProps): JSX.Element {
  const { tokens, reduced } = useMotionTokens();
  const d = sparkPath(values);
  return (
    <svg
      role={HEALTH_LABEL.role}
      aria-label={label}
      viewBox={`0 0 ${SPARK_BOX.width} ${SPARK_BOX.height}`}
      className={className ?? "h-9 w-full text-foreground"}
    >
      {d ? (
        <motion.path
          d={d}
          fill={SVG_NONE}
          stroke={SVG_CURRENT_COLOR}
          strokeWidth={1}
          vectorEffect={SVG_NON_SCALING_STROKE}
          initial={reduced ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: F06 }}
          transition={reduced ? { duration: 0 } : { duration: SHOT_ARC_S, ease: tokens.ease.emphasized }}
        />
      ) : null}
    </svg>
  );
}
