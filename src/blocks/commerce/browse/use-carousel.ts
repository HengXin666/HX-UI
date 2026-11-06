"use client";

import * as React from "react";
import { BROWSE_NUMBERS } from "../../../constants/blocks-commerce-v107";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { useControllableState } from "../../../hooks/state/useControllableState";

export interface CarouselOptions {
  count: number;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** 自动播放间隔 ms; 不传或减弱动效时不自动播. 最短 BROWSE_NUMBERS.autoplayMin. */
  autoplay?: number;
}

export interface Carousel {
  index: number;
  go: (index: number) => void;
  step: (delta: 1 | -1) => void;
  /** 是否正在自动播放 (未暂停且允许). */
  playing: boolean;
  autoplayEnabled: boolean;
  togglePlay: () => void;
  /** 挂在轮播根上: hover / 焦点进入时暂停, 离开恢复 (WCAG 2.2.2). */
  pauseHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: (event: React.FocusEvent<HTMLElement>) => void;
  };
}

/** 多张轮播的状态: 受控 index 三件套, 环绕翻页, 可暂停的自动播放. */
export function useCarousel({ count, index, defaultIndex = BROWSE_NUMBERS.first, onIndexChange, autoplay }: CarouselOptions): Carousel {
  const reduced = useReducedMotion();
  const [current, setCurrent] = useControllableState<number>({ value: index, defaultValue: defaultIndex, onChange: onIndexChange });
  const [paused, setPaused] = React.useState(false);
  const [hovering, setHovering] = React.useState(false);
  const autoplayEnabled = autoplay !== undefined && count > 1 && !reduced;
  const playing = autoplayEnabled && !paused && !hovering;

  const go = React.useCallback((next: number) => setCurrent(((next % count) + count) % count), [count, setCurrent]);
  const step = React.useCallback((delta: 1 | -1) => go(current + delta), [current, go]);

  React.useEffect(() => {
    if (!playing || autoplay === undefined) return undefined;
    const timer = setTimeout(() => go(current + 1), Math.max(autoplay, BROWSE_NUMBERS.autoplayMin));
    return () => clearTimeout(timer);
  }, [playing, autoplay, current, go]);

  return {
    index: Math.min(current, Math.max(count - 1, 0)),
    go,
    step,
    playing,
    autoplayEnabled,
    togglePlay: () => setPaused((p) => !p),
    pauseHandlers: {
      onMouseEnter: () => setHovering(true),
      onMouseLeave: () => setHovering(false),
      onFocus: () => setHovering(true),
      onBlur: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovering(false);
      },
    },
  };
}
