"use client";

/**
 * 行为规格参照 catalog/micro.md 的 VoicePill 条目, 只作出处说明; 实现与命名为 HX 自有.
 */
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { BUTTON_TYPE, COMPOSE_EASE_OUT, COMPOSE_FRAME, CSS_PROP, DICTATE, HALF, MS_PER_S, PX, colorVar, transitionOf, type HxColor } from "../tokens";
import { closeMic, freshLive, openMic, type Live } from "./parts/dictate-mic";
import { WAVE_BARS, WAVE_PITCH, drawWave } from "./parts/dictate-wave";
import { useDictateGesture } from "./parts/use-dictate-gesture";
import { barLevel, followEnvelope, formatClock, micLevel, pushWave, simulatedLevel } from "./voice-signal";

export const DICTATE_MODE = { auto: "auto", toggle: "toggle", hold: "hold" } as const;
export type DictateMode = (typeof DICTATE_MODE)[keyof typeof DICTATE_MODE];
export const DICTATE_SOURCE = { simulated: "simulated", mic: "mic" } as const;
export type DictateSource = (typeof DICTATE_SOURCE)[keyof typeof DICTATE_SOURCE];
export const DICTATE_SHAPE = { pill: "pill", circle: "circle" } as const;
export type DictateShape = (typeof DICTATE_SHAPE)[keyof typeof DICTATE_SHAPE];

export interface DictateStopDetail {
  readonly durationMs: number;
  readonly cancelled: boolean;
}

export interface DictateButtonProps {
  readonly accent?: HxColor;
  readonly iconColor?: HxColor;
  readonly background?: HxColor;
  readonly size?: number;
  readonly shape?: DictateShape;
  /** 展开后波形区两侧的留白 (px). */
  readonly reach?: number;
  readonly showTime?: boolean;
  readonly waveform?: boolean;
  readonly slideToCancel?: boolean;
  readonly cancelDistance?: number;
  readonly attack?: number;
  readonly release?: number;
  readonly sensitivity?: number;
  readonly floor?: number;
  readonly openDuration?: number;
  readonly pressScale?: number;
  /** auto: 轻点切换, 按住超过 holdAfter 松手即停; toggle: 只切换; hold: 按住说话. */
  readonly mode?: DictateMode;
  readonly holdAfter?: number;
  readonly reactive?: DictateSource;
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly onStart?: () => void;
  readonly onStop?: (detail: DictateStopDetail) => void;
  readonly className?: string;
}

const MIC_ICON = "M8 2.5a2 2 0 0 1 2 2v3.5a2 2 0 0 1-4 0V4.5a2 2 0 0 1 2-2zM4.5 7.5a3.5 3.5 0 0 0 7 0M8 11v2.5";
const ICON_RATIO = 0.57;

/**
 * 听写键: 按下开始收音, 胶囊展开出波形与计时; 按住左滑取消.
 * 电平走包络 (attack 40ms / release 240ms), 每 4 帧压一格历史, 最多 80 格.
 */
export function DictateButton({
  accent = "foreground",
  iconColor = "muted-foreground",
  background = "muted",
  size = DICTATE.size,
  shape = DICTATE_SHAPE.pill,
  reach = DICTATE.reach,
  showTime = true,
  waveform = true,
  slideToCancel = true,
  cancelDistance = DICTATE.cancelDistance,
  attack = DICTATE.attackMs,
  release = DICTATE.releaseMs,
  sensitivity = DICTATE.sensitivity,
  floor = DICTATE.floor,
  openDuration = DICTATE.openMs,
  pressScale = DICTATE.pressScale,
  mode = DICTATE_MODE.auto,
  holdAfter = DICTATE.holdAfterMs,
  reactive = DICTATE_SOURCE.simulated,
  disabled = false,
  ariaLabel = "Dictate",
  onStart,
  onStop,
  className,
}: DictateButtonProps): JSX.Element {
  const reduced = useReducedMotion();
  const [listening, setListening] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [slide, setSlide] = useState(0);
  const live = useRef<Live>(freshLive());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const listeningRef = useRef(false);

  const start = useCallback((): void => {
    if (listeningRef.current || disabled) return;
    listeningRef.current = true;
    live.current = { ...freshLive(), startedAt: performance.now() };
    setElapsed(0);
    setListening(true);
    onStart?.();
    if (reactive === DICTATE_SOURCE.mic && navigator.mediaDevices?.getUserMedia) void openMic(live.current);
  }, [disabled, onStart, reactive]);

  const stop = useCallback(
    (cancelled: boolean): void => {
      if (!listeningRef.current) return;
      listeningRef.current = false;
      const durationMs = performance.now() - live.current.startedAt;
      closeMic(live.current);
      setListening(false);
      setSlide(0);
      onStop?.({ durationMs, cancelled });
    },
    [onStop],
  );

  useEffect(() => {
    if (!listening) return undefined;
    const onHidden = (): void => {
      if (document.hidden) stop(false);
    };
    const onBlur = (): void => stop(false);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [listening, stop]);

  useEffect(() => () => closeMic(live.current), []);

  useFrameLoop((dtMs, now) => {
    const dt = dtMs / MS_PER_S;
    const state = live.current;
    const source = state.analyser && state.bins ? (state.analyser.getByteFrequencyData(state.bins), micLevel(state.bins)) : simulatedLevel((now - state.startedAt) / MS_PER_S);
    state.env = followEnvelope(state.env, source, dt, attack, release);
    state.frame += 1;
    if (state.frame % DICTATE.waveEvery === 0) pushWave(state.history, barLevel(state.env, sensitivity, floor));
    const seconds = Math.floor((now - state.startedAt) / MS_PER_S);
    setElapsed((was) => (Math.floor(was / MS_PER_S) === seconds ? was : seconds * MS_PER_S));
    const canvas = canvasRef.current;
    if (waveform && canvas) drawWave(canvas, state.history, barLevel(state.env, sensitivity, floor));
    return listeningRef.current;
  }, { ...COMPOSE_FRAME, active: listening });

  const { pressed, onPointerDown, onPointerMove, onPointerUp, onKeyDown } = useDictateGesture({
    mode,
    holdAfter,
    slideToCancel,
    cancelDistance,
    disabled,
    listeningRef,
    setSlide,
    start,
    stop,
  });

  const waveWidth = waveform ? WAVE_BARS * WAVE_PITCH : 0;
  const openWidth = waveWidth + (showTime ? DICTATE.timeWidthPx : 0) + reach * HALF;
  const growMs = reduced ? 0 : openDuration;
  const reveal = transitionOf([
    [CSS_PROP.opacity, reduced ? 0 : DICTATE.fadeMs],
    [CSS_PROP.filter, reduced ? 0 : DICTATE.fadeMs],
    [CSS_PROP.transform, reduced ? 0 : DICTATE.growMs, COMPOSE_EASE_OUT],
  ]);

  return (
    <button
      type={BUTTON_TYPE}
      data-slot="dictate-button"
      data-listening={listening ? "" : undefined}
      aria-label={ariaLabel}
      aria-pressed={listening}
      disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={cn(
        "relative inline-flex touch-none select-none items-center overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        shape === DICTATE_SHAPE.pill ? "rounded-full" : "rounded-lg",
        className,
      )}
      style={{
        height: size,
        width: size + (listening ? openWidth : 0),
        background: colorVar(background),
        color: colorVar(iconColor),
        transform: pressed && !reduced ? `scale(${pressScale})` : undefined,
        transition: transitionOf([
          [CSS_PROP.width, growMs, COMPOSE_EASE_OUT],
          [CSS_PROP.transform, DICTATE.pressMs, COMPOSE_EASE_OUT],
          [CSS_PROP.color, DICTATE.colorMs],
          [CSS_PROP.background, DICTATE.colorMs],
        ]),
      }}
    >
      <span className="flex shrink-0 items-center justify-center" style={{ width: size, height: size, color: listening ? colorVar(accent) : undefined }}>
        <svg aria-hidden viewBox="0 0 16 16" width={size * ICON_RATIO} height={size * ICON_RATIO} fill="none">
          <path d={MIC_ICON} stroke="currentColor" strokeWidth={1} strokeLinecap="round" />
        </svg>
      </span>
      <span
        aria-hidden
        className="flex items-center gap-1.5"
        style={{
          paddingRight: reach,
          opacity: listening ? 1 - slide : 0,
          filter: listening ? "blur(0px)" : `blur(${HALF}${PX})`,
          transform: `translateX(${listening ? -slide * cancelDistance : -reach}px)`,
          transition: reveal,
          color: colorVar(accent),
        }}
      >
        {waveform ? <canvas ref={canvasRef} className="text-current" style={{ width: waveWidth, height: size / HALF }} /> : null}
        {showTime ? (
          <span className="text-xs tabular-nums" style={{ width: DICTATE.timeWidthPx }}>
            {formatClock(elapsed)}
          </span>
        ) : null}
      </span>
    </button>
  );
}

