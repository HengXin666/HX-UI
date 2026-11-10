"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 MetaBalls 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../backdrop/kernel/BackdropShell";
import type { Rgb } from "../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../backdrop/kernel/common";
import { fallbackGradient } from "../backdrop/kernel/fallback";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { makeMerge, mergeLook, packMerge, settleMerge, stepMerge, type MergeMotion, type MergeState } from "./parts/merge";
import { MERGE_FRAGMENT, MERGE_MAX_RINGS, MERGE_VARIANTS, type MergeVariant } from "./parts/merge-shader";
import { MERGE } from "./tokens";

export interface MergeBlobsProps extends BackdropCommonProps {
  /** 球色 (token 名), 默认 foreground. */
  readonly color?: string;
  /** 光标球色 (token 名), 默认 primary. */
  readonly cursorBallColor?: string;
  /** 轨道速度, 默认 0.3. */
  readonly ballSpeed?: number;
  readonly enableMouseInteraction?: boolean;
  /** 光标球跟手 0..1, 越大越紧, 默认 0.1. */
  readonly hoverSmoothness?: number;
  /** 画布短边等于多少世界单位, 越大球越小, 默认 30. */
  readonly animationSize?: number;
  readonly ballCount?: number;
  /** 轨道幅度倍率, 默认 1. */
  readonly clumpFactor?: number;
  readonly cursorBallSize?: number;
  readonly variant?: MergeVariant;
  readonly motion?: MergeMotion;
  /** 0..1, 越大越黏糊 (等值面越软). */
  readonly gooeyness?: number;
  /** 0..1, 球之间的吸力. */
  readonly stickiness?: number;
  /** 沿速度方向拉长. */
  readonly stretch?: number;
  /** 半径起伏. */
  readonly wobble?: number;
  /** outline / contour 的线宽 (CSS 像素). */
  readonly lineWidth?: number;
  /** contour 的环数, 上限 12. */
  readonly rings?: number;
  readonly clickBurst?: boolean;
  /** 球逐个错开放出 (约 1.8 秒). */
  readonly intro?: boolean;
}

const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 融合球: 一群球各自绕轨道漂, 彼此近推远吸, 画成粘连的等值面; 光标处一个光标色的球把它们推开又黏住, 点击把球冲散.
 * 宿主撑满父元素, 画布垫在 children 下面, 读屏隐藏. 减弱动效时只画一帧, 球停在轨道起点.
 *
 * 规格的 speed prop 与公共的时钟倍率同名, 这里叫 ballSpeed.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
export function MergeBlobs(props: MergeBlobsProps): JSX.Element {
  const {
    color = "foreground", cursorBallColor = "primary", ballSpeed = MERGE.speed, enableMouseInteraction = true, hoverSmoothness = MERGE.hoverSmoothness,
    animationSize = MERGE.animationSize, ballCount = MERGE.ballCount, clumpFactor = MERGE.clumpFactor, cursorBallSize = MERGE.cursorBallSize, variant = "solid",
    motion = "orbit", gooeyness = MERGE.gooeyness, stickiness = MERGE.stickiness, stretch = MERGE.stretch, wobble = MERGE.wobble, lineWidth = MERGE.lineWidth,
    rings = MERGE.rings, clickBurst = true, intro = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const sim = useRef<MergeState | null>(null);
  if (!sim.current || sim.current.balls.length !== Math.min(MERGE.maxBalls - 1, Math.max(0, Math.round(ballCount)))) sim.current = makeMerge(Math.min(MERGE.maxBalls - 1, ballCount));
  const look = mergeLook(gooeyness);
  const tuning = { speed: ballSpeed, motion, animationSize: Math.max(1, animationSize), clumpFactor, stickiness, hoverSmoothness, cursorBallSize, interactive: enableMouseInteraction, clickBurst, intro };

  const uniforms = (frame: BackdropFrame) => {
    const s = sim.current as MergeState;
    const { width, height, scale } = frame.fit;
    const unit = Math.min(width, height) / tuning.animationSize;
    const p = frame.pointer;
    const toWorld = (x: number, y: number) => ({ x: ((x - 0.5) * width) / unit, y: ((y - 0.5) * height) / unit });
    if (frame.still) settleMerge(s, frame.time, tuning);
    else if (frame.dt > 0) {
      const taps = p.taps.map((t) => ({ ...toWorld(t.x, t.y), at: t.at }));
      stepMerge(s, frame.dt, frame.time, frame.elapsed, tuning, { ...toWorld(p.x, p.y), inside: p.inside }, taps);
    }
    const packed = packMerge(s, { cursorBallSize, stretch, wobble }, frame.time);
    return {
      u_balls: { list: packed.balls, size: 4 as const },
      u_shapes: { list: packed.shapes, size: 4 as const },
      u_count: packed.count,
      u_scale: unit,
      u_gamma: look.gamma,
      u_threshold: look.threshold,
      u_color: frame.colors[0] ?? GREY,
      u_cursor_color: frame.colors[1] ?? GREY,
      u_variant: MERGE_VARIANTS[variant] ?? 0,
      u_line: lineWidth * scale,
      u_rings: Math.max(1, Math.min(MERGE_MAX_RINGS, Math.round(rings))),
    };
  };

  const handle = useShaderBackdrop({ fragment: MERGE_FRAGMENT, uniforms }, { ...options, colors: [color, cursorBallColor], pointer: enableMouseInteraction && options.pointer });
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient([color, cursorBallColor])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
