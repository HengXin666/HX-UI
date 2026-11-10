"use client";

/**
 * 行为规格参照 catalog/micro.md 的 ThoughtLine 条目, 只作出处说明; 实现与命名为 HX 自有.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { BUTTON_TYPE, CURRENT_COLOR, COMPOSE_EASE_IN_OUT, COMPOSE_EASE_OUT, EASE_LINEAR, MS_PER_S, PX, TRACE, colorVar, type HxColor } from "../tokens";
import { TRACE_GLYPH, TraceGlyphMark, type TraceGlyph } from "./parts/TraceGlyphMark";
import { TraceStepRow, type TraceStep } from "./parts/TraceStepRow";
import { breathTrough, fadeTo, glyphSwapAt } from "./parts/trace-motion";
import { FOCUS_RING } from "../../../craft/tokens";

export { TRACE_GLYPH, type TraceGlyph } from "./parts/TraceGlyphMark";
export { type TraceStep } from "./parts/TraceStepRow";
export { breathTrough, glyphSwapAt } from "./parts/trace-motion";

export interface ReasoningTraceProps {
  readonly label?: string;
  /** 落定后的文字; 空串沿用 label. */
  readonly doneLabel?: string;
  readonly renderLabel?: (label: string, working: boolean) => ReactNode;
  readonly glyph?: TraceGlyph | ReactNode;
  readonly steps?: readonly TraceStep[];
  readonly collapsible?: boolean;
  readonly collapseOnSettle?: boolean;
  readonly color?: HxColor | "currentColor";
  readonly glyphColor?: HxColor;
  readonly fontSize?: number;
  /** 呼吸一个来回的秒数. */
  readonly breathPeriod?: number;
  /** 呼吸深度: 谷底透明度 = 1 - depth. */
  readonly breathDepth?: number;
  readonly shimmer?: boolean;
  readonly shimmerDuration?: number;
  /** 落定的毫秒数. */
  readonly settleDuration?: number;
  readonly settleBlur?: number;
  readonly working?: boolean;
  /** working 变 false 后再等这么多毫秒才落定. */
  readonly settleAfter?: number;
  /** 外部给的秒数; 不给则自己计. */
  readonly elapsed?: number;
  readonly showTimer?: boolean;
  readonly onSettle?: () => void;
  readonly className?: string;
  readonly style?: CSSProperties;
}

const EMPTY_STEPS: readonly TraceStep[] = [];
const SHIMMER_SIZE = "200% 100%";

/**
 * 推理过程的一行: 进行中图形呼吸, 文字扫光, 秒数走表; 结束时文字从模糊里落定, 图形在 55% 处换成勾.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-compose.md
 */
export function ReasoningTrace({
  label = "Thinking…",
  doneLabel = "",
  renderLabel,
  glyph = TRACE_GLYPH.sparkle,
  steps = EMPTY_STEPS,
  collapsible = true,
  collapseOnSettle = true,
  color = CURRENT_COLOR,
  glyphColor,
  fontSize = TRACE.fontSize,
  breathPeriod = TRACE.breathPeriodS,
  breathDepth = TRACE.breathDepth,
  shimmer = true,
  shimmerDuration = TRACE.shimmerS,
  settleDuration = TRACE.settleMs,
  settleBlur = TRACE.settleBlurPx,
  working = true,
  settleAfter = 0,
  elapsed,
  showTimer = true,
  onSettle,
  className,
  style,
}: ReasoningTraceProps): JSX.Element {
  const reduced = useReducedMotion();
  const [settled, setSettled] = useState(!working);
  const [glyphDone, setGlyphDone] = useState(!working);
  const [open, setOpen] = useState(working);
  const [ticks, setTicks] = useState(0);
  const glyphRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const listId = useId();
  const ranWorking = useRef(working);
  const onSettleRef = useRef(onSettle);
  onSettleRef.current = onSettle;

  useEffect(() => {
    if (!working || elapsed !== undefined) return undefined;
    setTicks(0);
    const id = window.setInterval(() => setTicks((n) => n + 1), TRACE.tickMs);
    return () => window.clearInterval(id);
  }, [working, elapsed]);

  // 呼吸: 进行中循环, 减弱动效时放慢到 2.4s 且不扫光.
  useLayoutEffect(() => {
    if (!working) return undefined;
    ranWorking.current = true;
    setSettled(false);
    setOpen(true);
    setGlyphDone(false);
    const el = glyphRef.current;
    const trough = breathTrough(breathDepth);
    const period = reduced ? TRACE.reducedBreathS : breathPeriod;
    el?.getAnimations?.().forEach((animation) => animation.cancel());
    const lead = fadeTo(el, trough, TRACE.fadeS);
    const loop = el?.animate?.([{ opacity: trough }, { opacity: 1 }, { opacity: trough }], {
      duration: period * MS_PER_S,
      delay: TRACE.fadeS * MS_PER_S,
      easing: COMPOSE_EASE_IN_OUT,
      iterations: Infinity,
    });
    const sheen =
      shimmer && !reduced
        ? labelRef.current?.animate?.([{ backgroundPosition: "100% 0" }, { backgroundPosition: "-100% 0" }], {
            duration: shimmerDuration * MS_PER_S,
            easing: EASE_LINEAR,
            iterations: Infinity,
          })
        : undefined;
    return () => {
      // 取消会让 finished 以 AbortError 拒绝; 规范里这条拒绝算已处理, 显式接住以免部分运行时报未处理.
      for (const animation of [lead, loop, sheen]) {
        animation?.finished?.catch(() => undefined);
        animation?.cancel();
      }
    };
  }, [working, reduced, breathPeriod, breathDepth, shimmer, shimmerDuration]);

  // 落定: 等 settleAfter, 图形回到满不透明, 文字去模糊, 55% 处换勾, 结束回调.
  useEffect(() => {
    if (working || !ranWorking.current) return undefined;
    const timers: number[] = [];
    const span = reduced ? 0 : settleDuration;
    timers.push(
      window.setTimeout(() => {
        fadeTo(glyphRef.current, 1, reduced ? 0 : TRACE.fadeS);
        setSettled(true);
        if (!reduced) {
          labelRef.current?.animate?.(
            [
              { opacity: 0, filter: `blur(${settleBlur}${PX})` },
              { opacity: 1, filter: `blur(0${PX})` },
            ],
            { duration: span, easing: COMPOSE_EASE_OUT },
          );
        }
        timers.push(window.setTimeout(() => setGlyphDone(true), glyphSwapAt(span)));
        timers.push(
          window.setTimeout(() => {
            if (collapseOnSettle) setOpen(false);
            onSettleRef.current?.();
          }, span),
        );
      }, settleAfter),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [working, reduced, settleAfter, settleDuration, settleBlur, collapseOnSettle]);

  const text = settled && doneLabel ? doneLabel : label;
  const seconds = elapsed ?? ticks;
  const sweeping = shimmer && !reduced && !settled;
  const labelStyle: CSSProperties = sweeping
    ? {
        backgroundImage: "linear-gradient(90deg, var(--muted-foreground) 40%, var(--foreground) 50%, var(--muted-foreground) 60%)",
        backgroundSize: SHIMMER_SIZE,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
      }
    : {};
  const hasSteps = steps.length > 0;
  const headInner = (
    <>
      <span ref={glyphRef} aria-hidden className="inline-flex shrink-0" style={{ color: glyphColor ? colorVar(glyphColor) : undefined }}>
        <TraceGlyphMark kind={glyph} done={glyphDone} />
      </span>
      <span ref={labelRef} role="status" className="truncate" style={labelStyle}>
        {renderLabel ? renderLabel(text, !settled) : text}
      </span>
      {showTimer && (seconds > 0 || !settled) ? (
        <span className="tabular-nums text-muted-foreground" aria-hidden>
          {seconds}s
        </span>
      ) : null}
    </>
  );

  return (
    <div
      data-slot="reasoning-trace"
      data-state={settled ? "settled" : "working"}
      className={cn("flex flex-col gap-1", className)}
      style={{ color: colorVar(color), fontSize, ...style }}
    >
      {collapsible && hasSteps ? (
        <button
          type={BUTTON_TYPE}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((was) => !was)}
          className={cn("inline-flex items-center gap-2 self-start rounded-md text-left", FOCUS_RING)}
        >
          {headInner}
        </button>
      ) : (
        <div className="inline-flex items-center gap-2">{headInner}</div>
      )}
      {hasSteps && (open || !collapsible) ? (
        <ol id={listId} className="ml-[1.5em] flex flex-col gap-1 border-l border-border pl-3 text-[0.875em] text-muted-foreground">
          {steps.map((step) => (
            <TraceStepRow key={step.id} step={step} reduced={reduced} />
          ))}
        </ol>
      ) : null}
    </div>
  );
}
