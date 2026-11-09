"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LiquidEther 条目, 实现为 HX 自有.
// 现状 (2026-11-09): 稳定流体四通道 (速度, 散度, 压力 32 次 Jacobi, 染料) 全部落地, 半浮点渲染目标可用时与规格一致.
// ENGINE-GAP (仍做不了): 内核在不支持半浮点渲染目标时退到 RGBA8, 速度与压力按 512 / 256 的范围编码后精度不足, 流体会发涩; 要内核加浮点目标探测之外的高精度打包才能补.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import type { Rgb } from "../../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { createEtherDrive, etherKeep, etherVelocityKeep, ETHER_DYE_RATE, stepEther, type EtherForces } from "./liquid-ether-drive";
import {
  ETHER_DIVERGENCE_PASS, ETHER_DYE_PASS, ETHER_FRAGMENT, ETHER_MAX_COLORS, ETHER_PRESSURE_PASS, ETHER_PRESSURE_STEPS, ETHER_VELOCITY_PASS,
} from "./liquid-ether-shader";

export interface LiquidEtherProps extends BackdropCommonProps {
  /** 调色板, 慢处取前面的色, 快处取后面的色, 最多 5 个. 默认 primary, accent-2, accent. */
  readonly colors?: readonly string[];
  /** 整体不透明度倍率, 默认 1. */
  readonly intensity?: number;
  /** 指针推力, 默认 20. */
  readonly mouseForce?: number;
  /** 指针影响半径 (CSS 像素), 默认 100. */
  readonly cursorSize?: number;
  /** 染料留存 0..1, 越大拖尾越久, 默认 0.75. */
  readonly persistence?: number;
  /** 粘性 0..1, 越大速度散得越快, 默认 0. */
  readonly viscosity?: number;
  /** 模拟分辨率 (相对画布的一半), 默认 0.5. */
  readonly resolution?: number;
  /** 边缘反弹, 默认 false. */
  readonly bounceEdges?: boolean;
  /** 点击向外推一圈, 默认 true. */
  readonly clickBurst?: boolean;
  /** 指针闲置时自动搅动, 默认 true. */
  readonly autoDemo?: boolean;
  /** 自动搅动速度, 默认 0.5. */
  readonly autoSpeed?: number;
  /** 自动搅动力度, 默认 2.2. */
  readonly autoIntensity?: number;
  /** 指针停下多久 (ms) 后恢复自动, 默认 1000. */
  readonly autoResumeDelay?: number;
  /** 出现时扫一笔, 默认 true. */
  readonly intro?: boolean;
  /** 浅色模式: 快处压暗而不是提亮. */
  readonly lightMode?: boolean;
  /** 底色, 默认 transparent (只画流体). */
  readonly backgroundColor?: string;
}

const DEFAULT_COLORS = ["primary", "accent-2", "accent"];
const TRANSPARENT = "transparent";
const GRID_FROM_RESOLUTION = 0.5;
const DEFAULT_FORCE = 20;
const DEFAULT_CURSOR = 100;
const DEFAULT_PERSISTENCE = 0.75;
const DEFAULT_RESOLUTION = 0.5;
const DEFAULT_AUTO_SPEED = 0.5;
const DEFAULT_AUTO_INTENSITY = 2.2;
const DEFAULT_RESUME_MS = 1000;
const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 液态以太: 稳定流体 (半拉格朗日平流, 散度, 32 次 Jacobi 压力迭代, 投影滞后一帧在下一帧速度通道里扣掉),
 * 染料浓度当不透明度, 流速沿调色板取色. 指针拖动推流, 点击外推, 闲置时自动搅动.
 * 减弱动效时内核只画一帧, 改画一张静态的噪声流.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-fluid.md
 */
export function LiquidEther(props: LiquidEtherProps): JSX.Element {
  const {
    colors = DEFAULT_COLORS, intensity = 1, mouseForce = DEFAULT_FORCE, cursorSize = DEFAULT_CURSOR, persistence = DEFAULT_PERSISTENCE, viscosity = 0,
    resolution = DEFAULT_RESOLUTION, bounceEdges = false, clickBurst = true, autoDemo = true, autoSpeed = DEFAULT_AUTO_SPEED, autoIntensity = DEFAULT_AUTO_INTENSITY,
    autoResumeDelay = DEFAULT_RESUME_MS, intro = true, lightMode = false, backgroundColor = TRANSPARENT, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const drive = useRef(createEtherDrive());
  const forces = useRef<EtherForces | null>(null);
  const palette = colors.slice(0, ETHER_MAX_COLORS);
  const hasBg = backgroundColor !== TRANSPARENT;
  const gridScale = Math.max(0.1, Math.min(1, resolution)) * GRID_FROM_RESOLUTION;
  const settings = { mouseForce, cursorSize, clickBurst, autoDemo, autoSpeed, autoIntensity, autoResumeDelay, intro, gridScale };
  const current = (): EtherForces => forces.current ?? { splat: [0, 0, 0, 0], splatK: [1, 0], burst: [0, 0, 0, 1] };

  const handle = useShaderBackdrop(
    {
      fragment: ETHER_FRAGMENT,
      passes: [
        {
          name: "u_vel",
          fragment: ETHER_VELOCITY_PASS,
          scale: gridScale,
          uniforms: (frame) => {
            forces.current = stepEther(drive.current, frame, settings);
            const f = current();
            return { u_dt: frame.dt, u_keep_v: etherVelocityKeep(viscosity, frame.dt), u_walls: bounceEdges, u_splat: f.splat, u_splat_k: f.splatK, u_burst: f.burst };
          },
        },
        { name: "u_div", fragment: ETHER_DIVERGENCE_PASS, scale: gridScale },
        { name: "u_press", fragment: ETHER_PRESSURE_PASS, scale: gridScale, iterations: ETHER_PRESSURE_STEPS },
        {
          name: "u_dye",
          fragment: ETHER_DYE_PASS,
          scale: gridScale,
          uniforms: (frame) => {
            const f = current();
            return { u_dt: frame.dt, u_keep: etherKeep(persistence, frame.dt), u_splat: f.splat, u_splat_k: f.splatK, u_burst: f.burst, u_dye_in: ETHER_DYE_RATE * frame.dt };
          },
        },
      ],
      uniforms: (frame) => {
        const list = new Float32Array(ETHER_MAX_COLORS * 3);
        palette.forEach((_c, i) => list.set(frame.colors[i] ?? GREY, i * 3));
        return {
          u_colors: { list, size: 3 },
          u_count: Math.max(1, palette.length),
          u_bg: hasBg ? (frame.colors[palette.length] ?? GREY) : GREY,
          u_bg_on: hasBg,
          u_intensity: intensity,
          u_light: lightMode,
          u_static: frame.reduced,
        };
      },
    },
    { ...options, colors: hasBg ? [...palette, backgroundColor] : palette },
  );

  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(hasBg ? [backgroundColor, ...palette] : palette)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
