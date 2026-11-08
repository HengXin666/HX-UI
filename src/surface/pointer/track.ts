"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 Crosshair, TargetCursor, Magnet 条目 (窗口级指针跟踪与 pointercancel), 实现为 HX 自有.

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import { approach } from "../../motion/spring/follow";
import { MS_PER_S } from "./tokens";

/**
 * DOM 件的指针跟踪: 宿主坐标系 (CSS 像素, y 朝下) 里的位置, 平滑速度, 是否在宿主内, 是否按下. 监听挂在 window 上, 所以
 * 不接收指针的全屏叠层也能跟手; pointercancel 与窗口失焦都当作抬起并离开. 只写 ref, 不触发重渲.
 * 和 backdrop 内核的指针不同: 内核只在宿主上监听, 坐标归一化; 磁吸的 padding 与锁定光标要在宿主外也能算距离, 所以挂在 window 上.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-pointer.md
 */
export interface PointerState {
  x: number;
  y: number;
  /** 平滑后的速度, px/s. */
  vx: number;
  vy: number;
  inside: boolean;
  down: boolean;
  /** 至少收到过一次指针事件. */
  seen: boolean;
  clientX: number;
  clientY: number;
  t: number;
}

export interface PointerHandlers {
  readonly onMove?: (p: PointerState, event: PointerEvent) => void;
  readonly onDown?: (p: PointerState, event: PointerEvent) => void;
  readonly onUp?: (p: PointerState) => void;
  readonly onLeave?: (p: PointerState) => void;
}

/** 速度平滑的时间常数 (秒). ENGINE-GAP: src/motion 没有指针速度采样器, 这里用 approach 平滑逐事件速度. */
export const POINTER_VELOCITY_TAU_S = 0.05;

export function makePointer(): PointerState {
  return { x: 0, y: 0, vx: 0, vy: 0, inside: false, down: false, seen: false, clientX: 0, clientY: 0, t: 0 };
}

/** 把一次客户区坐标写进状态, 返回是否落在 rect 里. */
export function locate(p: PointerState, rect: DOMRect | { left: number; top: number; width: number; height: number }, clientX: number, clientY: number, now: number): boolean {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  if (p.seen && now > p.t) {
    const dtS = (now - p.t) / MS_PER_S;
    p.vx = approach(p.vx, (x - p.x) / dtS, dtS, POINTER_VELOCITY_TAU_S);
    p.vy = approach(p.vy, (y - p.y) / dtS, dtS, POINTER_VELOCITY_TAU_S);
  }
  p.x = x;
  p.y = y;
  p.clientX = clientX;
  p.clientY = clientY;
  p.t = now;
  p.seen = true;
  p.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
  return p.inside;
}

/**
 * @param hostRef 坐标系所在的元素.
 * @param handlers 事件回调, 每次渲染取最新的.
 * @param enabled 关掉时不挂监听.
 */
export function usePointerTrack(hostRef: RefObject<HTMLElement | null>, handlers: PointerHandlers = {}, enabled = true): MutableRefObject<PointerState> {
  const state = useRef<PointerState>(makePointer());
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;
    const p = state.current;
    const rect = (): DOMRect | null => hostRef.current?.getBoundingClientRect() ?? null;
    const leave = (): void => {
      const was = p.inside || p.down;
      p.inside = false;
      p.down = false;
      if (was) latest.current.onLeave?.(p);
    };
    const move = (e: PointerEvent): void => {
      const r = rect();
      if (!r) return;
      const wasInside = p.inside;
      locate(p, r, e.clientX, e.clientY, e.timeStamp || performance.now());
      latest.current.onMove?.(p, e);
      if (wasInside && !p.inside) latest.current.onLeave?.(p);
    };
    const down = (e: PointerEvent): void => {
      const r = rect();
      if (!r) return;
      locate(p, r, e.clientX, e.clientY, e.timeStamp || performance.now());
      if (!p.inside) return;
      p.down = true;
      latest.current.onDown?.(p, e);
    };
    const up = (): void => {
      if (!p.down) return;
      p.down = false;
      latest.current.onUp?.(p);
    };
    const cancel = (): void => {
      up();
      leave();
    };
    const scroll = (): void => {
      const r = rect();
      if (r && p.seen) locate(p, r, p.clientX, p.clientY, performance.now());
    };
    const out = (e: PointerEvent): void => {
      if (!e.relatedTarget) leave();
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("pointerout", out);
    window.addEventListener("scroll", scroll, { passive: true, capture: true });
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("pointerout", out);
      window.removeEventListener("scroll", scroll, { capture: true });
      window.removeEventListener("blur", cancel);
    };
  }, [enabled, hostRef]);

  return state;
}
