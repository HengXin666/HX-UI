"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 BounceCards 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import * as B from "./parts/bounce-spec";
import { KIT_FOCUS, kitTone, transitionOf, useKitMotion, type KitTone } from "../tokens";

export { BOUNCE_DEFAULTS, hoverPose, popDelay, restPose, type BouncePose } from "./parts/bounce-spec";

export interface SpreadImage {
  readonly src: string;
  readonly alt: string;
}

export interface SpreadCardsProps {
  readonly images: readonly SpreadImage[];
  readonly containerWidth?: number;
  readonly containerHeight?: number;
  readonly cardSize?: number;
  readonly spread?: number;
  readonly rotation?: number;
  readonly arc?: number;
  /** 入场延迟 s 与每张错峰 s. */
  readonly animationDelay?: number;
  readonly animationStagger?: number;
  /** 0 无回弹, 1 回弹最多. */
  readonly bounciness?: number;
  readonly enableHover?: boolean;
  readonly pushDistance?: number;
  readonly hoverScale?: number;
  readonly borderWidth?: number;
  readonly borderTone?: KitTone;
  readonly radius?: number;
  readonly shadow?: boolean;
  /** 覆盖默认摆位: 每张给 x, y px 与转角 deg. */
  readonly poses?: readonly Omit<B.BouncePose, "scale">[];
  readonly onCardClick?: (index: number) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 弹开卡片: 一排照片卡以中间为轴扇形错开, 挂上后延迟 0.5s 按 0.06s 错峰从 0 弹出 (劲度 170);
 * 指针或焦点停在一张上时它摆正放大, 两侧各推开 pushDistance (劲度 210). 回弹量由 bounciness 定. 方向键移焦. 减弱动效时不弹出, 换位直接到位.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
export function SpreadCards({
  images,
  containerWidth = B.BOUNCE_DEFAULTS.containerWidth,
  containerHeight = B.BOUNCE_DEFAULTS.containerHeight,
  cardSize = B.BOUNCE_DEFAULTS.cardSize,
  spread = B.BOUNCE_DEFAULTS.spread,
  rotation = B.BOUNCE_DEFAULTS.rotation,
  arc = B.BOUNCE_DEFAULTS.arc,
  animationDelay = B.BOUNCE_DEFAULTS.animationDelay,
  animationStagger = B.BOUNCE_DEFAULTS.animationStagger,
  bounciness = B.BOUNCE_DEFAULTS.bounciness,
  enableHover = true,
  pushDistance = B.BOUNCE_DEFAULTS.pushDistance,
  hoverScale = B.BOUNCE_DEFAULTS.hoverScale,
  borderWidth = B.BOUNCE_DEFAULTS.borderWidth,
  borderTone = "background",
  radius = B.BOUNCE_DEFAULTS.radius,
  shadow = true,
  poses,
  onCardClick,
  ariaLabel = "Cards",
  className,
}: SpreadCardsProps): JSX.Element {
  const reduced = useReducedMotion();
  const n = images.length;
  const nodes = useRef<Array<HTMLButtonElement | null>>([]);
  const [hot, setHot] = useState(-1);

  const motion = useKitMotion((m) => {
    nodes.current.forEach((node, i) => {
      if (node) node.style.transform = `translate(-50%, -50%) translate(${m.get(`x${i}`)}px, ${m.get(`y${i}`)}px) rotate(${m.get(`r${i}`)}deg) scale(${m.get(`s${i}`)})`;
    });
  }, reduced);

  const rest = (i: number): B.BouncePose => {
    const own = poses?.[i];
    return own ? { ...own, scale: 1 } : B.restPose(i, n, spread, rotation, arc);
  };

  // 入场: 从 0 弹出
  useEffect(() => {
    const still = reduced || prefersReducedMotion();
    for (let i = 0; i < n; i += 1) {
      const pose = rest(i);
      motion.jump(`x${i}`, pose.x);
      motion.jump(`y${i}`, pose.y);
      motion.jump(`r${i}`, pose.rotate);
      if (still) motion.jump(`s${i}`, 1);
      else {
        motion.jump(`s${i}`, 0);
        motion.spring(`s${i}`, 1, B.popSpring(bounciness), 0, B.popDelay(i, animationDelay, animationStagger));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  // 悬停换位
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const spec = B.hoverSpring(bounciness);
    for (let i = 0; i < n; i += 1) {
      const pose = B.hoverPose(i, enableHover ? hot : -1, rest(i), pushDistance, hoverScale);
      motion.spring(`x${i}`, pose.x, spec);
      motion.spring(`y${i}`, pose.y, spec);
      motion.spring(`r${i}`, pose.rotate, spec);
      motion.spring(`s${i}`, pose.scale, spec);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hot, enableHover, spread, rotation, arc, pushDistance, hoverScale, bounciness]);

  const onKey = (event: KeyboardEvent<HTMLButtonElement>, i: number): void => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    nodes.current[(i + step + n) % n]?.focus();
  };

  return (
    <div role="group" aria-label={ariaLabel} data-slot="spread-cards" className={cn("relative", className)} style={{ width: containerWidth, height: containerHeight }} onMouseLeave={() => setHot(-1)}>
      {images.map((image, i) => (
        <button
          key={i}
          type="button"
          ref={(node) => {
            nodes.current[i] = node;
          }}
          aria-label={image.alt}
          data-slot="spread-cards-card"
          onMouseEnter={() => setHot(i)}
          onFocus={() => setHot(i)}
          onBlur={() => setHot(-1)}
          onKeyDown={(event) => onKey(event, i)}
          onClick={() => onCardClick?.(i)}
          className={cn("absolute left-1/2 top-1/2 overflow-hidden p-0", KIT_FOCUS)}
          style={{
            width: cardSize,
            height: cardSize,
            borderRadius: radius,
            border: `${borderWidth}px solid ${kitTone(borderTone)}`,
            boxShadow: shadow ? (hot === i ? "var(--shadow-2xl)" : "var(--shadow-lg)") : undefined,
            zIndex: hot === i ? n + 1 : i + 1,
            transition: transitionOf([["box-shadow", B.BOUNCE_SHADOW_MS, "ease"]], reduced),
          }}
        >
          <img src={image.src} alt="" draggable={false} className="block h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
}
