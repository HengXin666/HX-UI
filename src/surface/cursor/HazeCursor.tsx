"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 GhostCursor 条目, 实现为 HX 自有.
// ENGINE-GAP (同 InkSplash): 内核在不支持半浮点渲染目标时退到 RGBA8, 速度按范围编码后精度不足, 烟会发涩, 浓度在 1 处截断; 要内核加高精度打包才能补.

import { useRef, type JSX, type ReactNode } from "react";
import type { Rgb } from "../backdrop/kernel/color";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { BLOOM_DEFAULT_WEIGHTS, bloomPyramid } from "../backgrounds/bloom";
import { SurfaceLayer } from "../pointer/SurfaceLayer";
import { TONE_TOKEN, type SurfaceTone } from "../pointer/tone";
import { clamp, pointerPx } from "./parts/common";
import { fluidDyePass, fluidVelocityPass } from "./parts/fluid-shader";
import { packSplats, splatUniforms, type PackedSplats } from "./parts/fluid";
import { hazeDecay, hazeLife, makeHaze, puffHaze, stepHaze } from "./parts/haze";
import { hazeFade, hazeSplats } from "./parts/haze-fluid";
import { HAZE_SCENE, hazeFragment } from "./parts/haze-shader";
import { CURSOR_FLUID, HAZE } from "./tokens";

export interface HazeCursorProps {
  readonly children?: ReactNode;
  readonly tone?: SurfaceTone;
  readonly brightness?: number;
  /** 烟头直径 px. */
  readonly size?: number;
  /** 烟尾长短, 越大散得越慢. */
  readonly trailLength?: number;
  /** 0 到 1, 越大越飘. */
  readonly inertia?: number;
  readonly turbulence?: number;
  /** 向上漂移的快慢. */
  readonly drift?: number;
  /** 烟丝细节倍率, 默认 1. */
  readonly detail?: number;
  /** 颗粒, 默认 0.05. */
  readonly grainIntensity?: number;
  /** 泛光强度 (0 关闭), 半径 (0..1, 远级权重), 阈值. */
  readonly bloomStrength?: number;
  readonly bloomRadius?: number;
  readonly bloomThreshold?: number;
  /** 烟团轮廓光, 默认 0. */
  readonly edgeIntensity?: number;
  readonly clickPuff?: boolean;
  readonly intro?: boolean;
  /** 浅色底: 芯不发白. 规格 theme="light". */
  readonly lightMode?: boolean;
  /** 指针静止多久 (ms) 后开始隐去, 不给就不隐. */
  readonly fadeDelayMs?: number;
  /** 隐去用时 (ms), 默认 600. */
  readonly fadeDurationMs?: number;
  /** 设备像素比上限, 默认 2. */
  readonly maxDevicePixelRatio?: number;
  readonly className?: string;
}

const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 幽灵烟雾光标: 烟头用弹簧跟手 (inertia 越大越飘), 沿路径放出的烟团打进一张自平流的烟雾场 (拖拽, 上漂, 旋度噪声湍流),
 * 浓度按 trailLength 衰减; 着色时烟丝 (wisp) 与烟体 (cloud) 分开打光, 泛光金字塔出辉光. 点击喷一圈. 首次出现用 1.9s 长大.
 * 画布叠在 children 上方, aria-hidden 且不接指针. 减弱动效时不画.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
export function HazeCursor({
  children, tone = "foreground", brightness = HAZE.brightness, size = HAZE.size, trailLength = HAZE.trailLength, inertia = HAZE.inertia, turbulence = HAZE.turbulence,
  drift = HAZE.drift, detail = HAZE.detail, grainIntensity = HAZE.grainIntensity, bloomStrength = HAZE.bloomStrength, bloomRadius = HAZE.bloomRadius,
  bloomThreshold = HAZE.bloomThreshold, edgeIntensity = HAZE.edgeIntensity, clickPuff = true, intro = true, lightMode = false, fadeDelayMs, fadeDurationMs,
  maxDevicePixelRatio, className,
}: HazeCursorProps): JSX.Element {
  const sim = useRef(makeHaze(intro));
  const seen = useRef(-1);
  const packed = useRef<PackedSplats>(packSplats([]));
  const dt = (frame: BackdropFrame): number => (frame.reduced ? 0 : Math.min(frame.dt, CURSOR_FLUID.maxDt));
  const aspect = (frame: BackdropFrame): number => frame.fit.width / Math.max(1, frame.fit.height);

  const drive = (frame: BackdropFrame): void => {
    const step = dt(frame);
    const s = sim.current;
    if (step <= 0 || (!frame.pointer.inside && !s.placed)) {
      packed.current = packSplats([]);
      return;
    }
    const { scale } = frame.fit;
    const [tx, ty] = pointerPx(frame);
    const grow = s.intro * s.intro * (3 - 2 * s.intro);
    const radius = (size / 2) * scale * (0.3 + 0.7 * grow);
    const life = hazeLife(trailLength, size);
    stepHaze(s, tx, ty, frame.pointer.inside, step, { inertia, trailLength, turbulence, drift, radius: radius * 0.6, life }, scale);
    for (const tap of frame.pointer.taps) {
      if (tap.at <= seen.current) continue;
      seen.current = tap.at;
      if (clickPuff) puffHaze(s, HAZE.clickPuffs, radius, scale, life);
    }
    packed.current = packSplats(hazeSplats(s, frame.fit, { brightness, simScale: HAZE.sim }));
  };

  const r = clamp(bloomRadius, 0, 1);
  const bloom = bloomPyramid({
    scene: HAZE_SCENE,
    prefix: "u_haze_bloom",
    levels: bloomStrength > 0 ? 4 : 0,
    sceneScale: HAZE.dyeScale,
    threshold: bloomThreshold,
    knee: 0.5,
    strength: 1,
    weights: BLOOM_DEFAULT_WEIGHTS.map((w, i) => w * r ** i),
    sceneUniforms: (frame) => ({ u_tint: frame.colors[0] ?? GREY, u_hot: frame.colors[1] ?? GREY, u_detail: detail, u_edge: edgeIntensity, u_light: lightMode }),
  });

  const handle = useShaderBackdrop(
    {
      fragment: hazeFragment(bloom.compositeGlsl),
      passes: [
        {
          name: "u_vel",
          fragment: fluidVelocityPass(false),
          scale: HAZE.sim,
          uniforms: (frame) => {
            drive(frame);
            const step = dt(frame);
            return {
              u_dt: step,
              u_drag: Math.exp(-step * HAZE.dragRate),
              u_lift: drift * HAZE.driftPx * HAZE.sim * frame.fit.scale * step,
              u_turb: turbulence * HAZE.turbulenceCells * 10,
              u_detail: detail,
              u_flow: 1,
              ...splatUniforms(packed.current, aspect(frame)),
            };
          },
        },
        {
          name: "u_dye",
          fragment: fluidDyePass(false),
          scale: HAZE.dyeScale,
          uniforms: (frame) => {
            const keep = frame.reduced ? 0 : hazeDecay(dt(frame), trailLength);
            return {
              u_dt: dt(frame),
              u_keep: [keep, keep, keep],
              u_sim_px: [1 / Math.max(1, frame.fit.width * HAZE.sim), 1 / Math.max(1, frame.fit.height * HAZE.sim)],
              u_mac: 0.6,
              ...splatUniforms(packed.current, aspect(frame)),
            };
          },
        },
        ...bloom.passes,
      ],
      uniforms: (frame) => ({
        ...bloom.uniforms,
        u_bloom: bloomStrength,
        u_grain: grainIntensity,
        u_fade: frame.reduced ? 0 : hazeFade(frame.elapsed - frame.pointer.movedAt, fadeDelayMs, fadeDurationMs),
      }),
    },
    { colors: [TONE_TOKEN[tone], TONE_TOKEN.foreground], dpr: maxDevicePixelRatio },
  );
  return (
    <SurfaceLayer handle={handle} slot="haze-cursor" className={className}>
      {children}
    </SurfaceLayer>
  );
}
