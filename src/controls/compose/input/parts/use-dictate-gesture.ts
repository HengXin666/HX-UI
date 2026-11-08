/** DictateButton 的按压手势: 按 auto / toggle / hold 三种模式解释按下, 松开, 左滑取消与键盘. */
import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { slideProgress } from "../voice-signal";

const MODE_TOGGLE = "toggle";
const MODE_HOLD = "hold";

interface DictateGestureOptions {
  readonly mode: "auto" | "toggle" | "hold";
  readonly holdAfter: number;
  readonly slideToCancel: boolean;
  readonly cancelDistance: number;
  readonly disabled: boolean;
  readonly listeningRef: RefObject<boolean>;
  readonly setSlide: (progress: number) => void;
  readonly start: () => void;
  readonly stop: (cancelled: boolean) => void;
}

export interface DictateGesture {
  readonly pressed: boolean;
  readonly onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  readonly onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  readonly onPointerUp: () => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

export function useDictateGesture({ mode, holdAfter, slideToCancel, cancelDistance, disabled, listeningRef, setSlide, start, stop }: DictateGestureOptions): DictateGesture {
  const [pressed, setPressed] = useState(false);
  const press = useRef<{ x: number; at: number; startedHere: boolean } | null>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (disabled || event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setPressed(true);
    const startedHere = !listeningRef.current && mode !== MODE_TOGGLE;
    press.current = { x: event.clientX, at: performance.now(), startedHere };
    if (startedHere) start();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (!press.current || !slideToCancel || !listeningRef.current || mode === MODE_TOGGLE) return;
    const progress = slideProgress(event.clientX - press.current.x, cancelDistance);
    setSlide(progress);
    if (progress >= 1) {
      press.current = null;
      setPressed(false);
      stop(true);
    }
  };

  const onPointerUp = (): void => {
    const held = press.current;
    press.current = null;
    setPressed(false);
    setSlide(0);
    if (!held) return;
    const heldMs = performance.now() - held.at;
    if (mode === MODE_TOGGLE) {
      if (listeningRef.current) stop(false);
      else start();
    } else if (mode === MODE_HOLD) {
      stop(false);
    } else if (held.startedHere) {
      if (heldMs >= holdAfter) stop(false);
    } else {
      stop(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === "Escape" && listeningRef.current) {
      event.preventDefault();
      stop(true);
    } else if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
      event.preventDefault();
      if (listeningRef.current) stop(false);
      else start();
    }
  };

  return { pressed, onPointerDown, onPointerMove, onPointerUp, onKeyDown };
}
