"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 GlowCursor 条目, 实现为 HX 自有.
// ENGINE-GAP (同 InkSplash): 内核在不支持半浮点渲染目标时退到 RGBA8, 速度与压力按范围编码后精度不足, 流体会发涩; 要内核加高精度打包才能补.

import { useRef, type JSX, type ReactNode } from "react";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { bloomPyramid } from "../backgrounds/bloom";
import { SurfaceLayer } from "../pointer/SurfaceLayer";
import { TONE_TOKEN, type SurfaceTone } from "../pointer/tone";
import type { Rgb } from "../backdrop/kernel/color";
import { pointerPx } from "./parts/common";
import { FLUID_DIVERGENCE_PASS, FLUID_PRESSURE_PASS, fluidDyePass, fluidVelocityPass } from "./parts/fluid-shader";
import { packSplats, splatUniforms, type PackedSplats } from "./parts/fluid";
import { makeHalo, stepHalo } from "./parts/halo";
import { haloKeep, haloSplats } from "./parts/halo-fluid";
import { HALO_SCENE, haloFragment } from "./parts/halo-shader";
import { CURSOR_FLUID, HALO, type HaloQuality } from "./tokens";

export interface HaloCursorProps {
  readonly children?: ReactNode;
  /** 主色调与尾部色调 (语义 token); 不给 secondaryTone 时一色. */
  readonly tone?: SurfaceTone;
  readonly secondaryTone?: SurfaceTone;
  readonly intensity?: number;
  /** 轨迹线宽倍数. */
  readonly trailWidth?: number;
  /** 余辉停留秒数. */
  readonly linger?: number;
  /** 泛光强度, 0 关闭. */
  readonly glow?: number;
  /** 热芯强度 0 到 1. */
  readonly hotspot?: number;
  /** 0 到 1, 越大越贴手. */
  readonly followSpeed?: number;
  /** 颗粒 0 到 1, 默认 0. */
  readonly grain?: number;
  readonly clickBurst?: boolean;
  /** 画质档: 模拟格精度, 压力迭代, 泛光级数. 默认 high. */
  readonly quality?: HaloQuality;
  /** 浅色底: 热芯不发白. 规格 theme="light". */
  readonly lightMode?: boolean;
  /** 设备像素比上限, 默认 2. */
  readonly maxDevicePixelRatio?: number;
  readonly enabled?: boolean;
  readonly className?: string;
}

const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 发光拖尾光标: 光头平滑跟手, 走过的路打进一张稳定流体 (平流, 散度, Jacobi 压力投影), 染料三通道 (主体, 热芯, 外晕)
 * 按 linger 各自衰减, 被流动卷开; 泛光金字塔出辉光. 点击放一圈径向推开的光环. 画布叠在 children 上方, aria-hidden 且不接指针.
 * 减弱动效或 enabled 为 false 时不画.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
export function HaloCursor({
  children,
  tone = "primary",
  secondaryTone,
  intensity = HALO.intensity,
  trailWidth = HALO.trailWidth,
  linger = HALO.linger,
  glow = HALO.glow,
  hotspot = HALO.hotspot,
  followSpeed = HALO.followSpeed,
  grain = HALO.grain,
  clickBurst = true,
  quality = "high",
  lightMode = false,
  maxDevicePixelRatio,
  enabled = true,
  className,
}: HaloCursorProps): JSX.Element {
  const sim = useRef(makeHalo());
  const seen = useRef(-1);
  const packed = useRef<PackedSplats>(packSplats([]));
  const tier = HALO.quality[quality] ?? HALO.quality.high;
  const dt = (frame: BackdropFrame): number => (frame.reduced || !enabled ? 0 : Math.min(frame.dt, CURSOR_FLUID.maxDt));
  const aspect = (frame: BackdropFrame): number => frame.fit.width / Math.max(1, frame.fit.height);

  const drive = (frame: BackdropFrame): void => {
    const step = dt(frame);
    const s = sim.current;
    if (step <= 0 || (!frame.pointer.inside && !s.placed)) {
      packed.current = packSplats([]);
      return;
    }
    const from = s.placed ? { x: s.x, y: s.y } : null;
    const [tx, ty] = pointerPx(frame);
    stepHalo(s, tx, ty, step, followSpeed, linger, frame.fit.scale);
    const bursts: { x: number; y: number }[] = [];
    for (const tap of frame.pointer.taps) {
      if (tap.at <= seen.current) continue;
      seen.current = tap.at;
      if (clickBurst) bursts.push({ x: s.x, y: s.y });
    }
    packed.current = packSplats(haloSplats(s, from ?? s, bursts, step, frame.fit, { intensity, trailWidth, glow, hotspot, simScale: tier.sim }));
  };

  const bloom = bloomPyramid({
    scene: HALO_SCENE,
    prefix: "u_halo_bloom",
    levels: glow > 0 ? Math.min(tier.bloom, HALO.bloomLevels) : 0,
    sceneScale: tier.dye,
    threshold: HALO.bloomThreshold,
    knee: HALO.bloomKnee,
    strength: glow,
    sceneUniforms: (frame) => ({
      u_intensity: intensity / HALO.intensity,
      u_main: frame.colors[0] ?? GREY,
      u_tail: frame.colors[1] ?? frame.colors[0] ?? GREY,
      u_hot: frame.colors[2] ?? GREY,
      u_light: lightMode,
    }),
  });

  const handle = useShaderBackdrop(
    {
      fragment: haloFragment(bloom.compositeGlsl),
      passes: [
        {
          name: "u_vel",
          fragment: fluidVelocityPass(true),
          scale: tier.sim,
          uniforms: (frame) => {
            drive(frame);
            return { u_dt: dt(frame), u_drag: Math.exp(-dt(frame) * HALO.calmRate), u_lift: 0, u_turb: 0, u_detail: 1, u_flow: HALO.flow, ...splatUniforms(packed.current, aspect(frame)) };
          },
        },
        { name: "u_div", fragment: FLUID_DIVERGENCE_PASS, scale: tier.sim },
        { name: "u_press", fragment: FLUID_PRESSURE_PASS, scale: tier.sim, iterations: Math.min(tier.steps, HALO.pressureSteps), uniforms: (_frame, i) => ({ u_keep: i === 0 ? 0.8 : 1 }) },
        {
          name: "u_dye",
          fragment: fluidDyePass(true),
          scale: tier.dye,
          uniforms: (frame) => ({
            u_dt: dt(frame),
            u_keep: frame.reduced || !enabled ? [0, 0, 0] : haloKeep(dt(frame), linger),
            u_sim_px: [1 / Math.max(1, frame.fit.width * tier.sim), 1 / Math.max(1, frame.fit.height * tier.sim)],
            u_mac: 0.8,
            ...splatUniforms(packed.current, aspect(frame)),
          }),
        },
        ...bloom.passes,
      ],
      uniforms: (frame) => ({ ...bloom.uniforms, u_grain: grain, u_on: enabled && !frame.reduced }),
    },
    { colors: [TONE_TOKEN[tone], TONE_TOKEN[secondaryTone ?? tone], TONE_TOKEN.foreground], dpr: maxDevicePixelRatio },
  );
  return (
    <SurfaceLayer handle={handle} slot="halo-cursor" className={className}>
      {children}
    </SurfaceLayer>
  );
}
