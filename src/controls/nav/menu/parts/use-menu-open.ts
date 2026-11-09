"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

/**
 * 展开菜单共用的开合状态: 受控 / 非受控, 入场前强制一次布局让 CSS 过渡有起点, 离场留够时间再卸载,
 * Escape 关闭并把焦点还给开关, 点外部关闭.
 *
 * 阶段: closed (不挂) -> entering (挂上, 处于起始样式) -> open -> closing (离场样式, exitMs 后卸载) -> closed.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
export type MenuPhase = "closed" | "entering" | "open" | "closing";

export interface MenuOpenOptions {
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** 离场动画时长 ms; 减弱动效时按 0 处理. */
  readonly exitMs: number;
  readonly reduced: boolean;
  readonly closeOnClickAway?: boolean;
  /** 菜单整体 (含开关); 点在它外面算点外部. */
  readonly root: RefObject<HTMLElement | null>;
  /** Escape 关闭后焦点回到这里. */
  readonly toggle: RefObject<HTMLElement | null>;
}

export interface MenuOpen {
  readonly open: boolean;
  readonly phase: MenuPhase;
  /** 面板是否该挂在 DOM 上. */
  readonly mounted: boolean;
  /** 是否处于展开后的终态样式 (入场过渡的目标). */
  readonly shown: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly toggleOpen: () => void;
}

export function useMenuOpen({ open, defaultOpen = false, onOpenChange, exitMs, reduced, closeOnClickAway = true, root, toggle }: MenuOpenOptions): MenuOpen {
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  const [settled, setSettled] = useState<MenuPhase>(isOpen ? "open" : "closed");
  const change = useRef(onOpenChange);
  change.current = onOpenChange;

  const setOpen = (next: boolean): void => {
    if (next === isOpen) return;
    if (open === undefined) setInner(next);
    change.current?.(next);
  };
  const setRef = useRef(setOpen);
  setRef.current = setOpen;

  useLayoutEffect(() => {
    if (isOpen) {
      // 读一次布局, 让起始样式先落定, 下一次提交的终态样式才会触发过渡
      void root.current?.offsetHeight;
      setSettled("open");
      return undefined;
    }
    if (reduced || exitMs <= 0) {
      setSettled("closed");
      return undefined;
    }
    setSettled((prev) => (prev === "closed" ? prev : "closing"));
    const timer = setTimeout(() => setSettled("closed"), exitMs);
    return () => clearTimeout(timer);
  }, [isOpen, reduced, exitMs, root]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      setRef.current(false);
      toggle.current?.focus();
    };
    const onDown = (event: PointerEvent): void => {
      if (closeOnClickAway && root.current && !root.current.contains(event.target as Node)) setRef.current(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [isOpen, closeOnClickAway, root, toggle]);

  let phase: MenuPhase;
  if (isOpen) phase = settled === "open" ? "open" : "entering";
  else phase = settled === "closed" ? "closed" : "closing";
  return { open: isOpen, phase, mounted: phase !== "closed", shown: phase === "open", setOpen, toggleOpen: () => setOpen(!isOpen) };
}
