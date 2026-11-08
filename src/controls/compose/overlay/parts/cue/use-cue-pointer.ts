/** CueTip 的指针处理: 按横扫速度给气泡加倾斜弹簧, 触屏长按弹出, 滑开 holdSlop 取消. */
import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import type { SpringChannels } from "../../../kinetics";
import { CUE, MS_PER_S, type CueSide } from "../../../tokens";
import { leanFor } from "./cue-warmth";

const POINTER_TOUCH = "touch";
const LEAN = "lean";

interface CuePointerOptions {
  readonly channels: SpringChannels<"lean" | "x" | "y">;
  /** 弹出计时器, 与悬停延迟共用. */
  readonly openTimer: RefObject<number>;
  readonly lean: number;
  readonly side: CueSide;
  readonly vertical: boolean;
  readonly reduced: boolean;
  readonly longPress: number;
  readonly disabled: boolean;
  readonly show: (warm: boolean) => void;
}

export interface CuePointer {
  readonly onPointerMove: (e: ReactPointerEvent) => void;
  readonly onPointerDown: (e: ReactPointerEvent) => void;
  readonly onPointerUp: (e: ReactPointerEvent) => void;
  /** 指针离开后清掉速度采样起点. */
  readonly resetPointer: () => void;
}

export function isTouch(e: ReactPointerEvent): boolean {
  return e.pointerType === POINTER_TOUCH;
}

export function useCuePointer({ channels, openTimer, lean, side, vertical, reduced, longPress, disabled, show }: CuePointerOptions): CuePointer {
  const pointer = useRef({ x: 0, y: 0, t: 0, downX: 0, downY: 0 });
  const leanTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(leanTimer.current), []);

  const onPointerMove = (e: ReactPointerEvent): void => {
    const p = pointer.current;
    const now = e.timeStamp || performance.now();
    if (isTouch(e)) {
      if (openTimer.current && Math.hypot(e.clientX - p.downX, e.clientY - p.downY) > CUE.holdSlop) {
        window.clearTimeout(openTimer.current);
        openTimer.current = 0;
      }
      return;
    }
    const dt = (now - p.t) / MS_PER_S;
    if (lean > 0 && p.t > 0 && dt > 0 && !reduced) {
      const speed = vertical ? (e.clientX - p.x) / dt : (e.clientY - p.y) / dt;
      channels.to(LEAN, leanFor(speed, lean, side));
      window.clearTimeout(leanTimer.current);
      leanTimer.current = window.setTimeout(() => channels.to(LEAN, 0), CUE.graceMs);
    }
    pointer.current = { ...p, x: e.clientX, y: e.clientY, t: now };
  };

  const onPointerDown = (e: ReactPointerEvent): void => {
    if (!isTouch(e) || longPress <= 0 || disabled) return;
    pointer.current = { ...pointer.current, downX: e.clientX, downY: e.clientY };
    window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => {
      openTimer.current = 0;
      show(false);
    }, longPress);
  };

  const onPointerUp = (e: ReactPointerEvent): void => {
    if (!isTouch(e)) return;
    window.clearTimeout(openTimer.current);
    openTimer.current = 0;
  };

  const resetPointer = (): void => {
    pointer.current = { ...pointer.current, t: 0 };
  };

  return { onPointerMove, onPointerDown, onPointerUp, resetPointer };
}
