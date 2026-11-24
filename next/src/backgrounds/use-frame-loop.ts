"use client";

import * as React from "react";

export interface FrameInfo {
  /** 秒, 从挂载算起 (暂停期间不走) */
  t: number;
  /** 本帧间隔, 秒 */
  dt: number;
  /** 画布 css 尺寸 */
  w: number;
  h: number;
  dpr: number;
}

/**
 * 背景类组件共用的画布循环: 跟随容器尺寸, 限制 dpr, 不在视口或标签页隐藏时停帧.
 * still 为 true (减少动态效果 / paused) 时只在尺寸变化和 deps 变化时画一帧.
 */
export function useFrameLoop(
  canvas: React.RefObject<HTMLCanvasElement | null>,
  draw: (f: FrameInfo) => void,
  opts: { maxDpr?: number; still?: boolean; deps?: unknown[] } = {},
) {
  const drawRef = React.useRef(draw);
  drawRef.current = draw;
  const { maxDpr = 2, still = false, deps = [] } = opts;
  const size = React.useRef({ w: 0, h: 0, dpr: 1 });
  const time = React.useRef(0);
  const kick = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let raf = 0, last = 0, onScreen = true, running = false;
    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (!still) time.current += dt;
      const { w, h, dpr } = size.current;
      if (w && h) drawRef.current({ t: time.current, dt, w, h, dpr });
      if (running) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || still || !onScreen || document.hidden) return;
      running = true; last = 0; raf = requestAnimationFrame(frame);
    };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const once = () => { const { w, h, dpr } = size.current; if (w && h) drawRef.current({ t: time.current, dt: 0, w, h, dpr }); };
    kick.current = () => (still ? once() : start());
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
      size.current = { w: r.width, h: r.height, dpr };
      el.width = Math.max(1, Math.round(r.width * dpr));
      el.height = Math.max(1, Math.round(r.height * dpr));
      once();
    });
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) start(); else stop(); });
    io.observe(el);
    const vis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", vis);
    start();
    return () => { stop(); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", vis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, maxDpr, still]);

  // 参数变化时静止模式也要重画
  React.useEffect(() => { kick.current(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return time;
}

/** 把任意 css 颜色 (含 var(--x), oklch) 解析成 0-1 的 rgb, 依赖元素所在的主题 */
export function resolveColors(el: Element | null, colors: string[]): [number, number, number][] {
  if (typeof document === "undefined") return colors.map(() => [1, 1, 1]);
  const probe = document.createElement("span");
  (el ?? document.body).appendChild(probe);
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = 1;
  const ctx = cvs.getContext("2d", { willReadFrequently: true })!;
  const out = colors.map((c) => {
    probe.style.color = "";
    probe.style.color = c;
    const css = getComputedStyle(probe).color;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0] / 255, d[1] / 255, d[2] / 255] as [number, number, number];
  });
  probe.remove();
  return out;
}

/** 主题切换 (html class / data-theme) 时返回递增的版本号, 用来重新解析颜色 */
export function useThemeVersion() {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const mo = new MutationObserver(() => setV((x) => x + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
    return () => mo.disconnect();
  }, []);
  return v;
}
