import { useEffect, useState } from "react";
import { MEDIA_REDUCED_MOTION } from "../../../../src/constants/ui";
import { toFrameMs } from "../use-clock";

/** 视口外这么远就提前算进场, 卡滚进来时已经在动. */
const NEAR = "160px";

function reduced(): boolean {
  return window.matchMedia?.(MEDIA_REDUCED_MOTION).matches === true;
}

/** 元素是否在视口附近. once 为真时第一次进来后一直为真 (用来推迟挂载重组件). */
export function useNear(el: Element | null, margin: string = NEAR, once: boolean = false): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
        else if (!once) setNear(false);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [el, margin, once]);
  return near;
}

/**
 * 卡内循环的镜头时钟: 进视口才走, 离开就停在原地; 走完 total 停 rest 毫秒再从 0 开始.
 * 时间按整帧取, 镜头卡里的帧号照样取得到. 减弱动效直接给终点.
 */
export function useLoopMs(el: Element | null, total: number, rest: number): number {
  const near = useNear(el);
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (reduced()) {
      setMs(total);
      return;
    }
    if (!near) return;
    let frame = 0;
    let last = performance.now();
    let clock = 0;
    const loop = (now: number): void => {
      clock = (clock + now - last) % (total + rest);
      last = now;
      setMs(Math.min(total, toFrameMs(clock)));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [near, total, rest]);
  return ms;
}
