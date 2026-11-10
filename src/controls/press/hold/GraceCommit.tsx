"use client";
// 行为规格参照 docs/research/catalog/micro.md 的 FuseButton 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type CSSProperties, type JSX, type ReactNode } from "react";
import { PRESS_SCALE, FOCUS_RING } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { PLAIN_EASE, PRESS_EASE_OUT, PRESS_FEEDBACK_MS, transitionOf } from "../tokens";
import { useDrivenValue } from "../../../motion/drive/use-driven-value";

export const GRACE_DEFAULTS = { radius: 22, undoWindow: 4000, crossfadeMs: 200 } as const;
/** 引线是 1px 线, 与库的线宽规则一致. */
export const GRACE_FUSE_PX = 1;

export type GracePhase = "idle" | "armed" | "done";
export type GraceFuse = "outline" | "bar";
export type GraceCommitOn = "press" | "end";
export type GraceSettle = "reset" | "done";
export type GraceSize = "sm" | "md" | "lg";

const IDLE: GracePhase = "idle";
const ARMED: GracePhase = "armed";
const DONE: GracePhase = "done";
const ON_PRESS: GraceCommitOn = "press";
const SIZE_CLASS: Record<GraceSize, string> = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-5 text-base" };

export interface GraceCommitProps {
  readonly label?: ReactNode;
  readonly undoLabel?: ReactNode;
  readonly doneLabel?: ReactNode;
  readonly icon?: ReactNode;
  readonly size?: GraceSize;
  readonly radius?: number;
  /** 撤销窗口 ms, 引线烧完即落定. */
  readonly undoWindow?: number;
  readonly fuse?: GraceFuse;
  readonly crossfadeMs?: number;
  /** press: 按下即提交, 撤销时回滚; end: 引线烧完才提交. */
  readonly commitOn?: GraceCommitOn;
  readonly pauseOnHover?: boolean;
  /** 烧完后回到 idle 还是停在 done. */
  readonly settle?: GraceSettle;
  readonly disabled?: boolean;
  readonly onCommit?: () => void;
  readonly onUndo?: () => void;
  readonly onFuseEnd?: () => void;
  readonly onPhaseChange?: (phase: GracePhase) => void;
  readonly className?: string;
  readonly type?: "button" | "submit";
}

/**
 * 带撤销窗口的提交. 按下点燃引线, 窗口内再按一次撤销; 悬停或页面隐藏时引线暂停.
 * 引线时长是功能信息, 减弱动效时照常计时, 只去掉缩放与淡变.
 */
export function GraceCommit({
  label = "Archive",
  undoLabel = "Undo",
  doneLabel = "Archived",
  icon,
  size = "md",
  radius = GRACE_DEFAULTS.radius,
  undoWindow = GRACE_DEFAULTS.undoWindow,
  fuse = "outline",
  crossfadeMs = GRACE_DEFAULTS.crossfadeMs,
  commitOn = ON_PRESS,
  pauseOnHover = true,
  settle = "reset",
  disabled = false,
  onCommit,
  onUndo,
  onFuseEnd,
  onPhaseChange,
  className,
  type = "button",
}: GraceCommitProps): JSX.Element {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<GracePhase>(IDLE);
  const [pressed, setPressed] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const hovered = useRef(false);
  const ref = useRef<HTMLButtonElement>(null);

  const go = (next: GracePhase): void => {
    setPhase(next);
    onPhaseChange?.(next);
  };

  const burn = useDrivenValue(0, false, (value) => {
    if (value < 1) return;
    onFuseEnd?.();
    if (commitOn !== ON_PRESS) onCommit?.();
    go(settle === "reset" ? IDLE : DONE);
    burn.jump(0);
  });

  const syncPause = (): void => {
    burn.pause((pauseOnHover && hovered.current) || document.visibilityState === "hidden");
  };

  useEffect(() => {
    document.addEventListener("visibilitychange", syncPause);
    return () => document.removeEventListener("visibilitychange", syncPause);
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = (): void => setBox({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const press = (): void => {
    if (disabled || phase === DONE) return;
    if (phase === ARMED) {
      burn.jump(0);
      onUndo?.();
      go(IDLE);
      return;
    }
    if (commitOn === ON_PRESS) onCommit?.();
    go(ARMED);
    burn.jump(0);
    syncPause();
    burn.tween(1, undoWindow);
  };

  const fade = transitionOf([["opacity", crossfadeMs, PLAIN_EASE]], reduced);
  const shell: CSSProperties = {
    borderRadius: radius,
    transform: pressed && !reduced ? `scale(${PRESS_SCALE})` : undefined,
    transition: transitionOf([["transform", PRESS_FEEDBACK_MS, PRESS_EASE_OUT], ["background-color", PRESS_FEEDBACK_MS, PLAIN_EASE]], reduced),
  };
  const perimeter = 2 * (box.w + box.h);
  const left = 1 - burn.value;
  const labels: Array<[GracePhase, ReactNode]> = [
    [IDLE, label],
    [ARMED, undoLabel],
    [DONE, doneLabel],
  ];

  return (
    <button
      ref={ref}
      type={type}
      data-slot="grace-commit"
      data-phase={phase}
      disabled={disabled || phase === DONE}
      onClick={press}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerEnter={() => {
        hovered.current = true;
        syncPause();
      }}
      onPointerLeave={() => {
        hovered.current = false;
        setPressed(false);
        syncPause();
      }}
      className={cn(
        "relative inline-grid select-none place-items-center border border-border bg-muted font-medium text-foreground", FOCUS_RING, "disabled:cursor-not-allowed disabled:opacity-50 data-[phase=armed]:bg-accent",
        SIZE_CLASS[size],
        className,
      )}
      style={shell}
    >
      {labels.map(([key, text]) => (
        <span key={key} aria-hidden={phase !== key} className="col-start-1 row-start-1 inline-flex items-center gap-2" style={{ opacity: phase === key ? 1 : 0, transition: fade }}>
          {key === IDLE ? icon : null}
          {text}
        </span>
      ))}
      {phase === ARMED && fuse === "outline" && perimeter > 0 ? (
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible text-warning">
          <rect x={0} y={0} width={box.w} height={box.h} rx={radius} fill="none" stroke="currentColor" strokeWidth={GRACE_FUSE_PX} pathLength={1} strokeDasharray={`${left} 1`} />
        </svg>
      ) : null}
      {phase === ARMED && fuse === "bar" ? <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-warning" style={{ transform: `scaleX(${left})` }} /> : null}
      <span className="sr-only" aria-live="polite">
        {phase === ARMED ? undoLabel : phase === DONE ? doneLabel : ""}
      </span>
    </button>
  );
}
