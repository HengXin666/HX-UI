import * as React from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface ScrollStackProps {
  /** 容器自己滚动时的无障碍名称, 键盘可聚焦后用方向键滚动 */
  "aria-label"?: string;
  /** 要叠起来的卡片, 一般是 ScrollStackItem */
  children: React.ReactNode;
  /** 叠起来之前卡片之间的距离, px. 越大每张之间滚得越久 */
  itemDistance?: number;
  /** 叠好后每张比上一张低多少, px. 0 完全重合 */
  itemStackDistance?: number;
  /** 从视口或容器顶部多远开始钉住. 数字是 px, 也可以写 "15%" */
  stackPosition?: number | string;
  /** 上面每压一张, 下面这张缩小多少 */
  itemScale?: number;
  /** 被压住的卡片最小缩到多少 */
  baseScale?: number;
  /** 上面每压一张, 下面这张暗多少, 0-1 */
  dimAmount?: number;
  /** 上面每压一张, 下面这张模糊多少 px */
  blurAmount?: number;
  /** 被压住的卡片往后仰多少度 */
  tiltAmount?: number;
  /** 被压住的卡片左右交替转多少度, 像一叠随手放的纸 */
  rotationAmount?: number;
  /** 全部叠好后再钉住多久才一起滚走, px */
  holdDistance?: number;
  /** 鼠标滚轮平滑滚动; 触屏、键盘、滚动条保持原生 */
  smoothScroll?: boolean;
  /** 停在两张之间时, 自动滑到最近的一张 */
  snap?: boolean;
  /** 跟随整页滚动, 而不是在自己的容器里滚. 父级不要 overflow: hidden */
  useWindowScroll?: boolean;
  /** 最后一张落到位时调用 */
  onStackComplete?: () => void;
  /** 滚动容器 (或整页模式下的外层) 的 class */
  className?: string;
  /** 内层 (卡片列) 的 class, 控制宽度和左右留白 */
  innerClassName?: string;
  style?: React.CSSProperties;
}

export interface ScrollStackItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 卡片的尺寸、颜色和内容 */
  itemClassName?: string;
}

export function ScrollStackItem({ itemClassName, className, children, ...rest }: ScrollStackItemProps) {
  return (
    <div data-hx-stack-item="" className={cn("hx-stack-item relative w-full origin-top rounded-[2rem] p-10 will-change-transform", itemClassName, className)} {...rest}>
      {children}
    </div>
  );
}

function px(v: number | string, h: number) {
  if (typeof v === "number") return v;
  const n = parseFloat(v);
  return v.trim().endsWith("%") ? (n / 100) * h : n;
}

export function ScrollStack({
  children,
  itemDistance = 100,
  itemStackDistance = 24,
  stackPosition = "15%",
  itemScale = 0.05,
  baseScale = 0.8,
  dimAmount = 0.2,
  blurAmount = 0,
  tiltAmount = 0,
  rotationAmount = 0,
  holdDistance = 200,
  smoothScroll = true,
  snap = false,
  useWindowScroll = false,
  onStackComplete,
  className,
  innerClassName,
  style,
  "aria-label": ariaLabel = "滚动卡片",
}: ScrollStackProps) {
  const reduce = useReducedMotion();
  const outer = React.useRef<HTMLDivElement>(null);
  const inner = React.useRef<HTMLDivElement>(null);
  const tail = React.useRef<HTMLDivElement>(null);
  const done = React.useRef(false);
  const cb = React.useRef(onStackComplete);
  cb.current = onStackComplete;
  const cfg = { itemDistance, itemStackDistance, stackPosition, itemScale, baseScale, dimAmount, blurAmount, tiltAmount, rotationAmount, holdDistance };
  const cfgRef = React.useRef(cfg);
  cfgRef.current = cfg;
  const pins = React.useRef<number[]>([]);

  React.useEffect(() => {
    const host = outer.current, list = inner.current;
    if (!host || !list) return;
    const scroller: HTMLElement = useWindowScroll ? (document.scrollingElement as HTMLElement) : host;
    const items = () => Array.from(list.querySelectorAll<HTMLElement>(":scope > [data-hx-stack-item]"));
    let tops: number[] = [], vh = 0, raf = 0;

    const measure = () => {
      const c = cfgRef.current;
      const els = items();
      els.forEach((el, i) => { el.style.marginBottom = i === els.length - 1 ? "0px" : `${c.itemDistance}px`; });
      vh = useWindowScroll ? window.innerHeight : host.clientHeight;
      // 卡片在滚动坐标里的原始位置 (transform 不影响 offsetTop)
      const base = useWindowScroll ? list.getBoundingClientRect().top + window.scrollY : list.offsetTop;
      tops = els.map((el) => base + el.offsetTop);
      const sp = px(c.stackPosition, vh);
      pins.current = tops.map((t, i) => t - (sp + i * c.itemStackDistance));
      const last = els[els.length - 1];
      if (tail.current && last) tail.current.style.height = `${Math.max(0, vh - sp - (els.length - 1) * c.itemStackDistance - last.offsetHeight) + c.holdDistance}px`;
      update();
    };

    const update = () => {
      const c = cfgRef.current;
      const y = scroller.scrollTop;
      const els = items();
      const p = pins.current;
      if (!els.length || p.length !== els.length) return;
      const release = p[p.length - 1] + c.holdDistance;
      const yy = Math.min(y, release);
      const prog = p.map((s, j) => {
        if (j === 0) return yy >= s ? 1 : 0;
        const gap = Math.max(1, s - p[j - 1]);
        return Math.min(1, Math.max(0, (yy - (s - gap)) / gap));
      });
      els.forEach((el, i) => {
        const shift = Math.max(0, yy - p[i]);
        let depth = 0;
        for (let j = i + 1; j < els.length; j++) depth += prog[j];
        const s = Math.max(c.baseScale, 1 - c.itemScale * depth);
        const d1 = Math.min(1, depth);
        const tilt = c.tiltAmount * d1;
        const rot = c.rotationAmount * d1 * (i % 2 ? 1 : -1);
        el.style.transform = `translate3d(0, ${shift}px, 0)${tilt ? ` perspective(1200px) rotateX(${tilt}deg)` : ""}${rot ? ` rotate(${rot}deg)` : ""} scale(${s})`;
        el.style.setProperty("--hx-stack-dim", String(Math.min(0.9, c.dimAmount * depth)));
        el.style.filter = c.blurAmount && depth > 0.01 ? `blur(${(c.blurAmount * depth).toFixed(2)}px)` : "";
        el.style.zIndex = String(i + 1);
      });
      const complete = prog[prog.length - 1] >= 1;
      if (complete && !done.current) cb.current?.();
      done.current = complete;
    };

    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    const target: HTMLElement | Window = useWindowScroll ? window : host;
    target.addEventListener("scroll", onScroll, { passive: true });

    // 滚轮平滑: 只接管鼠标滚轮
    let goal = -1, glide = 0;
    const step = () => {
      const cur = scroller.scrollTop;
      const next = cur + (goal - cur) * 0.16;
      scroller.scrollTop = Math.abs(goal - next) < 0.5 ? goal : next;
      glide = Math.abs(goal - scroller.scrollTop) >= 0.5 ? requestAnimationFrame(step) : 0;
      if (!glide) goal = -1;
    };
    const onWheel = (e: WheelEvent) => {
      if (!smoothScroll || reduce || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = scroller.scrollHeight - (useWindowScroll ? window.innerHeight : host.clientHeight);
      const from = goal < 0 ? scroller.scrollTop : goal;
      const to = Math.max(0, Math.min(max, from + e.deltaY * (e.deltaMode === 1 ? 32 : 1)));
      // 容器滚到头时把滚轮还给页面
      if (!useWindowScroll && to === from) return;
      e.preventDefault();
      goal = to;
      if (!glide) glide = requestAnimationFrame(step);
    };
    const wheelTarget: HTMLElement | Window = useWindowScroll ? window : host;
    wheelTarget.addEventListener("wheel", onWheel as EventListener, { passive: false });

    // 吸附
    let idle = 0;
    const onIdle = () => {
      if (!snap || reduce) return;
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        if (glide) return;
        const y = scroller.scrollTop;
        const p = pins.current;
        const near = p.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a), p[0] ?? y);
        if (Math.abs(near - y) > 2 && Math.abs(near - y) < cfgRef.current.itemDistance + 400) {
          goal = near;
          if (!glide) glide = requestAnimationFrame(step);
        }
      }, 140);
    };
    target.addEventListener("scroll", onIdle, { passive: true });

    const ro = new ResizeObserver(measure);
    ro.observe(list);
    if (!useWindowScroll) ro.observe(host);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      cancelAnimationFrame(raf); cancelAnimationFrame(glide); window.clearTimeout(idle);
      target.removeEventListener("scroll", onScroll); target.removeEventListener("scroll", onIdle);
      wheelTarget.removeEventListener("wheel", onWheel as EventListener);
      ro.disconnect(); window.removeEventListener("resize", measure);
      items().forEach((el) => { el.style.transform = ""; el.style.filter = ""; el.style.zIndex = ""; el.style.marginBottom = ""; el.style.removeProperty("--hx-stack-dim"); });
    };
  }, [useWindowScroll, smoothScroll, snap, reduce]);

  // 数值参数变化时重新量一次
  const key = JSON.stringify(cfg);
  React.useEffect(() => { outer.current?.dispatchEvent(new Event("scroll")); window.dispatchEvent(new Event("resize")); }, [key]);

  return (
    <div
      ref={outer}
      className={cn(useWindowScroll ? "relative" : "relative h-full w-full overflow-y-auto overscroll-contain", className)}
      style={style}
      data-hx-scroll-stack=""
      tabIndex={useWindowScroll ? undefined : 0}
      role={useWindowScroll ? undefined : "region"}
      aria-label={useWindowScroll ? undefined : ariaLabel}
    >
      <div ref={inner} className={cn("relative mx-auto px-6 pt-[18vh]", innerClassName)}>
        {children}
        <div ref={tail} aria-hidden="true" />
      </div>
    </div>
  );
}
