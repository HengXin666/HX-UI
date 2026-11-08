"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GridDistortion 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { cssColorOf } from "../../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import {
  coverScale, GRID_DISTORTION, GRID_DISTORTION_FRAGMENT, makeField, packField, stepField, type DistortField, type DistortMode,
} from "./grid-distortion-field";
import { introProgress, rgbAt } from "./tokens";

export interface GridDistortionProps extends BackdropCommonProps {
  /** 被扭曲的图像地址. 不给时用两色渐变底加细网格. */
  readonly imageSrc?: string;
  /** 横向格数, 默认 15. */
  readonly grid?: number;
  /** 指针影响半径 (以画布宽计), 默认 0.18. */
  readonly radius?: number;
  /** 扭曲强度, 默认 0.15. */
  readonly strength?: number;
  /** 每 1/60 秒的回弹保留率, 默认 0.96. */
  readonly relaxation?: number;
  /** 扰动方式: drag / push / swirl. */
  readonly mode?: DistortMode;
  /** 0 为逐格块状位移, 1 为平滑插值, 默认 0. */
  readonly softness?: number;
  /** 三通道错开程度, 默认 0. */
  readonly chroma?: number;
  /** 指针静止时整场缓慢晃动的幅度, 默认 0.3. */
  readonly idle?: number;
  /** 点击打出涟漪. */
  readonly clickRipple?: boolean;
  /** 图像就绪后由中心揭开 (0.6 秒). */
  readonly intro?: boolean;
  /** 无图时渐变起点色, 默认 primary. */
  readonly fromColor?: string;
  /** 无图时渐变终点色, 默认 accent. */
  readonly toColor?: string;
  /** 无图时网格线色, 默认 background. */
  readonly lineColor?: string;
}

/** WebGL 不可用时: 有图铺原图 (cover), 无图铺两色渐变. */
export function distortFallback(imageSrc: string | undefined, from: string, to: string): string {
  return imageSrc ? `center / cover no-repeat url(${JSON.stringify(imageSrc)}), ${cssColorOf(from)}` : fallbackGradient([from, to]);
}

/** 加载图像, 就绪前为 null; src 变了重新加载. */
function useImage(src: string | undefined): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    setImage(null);
    if (!src || typeof Image === "undefined") return undefined;
    const img = new Image();
    img.crossOrigin = "anonymous";
    let alive = true;
    img.onload = () => {
      if (alive) setImage(img);
    };
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return image;
}

/**
 * 网格扭曲: 一张图 (或渐变网格) 被一张粗网格位移场推着走. 指针速度按 drag / push / swirl 写进半径内的格子,
 * 每帧按 relaxation 回弹; softness 在块状与平滑之间取, chroma 错开三通道, 指针静止时整场轻晃, 点击打出涟漪.
 * 位移场在 JS 侧积分, 打包成一格一纹素的小纹理, WebGL2 片元采样.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-grid.md
 */
export function GridDistortion(props: GridDistortionProps): JSX.Element {
  const {
    imageSrc, grid = 15, radius = 0.18, strength = 0.15, relaxation = 0.96, mode = "drag", softness = 0, chroma = 0, idle = 0.3,
    clickRipple = true, intro = true, fromColor = "primary", toColor = "accent", lineColor = "background", ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const image = useImage(imageSrc);
  const field = useRef<DistortField | null>(null);
  const bytes = useRef<ImageData[]>([]);
  const flip = useRef(0);
  const shownAt = useRef<number | null>(null);

  const uniforms = (frame: BackdropFrame) => {
    const aspect = frame.fit.width / Math.max(frame.fit.height, 1);
    let f = field.current;
    const want = makeField(grid, aspect);
    if (!f || f.cols !== want.cols || f.rows !== want.rows) {
      f = want;
      field.current = f;
      bytes.current = typeof ImageData === "undefined" ? [] : [new ImageData(f.cols, f.rows), new ImageData(f.cols, f.rows)];
    }
    const p = frame.pointer;
    stepField(f, frame.dt, { mode, radius, strength, relaxation, aspect, pointer: p.inside ? { x: p.x, y: p.y, vx: p.vx, vy: p.vy } : null });
    flip.current = 1 - flip.current;
    const out = bytes.current[flip.current];
    if (out) packField(f, out.data);
    const ready = !imageSrc || image !== null;
    if (ready && shownAt.current === null) shownAt.current = frame.elapsed;
    const since = shownAt.current === null ? 0 : frame.elapsed - shownAt.current;
    return {
      u_grid: [f.cols, f.rows],
      u_cover: image ? coverScale(aspect, image.naturalWidth / Math.max(image.naturalHeight, 1)) : [1, 1],
      u_has_image: image ? 1 : 0,
      u_softness: softness,
      u_chroma: chroma,
      u_idle: idle,
      u_phantom: f.phantom,
      u_ripple: clickRipple ? 1 : 0,
      u_reveal: ready ? introProgress(since, GRID_DISTORTION.revealSeconds, intro) : 0,
      u_from: rgbAt(frame.colors, 0),
      u_to: rgbAt(frame.colors, 1),
      u_line: rgbAt(frame.colors, 2),
    };
  };

  const textures = () => ({ u_field: bytes.current[flip.current], u_image: image });
  const handle = useShaderBackdrop({ fragment: GRID_DISTORTION_FRAGMENT, uniforms, textures }, { ...options, colors: [fromColor, toColor, lineColor] });
  const fallback = distortFallback(imageSrc, fromColor, toColor);
  return (
    <BackdropShell handle={handle} fallback={fallback} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
