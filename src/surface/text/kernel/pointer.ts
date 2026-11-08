"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 VariableProximity, TextPressure, ScrambledText, DepthText, EchoText, TextCursor, TechText 条目, 实现为 HX 自有.

import { useEffect, useRef, type RefObject } from "react";

/**
 * 指针邻近: 元素局部坐标下的指针状态, 与到矩形中心的距离.
 * pointercancel 与 pointerleave 一样收尾, 触屏被系统手势打断不会卡在按下态.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-kernel.md
 */

export interface PointerField {
  /** 相对元素左上角的坐标 (像素). */
  x: number;
  y: number;
  inside: boolean;
  down: boolean;
  /** 指针至少来过一次. */
  seen: boolean;
}

export type PointerEventKind = "move" | "enter" | "leave" | "down" | "up";

export interface PointerFieldOptions {
  /** element 只听元素自身; window 在窗口上听移动, 指针在元素外也算距离. */
  readonly scope?: "element" | "window";
  readonly enabled?: boolean;
}

/** 点到矩形中心的距离. */
export function centerDistance(x: number, y: number, rect: { readonly left: number; readonly top: number; readonly width: number; readonly height: number }): number {
  return Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2));
}

/**
 * @param ref 被测元素.
 * @param onChange 每次指针事件后回调 (通常用来唤醒帧循环).
 * @param options 监听范围与开关.
 */
export function usePointerField(ref: RefObject<Element | null>, onChange: (field: PointerField, kind: PointerEventKind, event: PointerEvent) => void, options: PointerFieldOptions = {}): PointerField {
  const { scope = "element", enabled = true } = options;
  const field = useRef<PointerField>({ x: 0, y: 0, inside: false, down: false, seen: false });
  const latest = useRef(onChange);
  latest.current = onChange;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;
    const f = field.current;
    const locate = (e: PointerEvent): void => {
      const rect = el.getBoundingClientRect();
      f.x = e.clientX - rect.left;
      f.y = e.clientY - rect.top;
      f.seen = true;
    };
    const handlers: Record<string, [PointerEventKind, (e: PointerEvent) => void]> = {
      pointermove: ["move", locate],
      pointerenter: ["enter", (e) => { locate(e); f.inside = true; }],
      pointerleave: ["leave", () => { f.inside = false; f.down = false; }],
      pointerdown: ["down", (e) => { locate(e); f.down = true; }],
      pointerup: ["up", () => { f.down = false; }],
      pointercancel: ["leave", () => { f.inside = false; f.down = false; }],
    };
    const bound: [EventTarget, string, EventListener][] = [];
    for (const [type, [kind, apply]] of Object.entries(handlers)) {
      const target: EventTarget = type === "pointermove" && scope === "window" ? window : el;
      const listener = ((e: PointerEvent) => {
        apply(e);
        latest.current(f, kind, e);
      }) as EventListener;
      target.addEventListener(type, listener, { passive: true });
      bound.push([target, type, listener]);
    }
    return () => {
      for (const [target, type, listener] of bound) target.removeEventListener(type, listener);
    };
  }, [ref, scope, enabled]);

  return field.current;
}
