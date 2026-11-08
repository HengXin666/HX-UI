// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.
"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { resolveColor, type Rgb } from "./color";
import { planRun, watchView, type RunPlan } from "./gate";
import { BACKDROP_MAX_EDGE, BACKDROP_STILL_TIME, clampDpr, fitCanvas, frameSeconds, type CanvasFit } from "./math";
import { attachPointer, createPointerState, stepPointer, type PointerState } from "./pointer";
import { useReducedMotionPreference } from "./use-reduced-motion";

/** 交给渲染器的一帧. */
export interface BackdropFrame {
  /** 场的时钟 (秒): 累计帧长乘 speed, 停帧时不走; 减弱动效时固定为 stillTime. */
  readonly time: number;
  /** 本帧真实帧长 (秒, 已钳), 给 JS 侧的积分用. 静态帧为 0. */
  readonly dt: number;
  /** 出帧以来的真实秒数, 不乘 speed, 给入场动画用. 减弱动效时视为入场已结束. */
  readonly elapsed: number;
  /** 画布设备像素尺寸与每 CSS 像素的设备像素. */
  readonly fit: CanvasFit;
  readonly pointer: PointerState;
  /** colors 选项逐个解析出的 sRGB. */
  readonly colors: readonly Rgb[];
  readonly reduced: boolean;
  /** 这是一张单独的静态帧 (减弱动效, 暂停, 或停帧中尺寸 / 主题变化后的重绘). */
  readonly still: boolean;
}

/** 渲染器: WebGL2, Canvas2D 或纯 DOM 都实现这三个方法. */
export interface BackdropRenderer {
  resize: (fit: CanvasFit) => void;
  render: (frame: BackdropFrame) => void;
  dispose: () => void;
}

/** 渲染器工厂. 返回 null 表示环境不支持, 内核退到 CSS 兜底; 运行中失效 (上下文丢失) 时调用 fail. */
export type BackdropFactory = (canvas: HTMLCanvasElement | null, host: HTMLElement, fail: () => void) => BackdropRenderer | null;

export interface BackdropOptions {
  readonly create: BackdropFactory;
  /** 渲染器的身份: 变了就销毁重建 (比如片元源码). */
  readonly rendererKey?: string;
  /** 颜色 prop 列表 (token 名或 CSS 颜色), 在宿主作用域里解析. */
  readonly colors?: readonly string[];
  /** 与 colors 一一对应的解析失败兜底. */
  readonly colorFallbacks?: readonly Rgb[];
  readonly speed?: number;
  readonly paused?: boolean;
  /** 覆写系统的减弱动效偏好. */
  readonly reducedMotion?: boolean;
  /** 像素比上限, 默认 2. */
  readonly dpr?: number;
  readonly maxEdge?: number;
  /** 是否监听指针, 默认 true. */
  readonly pointer?: boolean;
  readonly stillTime?: number;
}

export type BackdropStatus = "pending" | "live" | "fallback";

export interface BackdropHandle {
  readonly hostRef: RefObject<HTMLDivElement | null>;
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly status: BackdropStatus;
  readonly plan: RunPlan;
}

const MID = 0.5;
const GREY: Rgb = [MID, MID, MID];
const LIVE: BackdropStatus = "live";
const ABSENT = "undefined";
const THEME_ATTRIBUTES = ["class", "style", "data-mode", "data-theme", "data-skin"];

interface CoreState {
  renderer: BackdropRenderer | null;
  pointer: PointerState;
  colors: Rgb[];
  time: number;
  elapsed: number;
  fit: CanvasFit;
}

/**
 * Backgrounds 族的内核: 单画布, 像素比上限, ResizeObserver 跟尺寸, IntersectionObserver 离屏停帧,
 * 页面隐藏停帧, 减弱动效与暂停只画一帧, 颜色 token 在宿主作用域解析并跟随主题切换.
 * 帧循环走 src/motion/frame/use-frame-loop, 不自起 rAF.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backdrop-kernel.md
 */
export function useBackdrop(options: BackdropOptions): BackdropHandle {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latest = useRef(options);
  latest.current = options;
  const [status, setStatus] = useState<BackdropStatus>("pending");
  const [inView, setInView] = useState(true);
  const [sizeTick, setSizeTick] = useState(0);
  const prefers = useReducedMotionPreference();
  const reduced = options.reducedMotion ?? prefers;
  const plan = planRun({ inView, pageHidden: false, reduced, paused: options.paused === true });
  const core = useRef<CoreState | null>(null);
  core.current ??= { renderer: null, pointer: createPointerState(), colors: [], time: 0, elapsed: 0, fit: { width: 1, height: 1, scale: 1 } };
  const s = core.current;

  const draw = (dt: number, still: boolean): void => {
    const { renderer } = s;
    if (!renderer) return;
    const stillReduced = still && reduced;
    renderer.render({
      time: stillReduced ? (latest.current.stillTime ?? BACKDROP_STILL_TIME) : s.time,
      dt,
      elapsed: stillReduced ? Number.POSITIVE_INFINITY : s.elapsed,
      fit: s.fit,
      pointer: s.pointer,
      colors: s.colors,
      reduced,
      still,
    });
  };

  const loop = useFrameLoop(
    (dtMs) => {
      const dt = frameSeconds(dtMs);
      s.time += dt * (latest.current.speed ?? 1);
      s.elapsed += dt;
      stepPointer(s.pointer, dt, s.elapsed);
      draw(dt, false);
      return true;
    },
    { active: plan === "animate" && status === LIVE, pauseWhenHidden: true },
  );

  const { rendererKey } = options;
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let alive = true;
    const fail = (): void => {
      if (alive) setStatus("fallback");
    };
    const renderer = latest.current.create(canvasRef.current, host, fail);
    s.renderer = renderer;
    setStatus(renderer ? LIVE : "fallback");
    if (renderer) renderer.resize(s.fit);
    return () => {
      alive = false;
      renderer?.dispose();
      s.renderer = null;
    };
  }, [rendererKey, s]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const measure = (): void => {
      const rect = host.getBoundingClientRect();
      const o = latest.current;
      const dpr = clampDpr(typeof window === ABSENT ? 1 : window.devicePixelRatio, o.dpr);
      const fit = fitCanvas(rect.width, rect.height, dpr, o.maxEdge ?? BACKDROP_MAX_EDGE);
      const canvas = canvasRef.current;
      if (canvas && (canvas.width !== fit.width || canvas.height !== fit.height)) {
        canvas.width = fit.width;
        canvas.height = fit.height;
      }
      s.fit = fit;
      s.renderer?.resize(fit);
      setSizeTick((n) => n + 1);
    };
    measure();
    const stopView = watchView(host, setInView);
    if (typeof ResizeObserver === ABSENT) return stopView;
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => {
      ro.disconnect();
      stopView();
    };
  }, [options.dpr, options.maxEdge, s]);

  const colorKey = (options.colors ?? []).join("|");
  useEffect(() => {
    const host = hostRef.current;
    const resolve = (): void => {
      const o = latest.current;
      s.colors = (o.colors ?? []).map((c, i) => resolveColor(host, c, o.colorFallbacks?.[i] ?? GREY));
      setSizeTick((n) => n + 1);
    };
    resolve();
    if (typeof MutationObserver === ABSENT || typeof document === ABSENT) return undefined;
    const mo = new MutationObserver(resolve);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: THEME_ATTRIBUTES });
    return () => mo.disconnect();
  }, [colorKey, s]);

  const pointerOn = options.pointer !== false;
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !pointerOn) return undefined;
    return attachPointer(host, s.pointer, () => s.elapsed, () => loop.wake());
  }, [pointerOn, loop, s]);

  useEffect(() => {
    if (plan === "still" && status === LIVE) draw(0, true);
  });

  void sizeTick;
  return { hostRef, canvasRef, status, plan };
}
