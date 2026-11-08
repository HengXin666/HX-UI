"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useRef, type JSX, type ReactNode } from "react";
import { SPRING_FOLLOW } from "../../craft/tokens";
import { useMotionTokens } from "../../motion/presets";
import { cn } from "../../primitives/utils";
import { VIZ_CLASS, VIZ_SPRING } from "../tokens";

export const TIMELINE_STATUS = { done: "done", active: "active", next: "next" } as const;
export type TimelineStatus = (typeof TIMELINE_STATUS)[keyof typeof TIMELINE_STATUS];

export interface TimelineItem {
  id: string;
  /** 日期或阶段名, 写在节点旁. */
  when: string;
  title: string;
  detail?: ReactNode;
  status?: TimelineStatus;
}

export interface TimelineProps {
  items: readonly TimelineItem[];
  /** 读屏名称. */
  label: string;
  /** 进度线绑定滚动进度. 默认开; 关掉时进度线停在最后一个 done 项. */
  scrollLinked?: boolean;
  className?: string;
  classNames?: { root?: string; item?: string; rail?: string };
}

const SCROLL_OFFSET: ["start 0.8", "end 0.5"] = ["start 0.8", "end 0.5"];
const STAND_FROM = 0.6;
const EARLY = 0.1;
const STAND_ORIGIN = { originX: 0 } as const;
const POP = { type: "spring" as const, ...VIZ_SPRING.pop };

const DOT_CLASS: Record<TimelineStatus, string> = {
  done: "border-primary bg-primary",
  active: "border-primary bg-background",
  next: "border-border bg-background",
};

/**
 * 里程碑时间线. 一条 1px 轨道, 上面一条主色进度线只动 scaleY, 绑定滚动进度且可逆 (往回滚就收回), 用 follow 弹簧跟手.
 * 每项按 video-shotcraft timeline-travel 的弹卡: 以轨道一侧为轴从 0.6 立起, 弹簧 160 / 11 / 0.9 明显过冲,
 * 刚露头就起弹 (到了才弹观众已经错过). 状态用点的填充区分, 当前项 aria-current.
 */
export function Timeline({ items, label, scrollLinked = true, className, classNames }: TimelineProps): JSX.Element {
  const ref = useRef<HTMLOListElement | null>(null);
  const { reduced } = useMotionTokens();
  const { scrollYProgress } = useScroll({ target: ref, offset: SCROLL_OFFSET });
  const progress = useSpring(scrollYProgress, SPRING_FOLLOW);
  const lastDone = items.reduce((at, item, index) => (item.status === TIMELINE_STATUS.done ? index : at), -1);
  const staticFill = items.length > 1 ? Math.max(0, lastDone) / (items.length - 1) : 0;
  const linked = scrollLinked && !reduced;
  return (
    <ol ref={ref} aria-label={label} data-slot="hx-timeline" className={cn("relative flex flex-col gap-8 pl-8", className, classNames?.root)}>
      <span aria-hidden className={cn("absolute bottom-2 left-[7px] top-2 w-px bg-border", classNames?.rail)}>
        <motion.span
          className="absolute inset-0 origin-top bg-primary"
          style={linked ? { scaleY: progress } : { scaleY: staticFill }}
        />
      </span>
      {items.map((item) => {
        const status = item.status ?? TIMELINE_STATUS.next;
        return (
          <motion.li
            key={item.id}
            aria-current={status === TIMELINE_STATUS.active ? "step" : undefined}
            data-state={status}
            className={cn("relative flex flex-col gap-1", classNames?.item)}
            style={STAND_ORIGIN}
            initial={reduced ? false : { opacity: 0, scaleX: STAND_FROM }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true, amount: EARLY }}
            transition={reduced ? { duration: 0 } : POP}
          >
            <span aria-hidden className={cn("absolute -left-8 top-1 size-[15px] rounded-full border", DOT_CLASS[status])} />
            <span className={VIZ_CLASS.caption}>{item.when}</span>
            <span className="text-base font-semibold text-foreground">{item.title}</span>
            {item.detail ? <div className={VIZ_CLASS.panel}>{item.detail}</div> : null}
          </motion.li>
        );
      })}
    </ol>
  );
}
