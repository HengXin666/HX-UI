import { useEffect, useState } from "react";
import { useIntersection, useReducedMotion } from "../../../../src/hooks";
import { toFrameMs } from "../use-clock";

/** 视口外这么远就提前算进场, 卡滚进来时已经在动. */
const NEAR = "160px";

/**
 * 元素是否在视口附近, 观察交给库的 useIntersection. once 为真时第一次进来后一直为真 (用来推迟挂载重组件).
 * 调用方手里是元素本身 (同一个元素还要喂给时钟和量宽), 这里把它交给库返回的回调 ref.
 */
export function useNear(el: Element | null, margin: string = NEAR, once: boolean = false): boolean {
  const { ref, entry } = useIntersection<Element>({ rootMargin: margin });
  const [seen, setSeen] = useState(false);
  useEffect(() => ref(el), [el, ref]);
  const hit = entry?.isIntersecting === true;
  useEffect(() => {
    if (hit) setSeen(true);
  }, [hit]);
  return hit || (once && seen);
}

/**
 * 卡内循环的镜头时钟: 进视口才走, 离开就停在原地; 走完 total 停 rest 毫秒再从 0 开始.
 * 时间按整帧取, 镜头卡里的帧号照样取得到. 减弱动效直接给终点, 系统设置中途切换也跟着变.
 */
export function useLoopMs(el: Element | null, total: number, rest: number): number {
  const near = useNear(el);
  const reduced = useReducedMotion();
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (reduced) {
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
  }, [near, reduced, total, rest]);
  return ms;
}
