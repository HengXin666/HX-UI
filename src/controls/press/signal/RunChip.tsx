"use client";
// 行为规格参照 docs/research/catalog/micro.md 的 CallChip 条目, 实现为 HX 自有.

import { FileIcon, PencilIcon, SearchIcon, TerminalIcon, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type JSX, type RefObject } from "react";
import { PRESS_SCALE } from "../../../craft/tokens";
import { prefersReducedMotion } from "../../../primitives/motion";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { FADE_MS, MS_PER_SECOND, PERCENT, PLAIN_EASE, PRESS_EASE_OUT, PRESS_FEEDBACK_MS, QUICK_MS, shakeFrames, transitionOf } from "../tokens";

/** 运行中进度在预期时长到达这里后停住, 只有真正完成才走满. */
export const RUN_HOLD_AT = 0.9;
export const RUN_SHAKE_MS = 450;
export const RUN_TIMING = { wash: 400, washDelay: 200, swapIn: 240, swapOut: 160, settle: 200 } as const;
export const RUN_DEFAULTS = { expectedMs: 2500, size: 34, radius: 10, progressOpacity: 0.08, washOpacity: 0.14, shake: 6 } as const;
/** 计时显示的小数位. */
const TIMER_DIGITS = 1;

export type RunStatus = "running" | "done" | "error";
export type RunIcon = "terminal" | "file" | "search" | "edit";
const RUNNING: RunStatus = "running";
const ERROR: RunStatus = "error";
const ICONS: Record<RunIcon, LucideIcon> = { terminal: TerminalIcon, file: FileIcon, search: SearchIcon, edit: PencilIcon };
const WASH: Record<RunStatus, string> = { running: "bg-transparent", done: "bg-success", error: "bg-danger" };

export interface RunChipProps {
  readonly icon?: RunIcon;
  readonly name?: string;
  readonly argument?: string;
  readonly status?: RunStatus;
  /** 预期耗时 ms, 决定运行中进度条的速度. */
  readonly expectedMs?: number;
  readonly size?: number;
  readonly radius?: number;
  readonly progressOpacity?: number;
  readonly washOpacity?: number;
  /** 出错抖动的幅度 px. */
  readonly shake?: number;
  readonly showTimer?: boolean;
  /** 给了它, 出错时整枚芯片可点重试. */
  readonly onRetry?: () => void;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/** 运行中进度: 线性走到 RUN_HOLD_AT (用时 expectedMs) 后停住. */
export function runProgress(elapsedMs: number, expectedMs: number): number {
  if (expectedMs <= 0) return RUN_HOLD_AT;
  return Math.min(RUN_HOLD_AT, (elapsedMs / expectedMs) * RUN_HOLD_AT);
}

/**
 * 工具调用芯片. 运行中显示进度与计时, 完成或出错时底色从左向右刷开; 出错抖一下, 有 onRetry 时可点重试.
 * 进度与计时属于状态信息, 减弱动效时照常更新, 去掉抖动, 刷开和淡变.
 */
export function RunChip({
  icon = "terminal",
  name = "bash",
  argument = "npm test",
  status = RUNNING,
  expectedMs = RUN_DEFAULTS.expectedMs,
  size = RUN_DEFAULTS.size,
  radius = RUN_DEFAULTS.radius,
  progressOpacity = RUN_DEFAULTS.progressOpacity,
  washOpacity = RUN_DEFAULTS.washOpacity,
  shake = RUN_DEFAULTS.shake,
  showTimer = true,
  onRetry,
  className,
  style,
}: RunChipProps): JSX.Element {
  const reduced = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const [pressed, setPressed] = useState(false);
  const started = useRef(0);
  const root = useRef<HTMLElement>(null);
  const running = status === RUNNING;

  useEffect(() => {
    if (!running) return undefined;
    started.current = performance.now();
    setElapsed(0);
    let frame = 0;
    const tick = (now: number): void => {
      setElapsed(now - started.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  useEffect(() => {
    // 首帧 useReducedMotion 还是初值, 直接读一次媒体查询, 挂载即出错时也不抖
    if (status !== ERROR || reduced || prefersReducedMotion()) return;
    root.current?.animate?.(shakeFrames(shake), { duration: RUN_SHAKE_MS, composite: "add" });
  }, [status, reduced, shake]);

  const Icon = ICONS[icon];
  const progress = running ? runProgress(elapsed, expectedMs) : 1;
  const retry = status === ERROR && onRetry ? onRetry : undefined;
  const swap = (entering: boolean): string => {
    const ms = entering ? RUN_TIMING.swapIn : RUN_TIMING.swapOut;
    return transitionOf([["opacity", ms, PRESS_EASE_OUT], ["transform", ms, PRESS_EASE_OUT], ["filter", ms, PRESS_EASE_OUT]], reduced);
  };
  const body = (
    <>
      <span aria-hidden className="absolute inset-y-0 left-0 bg-foreground" style={{ width: `${progress * PERCENT}%`, opacity: running ? progressOpacity : 0, transition: transitionOf([["opacity", RUN_TIMING.settle, PLAIN_EASE]], reduced) }} />
      <span
        aria-hidden
        className={cn("absolute inset-0", WASH[status])}
        style={{
          opacity: washOpacity,
          clipPath: running ? "inset(0 100% 0 0)" : "inset(0 0 0 0)",
          transition: transitionOf([["background-color", QUICK_MS, PLAIN_EASE], ["clip-path", RUN_TIMING.wash, PRESS_EASE_OUT, RUN_TIMING.washDelay]], reduced),
        }}
      />
      <Icon aria-hidden className="relative size-3.5 shrink-0 text-muted-foreground" />
      <span className="relative font-medium">{name}</span>
      <span className="relative truncate font-mono text-muted-foreground">{argument}</span>
      {showTimer ? (
        <span className="relative ml-auto tabular-nums text-muted-foreground" style={{ opacity: running ? 1 : 0, filter: running ? "none" : "blur(2px)", transition: swap(running) }}>
          {(elapsed / MS_PER_SECOND).toFixed(TIMER_DIGITS)}s
        </span>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {status}
      </span>
    </>
  );
  const shell = cn(
    "relative inline-flex max-w-full select-none items-center gap-2 overflow-hidden border border-border bg-muted px-2.5 text-xs text-foreground outline-none",
    retry && "cursor-pointer focus-visible:ring-1 focus-visible:ring-ring",
    className,
  );
  const shellStyle: CSSProperties = {
    height: size,
    borderRadius: radius,
    transform: pressed && retry && !reduced ? `scale(${PRESS_SCALE})` : undefined,
    transition: transitionOf([["transform", PRESS_FEEDBACK_MS, PRESS_EASE_OUT], ["background-color", FADE_MS, PLAIN_EASE]], reduced),
    ...style,
  };

  if (retry) {
    return (
      <button
        ref={root as RefObject<HTMLButtonElement>}
        type="button"
        data-slot="run-chip"
        data-status={status}
        aria-label={`${name} ${argument}: ${status}, retry`}
        className={shell}
        style={shellStyle}
        onClick={retry}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        {body}
      </button>
    );
  }
  return (
    <span ref={root as RefObject<HTMLSpanElement>} role="status" data-slot="run-chip" data-status={status} aria-busy={running} className={shell} style={shellStyle}>
      {body}
    </span>
  );
}
