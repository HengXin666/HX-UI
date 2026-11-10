"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 ShapeBlur 条目, 实现为 HX 自有.
// 不标 ENGINE-GAP (2026-11-10 复核定): 失焦按距离场展宽近似, 不涉顶点 / 实例化 / 深度; 真高斯卷积可走内核 passes 两遍可分离模糊, 属未落项, 已排进 CHECKPOINT 待办.

import { useEffect, useRef, useState, type JSX } from "react";
import { BackdropShell } from "../backdrop/kernel/BackdropShell";
import type { Rgb } from "../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../backdrop/kernel/common";
import { fallbackGradient } from "../backdrop/kernel/fallback";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { rasterImage } from "./parts/mask";
import { sdfCanvas, type SdfField } from "./parts/sdf";
import { makeSoft, stepSoft } from "./parts/soft";
import { SOFT_FRAGMENT, SOFT_SHAPES, type SoftShapeKind } from "./parts/soft-shader";
import { SOFT } from "./tokens";

export interface SoftShapeProps extends BackdropCommonProps {
  readonly shape?: SoftShapeKind;
  /** 图片地址: 给了就用图片的透明度当形状 (算距离场), 忽略 shape. */
  readonly src?: string;
  /** polygon 的边数, 默认 6. */
  readonly sides?: number;
  /** 形状占短边的比例, 默认 0.8. */
  readonly size?: number;
  /** 圆角 0..1 (相对半边长), 默认 0.2. */
  readonly roundness?: number;
  /** 描边粗细 (CSS 像素), 默认 2. */
  readonly thickness?: number;
  /** 填充而不只描边. */
  readonly fill?: boolean;
  /** 向外的回声描边条数 (含本体), 默认 1, 上限 8. */
  readonly echoes?: number;
  /** 回声间距 (CSS 像素), 默认 12. */
  readonly spacing?: number;
  /** 颜色 (token 名), 默认 foreground. */
  readonly color?: string;
  /** 失焦模糊 (CSS 像素), 默认 16. */
  readonly blur?: number;
  /** 透镜半径占短边的比例, 默认 0.3. */
  readonly lensSize?: number;
  /** 透镜边缘柔和 0..1, 默认 0.7. */
  readonly lensSoftness?: number;
  /** true: 整体清晰, 透镜处失焦; 默认 false: 整体失焦, 透镜处对焦. */
  readonly focus?: boolean;
  /** 色散, 默认 0.3. */
  readonly chroma?: number;
  /** 形状旋转 (度). */
  readonly rotation?: number;
  /** 自转 (度每秒). */
  readonly spin?: number;
  /** 指针不在时透镜自己漂. */
  readonly idle?: boolean;
}

const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 柔焦形状: 一个描边 (或填充) 的形状整体失焦, 指针处有一片透镜把它对焦, 失焦处三色错开出色散; 可加向外的回声描边与自转,
 * 指针不在时透镜自己漂. 形状可以是矩形, 圆, 正多边形, 或图片 (距离场). 宿主撑满父元素, 画布垫在 children 下面, 读屏隐藏.
 * 减弱动效时只画一帧, 透镜停在中心.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
export function SoftShape(props: SoftShapeProps): JSX.Element {
  const {
    shape = "rect", src, sides = SOFT.sides, size = SOFT.size, roundness = SOFT.roundness, thickness = SOFT.thickness, fill = false, echoes = SOFT.echoes,
    spacing = SOFT.spacing, color = "foreground", blur = SOFT.blur, lensSize = SOFT.lensSize, lensSoftness = SOFT.lensSoftness, focus = false, chroma = SOFT.chroma,
    rotation = 0, spin = 0, idle = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const state = useRef(makeSoft());
  const [field, setField] = useState<SdfField | null>(null);

  useEffect(() => {
    if (!src) {
      setField(null);
      return undefined;
    }
    let live = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const mask = live ? rasterImage(img, SOFT.field) : null;
      if (live) setField(mask ? sdfCanvas(mask) : null);
    };
    img.src = src;
    return () => {
      live = false;
    };
  }, [src]);

  const uniforms = (frame: BackdropFrame) => {
    const { width, height, scale } = frame.fit;
    const s = state.current;
    stepSoft(s, frame.reduced ? 0 : frame.dt, spin, idle, width / Math.max(1, height), frame.pointer);
    const short = Math.min(width, height);
    const half = size * 0.5 * short;
    const boxHalf = field ? (field.aspect >= 1 ? [half, half / field.aspect] : [half * field.aspect, half]) : [half, half];
    const reduced = frame.reduced;
    return {
      u_shape: [field ? SOFT_SHAPES.image : SOFT_SHAPES[shape], sides, half, Math.min(1, Math.max(0, roundness))] as const,
      u_field_half: [boxHalf[0] * (1 + 2 * SOFT.pad), boxHalf[1] * (1 + 2 * SOFT.pad)] as const,
      u_has_field: field !== null,
      u_field_range: field?.range ?? 1,
      u_line: [thickness * 0.5 * scale, fill ? 1 : 0, Math.max(1, Math.min(SOFT.maxEchoes, Math.round(echoes))), spacing * scale] as const,
      u_blur: [blur * scale, chroma, focus ? 1 : 0, scale] as const,
      u_lens: [(reduced ? 0.5 : s.x) * width, (reduced ? 0.5 : s.y) * height, lensSize * short, reduced ? 1 : s.power] as const,
      u_lens_soft: Math.min(1, Math.max(0, lensSoftness)),
      u_angle: rotation + s.angle,
      u_color: frame.colors[0] ?? GREY,
    };
  };

  const handle = useShaderBackdrop({ fragment: SOFT_FRAGMENT, uniforms, textures: () => ({ u_field: field?.canvas }) }, { ...options, colors: [color] });
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient([color])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
