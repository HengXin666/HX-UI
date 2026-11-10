"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 Noise 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../motion/frame/use-frame-loop";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import { fillGrain, frameDue, seededRandom } from "./parts/grain";
import { GRAIN, type GrainBlend } from "./tokens";

export interface GrainLayerProps {
  /** 整层不透明度. */
  readonly opacity?: number;
  /** 颗粒倍数, 1 为一像素一粒. */
  readonly size?: number;
  /** 换帧频率; 0 为静止. */
  readonly fps?: number;
  readonly blendMode?: GrainBlend;
  /** 颗粒对比度 0 到 1. */
  readonly contrast?: number;
  /** 彩色颗粒 (三通道各自随机). */
  readonly colored?: boolean;
  /** 尘点, 划痕, 扫描线, 闪烁的强度, 0 到 1. */
  readonly dust?: number;
  readonly scratches?: number;
  readonly scanlines?: number;
  readonly flicker?: number;
  /** 铺满视口 (position fixed), 否则铺满最近的定位祖先. */
  readonly fixed?: boolean;
  /** 随机种子, 同一种子同一序列. */
  readonly seed?: number;
  readonly className?: string;
}

/**
 * 胶片颗粒层: 一块贴片逐帧重写颗粒, 尘点, 划痕与扫描线, 以图案铺满画布, 按混合模式叠在内容上.
 * 纯装饰, aria-hidden 且不接指针. 帧率按 fps 节拍出帧, 离开视口或页面隐藏时停.
 * 减弱动效: 只画一帧, 不换帧不闪烁.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-texture.md
 */
export function GrainLayer({
  opacity = GRAIN.opacity,
  size = GRAIN.size,
  fps = GRAIN.fps,
  blendMode = "overlay",
  contrast = GRAIN.contrast,
  colored = false,
  dust = 0,
  scratches = 0,
  scanlines = 0,
  flicker = 0,
  fixed = false,
  seed = 1,
  className,
}: GrainLayerProps): JSX.Element {
  const reduced = useReducedMotion();
  const still = reduced || prefersReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(true);
  const s = useRef({ acc: 0, rand: seededRandom(seed), tile: null as HTMLCanvasElement | null, image: null as ImageData | null });

  const draw = (): void => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const st = s.current;
    if (!st.tile) {
      st.tile = document.createElement("canvas");
      st.tile.width = GRAIN.tile;
      st.tile.height = GRAIN.tile;
    }
    const tctx = st.tile.getContext("2d");
    if (!tctx) return;
    st.image ??= tctx.createImageData(GRAIN.tile, GRAIN.tile);
    fillGrain(st.image.data, GRAIN.tile, GRAIN.tile, { contrast, colored, dust, scratches, scanlines, dustMax: GRAIN.dustMax, dustPx: GRAIN.dustPx, scratchChance: GRAIN.scratchChance, scratchPx: GRAIN.scratchPx, scanPeriodPx: GRAIN.scanPeriodPx, scanDim: GRAIN.scanDim }, st.rand);
    tctx.putImageData(st.image, 0, 0);
    const pattern = ctx.createPattern(st.tile, "repeat");
    if (!pattern) return;
    const k = Math.max(0.25, size);
    ctx.setTransform(k, 0, 0, k, -Math.floor(st.rand() * GRAIN.tile) * k, -Math.floor(st.rand() * GRAIN.tile) * k);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, el.width / k + GRAIN.tile, el.height / k + GRAIN.tile);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    el.style.opacity = String(still ? opacity : opacity * (1 - Math.max(0, Math.min(1, flicker)) * GRAIN.flickerDip * st.rand()));
  };

  useEffect(() => {
    s.current.rand = seededRandom(seed);
  }, [seed]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return undefined;
    const fit = (): void => {
      const dpr = Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, GRAIN.dprCap);
      el.width = Math.max(1, Math.round(el.clientWidth * dpr));
      el.height = Math.max(1, Math.round(el.clientHeight * dpr));
      draw();
    };
    fit();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    ro?.observe(el);
    const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([e]) => setVisible(e?.isIntersecting ?? true));
    io?.observe(el);
    return () => {
      ro?.disconnect();
      io?.disconnect();
    };
    // draw 读最新 props; 只在挂载与外观参数变化时重配画布.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, contrast, colored, dust, scratches, scanlines, opacity, still]);

  useFrameLoop((dtMs) => {
    const tick = frameDue(s.current.acc, dtMs / 1000, fps);
    s.current.acc = tick.acc;
    if (tick.due) draw();
    return true;
  }, { maxDtMs: 100, active: !still && visible && fps > 0, pauseWhenHidden: true });

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      data-slot="grain-layer"
      className={cn("pointer-events-none inset-0 size-full", fixed ? "fixed" : "absolute", className)}
      style={{ opacity, mixBlendMode: blendMode }}
    />
  );
}
