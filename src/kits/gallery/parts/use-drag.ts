"use client";

import { useRef, type PointerEvent } from "react";
import { DRAG_THRESHOLD_PX } from "../tokens";

/** 拖拽过程回调: 累计位移 px 与平滑速度 px/ms. */
export interface DragHandlers {
  readonly onStart?: () => void;
  readonly onMove: (dx: number, dy: number) => void;
  /** 松手; vx / vy 为最近几帧的平滑速度 px/ms. 未过阈值的点按不回调. */
  readonly onEnd: (vx: number, vy: number) => void;
}

/** 速度平滑系数: 新样本占 0.3. HX 自定. */
const VELOCITY_BLEND = 0.3;

/**
 * 指针拖拽: 过阈值才算拖, 之后抓住指针; pointercancel 与 pointerup 同样收尾.
 * 返回要挂在容器上的事件与 "刚拖过" 判定 (给 click 用, 拖完不当点选).
 */
export function useDrag(handlers: DragHandlers, enabled = true): {
  readonly bind: {
    onPointerDown: (e: PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: PointerEvent<HTMLElement>) => void;
    onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
  };
  readonly dragged: () => boolean;
} {
  const ref = useRef(handlers);
  ref.current = handlers;
  const s = useRef({ down: false, live: false, id: -1, x0: 0, y0: 0, lx: 0, ly: 0, lt: 0, vx: 0, vy: 0, moved: false });
  const end = (e: PointerEvent<HTMLElement>): void => {
    const st = s.current;
    if (!st.down || e.pointerId !== st.id) return;
    st.down = false;
    if (st.live) {
      st.live = false;
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      ref.current.onEnd(st.vx, st.vy);
    }
  };
  return {
    bind: {
      onPointerDown: (e) => {
        if (!enabled || e.button !== 0) return;
        const st = s.current;
        Object.assign(st, { down: true, live: false, id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, lt: e.timeStamp, vx: 0, vy: 0, moved: false });
      },
      onPointerMove: (e) => {
        const st = s.current;
        if (!st.down || e.pointerId !== st.id) return;
        const dx = e.clientX - st.x0;
        const dy = e.clientY - st.y0;
        if (!st.live) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
          st.live = true;
          st.moved = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          ref.current.onStart?.();
        }
        const dt = Math.max(1, e.timeStamp - st.lt);
        st.vx += ((e.clientX - st.lx) / dt - st.vx) * VELOCITY_BLEND;
        st.vy += ((e.clientY - st.ly) / dt - st.vy) * VELOCITY_BLEND;
        st.lx = e.clientX;
        st.ly = e.clientY;
        st.lt = e.timeStamp;
        ref.current.onMove(dx, dy);
      },
      onPointerUp: end,
      onPointerCancel: end,
    },
    dragged: () => {
      const moved = s.current.moved;
      s.current.moved = false;
      return moved;
    },
  };
}
