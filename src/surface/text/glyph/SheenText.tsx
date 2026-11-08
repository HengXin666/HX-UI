"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 GradientText, ShinyText 条目, 实现为 HX 自有.

import { useRef, type ElementType, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { makeAxis, stepAxis } from "../../../motion/drive/axis";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { springFromStiffness } from "../../../motion/spring/fit";
import { approach } from "../../../motion/spring/follow";
import { stepSpringExact } from "../../../motion/spring/step";
import { cn } from "../../../primitives/utils";
import { clamp01 } from "../kernel/curve";
import { usePointerField } from "../kernel/pointer";
import { DOUBLE, HALF, MS_PER_S, PERCENT, SR_ONLY, TEXT_FRAME } from "../kernel/tokens";
import { GRADIENT_ANGLES, GRADIENT_DEFAULTS, GRADIENT_FOLLOW_STIFFNESS, GRADIENT_PULL_TAU_S, SHINE_DEFAULTS, SHINE_FOLLOW_STIFFNESS, SHINE_MIN_SPAN } from "./tokens";

/** 语义色 token 名, 落成 var(--name). */
export type SheenTone = "primary" | "success" | "warning" | "danger" | "foreground" | "muted-foreground";

export interface SheenTextProps {
  readonly text: string;
  /** gradient 渐变在字里流动; shine 一道光带扫过. */
  readonly variant?: "gradient" | "shine";
  /** 渐变色 (token 名). */
  readonly colors?: readonly SheenTone[];
  /** 渐变一圈的时长 (秒). */
  readonly animationSpeed?: number;
  readonly direction?: keyof typeof GRADIENT_ANGLES;
  /** 渐变背景放大倍数. */
  readonly scale?: number;
  /** 光带一趟的时长 (秒). */
  readonly speed?: number;
  /** 两趟之间的停顿 (秒). */
  readonly delay?: number;
  /** 光带角度 (度). 给了也覆盖渐变角度. */
  readonly angle?: number;
  /** 光带宽度 (百分比). */
  readonly shineWidth?: number;
  /** 光带颜色 token. */
  readonly shineTone?: SheenTone;
  /** 光带底下正文的类. */
  readonly baseClassName?: string;
  readonly sweep?: "left" | "right";
  /** loop 一直扫; hover 指针进入扫一趟. */
  readonly trigger?: "loop" | "hover";
  /** 来回往返而不是从头再来. */
  readonly yoyo?: boolean;
  readonly pauseOnHover?: boolean;
  /** 渐变或光带跟着指针横向位置走. */
  readonly followPointer?: boolean;
  readonly disabled?: boolean;
  readonly as?: ElementType;
  readonly className?: string;
}

/** 往返或单向的循环相位, 0 到 1. */
export function sheenPhase(t: number, period: number, yoyo: boolean): number {
  if (period <= 0) return 0;
  const k = t / period;
  if (!yoyo) return k - Math.floor(k);
  const m = k % DOUBLE;
  return m <= 1 ? m : DOUBLE - m;
}

/** 光带相位: 扫一趟 sweepMs, 停 restMs; 往返时下一趟反向扫回. */
export function shinePhase(t: number, sweepMs: number, restMs: number, yoyo: boolean): number {
  const lap = Math.max(1, sweepMs) + Math.max(0, restMs);
  const k = Math.floor(t / lap);
  const p = clamp01((t - k * lap) / Math.max(1, sweepMs));
  return yoyo && k % DOUBLE === 1 ? 1 - p : p;
}

const varOf = (tone: SheenTone): string => `var(--${tone})`;

/**
 * 流光字: gradient 让 token 色的渐变在字里流动, shine 让一道光带扫过正文. 相位按时间算, 写样式不重渲染;
 * 跟随指针时位置走临界阻尼弹簧 (解析积分), 指针进出时用一阶跟随在自动相位与指针之间过渡.
 * 减弱动效时渐变静止, 光带不出现.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-glyph.md
 */
export function SheenText({
  text,
  variant = "gradient",
  colors = ["primary", "success", "primary"],
  animationSpeed = GRADIENT_DEFAULTS.animationSpeed,
  direction = "horizontal",
  scale = GRADIENT_DEFAULTS.scale,
  speed = SHINE_DEFAULTS.speed,
  delay = SHINE_DEFAULTS.delay,
  angle,
  shineWidth = SHINE_DEFAULTS.shineWidth,
  shineTone = "foreground",
  baseClassName = "text-muted-foreground",
  sweep = "left",
  trigger = "loop",
  yoyo,
  pauseOnHover = false,
  followPointer = false,
  disabled = false,
  as: Tag = "span",
  className,
}: SheenTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const layer = useRef<HTMLSpanElement>(null);
  const shine = variant === "shine";
  const back = yoyo ?? !shine;
  const clock = useRef(0);
  const axis = useRef(makeAxis(0));
  const pull = useRef(0);
  const live = !reduced && !disabled;
  const spec = springFromStiffness(shine ? SHINE_FOLLOW_STIFFNESS : GRADIENT_FOLLOW_STIFFNESS, 0);
  const deg = angle ?? (shine ? SHINE_DEFAULTS.angle : GRADIENT_ANGLES[direction]);

  const paint = (p: number): void => {
    const el = layer.current;
    if (!el) return;
    if (!shine) {
      el.style.backgroundPosition = `${p * PERCENT}% ${HALF * PERCENT}%`;
      return;
    }
    const at = (sweep === "left" ? p : 1 - p) * (PERCENT + shineWidth * DOUBLE) - shineWidth;
    el.style.backgroundImage = `linear-gradient(${deg}deg, transparent ${at - shineWidth * HALF}%, ${varOf(shineTone)} ${at}%, transparent ${at + shineWidth * HALF}%)`;
  };

  const field = usePointerField(root, (_, kind) => {
    if (trigger === "hover" && kind === "enter" && clock.current >= (speed + delay) * MS_PER_S) clock.current = 0;
    frames.wake();
  }, { enabled: live });

  const frames = useFrameLoop((dt) => {
    const hovered = field.inside;
    if (!(pauseOnHover && hovered)) clock.current += dt;
    const auto = shine ? shinePhase(clock.current, speed * MS_PER_S, delay * MS_PER_S, back) : sheenPhase(clock.current, animationSpeed * MS_PER_S, back);
    const once = trigger === "hover" ? clamp01(clock.current / Math.max(1, speed * MS_PER_S)) : auto;
    pull.current = approach(pull.current, followPointer && hovered ? 1 : 0, dt / MS_PER_S, GRADIENT_PULL_TAU_S);
    const host = root.current;
    axis.current.target = host && host.clientWidth > 0 ? clamp01(field.x / host.clientWidth) : 0;
    stepAxis(axis.current, spec, dt, stepSpringExact);
    paint(once + (axis.current.current - once) * pull.current);
    return trigger === "loop" || once < 1 || pull.current > SHINE_MIN_SPAN / PERCENT;
  }, { ...TEXT_FRAME, active: live });

  const gradient = `linear-gradient(${deg}deg, ${colors.map(varOf).join(", ")})`;
  if (!shine) {
    return (
      <Tag ref={root} data-slot="sheen-text" className={className}>
        <span className={SR_ONLY}>{text}</span>
        <span ref={layer} aria-hidden="true" className="bg-clip-text text-transparent" style={{ backgroundImage: gradient, backgroundSize: `${scale * PERCENT}% ${scale * PERCENT}%`, backgroundPosition: "0% 50%" }}>
          {text}
        </span>
      </Tag>
    );
  }
  return (
    <Tag ref={root} data-slot="sheen-text" className={cn("relative inline-block", className)}>
      <span className={SR_ONLY}>{text}</span>
      <span aria-hidden="true" className={baseClassName}>{text}</span>
      {live ? <span ref={layer} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-clip-text text-transparent">{text}</span> : null}
    </Tag>
  );
}
