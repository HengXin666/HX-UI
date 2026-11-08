"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 ASCIIText, FuzzyText, ParticleText, WarpText 条目, 实现为 HX 自有.

import { useEffect, useRef, type RefObject } from "react";
import { DPR_CAP, HALF } from "./tokens";

/**
 * 画布文字的底座: 用一份不可见但占位的原文量尺寸, 读它的计算字体与颜色 (颜色来自语义 token 类, 不收色值),
 * 把原文画进离屏画布当采样源, 再把可见画布对齐到原文上. 像素比封顶 2, 尺寸变化时重建.
 * 环境没有 2d 上下文 (测试, 服务端) 时什么都不做, 原文仍在.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-kernel.md
 */
export interface CanvasText {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  /** 离屏的原文画布, 与可见画布同尺寸同像素比. */
  readonly source: HTMLCanvasElement;
  /** CSS 像素. */
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
  /** 原文的计算颜色与字体. */
  readonly color: string;
  readonly font: string;
  /** 原文四周留白 (CSS 像素), 给抖动, 粒子和透镜溢出用. */
  readonly pad: number;
}

/**
 * @param measureRef 量尺寸的原文元素 (不可见, 但占位).
 * @param canvasRef 可见画布.
 * @param text 原文, 变了重建.
 * @param pad 四周留白.
 * @param onBuild 每次重建后回调.
 */
export function useCanvasText(measureRef: RefObject<HTMLElement | null>, canvasRef: RefObject<HTMLCanvasElement | null>, text: string, pad: number, onBuild: (c: CanvasText) => void): RefObject<CanvasText | null> {
  const state = useRef<CanvasText | null>(null);
  const latest = useRef(onBuild);
  latest.current = onBuild;

  useEffect(() => {
    const measure = measureRef.current;
    const canvas = canvasRef.current;
    if (!measure || !canvas || typeof document === "undefined") return undefined;
    const build = (): void => {
      const ctx = canvas.getContext("2d");
      const source = document.createElement("canvas");
      const sctx = source.getContext("2d");
      if (!ctx || !sctx) return;
      const css = getComputedStyle(measure);
      const rect = measure.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const width = Math.ceil(rect.width + pad * 2);
      const height = Math.ceil(rect.height + pad * 2);
      for (const c of [canvas, source]) {
        c.width = Math.max(1, Math.round(width * dpr));
        c.height = Math.max(1, Math.round(height * dpr));
      }
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.font = font;
      sctx.fillStyle = css.color;
      sctx.textBaseline = "middle";
      sctx.fillText(text, pad, pad + rect.height * HALF);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.current = { canvas, ctx, source, width, height, dpr, color: css.color, font, pad };
      latest.current(state.current);
    };
    build();
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    let alive = true;
    void fonts?.ready.then(() => {
      if (alive) build();
    });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(build);
    ro?.observe(measure);
    return () => {
      alive = false;
      ro?.disconnect();
    };
  }, [measureRef, canvasRef, text, pad]);

  return state;
}
