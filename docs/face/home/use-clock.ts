import { useEffect, useState } from "react";
import { FRAME_MS } from "../../../src/craft";
import { MEDIA_REDUCED_MOTION } from "../../../src/constants/ui";

/** 毫秒取整到微秒, 让 15 帧正好是 500ms 而不是 500.00000000000006. */
const MICRO = 1000;

/** 时间 = 帧 × 33.3ms: 任意毫秒先落到最近的整帧, 镜头卡里的帧号才取得到. */
export function toFrameMs(ms: number): number {
  return Math.round(Math.round(ms / FRAME_MS) * FRAME_MS * MICRO) / MICRO;
}

function reduced(): boolean {
  return window.matchMedia?.(MEDIA_REDUCED_MOTION).matches === true;
}

/** 挂载起算的毫秒时钟, 按整帧走, 到 end 停表. 减弱动效直接给终点. */
export function useShotClock(end: number): number {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (reduced()) {
      setMs(end);
      return;
    }
    const began = performance.now();
    let frame = 0;
    const loop = (now: number): void => {
      const elapsed = now - began;
      setMs(Math.min(end, toFrameMs(elapsed)));
      if (elapsed < end) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [end]);
  return ms;
}

/** sticky 舞台的滚动进度: 轨道顶到达视口顶为 0, 轨道底离开视口底为 1. 往回滚就往回减. */
export function useStageProgress(track: HTMLElement | null): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!track) return;
    const read = (): void => {
      const rect = track.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      setProgress(range <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / range)));
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [track]);
  return progress;
}

/** 舞台从贴顶到松开走过的滚动距离, 与它在视口里贴住的位置. */
export interface StageSpan {
  readonly start: number;
  readonly length: number;
}

/** 轨道在文档里的起点和可滚长度: 舞台贴到 sticky top 时为 0, 轨道底与舞台底对齐时为 1. */
export function stageSpan(track: HTMLElement): StageSpan {
  const stage = track.firstElementChild as HTMLElement | null;
  const stick = stage ? Number.parseFloat(getComputedStyle(stage).top) || 0 : 0;
  const height = stage?.offsetHeight ?? window.innerHeight;
  const rect = track.getBoundingClientRect();
  return { start: rect.top + window.scrollY - stick, length: Math.max(0, rect.height - height) };
}

/**
 * 舞台时钟: 滚动进度换成镜头毫秒, 再落到整帧. 纯读滚动位置, 往回滚就是往回走, 不重播.
 * 减弱动效直接给终点.
 */
export function useStageMs(track: HTMLElement | null, total: number): number {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!track) return;
    if (reduced()) {
      setMs(total);
      return;
    }
    const read = (): void => {
      const span = stageSpan(track);
      const progress = span.length <= 0 ? 1 : Math.min(1, Math.max(0, (window.scrollY - span.start) / span.length));
      setMs(Math.min(total, toFrameMs(progress * total)));
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [track, total]);
  return ms;
}
