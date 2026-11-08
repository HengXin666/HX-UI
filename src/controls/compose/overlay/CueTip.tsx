"use client";

/**
 * 行为规格参照 catalog/micro.md 的 WarmTooltip 条目, 只作出处说明; 实现与命名为 HX 自有.
 */
import { useCallback, useEffect, useId, useRef, useState, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { CUE, CUE_SIDE, type CueSide, type CueSize, type HxColor } from "../tokens";
import { CueBubble } from "./parts/cue/CueBubble";
import { isWarm, warmth } from "./parts/cue/cue-warmth";
import { useCueDismiss } from "./parts/cue/use-cue-dismiss";
import { isTouch, useCuePointer } from "./parts/cue/use-cue-pointer";
import { useCueTravel } from "./parts/cue/use-cue-travel";

export { isWarm, leanFor, resetCueWarmth } from "./parts/cue/cue-warmth";

const VERTICAL = new Set<CueSide>([CUE_SIDE.top, CUE_SIDE.bottom]);
const FUSE_FROM = "scaleX(0)";
const FUSE_TO = "scaleX(1)";

export interface CueTipProps {
  readonly content: ReactNode;
  /** 快捷键提示, 以 kbd 排在文字右侧. */
  readonly shortcut?: ReactNode;
  readonly children: ReactNode;
  readonly side?: CueSide;
  /** 冷启动时悬停多久才弹出 (ms). */
  readonly delay?: number;
  /** 上一个提示收起后多久内算 "热", 热时立即弹出并从上一个位置滑过来 (ms). */
  readonly warmWindow?: number;
  /** 热切换时从旧位置滑到新位置的时长 (ms). */
  readonly travel?: number;
  /** 指针速度带来的倾斜上限 (度), 0 关闭. */
  readonly lean?: number;
  readonly surfaceColor?: HxColor;
  readonly inkColor?: HxColor;
  readonly size?: CueSize;
  readonly radius?: number;
  readonly gap?: number;
  readonly arrow?: boolean;
  readonly popDuration?: number;
  readonly popScale?: number;
  readonly popBlur?: number;
  /** 等待期间在触发件底部画一条 1px 引线. */
  readonly showFuse?: boolean;
  /** 触屏长按多久弹出 (ms), 0 关闭. */
  readonly longPress?: number;
  readonly disabled?: boolean;
  readonly onWarmChange?: (warm: boolean) => void;
  readonly onOpenChange?: (open: boolean) => void;
  readonly className?: string;
}

/**
 * 暖提示: 冷启动悬停 delay 后弹出; 收起后 warmWindow 内碰到下一个触发件立即弹出,
 * 并从上一个气泡的位置以弹簧滑过来. 指针横扫时气泡按速度微倾, 倾斜是保留速度的弹簧.
 * 触屏长按弹出, 滑开 holdSlop 取消; 滚动, 缩放, 切后台, 点别处与 Esc 都收起.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-compose.md
 */
export function CueTip({
  content,
  shortcut,
  children,
  side = CUE_SIDE.top,
  delay = CUE.delayMs,
  warmWindow = CUE.warmWindowMs,
  travel = CUE.travelMs,
  lean = 0,
  surfaceColor = "popover",
  inkColor = "popover-foreground",
  size = "md",
  radius = CUE.radius,
  gap = CUE.gap,
  arrow = false,
  popDuration = CUE.popMs,
  popScale = CUE.popScale,
  popBlur = CUE.popBlurPx,
  showFuse = false,
  longPress = CUE.longPressMs,
  disabled = false,
  onWarmChange,
  onOpenChange,
  className,
}: CueTipProps): JSX.Element {
  const reduced = useReducedMotion();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [warmOpen, setWarmOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const travelRef = useRef<HTMLSpanElement>(null);
  const leanRef = useRef<HTMLSpanElement>(null);
  const fuseRef = useRef<HTMLSpanElement>(null);
  const openTimer = useRef(0);
  const closeTimer = useRef(0);
  const fuseAnim = useRef<Animation | null>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const vertical = VERTICAL.has(side);

  const channels = useCueTravel({ travelRef, leanRef, bubbleRef, travel, open, warmOpen, reduced });

  const clearTimers = useCallback((): void => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
    openTimer.current = 0;
    closeTimer.current = 0;
  }, []);

  const stopFuse = useCallback((): void => {
    fuseAnim.current?.cancel();
    fuseAnim.current = null;
  }, []);

  const show = useCallback(
    (warm: boolean): void => {
      stopFuse();
      setWarmOpen(warm);
      setOpen(true);
      onWarmChange?.(warm);
      onOpenChange?.(true);
    },
    [onOpenChange, onWarmChange, stopFuse],
  );

  const hide = useCallback((): void => {
    clearTimers();
    stopFuse();
    if (!openRef.current) return;
    const rect = bubbleRef.current?.getBoundingClientRect();
    warmth.rect = rect && rect.width > 0 ? rect : null;
    warmth.closedAt = performance.now();
    setOpen(false);
    onOpenChange?.(false);
  }, [clearTimers, onOpenChange, stopFuse]);

  const arm = useCallback(
    (wait: number): void => {
      if (disabled) return;
      window.clearTimeout(closeTimer.current);
      closeTimer.current = 0;
      if (openRef.current || openTimer.current) return;
      const warm = isWarm(performance.now(), warmth.closedAt, warmWindow);
      if (warm || wait <= 0) {
        show(warm);
        return;
      }
      if (showFuse && !reduced) {
        fuseAnim.current = fuseRef.current?.animate?.([{ transform: FUSE_FROM }, { transform: FUSE_TO }], { duration: wait, easing: "linear", fill: "forwards" }) ?? null;
      }
      openTimer.current = window.setTimeout(() => {
        openTimer.current = 0;
        show(false);
      }, wait);
    },
    [disabled, reduced, show, showFuse, warmWindow],
  );

  /** 离开后留 grace 毫秒, 指针掠过缝隙不闪. */
  const release = useCallback((): void => {
    window.clearTimeout(openTimer.current);
    openTimer.current = 0;
    stopFuse();
    if (!openRef.current) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(hide, CUE.graceMs);
  }, [hide, stopFuse]);

  useCueDismiss(open, wrapRef, hide);

  useEffect(() => {
    if (disabled) hide();
  }, [disabled, hide]);

  useEffect(
    () => () => {
      clearTimers();
      stopFuse();
    },
    [clearTimers, stopFuse],
  );

  const { onPointerMove, onPointerDown, onPointerUp, resetPointer } = useCuePointer({ channels, openTimer, lean, side, vertical, reduced, longPress, disabled, show });

  return (
    <span
      ref={wrapRef}
      data-slot="cue-tip"
      data-state={open ? "open" : "closed"}
      aria-describedby={open ? id : undefined}
      className={cn("relative inline-flex", className)}
      onPointerEnter={(e) => {
        if (!isTouch(e)) arm(delay);
      }}
      onPointerLeave={(e) => {
        if (!isTouch(e)) release();
        resetPointer();
      }}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onFocus={() => arm(delay)}
      onBlur={release}
    >
      {children}
      {showFuse ? (
        <span ref={fuseRef} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-primary" style={{ transform: FUSE_FROM }} />
      ) : null}
      <CueBubble
        bubbleRef={bubbleRef}
        travelRef={travelRef}
        leanRef={leanRef}
        id={id}
        open={open}
        warmOpen={warmOpen}
        reduced={reduced}
        side={side}
        vertical={vertical}
        gap={gap}
        popDuration={popDuration}
        popScale={popScale}
        popBlur={popBlur}
        surfaceColor={surfaceColor}
        inkColor={inkColor}
        size={size}
        radius={radius}
        arrow={arrow}
        content={content}
        shortcut={shortcut}
      />
    </span>
  );
}
