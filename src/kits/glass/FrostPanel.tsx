"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 GlassSurface 条目, 实现为 HX 自有.

import { useEffect, useId, useRef, useState, type CSSProperties, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import * as F from "./parts/frost-spec";
import { transitionOf } from "./tokens";

export { FROST_DEFAULTS, frostFallbackFilter, frostMap, frostMapUrl, frostScales, svgBackdropSupported, type FrostBlend, type FrostChannel, type FrostRenderer } from "./parts/frost-spec";

export interface FrostPanelProps {
  readonly children?: ReactNode;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly borderRadius?: number;
  /** 位移集中的边缘宽度, 占短边的比例. */
  readonly borderWidth?: number;
  /** 位移图中心块的亮度 0..100 与不透明度 0..1. */
  readonly brightness?: number;
  readonly opacity?: number;
  /** 位移图中心块的模糊 px; 退回滤镜时是背景模糊. */
  readonly blur?: number;
  /** 合成后的高斯模糊 stdDeviation. */
  readonly displace?: number;
  /** 面板底色 (var(--background)) 的浓度 0..1. */
  readonly backgroundOpacity?: number;
  readonly saturation?: number;
  readonly distortionScale?: number;
  readonly redOffset?: number;
  readonly greenOffset?: number;
  readonly blueOffset?: number;
  readonly xChannel?: F.FrostChannel;
  readonly yChannel?: F.FrostChannel;
  readonly mixBlendMode?: F.FrostBlend;
  /** auto: 支持时用 SVG 位移, 否则退回模糊; svg / fallback: 强制. */
  readonly renderer?: F.FrostRenderer;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * 磨砂玻璃面板: Chromium 上用 SVG 位移滤镜作 backdrop-filter, 红绿蓝三道按 distortionScale 加各自偏移分别位移再 screen 合成, 边缘一圈位移最强, 形成折射与色边;
 * 其他浏览器退回 blur + saturate + brightness. 尺寸变化时重画位移图. 出现时淡入 0.26s, 减弱动效时不淡入 (规格无减弱动效, 本件补上).
 * ENGINE-GAP: 折射是位移图近似, 不随视角变化; 色散只是三道固定偏移, 无明暗与高光随形变化.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-glass.md
 */
export function FrostPanel({
  children,
  width = F.FROST_DEFAULTS.width,
  height = F.FROST_DEFAULTS.height,
  borderRadius = F.FROST_DEFAULTS.borderRadius,
  borderWidth = F.FROST_DEFAULTS.borderWidth,
  brightness = F.FROST_DEFAULTS.brightness,
  opacity = F.FROST_DEFAULTS.opacity,
  blur = F.FROST_DEFAULTS.blur,
  displace = F.FROST_DEFAULTS.displace,
  backgroundOpacity = F.FROST_DEFAULTS.backgroundOpacity,
  saturation = F.FROST_DEFAULTS.saturation,
  distortionScale = F.FROST_DEFAULTS.distortionScale,
  redOffset = F.FROST_DEFAULTS.redOffset,
  greenOffset = F.FROST_DEFAULTS.greenOffset,
  blueOffset = F.FROST_DEFAULTS.blueOffset,
  xChannel = "R",
  yChannel = "G",
  mixBlendMode = "difference",
  renderer = "auto",
  className,
  style,
}: FrostPanelProps): JSX.Element {
  const reduced = useReducedMotion();
  const id = `hx-frost-${useId().replace(/:/g, "")}`;
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: typeof width === "number" ? width : 0, h: typeof height === "number" ? height : 0 });
  const [svg, setSvg] = useState(renderer === "svg");
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setSvg(renderer === "svg" || (renderer === "auto" && F.svgBackdropSupported()));
    setShown(true);
  }, [renderer]);

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const measure = (): void => setSize({ w: node.clientWidth || (typeof width === "number" ? width : 0), h: node.clientHeight || (typeof height === "number" ? height : 0) });
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [width, height]);

  const [r, g, b] = F.frostScales(distortionScale, redOffset, greenOffset, blueOffset);
  const map = F.frostMapUrl(F.frostMap(size.w, size.h, borderRadius, borderWidth, brightness, opacity, blur, mixBlendMode));
  const filter = svg ? `url(#${id}) saturate(${saturation})` : F.frostFallbackFilter(blur, saturation);
  const channel = (scale: number, keep: string, name: string): JSX.Element[] => [
    <feDisplacementMap key={`${name}-d`} in="SourceGraphic" in2="map" scale={scale} xChannelSelector={xChannel} yChannelSelector={yChannel} result={`${name}-d`} />,
    <feColorMatrix key={`${name}-m`} in={`${name}-d`} type="matrix" values={keep} result={name} />,
  ];

  return (
    <div
      ref={root}
      data-slot="frost-panel"
      data-renderer={svg ? "svg" : "fallback"}
      className={cn("relative isolate flex items-center justify-center overflow-hidden", className)}
      style={{
        width,
        height,
        borderRadius,
        opacity: shown ? 1 : 0,
        transition: transitionOf([["opacity", F.FROST_APPEAR_MS, "ease-out"]], reduced),
        background: `color-mix(in oklab, var(--background) ${Math.round(Math.min(1, Math.max(0, backgroundOpacity)) * 100)}%, transparent)`,
        backdropFilter: filter,
        WebkitBackdropFilter: filter,
        boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--foreground) 12%, transparent), var(--shadow-lg)",
        ...style,
      }}
    >
      {svg ? (
        <svg aria-hidden data-slot="frost-panel-filter" className="pointer-events-none absolute h-0 w-0" focusable="false">
          <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage href={map} x="0" y="0" width={size.w} height={size.h} preserveAspectRatio="none" result="map" />
            {channel(r, "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", "red")}
            {channel(g, "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", "green")}
            {channel(b, "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", "blue")}
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="rgb" />
            <feGaussianBlur in="rgb" stdDeviation={displace} />
          </filter>
        </svg>
      ) : null}
      <div className="relative z-[1] flex h-full w-full items-center justify-center">{children}</div>
    </div>
  );
}
