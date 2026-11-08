"use client";

/**
 * 行为规格参照 catalog/micro.md 的 RefineFrame 条目, 只作出处说明; 实现与命名为 HX 自有.
 */
import { useEffect, useLayoutEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { fitCanvas, inkOf } from "../canvas";
import {
  BUTTON_TYPE,
  COMPOSE_FRAME,
  COMPOSE_EASE_IN_OUT,
  COMPOSE_EASE_OUT,
  CSS_PROP,
  DEVELOP,
  DEVELOP_STATUS,
  DEVELOP_TARGET,
  MS_PER_S,
  PX,
  colorVar,
  transitionOf,
  type DevelopStatus,
  type HxColor,
} from "../tokens";
import { blurFor, developApproach, drawVeil } from "./develop-veil";

export interface DevelopFrameProps {
  readonly status?: DevelopStatus;
  readonly children?: ReactNode;
  readonly aspectRatio?: string;
  readonly width?: number | string;
  readonly radius?: number;
  readonly background?: HxColor;
  readonly color?: HxColor;
  /** 每一档进度追随的时长 (ms). */
  readonly stageDuration?: number;
  readonly sweep?: boolean;
  readonly showStatus?: boolean;
  /** 完成后状态签停留的毫秒数. */
  readonly hideAfter?: number;
  readonly labels?: Partial<Record<DevelopStatus, string>>;
  readonly retryLabel?: string;
  readonly onRetry?: () => void;
  readonly className?: string;
}

const DEFAULT_LABELS: Record<DevelopStatus, string> = {
  queued: "Queued",
  generating: "Generating",
  refining: "Refining",
  complete: "Done",
  error: "Failed",
};
const WAIT_LOW = 0.55;
const LABEL_RISE = "translateY(4px)";

/** 生成中或精修中才扫光. */
function sweeping(status: DevelopStatus): boolean {
  return status === DEVELOP_STATUS.generating || status === DEVELOP_STATUS.refining;
}

/**
 * 显影框: 内容从分条遮罩与模糊里逐档清晰, 生成中有一条软边扫光; 失败给重试.
 * 进度是连续追随, 状态在半路改了下一帧就转向.
 */
export function DevelopFrame({
  status = DEVELOP_STATUS.generating,
  children,
  aspectRatio = DEVELOP.aspect,
  width = DEVELOP.width,
  radius = DEVELOP.radius,
  background = "muted",
  color = "foreground",
  stageDuration = DEVELOP.stageMs,
  sweep = true,
  showStatus = true,
  hideAfter = DEVELOP.hideAfterMs,
  labels,
  retryLabel = "Retry",
  onRetry,
  className,
}: DevelopFrameProps): JSX.Element {
  const reduced = useReducedMotion();
  const target = DEVELOP_TARGET[status];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const start = status === DEVELOP_STATUS.complete ? 1 : 0;
  const sim = useRef({ progress: start, phase: 0 });
  const [shown, setShown] = useState(start);
  const [labelVisible, setLabelVisible] = useState(true);
  const text = { ...DEFAULT_LABELS, ...labels }[status];

  const paint = (): void => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = fitCanvas(canvas, canvas.clientWidth, canvas.clientHeight);
    if (!ctx) return;
    const veil = getComputedStyle(root).backgroundColor;
    drawVeil(ctx, canvas.clientWidth, canvas.clientHeight, sim.current.progress, sim.current.phase, { veil, ink: inkOf(root) }, sweep && !reduced && sweeping(status));
  };

  const { wake: kick } = useFrameLoop((dtMs) => {
    const dt = dtMs / MS_PER_S;
    const state = sim.current;
    state.progress = developApproach(state.progress, target, dt, stageDuration);
    state.phase = (state.phase + DEVELOP.sweepPerS * dt) % 1;
    paint();
    setShown((was) => (blurFor(was) === blurFor(state.progress) ? was : state.progress));
    return state.progress !== target || (sweep && sweeping(status));
  }, { ...COMPOSE_FRAME, active: !reduced });

  useLayoutEffect(() => {
    if (reduced) {
      sim.current.progress = target;
      setShown(target);
      paint();
      return;
    }
    kick();
  });

  // 排队时遮罩慢呼吸 2.4s.
  useEffect(() => {
    if (status !== DEVELOP_STATUS.queued || reduced) return undefined;
    const pulse = canvasRef.current?.animate?.([{ opacity: 1 }, { opacity: WAIT_LOW }, { opacity: 1 }], {
      duration: DEVELOP.waitS * MS_PER_S,
      easing: COMPOSE_EASE_IN_OUT,
      iterations: Infinity,
    });
    return () => pulse?.cancel();
  }, [status, reduced]);

  // 状态签: 换字时淡入, 完成后 hideAfter 毫秒收起.
  useLayoutEffect(() => {
    setLabelVisible(true);
    if (!reduced) labelRef.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: DEVELOP.fadeMs });
    if (status !== DEVELOP_STATUS.complete) return undefined;
    const id = window.setTimeout(() => setLabelVisible(false), hideAfter);
    return () => window.clearTimeout(id);
  }, [status, hideAfter, reduced]);

  const busy = status !== DEVELOP_STATUS.complete && status !== DEVELOP_STATUS.error;
  const failed = status === DEVELOP_STATUS.error;

  return (
    <div
      ref={rootRef}
      data-slot="develop-frame"
      data-status={status}
      aria-busy={busy}
      className={cn("relative isolate overflow-hidden", className)}
      style={{ width, aspectRatio, borderRadius: radius, background: colorVar(background), color: colorVar(color) }}
    >
      <div
        className="absolute inset-0"
        style={{
          filter: `blur(${blurFor(shown)}${PX})`,
          transition: reduced ? undefined : transitionOf([[CSS_PROP.filter, DEVELOP.fadeMs]]),
        }}
      >
        {children}
      </div>
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 size-full" />
      {showStatus ? (
        <span
          ref={labelRef}
          key={status}
          role="status"
          className="absolute bottom-2 left-2 rounded-full border border-border bg-popover px-2 py-0.5 text-xs text-popover-foreground"
          style={{
            opacity: labelVisible ? 1 : 0,
            transform: labelVisible ? undefined : LABEL_RISE,
            transition: reduced ? undefined : transitionOf([[CSS_PROP.opacity, DEVELOP.fadeMs], [CSS_PROP.transform, DEVELOP.fadeMs, COMPOSE_EASE_OUT]]),
          }}
        >
          {text}
        </span>
      ) : null}
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type={BUTTON_TYPE}
            onClick={onRetry}
            className="rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground outline-none hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring motion-safe:active:scale-[0.96]"
            style={{
              transition: transitionOf([
                [CSS_PROP.opacity, DEVELOP.fadeMs],
                [CSS_PROP.transform, DEVELOP.pressMs, COMPOSE_EASE_OUT],
                [CSS_PROP.background, DEVELOP.colorMs],
              ]),
            }}
          >
            {retryLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
