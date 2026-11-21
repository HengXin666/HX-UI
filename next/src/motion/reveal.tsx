import { m, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { reveal, spring, type RevealPreset } from "./presets";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate"> {
  preset?: RevealPreset;
  delay?: number;
  /** 进入视口才播放 (默认). false 时挂载即播. */
  inView?: boolean;
  /** 只播一次 (默认 true) */
  once?: boolean;
}

/** 视口内入场. 减弱动效时直接显示终态. */
export function Reveal({ preset = "up", delay = 0, inView = true, once = true, transition, ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <m.div {...rest} />;
  const trigger = inView
    ? { whileInView: "show", viewport: { once, margin: "0px 0px -10% 0px" } }
    : { animate: "show" };
  return (
    <m.div
      variants={reveal[preset]}
      initial="hidden"
      {...trigger}
      transition={{ ...spring.smooth, delay, ...transition }}
      {...rest}
    />
  );
}

interface StaggerProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial"> {
  /** 首项间隔 (秒). 后续间隔逐渐缩短, 群体入场越来越快, 不是匀速. */
  gap?: number;
  delay?: number;
  once?: boolean;
}

/** 子项交错入场, 配合 <StaggerItem>. */
export function Stagger({ gap = 0.08, delay = 0, once = true, ...rest }: StaggerProps) {
  const reduce = useReducedMotion();
  if (reduce) return <m.div {...rest} />;
  return (
    <m.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "0px 0px -10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
      {...rest}
    />
  );
}

export function StaggerItem({ preset = "up", ...rest }: Omit<HTMLMotionProps<"div">, "variants"> & { preset?: RevealPreset }) {
  return <m.div variants={reveal[preset]} transition={spring.smooth} {...rest} />;
}

export type { RevealProps, StaggerProps };
