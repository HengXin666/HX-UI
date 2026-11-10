"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 ElasticMesh 条目, 实现为 HX 自有.
// ENGINE-GAP (仍做不了, 需内核顶点着色 / 网格): 规格是 MAX_NODES 5200 节点的质点弹簧网格 (STEP 1/480) 走顶点着色器变形, 另有阴影遍 (SHADOW) 与逐字零件 (uParts);
// 这里片元里用距离场当充气高度, 拉伸是单个抓取点的高斯反向扭曲加一根阻尼弹簧, 没有逐节点的布料式传播, 也没有自遮挡; 阴影是距离场偏移软化, 逐字入场按 x 近似.

import { useEffect, useRef, useState, type JSX } from "react";
import { BackdropShell } from "../backdrop/kernel/BackdropShell";
import type { Rgb } from "../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../backdrop/kernel/common";
import { glowFallback } from "../backdrop/kernel/fallback";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { rasterImage, rasterText, type MaskCanvas } from "../field/parts/mask";
import { sdfCanvas, type SdfField } from "../field/parts/sdf";
import { makeMesh, stepMesh } from "./parts/mesh";
import { MESH_FRAGMENT } from "./parts/mesh-shader";
import { MESH } from "./tokens";

export type MeshMaterial = keyof typeof MESH.materials;

export interface SpringMeshProps extends BackdropCommonProps {
  /** 充气的文字, 默认 "Squish"; 给了 src 时用图片的形状. */
  readonly text?: string;
  readonly src?: string;
  readonly fontFamily?: string;
  readonly fontWeight?: number;
  /** 主体色 (token 名), 默认 primary. */
  readonly color?: string;
  /** 有 src 时用图片自己的颜色, 默认 true. */
  readonly imageColors?: boolean;
  readonly material?: MeshMaterial;
  readonly inflate?: number;
  /** 回弹硬度 0..1, 默认 0.5. */
  readonly stiffness?: number;
  /** 回弹晃动 0..1, 默认 0.6. */
  readonly wobble?: number;
  /** 抓取影响半径 (CSS 像素), 默认 70. */
  readonly grabRadius?: number;
  readonly stretch?: number;
  readonly press?: number;
  readonly shadow?: number;
  readonly intro?: boolean;
  /** 规格 theme="light": 环境天空取 background, 地面取 foreground. */
  readonly lightMode?: boolean;
}

const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 充气形状: 文字或图片鼓成气球 / 镀铬 / 果冻 / 黏土, 按住可以拉长和压瘪, 松手弹回并晃几下; 挂载时逐字弹起.
 * 宿主撑满父元素, 画布垫在 children 下面. 减弱动效时只画一帧静止的形状.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
export function SpringMesh(props: SpringMeshProps): JSX.Element {
  const {
    text = "Squish", src, fontFamily = "system-ui, sans-serif", fontWeight = MESH.fontWeight, color = "primary", imageColors = true, material = "balloon",
    inflate = MESH.inflate, stiffness = MESH.stiffness, wobble = MESH.wobble, grabRadius = MESH.grabRadius, stretch = MESH.stretch, press = MESH.press,
    shadow = MESH.shadow, intro = true, lightMode = false, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const sim = useRef(makeMesh());
  const [shape, setShape] = useState<{ mask: MaskCanvas; field: SdfField; image: boolean } | null>(null);

  useEffect(() => {
    let live = true;
    const adopt = (mask: MaskCanvas | null, image: boolean) => {
      const field = mask ? sdfCanvas(mask, MESH.field, MESH.pad) : null;
      if (live) setShape(mask && field ? { mask, field, image } : null);
    };
    if (!src) {
      adopt(rasterText(text, fontFamily, fontWeight, MESH.field), false);
      return () => {
        live = false;
      };
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => adopt(live ? rasterImage(img, MESH.field) : null, true);
    img.src = src;
    return () => {
      live = false;
    };
  }, [src, text, fontFamily, fontWeight]);

  const uniforms = (frame: BackdropFrame) => {
    const { width, height, scale } = frame.fit;
    const short = Math.max(1, Math.min(width, height));
    const p = frame.pointer;
    const aspect = shape?.mask.aspect ?? 1;
    const box = aspect >= 1 ? [1, 1 / aspect] : [aspect, 1];
    const px = ((p.x - 0.5) * width) / short;
    const py = ((p.y - 0.5) * height) / short;
    const within = Math.abs(px) <= (box[0] ?? 1) * MESH.fill * 0.5 && Math.abs(py) <= (box[1] ?? 1) * MESH.fill * 0.5;
    const s = sim.current;
    if (!frame.reduced) stepMesh(s, frame.dt, { x: px, y: py, down: p.down && p.inside, within }, { stiffness, wobble, stretch, press });
    const inner = 1 / (1 + 2 * MESH.pad);
    const fieldLong = shape ? (shape.field.aspect >= 1 ? shape.field.width : shape.field.width / shape.field.aspect) : 1;
    const [hi, lo] = lightMode ? [frame.colors[2], frame.colors[1]] : [frame.colors[1], frame.colors[2]];
    return {
      u_ready: shape !== null,
      u_shape_range: shape?.field.range ?? 1,
      u_use_tint: shape?.image === true && imageColors,
      u_aspect: aspect,
      u_inner: inner,
      u_px: (fieldLong * inner) / (MESH.fill * short),
      u_fill: MESH.fill,
      u_grab: [s.ax, s.ay, s.dx, s.dy] as const,
      u_grab_r: (grabRadius * scale) / short,
      u_dent: s.dent,
      u_inflate: shape ? inflate : 0,
      u_shadow: shadow,
      u_material: MESH.materials[material] ?? 0,
      u_blur: MESH.blur[MESH.materials[material] ?? 0] ?? 0,
      u_clock: intro && !frame.reduced ? frame.elapsed : 10,
      u_stagger: MESH.introStagger,
      u_color: frame.colors[0] ?? GREY,
      u_hi: hi ?? GREY,
      u_lo: lo ?? GREY,
      u_shade: (frame.colors[2] ?? GREY).map((v) => v * 0.35) as unknown as Rgb,
    };
  };

  const handle = useShaderBackdrop(
    { fragment: MESH_FRAGMENT, uniforms, textures: () => ({ u_shape: shape?.field.canvas ?? null, u_tint: shape?.mask.canvas ?? null }) },
    { ...options, colors: [color, "foreground", "background"] },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback("background", color)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
