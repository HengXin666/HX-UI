"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 ElectricLogo 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX } from "react";
import { BackdropShell } from "../backdrop/kernel/BackdropShell";
import type { Rgb } from "../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../backdrop/kernel/common";
import { fallbackGradient } from "../backdrop/kernel/fallback";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { rasterImage, rasterPath } from "./parts/mask";
import { sdfCanvas, type SdfField } from "./parts/sdf";
import { makeSpark, packPulses, startMorph, stepSpark } from "./parts/spark";
import { SPARK_FRAGMENT } from "./parts/spark-shader";
import { SOFT, SPARK_MARK, SPARK_BOLT } from "./tokens";

export interface SparkMarkProps extends BackdropCommonProps {
  /** 图形的图片地址 (用透明度当形状); 不给时是自带的闪电. 换 src 时从旧图形形变过去. */
  readonly src?: string;
  /** 电弧芯色 (token 名), 默认 accent. */
  readonly color?: string;
  /** 辉光色 (token 名), 默认 primary. */
  readonly glowColor?: string;
  /** 图形占短边的比例, 默认 0.7. */
  readonly scale?: number;
  readonly intensity?: number;
  /** 辉光与支弧的伸展. */
  readonly glow?: number;
  /** 电弧粗细. */
  readonly thickness?: number;
  /** 沿轮廓的电弧股数, 上限 5. */
  readonly strands?: number;
  /** 抖动的空间频率. */
  readonly bend?: number;
  /** 抖动幅度. */
  readonly crackle?: number;
  /** 轮廓外支弧数, 上限 5. */
  readonly arcs?: number;
  /** 闪烁. */
  readonly flicker?: number;
  /** 形状内本体光. */
  readonly fill?: number;
  /** 光标附近升温. */
  readonly interactive?: boolean;
  readonly cursorIntensity?: number;
  /** 升温半径 (CSS 像素), 默认 140. */
  readonly cursorRadius?: number;
  readonly lightMode?: boolean;
}

const GREY: Rgb = [0.5, 0.5, 0.5];

/** 距离场画布 (含留白) 在屏幕上的半宽高: 形状框的半宽高乘 (1 + 2 PAD). */
function boxHalf(field: SdfField, half: number): readonly [number, number] {
  const grow = 1 + 2 * SOFT.pad;
  return field.aspect >= 1 ? [half * grow, (half / field.aspect) * grow] : [half * field.aspect * grow, half * grow];
}

/**
 * 电光标记: 图形的轮廓上缠着几股抖动的电弧, 偶尔向外迸出支弧, 脉冲沿轮廓向两侧跑, 内部一层淡光; 光标附近升温变亮.
 * 换图形时逐像素形变过去. 宿主撑满父元素, 画布垫在 children 下面, 读屏隐藏. 减弱动效时只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
export function SparkMark(props: SparkMarkProps): JSX.Element {
  const {
    src, color = "accent", glowColor = "primary", scale = SPARK_MARK.scale, intensity = SPARK_MARK.intensity, glow = SPARK_MARK.glow, thickness = SPARK_MARK.thickness,
    strands = SPARK_MARK.strands, bend = SPARK_MARK.bend, crackle = SPARK_MARK.crackle, arcs = SPARK_MARK.arcs, flicker = SPARK_MARK.flicker, fill = SPARK_MARK.fill, interactive = true,
    cursorIntensity = SPARK_MARK.cursorIntensity, cursorRadius = SPARK_MARK.cursorRadius, lightMode = false, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const state = useRef(makeSpark());
  const [fields, setFields] = useState<{ from: SdfField | null; to: SdfField | null }>({ from: null, to: null });
  const latest = useRef(fields);

  useEffect(() => {
    let live = true;
    const land = (field: SdfField | null): void => {
      if (!live || !field) return;
      const prev = latest.current;
      if (prev.to) startMorph(state.current, state.current.morph < 1);
      latest.current = { from: prev.to, to: field };
      setFields(latest.current);
    };
    if (!src) {
      const mask = rasterPath(SPARK_BOLT.d, SPARK_BOLT.viewBox, SPARK_MARK.raster);
      land(mask ? sdfCanvas(mask, SPARK_MARK.raster) : null);
      return () => {
        live = false;
      };
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const mask = rasterImage(img, SPARK_MARK.raster);
      land(mask ? sdfCanvas(mask, SPARK_MARK.raster) : null);
    };
    img.src = src;
    return () => {
      live = false;
    };
  }, [src]);

  const uniforms = (frame: BackdropFrame) => {
    const { width, height, scale: px } = frame.fit;
    const s = state.current;
    stepSpark(s, frame.reduced ? 0 : frame.dt, frame.time, interactive, frame.pointer);
    const half = scale * 0.5 * Math.min(width, height);
    const { from, to } = fields;
    const hFrom = from ? boxHalf(from, half) : ([1, 1] as const);
    const hTo = to ? boxHalf(to, half) : ([1, 1] as const);
    return {
      u_half_from: hFrom,
      u_half_to: hTo,
      u_px: [from ? (2 * hFrom[0]) / from.width : 1, to ? (2 * hTo[0]) / to.width : 1] as const,
      u_has: [from ? 1 : 0, to ? 1 : 0] as const,
      u_from_range: from?.range ?? 1,
      u_to_range: to?.range ?? 1,
      u_morph: frame.reduced ? 1 : s.morph,
      u_unit: to ? ((2 * hTo[0]) / to.width) * SPARK_MARK.cell : px,
      u_look: [intensity, glow, thickness, fill] as const,
      u_arc: [Math.min(SPARK_MARK.arcs, Math.max(1, Math.round(strands))), bend, crackle, Math.min(SPARK_MARK.arcs, Math.max(0, Math.round(arcs)))] as const,
      u_flicker: flicker,
      u_hover: [(s.hover.x - 0.5) * width, (s.hover.y - 0.5) * height, cursorRadius * px, interactive ? s.hover.power * cursorIntensity : 0] as const,
      u_pulses: { list: packPulses(s), size: 4 as const },
      u_core: frame.colors[0] ?? GREY,
      u_glow: frame.colors[1] ?? GREY,
      u_light: lightMode,
    };
  };

  const handle = useShaderBackdrop(
    { fragment: SPARK_FRAGMENT, uniforms, textures: () => ({ u_from: fields.from?.canvas, u_to: fields.to?.canvas }) },
    { ...options, colors: [color, glowColor], pointer: interactive && options.pointer },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient([glowColor, color])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
