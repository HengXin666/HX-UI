"use client";
// 行为规格参照 docs/research/catalog/micro.md 的 PulseHeart 条目, 实现为 HX 自有.

import { HeartIcon, StarIcon, ThumbsUpIcon, type LucideIcon } from "lucide-react";
import { useRef, useState, type JSX } from "react";
import { ease } from "../../../craft/ease";
import { PRESS_SCALE } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { DOUBLE, FADE_MS, HALF, PERCENT, PLAIN_EASE, PRESS_EASE_OUT, PRESS_FEEDBACK_MS, transitionOf } from "../tokens";
import { useDrivenValue } from "../../../motion/drive/use-driven-value";

/** 粒子外飞占整段时长的比例, 其后只淡出. */
export const LIKE_OUT = 0.4;
export const LIKE_DEFAULTS = { size: 40, corner: 32, duration: 560, dotSize: 0.3, overshoot: 1.7, beat: 3, rollDuration: 350 } as const;
/** 粒子数与心跳幅度: 规格只给了 beat 与 dotSize, 这两个数由本库定. */
export const LIKE_DOTS = 6;
export const LIKE_BEAT_AMP = 0.06;
/** 粒子外飞距离, 以图标尺寸为单位. */
export const LIKE_REACH = 0.9;

export type LikeIcon = "heart" | "star" | "thumb";
const ICONS: Record<LikeIcon, LucideIcon> = { heart: HeartIcon, star: StarIcon, thumb: ThumbsUpIcon };
const TURN = Math.PI * DOUBLE;

/*
 * ENGINE-GAP: craft/ease 只有固定控制点的 overshoot 曲线, 没有可调过冲量的 back-out.
 * 规格的 overshoot=1.7 是 back-out 的 s 参数, 先在这里局部实现.
 */
export function backOut(t: number, s: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const u = t - 1;
  return u * u * ((s + 1) * u + s) + 1;
}

/** 点亮那一下的图标缩放: back-out 弹出, 叠 beat 次逐渐衰减的心跳. */
export function likeScale(k: number, overshoot: number, beat: number): number {
  if (k >= 1) return 1;
  return backOut(k, overshoot) * (1 + LIKE_BEAT_AMP * (1 - k) * Math.sin(k * beat * TURN));
}

export interface LikeBurstProps {
  readonly defaultLiked?: boolean;
  readonly count?: number;
  readonly onChange?: (liked: boolean, count: number) => void;
  readonly showCount?: boolean;
  readonly icon?: LikeIcon;
  readonly idleOutline?: boolean;
  readonly size?: number;
  readonly corner?: number;
  readonly duration?: number;
  readonly dotSize?: number;
  readonly overshoot?: number;
  readonly beat?: number;
  readonly rollDuration?: number;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly className?: string;
}

/**
 * 点赞. 点亮时图标 back-out 弹出并跳 beat 下, 一圈粒子外飞后淡出, 计数纵向滚一格.
 * 取消点亮只换色不弹. 减弱动效时只换色和数字.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-press.md
 */
export function LikeBurst({
  defaultLiked = false,
  count = 0,
  onChange,
  showCount = true,
  icon = "heart",
  idleOutline = true,
  size = LIKE_DEFAULTS.size,
  corner = LIKE_DEFAULTS.corner,
  duration = LIKE_DEFAULTS.duration,
  dotSize = LIKE_DEFAULTS.dotSize,
  overshoot = LIKE_DEFAULTS.overshoot,
  beat = LIKE_DEFAULTS.beat,
  rollDuration = LIKE_DEFAULTS.rollDuration,
  disabled = false,
  label = "Like",
  className,
}: LikeBurstProps): JSX.Element {
  const reduced = useReducedMotion();
  const [liked, setLiked] = useState(defaultLiked);
  const [pressed, setPressed] = useState(false);
  const shown = count + (liked && !defaultLiked ? 1 : 0) - (!liked && defaultLiked ? 1 : 0);
  const previous = useRef(shown);
  const burst = useDrivenValue(1, reduced);
  const roll = useDrivenValue(1, reduced);
  const Icon = ICONS[icon];
  const glyph = size * HALF;

  const toggle = (): void => {
    if (disabled) return;
    const next = !liked;
    previous.current = shown;
    setLiked(next);
    onChange?.(next, shown + (next ? 1 : -1));
    roll.jump(0);
    roll.tween(1, rollDuration, (t) => ease("out", t));
    if (next) {
      burst.jump(0);
      burst.tween(1, duration);
    }
  };

  const k = burst.value;
  const scale = liked ? likeScale(k, overshoot, beat) : 1;
  const travel = Math.min(1, k / LIKE_OUT);
  const fade = k < LIKE_OUT ? 1 : 1 - (k - LIKE_OUT) / (1 - LIKE_OUT);
  const r = roll.value;

  return (
    <button
      type="button"
      data-slot="like-burst"
      aria-pressed={liked}
      aria-label={showCount ? `${label}, ${shown}` : label}
      disabled={disabled}
      onClick={toggle}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={cn(
        "relative inline-flex select-none items-center gap-1.5 border border-border bg-muted pr-3 text-sm font-medium text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        !showCount && "pr-0",
        className,
      )}
      style={{ height: size, borderRadius: corner }}
    >
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size, transform: pressed && !reduced ? `scale(${PRESS_SCALE})` : undefined, transition: transitionOf([["transform", PRESS_FEEDBACK_MS, PRESS_EASE_OUT]], reduced) }}
      >
        <Icon
          aria-hidden
          className={cn(liked ? "fill-current text-danger" : "text-muted-foreground", !liked && !idleOutline && "fill-current")}
          style={{ width: glyph, height: glyph, transform: `scale(${scale})`, transition: transitionOf([["color", PRESS_FEEDBACK_MS, PLAIN_EASE]], reduced) }}
        />
        {liked && k < 1 && !reduced
          ? Array.from({ length: LIKE_DOTS }, (_, i) => {
              const angle = (i / LIKE_DOTS) * TURN;
              const distance = travel * glyph * LIKE_REACH;
              return (
                <span
                  key={i}
                  aria-hidden
                  className="pointer-events-none absolute rounded-full bg-danger"
                  style={{ width: glyph * dotSize, height: glyph * dotSize, opacity: fade, transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(${1 - travel * HALF})` }}
                />
              );
            })
          : null}
      </span>
      {showCount ? (
        <span aria-hidden className="relative inline-grid overflow-hidden tabular-nums" style={{ transition: transitionOf([["color", FADE_MS, PLAIN_EASE]], reduced) }}>
          <span className="col-start-1 row-start-1" style={{ transform: `translateY(${(1 - r) * PERCENT}%)` }}>
            {shown}
          </span>
          {r < 1 ? (
            <span className="col-start-1 row-start-1" style={{ transform: `translateY(${-r * PERCENT}%)` }}>
              {previous.current}
            </span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}

